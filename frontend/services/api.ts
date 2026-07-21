import { API_BASE_URL, AUTH_COOKIE_KEY } from "@/lib/constants";
import { deleteCookie, setCookie } from "@/lib/cookies";
import { supabase } from "@/lib/supabase";
import { ApiSuccess } from "@/lib/types";

export class ApiRequestError extends Error {
  public readonly status: number;
  public readonly fieldErrors?: Array<{ field: string; message: string }>;

  constructor(
    message: string,
    status: number,
    fieldErrors?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: BodyInit | Record<string, unknown> | null;
  auth?: boolean;
}

/**
 * Get a valid Supabase access token.
 *
 * We deliberately do NOT fall back to the `faculty_cms_session` cookie here:
 * that cookie exists only so Next.js middleware can cheaply gate routes, and it
 * can hold a stale token (access tokens live ~1h but the cookie lives 7d).
 * Sending a stale token just produces backend 401s. The Supabase session in
 * storage is the source of truth and auto-refreshes when expired.
 *
 * `forceRefresh` explicitly rotates the token — used to recover from tokens that
 * were signed under an old JWT key (after Supabase key rotation) but haven't
 * expired yet, so `getSession()` alone wouldn't refresh them.
 */
async function getToken(forceRefresh = false): Promise<string | null> {
  try {
    if (forceRefresh) {
      const { data, error } = await supabase.auth.refreshSession();
      if (!error && data.session?.access_token) {
        setCookie(AUTH_COOKIE_KEY, data.session.access_token);
        return data.session.access_token;
      }
    }

    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) {
      setCookie(AUTH_COOKIE_KEY, data.session.access_token);
      return data.session.access_token;
    }
  } catch {
    // Supabase client unavailable — treat as unauthenticated.
  }
  return null;
}

/**
 * The backend runs on a free host that spins down when idle. The first request
 * after a spin-down can fail at the network layer (connection timeout / reset)
 * while the instance wakes up (~30-60s). A thrown fetch (TypeError) means the
 * server was unreachable — as opposed to an HTTP error response, which resolves
 * normally. We retry those network failures with backoff so a cold start
 * recovers transparently instead of surfacing "Failed to fetch" on the UI.
 */
const COLD_START_RETRY_DELAYS_MS = [2000, 5000, 9000];

async function fetchWithWake(url: string, init: RequestInit): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= COLD_START_RETRY_DELAYS_MS.length; attempt++) {
    try {
      return await fetch(url, init);
    } catch (err) {
      lastError = err;
      const delay = COLD_START_RETRY_DELAYS_MS[attempt];
      if (delay === undefined) break;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { body, auth = true, headers, ...rest } = options;

  const baseHeaders = new Headers(headers);
  let finalBody: BodyInit | null | undefined;

  if (body instanceof FormData) {
    finalBody = body;
  } else if (body !== undefined && body !== null) {
    baseHeaders.set("Content-Type", "application/json");
    finalBody = JSON.stringify(body);
  }

  // A caller may pin its own Authorization header (e.g. the login/sync flow that
  // holds a token before the session is persisted). We must not overwrite it.
  const callerSuppliedAuth = baseHeaders.has("Authorization");

  const send = async (forceRefresh: boolean) => {
    const finalHeaders = new Headers(baseHeaders);
    if (auth && !callerSuppliedAuth) {
      const token = await getToken(forceRefresh);
      if (token) finalHeaders.set("Authorization", `Bearer ${token}`);
    }
    return fetchWithWake(`${API_BASE_URL}${path}`, {
      ...rest,
      headers: finalHeaders,
      body: finalBody,
    });
  };

  let response = await send(false);

  // A 401 usually means the token we sent is stale/rotated. Try once more with a
  // freshly refreshed token before giving up. Skip retry when the caller pinned
  // its own Authorization header (we can't refresh someone else's token).
  if (response.status === 401 && auth && !callerSuppliedAuth) {
    response = await send(true);
    if (response.status === 401) {
      // Refresh didn't help — the session is truly dead. Clear it so middleware
      // sends the user back to login instead of looping on 401s.
      deleteCookie(AUTH_COOKIE_KEY);
      supabase.auth.signOut().catch(() => {});
    }
  }

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    const message =
      (payload && payload.message) || `Request failed with status ${response.status}`;
    const fieldErrors = Array.isArray(payload?.errors) ? payload.errors : undefined;
    throw new ApiRequestError(message, response.status, fieldErrors);
  }

  return payload as T;
}

export type { ApiSuccess };
