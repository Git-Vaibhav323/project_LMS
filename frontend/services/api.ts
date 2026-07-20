import { API_BASE_URL, AUTH_COOKIE_KEY } from "@/lib/constants";
import { getCookie } from "@/lib/cookies";
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
 * Thin wrapper around fetch that:
 * - Prefixes the backend base URL
 * - Attaches the Bearer token (when auth !== false)
 * - JSON-encodes plain object bodies (leaves FormData untouched)
 * - Normalizes errors into ApiRequestError with field-level details
 */
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

  if (auth) {
    const token = getCookie(AUTH_COOKIE_KEY);
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
