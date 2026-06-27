"use client";

import { Badge } from "@/components/ui/Badge";
import { isOverdue } from "../../domain/taskRules";

export function TaskDueBadge({ dueAt, completed }: { dueAt?: string; completed: boolean }) {
  if (!dueAt || completed) return null;

  const date = new Date(dueAt);
  const label = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const overdue = isOverdue({ dueAt, completed });

  return (
    <Badge variant={overdue ? "danger" : "outline"} className="text-[9px]">
      {overdue ? "Overdue" : label}
    </Badge>
  );
}
