export type ToolId = string;

export type ToolVisibility = "public" | "unlisted" | "private";
export type ToolStatus = "ready" | "in_progress" | "planned";
export type ToolPrivacy = "client-only" | "local-storage" | "server-assisted" | "external-api";
export type ToolLayoutType =
  | "text-workbench"
  | "visual-generator"
  | "fullscreen-studio"
  | "single-utility"
  | "interactive-challenge"
  | "directory";
export type ToolAudience =
  | "developer"
  | "designer"
  | "student"
  | "creator"
  | "general"
  | "business";

export type ToolDifficulty = "easy" | "medium" | "advanced";
export type ToolPowerLevel = "light" | "standard" | "pro";

export type ToolDefinition = {
  id: ToolId;
  title: string;
  description: string;
  shortDescription?: string;
  useCases?: string[];
  benefits?: string[];
  examples?: string[];
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
  difficulty?: ToolDifficulty;
  dailyUseScore?: number;
  toolPowerLevel?: ToolPowerLevel;
  featured?: boolean;
  pinned?: number;
  toolCategory?: string;
  layoutType?: ToolLayoutType;
  privacy?: ToolPrivacy;
  keywords?: string[];
  relatedTools?: ToolId[];
};
