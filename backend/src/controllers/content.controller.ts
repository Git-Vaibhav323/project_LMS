import { Request, Response } from "express";
import { contentService, uploadToSupabase } from "../services/content.service";
import { authService } from "../services/auth.service";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { AppError } from "../utils/AppError";
import { ContentQuery } from "../types";

/**
 * If a file was attached to the request, upload it to Supabase Storage
 * and return the metadata needed to persist in the DB.
 */
async function buildFileMeta(req: Request) {
  if (!req.file) return undefined;

  const { publicUrl, storagePath } = await uploadToSupabase(
    req.file.buffer,
    req.file.originalname,
    req.file.mimetype
  );

  return {
    fileUrl: publicUrl,
    fileName: req.file.originalname,
    fileType: req.file.mimetype,
    storagePath,
  };
}

function requireFacultyId(req: Request): string {
  if (!req.faculty) {
    throw new AppError("Authentication required.", 401);
  }
  return req.faculty.facultyId;
}

export const createContent = asyncHandler(async (req: Request, res: Response) => {
  const facultyId = requireFacultyId(req);
  // Guarantee the faculty row exists so the content FK can never fail, even if
  // the post-login sync was missed. Run it alongside the file upload so the DB
  // check overlaps the (network-bound) storage upload instead of adding to it.
  const [, fileMeta] = await Promise.all([
    authService.ensureFaculty(facultyId, req.faculty!.email, req.faculty!.name),
    buildFileMeta(req),
  ]);
  const content = await contentService.create(facultyId, req.body, fileMeta);
  sendSuccess(res, 201, "Content uploaded successfully.", content);
});

export const listContent = asyncHandler(async (req: Request, res: Response) => {
  const facultyId = requireFacultyId(req);
  const query = req.query as unknown as ContentQuery;
  const result = await contentService.list(facultyId, query);
  sendSuccess(res, 200, "Content fetched successfully.", result.items, {
    pagination: result.pagination,
    totalContentCount: result.totalContentCount,
  });
});

export const getContentById = asyncHandler(async (req: Request, res: Response) => {
  const facultyId = requireFacultyId(req);
  const content = await contentService.getById(facultyId, req.params.id);
  sendSuccess(res, 200, "Content fetched successfully.", content);
});

export const updateContent = asyncHandler(async (req: Request, res: Response) => {
  const facultyId = requireFacultyId(req);
  const content = await contentService.update(
    facultyId,
    req.params.id,
    req.body,
    await buildFileMeta(req)
  );
  sendSuccess(res, 200, "Content updated successfully.", content);
});

export const deleteContent = asyncHandler(async (req: Request, res: Response) => {
  const facultyId = requireFacultyId(req);
  await contentService.remove(facultyId, req.params.id);
  sendSuccess(res, 200, "Content deleted successfully.");
});

export const getDashboardSummary = asyncHandler(async (req: Request, res: Response) => {
  const facultyId = requireFacultyId(req);
  const summary = await contentService.dashboardSummary(facultyId);
  sendSuccess(res, 200, "Dashboard summary fetched successfully.", summary);
});
