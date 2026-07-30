import { z } from "zod";

const personSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  href: z.string().startsWith("/"),
});

const sectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  paragraphs: z.array(z.string().min(60)).min(1),
  bullets: z.array(z.string().min(12)).optional(),
  note: z.string().min(30).optional(),
});

const decisionItemSchema = z.object({
  label: z.string().min(1),
  guidance: z.string().min(30),
});

const comparisonTableSchema = z.object({
  columns: z.array(z.string().min(1)).min(2),
  rows: z.array(z.object({
    label: z.string().min(1),
    values: z.array(z.string().min(1)).min(2),
  })).min(3),
});

const faqSchema = z.object({
  question: z.string().min(10),
  answer: z.string().min(60),
});

export const editorialPageSchema = z.object({
  slug: z.string().min(1),
  kind: z.enum(["guide", "comparison"]),
  title: z.string().min(1),
  shortTitle: z.string().min(1),
  summary: z.string().min(80),
  description: z.string().min(140),
  primaryKeyword: z.string().min(1),
  secondaryKeywords: z.array(z.string().min(1)).min(3),
  searchIntent: z.string().min(30),
  audience: z.array(z.string().min(1)).min(2),
  readingMinutes: z.number().int().min(4),
  publishedAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  author: personSchema,
  reviewer: personSchema,
  featured: z.boolean(),
  quickAnswer: z.string().min(120),
  keyTakeaways: z.array(z.string().min(25)).min(3),
  sections: z.array(sectionSchema).min(4),
  decisionFramework: z.array(decisionItemSchema).optional(),
  comparisonTable: comparisonTableSchema.optional(),
  faqs: z.array(faqSchema).min(3),
  relatedPathSlugs: z.array(z.string().min(1)),
  relatedCareerSlugs: z.array(z.string().min(1)),
  relatedWaySlugs: z.array(z.string().min(1)),
  resourceIds: z.array(z.string().min(1)).min(1),
  references: z.array(z.object({
    name: z.string().min(1),
    url: z.string().url(),
    type: z.enum(["official", "standards", "research", "community"]),
  })).min(1),
  cta: z.object({
    title: z.string().min(1),
    text: z.string().min(40),
    href: z.string().startsWith("/"),
    label: z.string().min(1),
  }),
});

export const editorialCatalogSchema = z.array(editorialPageSchema);
export type EditorialPage = z.infer<typeof editorialPageSchema>;
export type EditorialKind = EditorialPage["kind"];
