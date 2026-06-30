import type { LucideIcon } from "lucide-react";

export type CollectionId =
  | "tools"
  | "games"
  | "templates"
  | "components"
  | "ai"
  | "resources"
  | "learning";

export type CollectionStatus = "live" | "planned" | "experimental";
export type CollectionTone = "productive" | "playful" | "creative" | "learning" | "technical";

export type CollectionMetric = {
  label: string;
  value: string;
  helper?: string;
};

export type CollectionAction = {
  label: string;
  href: string;
  variant?: "primary" | "secondary";
};

export type CollectionDefinition = {
  id: CollectionId;
  title: string;
  navLabel: string;
  href: string;
  description: string;
  eyebrow: string;
  status: CollectionStatus;
  tone: CollectionTone;
  accent: "orange" | "teal" | "violet" | "blue" | "emerald" | "amber" | "rose";
  icon: LucideIcon;
  badges: string[];
  metrics: CollectionMetric[];
  primaryAction: CollectionAction;
  secondaryAction?: CollectionAction;
  searchPlaceholder: string;
  sections: string[];
};

export type CollectionItemBase = {
  id: string;
  slug: string;
  title: string;
  description: string;
  href: string;
  categories?: string[];
  tags?: string[];
  featured?: boolean;
  popular?: boolean;
  isNew?: boolean;
};
