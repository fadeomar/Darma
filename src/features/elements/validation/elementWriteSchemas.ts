import { z } from "zod";

const tagSchema = z.string().min(1).max(50);
const categorySchema = z.string().min(1).max(50);

export const elementCreateSchema = z
  .object({
    title: z.string().min(1).max(200),
    slug: z.string().min(1).max(240).optional(),

    description: z.string().max(5000).optional().default(""),
    shortDescription: z.string().max(500).optional().nullable(),

    html: z.string().min(1),
    css: z.string().optional().default(""),
    js: z.string().optional().default(""),

    tags: z.array(tagSchema).max(50).optional().default([]),
    mainCategory: z.array(categorySchema).max(20).optional().default([]),
    secondaryCategory: z.array(categorySchema).max(50).optional().default([]),

    reviewed: z.boolean().optional().default(false),
  })
  .strict();

export type ElementCreateInput = z.infer<typeof elementCreateSchema>;

export const elementUpdateSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),

    description: z.string().max(5000).optional(),
    shortDescription: z.string().max(500).optional().nullable(),

    html: z.string().min(1).optional(),
    css: z.string().optional(),
    js: z.string().optional(),

    tags: z.array(tagSchema).max(50).optional(),
    mainCategory: z.array(categorySchema).max(20).optional(),
    secondaryCategory: z.array(categorySchema).max(50).optional(),

    slug: z.string().min(1).max(240).optional(),

    reviewed: z.boolean().optional(),
  })
  .strict();

export type ElementUpdateInput = z.infer<typeof elementUpdateSchema>;
