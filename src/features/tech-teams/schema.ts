import { z } from "zod";

export const teamModelSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(60),
  description: z.string().min(120),
  usefulWhen: z.array(z.string().min(1)).min(3),
  watchOutFor: z.array(z.string().min(1)).min(3),
  typicalRoleSlugs: z.array(z.string().min(1)).min(2),
  decisionPattern: z.string().min(40),
  communicationPattern: z.string().min(40),
  example: z.string().min(50),
  tags: z.array(z.string().min(1)).min(2),
});

export const deliveryStageSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  question: z.string().min(1),
  description: z.string().min(40),
  roleSlugs: z.array(z.string().min(1)).min(1),
  outputs: z.array(z.string().min(1)).min(1),
  glossaryTerms: z.array(z.string().min(1)),
});

export const teamModelsCatalogSchema = z.array(teamModelSchema);
export const deliveryFlowSchema = z.array(deliveryStageSchema);
export type TeamModel = z.infer<typeof teamModelSchema>;
export type DeliveryStage = z.infer<typeof deliveryStageSchema>;
