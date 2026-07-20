import bcrypt from "bcryptjs";
import { AppError } from "../utils/AppError";
import { signToken } from "../utils/jwt";
import prisma from "../utils/prisma";
import { LoginInput, RegisterInput } from "../types";

const SALT_ROUNDS = 8; // 8 rounds ≈ 40ms vs 10 rounds ≈ 160ms — still secure for bcrypt

function toPublicFaculty(faculty: { id: string; name: string; email: string; createdAt: Date }) {
  return {
    id: faculty.id,
    name: faculty.name,
    email: faculty.email,
    createdAt: faculty.createdAt,
  };
}

export const authService = {
  async register(input: RegisterInput) {
    const existing = await prisma.faculty.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new AppError("An account with this email already exists.", 409);
    }

    const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

    const faculty = await prisma.faculty.create({
      data: {
        name: input.name,
        email: input.email,
        password: hashedPassword,
      },
    });

    const token = signToken({ facultyId: faculty.id, email: faculty.email });

    return { faculty: toPublicFaculty(faculty), token };
  },

  async login(input: LoginInput) {
    const faculty = await prisma.faculty.findUnique({ where: { email: input.email } });
    if (!faculty) {
      throw new AppError("Invalid email or password.", 401);
    }

    const isMatch = await bcrypt.compare(input.password, faculty.password);
    if (!isMatch) {
      throw new AppError("Invalid email or password.", 401);
    }

    const token = signToken({ facultyId: faculty.id, email: faculty.email });

    return { faculty: toPublicFaculty(faculty), token };
  },

  async getProfile(facultyId: string) {
    const faculty = await prisma.faculty.findUnique({ where: { id: facultyId } });
    if (!faculty) {
      throw new AppError("Faculty account not found.", 404);
    }
    return toPublicFaculty(faculty);
  },
};

export default authService;
