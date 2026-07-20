import { FileText, FileImage, FileType2, File as FileIcon } from "lucide-react";

export function getFileIcon(fileType?: string | null) {
  if (!fileType) return FileIcon;
  if (fileType.startsWith("image/")) return FileImage;
  if (fileType === "application/pdf") return FileText;
  if (fileType.includes("word") || fileType.includes("presentation") || fileType.includes("powerpoint")) {
    return FileType2;
  }
  return FileIcon;
}
