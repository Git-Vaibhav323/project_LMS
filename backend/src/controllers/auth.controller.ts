import { Request, Response } from "express";
import { authService } from "../services/auth.service";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { AppError } from "../utils/AppError";

/**
 * POST /api/auth/sync
 * Called by the frontend right after Supabase signUp succeeds.
 * Creates the Faculty row in our DB (upsert — safe to call multiple times).
 * Requires a valid Supabase JWT so we know the user is authenticated.
 */
export const syncFaculty = asyncHandler(async (req: Request, res: Response) => {
  if (!req.faculty) {
    throw new AppError("Authentication required.", 401);
  }
  const { name } = req.body;
  if (!name || typeof name !== "string" || name.trim().length < 2) {
    throw new AppError("Name must be at least 2 characters.", 400);
  }

  const faculty = await authService.syncFaculty(
    req.faculty.facultyId,
    name.trim(),
    req.faculty.email
  );

  sendSuccess(res, 200, "Faculty profile synced.", {
    id: faculty.id,
    name: faculty.name,
    email: faculty.email,
    createdAt: faculty.createdAt,
  });
});

/**
 * GET /api/auth/me
 * Returns the Faculty profile for the authenticated user.
 */
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.faculty) {
    throw new AppError("Authentication required.", 401);
  }
  const faculty = await authService.getProfile(req.faculty.facultyId);
  sendSuccess(res, 200, "Profile fetched successfully.", faculty);
});

/**
 * POST /api/auth/logout
 * Supabase logout is handled client-side. This endpoint exists
 * only so the frontend has a clean API contract to call.
 */
export const logout = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, 200, "Logged out successfully.");
});
