import { z } from "zod";

export const elementAdminQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(12),
    search: z.string().optional().default(""),

    // admin-only filters
    includeDeleted: z
      .enum(["true", "false"])
      .optional()
      .transform((v) => v === "true")
      .default(false),

    // "all" means no filter
    reviewed: z.enum(["true", "false", "all"]).optional().default("all"),
  })
  .strict();

export type ElementAdminQuery = z.infer<typeof elementAdminQuerySchema>;
