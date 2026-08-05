import { z } from "zod";

export const resourceTypeSchema = z.enum([
  "documentation",
  "course",
  "tutorial",
  "tool",
  "generator",
  "community",
  "reference",
  "asset-library",
]);
export const resourceLevelSchema = z.enum(["beginner", "intermediate", "advanced"]);
export const resourcePricingSchema = z.enum(["free", "freemium", "paid", "unknown"]);
export const publisherTypeSchema = z.enum(["official", "community", "unknown"]);
export const resourceReviewStatusSchema = z.enum(["verified", "review-needed", "archived"]);

export const resourceIconSchema = z.object({
  logoUrl: z.string().url().optional(),
  faviconUrl: z.string().url().optional(),
  localPath: z.string().startsWith("/").optional(),
  status: z.enum(["local", "remote-candidate", "fallback-only", "review-needed"]),
});

export const resourceSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  url: z.string().url(),
  domain: z.string().min(1),
  summary: z.string().min(20),
  categories: z.array(z.string().min(1)).min(1),
  tags: z.array(z.string().min(1)),
  resourceType: resourceTypeSchema,
  levels: z.array(resourceLevelSchema),
  pricing: resourcePricingSchema,
  publisherType: publisherTypeSchema,
  featured: z.boolean(),
  related: z.object({ title: z.string().min(1), href: z.string().startsWith("/") }).optional(),
  icon: resourceIconSchema,
  review: z.object({
    status: resourceReviewStatusSchema,
    lastChecked: z.string().datetime().nullable(),
    notes: z.string().optional(),
  }),
  source: z.object({
    importedFrom: z.string().min(1),
    originalUrls: z.array(z.string().min(1)).min(1),
  }),
});

export const resourceCatalogSchema = z.array(resourceSchema);
export type Resource = z.infer<typeof resourceSchema>;
export type ResourceType = z.infer<typeof resourceTypeSchema>;
export type ResourceLevel = z.infer<typeof resourceLevelSchema>;
export type ResourcePricing = z.infer<typeof resourcePricingSchema>;
export type PublisherType = z.infer<typeof publisherTypeSchema>;
