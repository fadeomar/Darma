export type ToolId = string;

export type ToolVisibility = "public" | "unlisted" | "private";
export type ToolStatus = "ready" | "in_progress" | "planned";
export type ToolLayoutType =
  | "text-workbench"
  | "visual-generator"
  | "fullscreen-studio"
  | "single-utility"
  | "directory";
export type ToolAudience =
  | "developer"
  | "designer"
  | "student"
  | "creator"
  | "general";

export type ToolDefinition = {
  id: ToolId;
  title: string;
  description: string;
  href: string;
  tags: string[];
  mainCategory: string[];
  secondaryCategory: string[];
  visibility: ToolVisibility;
  icon?: string;
  status?: ToolStatus;
  completion?: number;
  visitors?: number;
  createdAt?: Date;
  updatedAt?: Date;
  audiences?: ToolAudience[];
  featured?: boolean;
  pinned?: number;
  toolCategory?: string;
  layoutType?: ToolLayoutType;
};
