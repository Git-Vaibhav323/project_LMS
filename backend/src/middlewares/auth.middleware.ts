import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { sendError } from "../utils/apiResponse";

const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET || "";

if (!SUPABASE_JWT_SECRET) {
  throw new Error("SUPABASE_JWT_SECRET is not defined in environment variables.");
}

// Supabase JWT secrets are base64-encoded — decode to raw bytes for verification
const JWT_SECRET_BUFFER = Buffer.from(SUPABASE_JWT_SECRET, "base64");

interface SupabaseJwtPayload {
  sub: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

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

  // Try base64-decoded secret first, then raw string as fallback
  // This handles both Supabase JWT secret formats
  let decoded: SupabaseJwtPayload | null = null;

  try {
    decoded = jwt.verify(token, JWT_SECRET_BUFFER) as SupabaseJwtPayload;
  } catch {
    try {
      decoded = jwt.verify(token, SUPABASE_JWT_SECRET) as SupabaseJwtPayload;
    } catch (err2) {
      const msg = err2 instanceof Error ? err2.message : String(err2);
      console.error("[auth] JWT verify failed:", msg);
      sendError(res, 401, "Session expired or invalid. Please log in again.");
      return;
    }
  }

  req.faculty = { facultyId: decoded.sub, email: decoded.email };
  next();
}

export default requireAuth;
