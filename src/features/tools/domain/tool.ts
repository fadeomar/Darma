// src/features/tools/domain/tool.ts

export type ToolId = string;

export type ToolVisibility = "public" | "unlisted" | "private";

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
  icon?: string; // keep string for now (lucide name later)
  createdAt?: Date;
  updatedAt?: Date;
};
