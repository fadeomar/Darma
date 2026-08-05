import { z } from "zod";

export const careerCategorySchema = z.enum([
  "engineering",
  "quality-security",
  "design-research",
  "product-delivery",
  "leadership",
  "operations-growth",
]);

export const careerFocusSchema = z.enum([
  "build",
  "quality",
  "design",
  "discovery",
  "delivery",
  "people",
  "business",
]);

const careerLevelSchema = z.object({
  label: z.string().min(1),
  scope: z.string().min(40),
  evidence: z.array(z.string().min(1)).min(2),
});

export const techCareerSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  shortTitle: z.string().min(1),
  category: careerCategorySchema,
  focus: careerFocusSchema,
  summary: z.string().min(60),
  whatTheyDo: z.string().min(120),
  typicalDay: z.array(z.string().min(1)).min(4),
  responsibilities: z.array(z.string().min(1)).min(4),
  deliverables: z.array(z.string().min(1)).min(3),
  skills: z.object({
    technical: z.array(z.string().min(1)).min(3),
    human: z.array(z.string().min(1)).min(3),
  }),
  tools: z.array(z.string().min(1)).min(2),
  collaboratesWith: z.array(z.string().min(1)),
  howToStart: z.array(z.string().min(1)).min(3),
  misconceptions: z.array(z.string().min(1)).min(2),
  levels: z.object({
    junior: careerLevelSchema,
    mid: careerLevelSchema,
    senior: careerLevelSchema,
  }),
  learningPathSlugs: z.array(z.string().min(1)),
  resourceIds: z.array(z.string().min(1)),
  featured: z.boolean(),
  tags: z.array(z.string().min(1)).min(3),
  references: z.array(z.object({ name: z.string().min(1), url: z.string().url() })).min(1),
});

export const techCareerCatalogSchema = z.array(techCareerSchema);
export type TechCareer = z.infer<typeof techCareerSchema>;
export type CareerCategory = z.infer<typeof careerCategorySchema>;
export type CareerFocus = z.infer<typeof careerFocusSchema>;
