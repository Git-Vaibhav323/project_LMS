import { NextFunction, Request, Response } from "express";
import { sendError } from "../utils/apiResponse";
import { verifyToken } from "../utils/jwt";

/**
 * Protects private routes. Expects a Bearer token in the Authorization
 * header. On success, attaches the decoded faculty identity to req.faculty.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    sendError(res, 401, "Authentication required. Please log in.");
    return;
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    sendError(res, 401, "Authentication required. Please log in.");
    return;
  }

  try {
    const decoded = verifyToken(token);
    req.faculty = { facultyId: decoded.facultyId, email: decoded.email };
    next();
  } catch (err) {
    sendError(res, 401, "Session expired or invalid. Please log in again.");
  }
}

export default requireAuth;
