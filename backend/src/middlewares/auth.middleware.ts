import { NextFunction, Request, Response } from "express";
import { sendError } from "../utils/apiResponse";
import supabase from "../utils/supabase";

/**
 * Verifies the Supabase-issued JWT by calling supabase.auth.getUser().
 * This works regardless of the JWT algorithm (HS256 or RS256) because
 * Supabase verifies it server-side using its own keys.
 */
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

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    console.error("[auth] getUser failed:", error?.message);
    sendError(res, 401, "Session expired or invalid. Please log in again.");
    return;
  }

  req.faculty = {
    facultyId: data.user.id,
    email: data.user.email ?? "",
  };

  next();
}

export default requireAuth;
