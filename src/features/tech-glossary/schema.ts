import { z } from "zod";

export const glossaryCategorySchema = z.enum([
  "engineering",
  "product",
  "delivery",
  "design",
  "operations",
  "people-business",
]);

export const glossaryTermSchema = z.object({
  slug: z.string().min(1),
  term: z.string().min(1),
  acronym: z.string().min(1).optional(),
  aliases: z.array(z.string().min(1)),
  category: glossaryCategorySchema,
  definition: z.string().min(50),
  practicalMeaning: z.string().min(60),
  example: z.string().min(30),
  relatedTerms: z.array(z.string().min(1)),
  relatedRoleSlugs: z.array(z.string().min(1)),
  relatedMethodSlugs: z.array(z.string().min(1)),
  tags: z.array(z.string().min(1)).min(2),
});

export const glossaryCatalogSchema = z.array(glossaryTermSchema);
export type GlossaryTerm = z.infer<typeof glossaryTermSchema>;
export type GlossaryCategory = z.infer<typeof glossaryCategorySchema>;
