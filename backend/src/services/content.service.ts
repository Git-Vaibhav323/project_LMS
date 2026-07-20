import path from "path";
import { Prisma } from "@prisma/client";
import { AppError } from "../utils/AppError";
import prisma from "../utils/prisma";
import supabase from "../utils/supabase";
import { ContentCreateInput, ContentQuery, ContentUpdateInput } from "../types";

const BUCKET = process.env.SUPABASE_BUCKET || "faculty-files";

interface UploadedFileMeta {
  fileUrl: string;
  fileName: string;
  fileType: string;
  storagePath: string; // path inside the bucket, used for deletion
}

/**
 * Upload a buffer to Supabase Storage and return the public URL + storage path.
 */
async function uploadToSupabase(
  buffer: Buffer,
  originalName: string,
  mimeType: string
): Promise<{ publicUrl: string; storagePath: string }> {
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const safeExt = path.extname(originalName).toLowerCase();
  const storagePath = `uploads/${uniqueSuffix}${safeExt}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType: mimeType, upsert: false });

  if (error) {
    throw new AppError(`File upload failed: ${error.message}`, 500);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

  return { publicUrl: data.publicUrl, storagePath };
}

/**
 * Remove a file from Supabase Storage given the full public URL.
 * Extracts the storage path from the URL so we don't need to store it separately.
 */
async function removeFromSupabase(fileUrl?: string | null) {
  if (!fileUrl) return;

  // The public URL looks like:
  // https://<project>.supabase.co/storage/v1/object/public/<bucket>/<storagePath>
  // We extract everything after the bucket name.
  const marker = `/object/public/${BUCKET}/`;
  const idx = fileUrl.indexOf(marker);
  if (idx === -1) return; // not a Supabase URL — skip silently

  const storagePath = fileUrl.slice(idx + marker.length);

  const { error } = await supabase.storage.from(BUCKET).remove([storagePath]);
  if (error) {
    console.error(`Failed to remove file from Supabase (${storagePath}):`, error.message);
  }
}

async function assertOwnership(contentId: string, facultyId: string) {
  const content = await prisma.content.findUnique({ where: { id: contentId } });
  if (!content) {
    throw new AppError("Content not found.", 404);
  }
  if (content.facultyId !== facultyId) {
    throw new AppError("You do not have permission to modify this content.", 403);
  }
  return content;
}

export const contentService = {
  async create(facultyId: string, input: ContentCreateInput, file?: UploadedFileMeta) {
    return prisma.content.create({
      data: {
        title: input.title,
        description: input.description,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        facultyId,
        ...(file
          ? { fileUrl: file.fileUrl, fileName: file.fileName, fileType: file.fileType }
          : {}),
      },
    });
  },
  async list(facultyId: string, query: ContentQuery) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;

    const where: Prisma.ContentWhereInput = {
      facultyId,
      ...(query.search
        ? { title: { contains: query.search, mode: "insensitive" as Prisma.QueryMode } }
        : {}),
    };

    const orderBy: Prisma.ContentOrderByWithRelationInput = {
      createdAt: query.sort === "oldest" ? "asc" : "desc",
    };

    const [items, total, totalAll] = await Promise.all([
      prisma.content.findMany({ where, orderBy, skip: (page - 1) * limit, take: limit }),
      prisma.content.count({ where }),
      prisma.content.count({ where: { facultyId } }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      totalContentCount: totalAll,
    };
  },

  async getById(facultyId: string, contentId: string) {
    const content = await prisma.content.findUnique({ where: { id: contentId } });
    if (!content) {
      throw new AppError("Content not found.", 404);
    }
    if (content.facultyId !== facultyId) {
      throw new AppError("You do not have permission to view this content.", 403);
    }
    return content;
  },

  async update(
    facultyId: string,
    contentId: string,
    input: ContentUpdateInput,
    file?: UploadedFileMeta
  ) {
    const existing = await assertOwnership(contentId, facultyId);

    // Fire-and-forget old file removal — don't block the DB update on storage cleanup
    if (file && existing.fileUrl) {
      removeFromSupabase(existing.fileUrl).catch((err) =>
        console.error("Background file removal failed:", err)
      );
    }

    return prisma.content.update({
      where: { id: contentId },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.dueDate !== undefined
          ? { dueDate: input.dueDate ? new Date(input.dueDate) : null }
          : {}),
        ...(file
          ? { fileUrl: file.fileUrl, fileName: file.fileName, fileType: file.fileType }
          : {}),
      },
    });
  },

  async remove(facultyId: string, contentId: string) {
    const existing = await assertOwnership(contentId, facultyId);
    // Run storage deletion and DB deletion in parallel
    await Promise.all([
      removeFromSupabase(existing.fileUrl),
      prisma.content.delete({ where: { id: contentId } }),
    ]);
  },

  async dashboardSummary(facultyId: string) {
    const [total, recent] = await Promise.all([
      prisma.content.count({ where: { facultyId } }),
      prisma.content.findMany({
        where: { facultyId },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);
    return { total, recent };
  },
};

export { uploadToSupabase };
export default contentService;
