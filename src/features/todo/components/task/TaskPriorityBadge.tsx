"use client";

import { Badge } from "@/components/ui/Badge";
import { PRIORITY_LABELS } from "../../domain/constants";
import type { TaskPriority } from "../../domain/types";

const VARIANT: Record<TaskPriority, "outline" | "info" | "warning" | "danger" | "soft"> = {
  none: "outline",
  low: "soft",
  medium: "info",
  urgent: "danger",
  high: "warning",
};

export function TaskPriorityBadge({ priority }: { priority: TaskPriority }) {
  if (priority === "none") return null;
  return (
    <Badge variant={VARIANT[priority]} className="text-[9px]">
      {PRIORITY_LABELS[priority]}
    </Badge>
  );
}
