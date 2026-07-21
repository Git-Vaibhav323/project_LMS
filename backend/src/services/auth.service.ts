import { AppError } from "../utils/AppError";
import prisma from "../utils/prisma";

/**
 * Called after Supabase Auth creates/signs in a user.
 * Finds existing faculty by email OR id, then ensures the id matches
 * the Supabase UUID. This handles migration from the old JWT system
 * where faculty rows had different UUIDs.
 */
async function syncFaculty(supabaseId: string, name: string, email: string) {
  // Check if a row exists with this email (old system had a different id)
  const existing = await prisma.faculty.findUnique({ where: { email } });

  if (existing) {
    if (existing.id === supabaseId) {
      // Already in sync — nothing to do
      return existing;
    }
    // ID mismatch — update the id to match Supabase UUID
    // Must delete and recreate because id is the primary key
    await prisma.content.updateMany({
      where: { facultyId: existing.id },
      data: { facultyId: supabaseId },
    });
    await prisma.faculty.delete({ where: { id: existing.id } });
    return prisma.faculty.create({
      data: { id: supabaseId, name: existing.name, email, password: "" },
    });
  }

  // No existing row — create fresh
  return prisma.faculty.create({
    data: { id: supabaseId, name, email, password: "" },
  });
}

async function getProfile(facultyId: string) {
  const faculty = await prisma.faculty.findUnique({ where: { id: facultyId } });
  if (!faculty) {
    throw new AppError("Faculty account not found.", 404);
  }
  return {
    id: faculty.id,
    name: faculty.name,
    email: faculty.email,
    createdAt: faculty.createdAt,
  };
}

export const authService = { syncFaculty, getProfile };
export default authService;
