import { NextFunction, Request, Response } from "express";
import { ZodError, ZodTypeAny } from "zod";
import { sendError } from "../utils/apiResponse";

type RequestPart = "body" | "query" | "params";

/**
 * Validates req[part] against the given zod schema.
 * On success, replaces req[part] with the parsed (and coerced/trimmed) data.
 * On failure, responds 422 with a field-level error breakdown.
 */
export const validate =
  (schema: ZodTypeAny, part: RequestPart = "body") =>
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[part]);
      (req as Record<RequestPart, unknown>)[part] = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors = err.errors.map((e) => ({
          field: e.path.join(".") || part,
          message: e.message,
        }));
        sendError(res, 422, "Validation failed", errors);
        return;
      }
      next(err);
    }
  };

export default validate;
