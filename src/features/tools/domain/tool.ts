// src/features/tools/domain/tool.ts

export type ToolId = string;

export type ToolVisibility = "public" | "unlisted" | "private";

export type ToolStatus = "ready" | "in_progress" | "planned";

export type ToolDefinition = {
  id: ToolId;

  title: string;
  description: string;
  href: string; // route path inside app

  tags: string[];

  mainCategory: string[];
  secondaryCategory: string[];

  visibility: ToolVisibility;

  // Optional metadata for UI
  /**
   * UI icon key.
   * Keep this as a string so it can be used by any UI layer (react-icons now,
   * lucide later, etc.).
   */
  icon?: string;

  /** Manual rollout / completeness metadata (no backend required). */
  status?: ToolStatus;
  completion?: number; // 0..100

  /** Future: aggregated metrics (privacy-first). */
  visitors?: number;
  createdAt?: Date;
  updatedAt?: Date;
};
