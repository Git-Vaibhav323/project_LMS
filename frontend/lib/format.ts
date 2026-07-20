import { format, formatDistanceToNow } from "date-fns";

export function formatDate(dateString: string): string {
  return format(new Date(dateString), "MMM d, yyyy");
}

export function formatRelative(dateString: string): string {
  return formatDistanceToNow(new Date(dateString), { addSuffix: true });
}

export function fileExtension(fileName?: string | null): string {
  if (!fileName) return "";
  const parts = fileName.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : "";
}

export function isImageType(fileType?: string | null): boolean {
  return Boolean(fileType?.startsWith("image/"));
}

export function isPdfType(fileType?: string | null): boolean {
  return fileType === "application/pdf";
}
