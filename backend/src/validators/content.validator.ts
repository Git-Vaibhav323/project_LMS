import { z } from "zod";

export const createContentSchema = z.object({
  title: z
    .string({ required_error: "Title is required" })
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(150, "Title must be under 150 characters"),
  description: z
    .string({ required_error: "Description is required" })
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description must be under 2000 characters"),
  dueDate: z
    .string()
    .trim()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: "Due date must be a valid date",
    })
    .optional()
    .nullable(),
});

export const updateContentSchema = createContentSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided to update" }
);

export const contentQuerySchema = z.object({
  search: z.string().trim().max(150).optional(),
  sort: z.enum(["newest", "oldest"]).optional().default("newest"),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(12),
});

export type CreateContentSchema = z.infer<typeof createContentSchema>;
export type UpdateContentSchema = z.infer<typeof updateContentSchema>;
export type ContentQuerySchema = z.infer<typeof contentQuerySchema>;
