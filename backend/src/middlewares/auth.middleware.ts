import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { sendError } from "../utils/apiResponse";

const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET || "";

if (!SUPABASE_JWT_SECRET) {
  throw new Error("SUPABASE_JWT_SECRET is not defined in environment variables.");
}

interface SupabaseJwtPayload {
  sub: string;   // Supabase user UUID
  email: string;
  role: string;
  iat: number;
  exp: number;
}

/**
 * Verifies the Supabase-issued JWT from the Authorization header.
 * On success, attaches faculty identity to req.faculty using the
 * Supabase user ID as facultyId (matches Faculty.id in our DB).
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
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

  try {
    const decoded = jwt.verify(token, SUPABASE_JWT_SECRET) as SupabaseJwtPayload;
    req.faculty = { facultyId: decoded.sub, email: decoded.email };
    next();
  } catch {
    sendError(res, 401, "Session expired or invalid. Please log in again.");
  }
}

export default requireAuth;
