import { Response } from "express";

interface SuccessPayload<T> {
  success: true;
  message: string;
  data?: T;
  meta?: Record<string, unknown>;
}

interface ErrorPayload {
  success: false;
  message: string;
  errors?: unknown;
}

/**
 * Sends a consistent success response shape across every endpoint:
 * { success, message, data, meta? }
 */
export function sendSuccess<T>(
  res: Response,
  statusCode: number,
  message: string,
  data?: T,
  meta?: Record<string, unknown>
): Response {
  const payload: SuccessPayload<T> = { success: true, message, data, meta };
  return res.status(statusCode).json(payload);
}

/**
 * Sends a consistent error response shape: { success, message, errors? }
 */
export function sendError(
  res: Response,
  statusCode: number,
  message: string,
  errors?: unknown
): Response {
  const payload: ErrorPayload = { success: false, message, errors };
  return res.status(statusCode).json(payload);
}
