import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const hashedPassword = await bcrypt.hash("Password123!", 10);

  const faculty = await prisma.faculty.upsert({
    where: { email: "faculty@university.edu" },
    update: {},
    create: {
      name: "Dr. Ava Whitfield",
      email: "faculty@university.edu",
      password: hashedPassword,
    },
  });

  console.log(`Sample faculty ready: ${faculty.email} / Password123!`);

  const existingContent = await prisma.content.count({
    where: { facultyId: faculty.id },
  });

  if (existingContent === 0) {
    await prisma.content.createMany({
      data: [
        {
          title: "Introduction to Data Structures",
          description:
            "Lecture notes covering arrays, linked lists, stacks, and queues with worked examples for first-year students.",
          category: "Lecture Notes",
          facultyId: faculty.id,
        },
        {
          title: "Midterm Study Guide - Algorithms",
          description:
            "A condensed guide summarizing sorting, searching, and complexity analysis topics for the midterm exam.",
          category: "Study Guide",
          facultyId: faculty.id,
        },
        {
          title: "Research Paper: Neural Network Optimization",
          description:
            "Draft of an ongoing research paper exploring gradient descent variants and convergence behavior.",
          category: "Research",
          facultyId: faculty.id,
        },
      ],
    });
    console.log("Sample content created.");
  }

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
