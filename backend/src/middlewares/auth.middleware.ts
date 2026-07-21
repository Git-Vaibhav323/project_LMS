import { NextFunction, Request, Response } from "express";
import { sendError } from "../utils/apiResponse";
import supabase from "../utils/supabase";
import { AuthenticatedFaculty } from "../types";

/**
 * A single browser session reuses the same access token for many API calls.
 * Calling supabase.auth.getUser() (a network round-trip to Supabase Auth) on
 * every request is the dominant per-request latency. We cache the verified
 * result keyed by the token, bounded by the token's own `exp`, so repeat
 * requests are validated in-process. A short safety cap (60s) is applied so a
 * revoked token isn't honored for longer than that.
 */
interface CachedAuth {
  faculty: AuthenticatedFaculty;
  expiresAt: number;
}

const MAX_TTL_MS = 60_000;
const MAX_CACHE_ENTRIES = 5_000;
const tokenCache = new Map<string, CachedAuth>();

/** Reads the JWT `exp` (seconds) without verifying — used only to bound TTL. */
function readTokenExpiryMs(token: string): number | null {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64").toString("utf8")
    );
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    sendError(res, 401, "Authentication required. Please log in.");
    return;
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    sendError(res, 401, "Authentication required. Please log in.");
    return;
  }

  const now = Date.now();
  const cached = tokenCache.get(token);
  if (cached && cached.expiresAt > now) {
    req.faculty = cached.faculty;
    next();
    return;
  }
  if (cached) tokenCache.delete(token);

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    console.error("[auth] getUser failed:", error?.message);
    sendError(res, 401, "Session expired or invalid. Please log in again.");
    return;
  }

  const metadataName =
    typeof data.user.user_metadata?.name === "string"
      ? (data.user.user_metadata.name as string)
      : undefined;

  const faculty: AuthenticatedFaculty = {
    facultyId: data.user.id,
    email: data.user.email ?? "",
    name: metadataName,
  };

  const tokenExpiry = readTokenExpiryMs(token);
  const expiresAt = Math.min(now + MAX_TTL_MS, tokenExpiry ?? now + MAX_TTL_MS);
  if (expiresAt > now) {
    // Cheap unbounded-growth guard: reset if it ever gets large.
    if (tokenCache.size >= MAX_CACHE_ENTRIES) tokenCache.clear();
    tokenCache.set(token, { faculty, expiresAt });
  }

  req.faculty = faculty;
  next();
}

export default requireAuth;
