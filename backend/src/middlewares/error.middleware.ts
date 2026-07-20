import { NextFunction, Request, Response } from "express";
import multer from "multer";
import { Prisma } from "@prisma/client";
import { AppError } from "../utils/AppError";
import { sendError } from "../utils/apiResponse";

/**
 * Catches everything forwarded via next(err), including thrown AppErrors,
 * Prisma errors, Multer errors, and unexpected exceptions, and translates
 * each into a consistent JSON error response.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Known, operational error we threw intentionally.
  if (err instanceof AppError) {
    sendError(res, err.statusCode, err.message, err.details);
    return;
  }

  // Multer-specific errors (file too large, unexpected field, etc.)
  if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "File is too large. Please upload a smaller file."
        : `File upload error: ${err.message}`;
    sendError(res, 400, message);
    return;
  }

  // Prisma known request errors (unique constraint violations, not found, etc.)
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      sendError(res, 409, "A record with this value already exists.");
      return;
    }
    if (err.code === "P2025") {
      sendError(res, 404, "Requested record was not found.");
      return;
    }
    sendError(res, 400, "Database request could not be processed.");
    return;
  }

  // Fallback: unknown/unexpected error.
  console.error("Unhandled error:", err);
  const message =
    err instanceof Error && process.env.NODE_ENV === "development"
      ? err.message
      : "Something went wrong on the server. Please try again later.";
  sendError(res, 500, message);
}

export function notFoundHandler(req: Request, res: Response): void {
  sendError(res, 404, `Route not found: ${req.method} ${req.originalUrl}`);
}
