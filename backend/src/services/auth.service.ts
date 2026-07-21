import { Prisma } from "@prisma/client";
import { AppError } from "../utils/AppError";
import prisma from "../utils/prisma";

/**
 * Derive a reasonable display name when the client didn't send one
 * (e.g. the self-heal path from GET /me).
 */
function fallbackName(email: string, provided?: string | null): string {
  const trimmed = provided?.trim();
  if (trimmed && trimmed.length >= 2) return trimmed;
  const local = email.split("@")[0] || "Faculty";
  return local.length >= 2 ? local : "Faculty";
}

/**
 * Guarantees a Faculty row exists whose primary key equals the Supabase Auth
 * UUID. Idempotent and safe to call on every authenticated request.
 *
 * Handles three cases:
 *  1. Row already keyed by the Supabase UUID  -> return it (keep email fresh).
 *  2. Legacy row keyed by an old JWT-era UUID  -> atomically migrate its content
 *     to the Supabase UUID and re-key the row.
 *  3. No row yet                               -> create it.
 *
 * A concurrent create (two parallel requests right after login) is absorbed via
 * the P2002 unique-violation catch instead of surfacing to the client.
 */
async function ensureFaculty(supabaseId: string, email: string, name?: string | null) {
  // Case 1: already synced by id.
  const byId = await prisma.faculty.findUnique({ where: { id: supabaseId } });
  if (byId) {
    if (byId.email !== email) {
      return prisma.faculty.update({ where: { id: supabaseId }, data: { email } });
    }
    return byId;
  }

  // Case 2: a legacy row exists under this email with a different id.
  const byEmail = await prisma.faculty.findUnique({ where: { email } });
  if (byEmail && byEmail.id !== supabaseId) {
    // Order matters and must respect two constraints simultaneously:
    //   - `email` is unique, so the new row can't be created while the old row
    //     still holds the email.
    //   - `contents.facultyId` FK, so content can't point at the new id until
    //     that row exists, and the old row can't be deleted while content
    //     still references it.
    // So: park the old email -> create new row -> repoint content -> drop old.
    const parkedEmail = `migrated+${byEmail.id}@faculty-cms.local`;
    await prisma.$transaction([
      prisma.faculty.update({
        where: { id: byEmail.id },
        data: { email: parkedEmail },
      }),
      prisma.faculty.create({
        data: {
          id: supabaseId,
          name: fallbackName(email, byEmail.name || name),
          email,
          password: "",
        },
      }),
      prisma.content.updateMany({
        where: { facultyId: byEmail.id },
        data: { facultyId: supabaseId },
      }),
      prisma.faculty.delete({ where: { id: byEmail.id } }),
    ]);
    return prisma.faculty.findUnique({ where: { id: supabaseId } });
  }

  // Case 3: brand new user.
  try {
    return await prisma.faculty.create({
      data: { id: supabaseId, name: fallbackName(email, name), email, password: "" },
    });
  } catch (err) {
    // Another concurrent request already created the row — just return it.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const existing =
        (await prisma.faculty.findUnique({ where: { id: supabaseId } })) ??
        (await prisma.faculty.findUnique({ where: { email } }));
      if (existing) return existing;
    }
    throw err;
  }
}

/**
 * Returns the faculty profile, creating the row on the fly if it doesn't exist
 * yet. This self-heal means an authenticated user can never hit a 404 just
 * because the post-login sync call was missed or failed.
 */
async function getProfile(facultyId: string, email?: string, name?: string) {
  let faculty = await prisma.faculty.findUnique({ where: { id: facultyId } });

  if (!faculty && email) {
    faculty = await ensureFaculty(facultyId, email, name);
  }

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

export const authService = { ensureFaculty, getProfile };
export default authService;
