import type { CoreEntity } from "@/core/registry";

export type WorkflowCoreStep =
  | string
  | {
      id?: string;
      title: string;
      description?: string;
      href?: string;
      toolId?: string;
      handoff?: string;
    };

export type WorkflowCoreSource = {
  id: string;
  title: string;
  description: string;
  useCase: string;
  outcome?: string;
  estimatedTime?: string;
  audience?: string[];
  toolIds?: string[];
  steps?: readonly WorkflowCoreStep[];
};

function getWorkflowSteps(workflow: WorkflowCoreSource) {
  return workflow.steps ?? [];
}

function getToolIds(workflow: WorkflowCoreSource) {
  if (workflow.toolIds?.length) return workflow.toolIds;
  return getWorkflowSteps(workflow).flatMap((step) => (typeof step === "string" || !step.toolId ? [] : [step.toolId]));
}

export function toWorkflowCoreEntity(workflow: WorkflowCoreSource): CoreEntity {
  const href = `/workflows/${workflow.id}`;
  const steps = getWorkflowSteps(workflow);
  const toolIds = getToolIds(workflow);
  const audience = workflow.audience ?? [];
  const stepKeywords = steps.flatMap((step) =>
    typeof step === "string" ? [step] : [step.title, step.description ?? "", step.handoff ?? ""],
  );

  return {
    id: `workflow:${workflow.id}`,
    slug: workflow.id,
    kind: "workflow",
    title: workflow.title,
    description: workflow.description,
    href,
    status: "live",
    categories: audience,
    tags: toolIds,
    keywords: [workflow.useCase, workflow.outcome ?? "", ...audience, ...toolIds, ...stepKeywords].filter(Boolean),
    primaryAction: { label: "Open workflow", href },
    metadata: {
      toolCount: toolIds.length,
      stepCount: steps.length,
      ...(workflow.estimatedTime ? { estimatedTime: workflow.estimatedTime } : {}),
    },
  };
}

export function toWorkflowCoreEntities(workflows: readonly WorkflowCoreSource[]): CoreEntity[] {
  return workflows.map(toWorkflowCoreEntity);
}
