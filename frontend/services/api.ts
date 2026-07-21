import { API_BASE_URL, AUTH_COOKIE_KEY } from "@/lib/constants";
import { getCookie } from "@/lib/cookies";
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
 * Get the best available auth token:
 * 1. Try Supabase session directly (always fresh, handles token refresh)
 * 2. Fall back to cookie (set during login for middleware route protection)
 */
async function getToken(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) return data.session.access_token;
  } catch {
    // Supabase not available — fall back to cookie
  }
  return getCookie(AUTH_COOKIE_KEY);
}

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { body, auth = true, headers, ...rest } = options;

  const finalHeaders = new Headers(headers);
  let finalBody: BodyInit | null | undefined;

  if (body instanceof FormData) {
    finalBody = body;
  } else if (body !== undefined && body !== null) {
    finalHeaders.set("Content-Type", "application/json");
    finalBody = JSON.stringify(body);
  }

  if (auth && !finalHeaders.has("Authorization")) {
    const token = await getToken();
    if (token) {
      finalHeaders.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
    body: finalBody,
  });

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
