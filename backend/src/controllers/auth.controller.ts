import { Request, Response } from "express";
import { authService } from "../services/auth.service";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { AppError } from "../utils/AppError";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.register(req.body);
  sendSuccess(res, 201, "Account created successfully.", result);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body);
  sendSuccess(res, 200, "Logged in successfully.", result);
});

// JWTs are stateless, so "logout" is handled client-side by discarding the
// token. This endpoint exists for a clean, predictable API contract and to
// give the client an explicit action to call.
export const logout = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, 200, "Logged out successfully.");
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.faculty) {
    throw new AppError("Authentication required.", 401);
  }
  const faculty = await authService.getProfile(req.faculty.facultyId);
  sendSuccess(res, 200, "Profile fetched successfully.", faculty);
});
