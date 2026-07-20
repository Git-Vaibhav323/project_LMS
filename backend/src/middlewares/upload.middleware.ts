import multer, { FileFilterCallback } from "multer";
import { Request } from "express";
import { AppError } from "../utils/AppError";

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
]);

function fileFilter(_req: Request, file: Express.Multer.File, cb: FileFilterCallback) {
  if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        "Unsupported file type. Allowed formats: PDF, PPT, PPTX, DOC, DOCX, PNG, JPG, JPEG, WEBP, GIF.",
        400
      )
    );
  }
}

const maxSizeMb = Number(process.env.MAX_FILE_SIZE_MB) || 10;

// Files are held in memory (req.file.buffer) and streamed to Supabase Storage.
// No local disk writes happen.
export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: maxSizeMb * 1024 * 1024 },
});
