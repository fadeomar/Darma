import { z } from "zod";

export const wayKindSchema = z.enum([
  "principles",
  "framework",
  "method",
  "lifecycle",
  "design-process",
  "predictive-model",
  "hybrid",
]);

const flowStageSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(40),
  participants: z.array(z.string().min(1)).min(1),
  outputs: z.array(z.string().min(1)).min(1),
});

export const wayOfWorkingSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  shortTitle: z.string().min(1),
  kind: wayKindSchema,
  summary: z.string().min(60),
  description: z.string().min(140),
  bestFor: z.array(z.string().min(1)).min(3),
  avoidWhen: z.array(z.string().min(1)).min(2),
  coreIdeas: z.array(z.string().min(1)).min(4),
  flow: z.array(flowStageSchema).min(3),
  roles: z.array(z.string().min(1)).min(2),
  cadence: z.array(z.string().min(1)).min(1),
  artifacts: z.array(z.string().min(1)).min(1),
  strengths: z.array(z.string().min(1)).min(3),
  risks: z.array(z.string().min(1)).min(3),
  healthySignals: z.array(z.string().min(1)).min(3),
  relatedRoleSlugs: z.array(z.string().min(1)),
  relatedTerms: z.array(z.string().min(1)),
  compareWith: z.array(z.string().min(1)),
  resourceIds: z.array(z.string().min(1)),
  featured: z.boolean(),
  tags: z.array(z.string().min(1)).min(3),
  references: z.array(z.object({ name: z.string().min(1), url: z.string().url() })).min(1),
});

export const wayOfWorkingCatalogSchema = z.array(wayOfWorkingSchema);
export type WayOfWorking = z.infer<typeof wayOfWorkingSchema>;
export type WayKind = z.infer<typeof wayKindSchema>;
