import { AppError } from "../utils/AppError";
import prisma from "../utils/prisma";

/**
 * Called after Supabase Auth creates a user.
 * Creates the Faculty row in our DB if it doesn't exist yet,
 * using the Supabase user UUID as the primary key so the two
 * systems stay in sync without any extra mapping table.
 */
async function syncFaculty(supabaseId: string, name: string, email: string) {
  return prisma.faculty.upsert({
    where: { id: supabaseId },
    update: {},          // already exists — nothing to change
    create: { id: supabaseId, name, email, password: "" },
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
