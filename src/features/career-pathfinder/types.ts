import type { CareerCategory, CareerFocus } from "@/features/tech-careers";

export type PathfinderCareer = {
  slug: string;
  title: string;
  shortTitle: string;
  summary: string;
  category: CareerCategory;
  focus: CareerFocus;
  tags: string[];
  learningPathSlugs: string[];
  featured: boolean;
};

export type PathfinderOption = {
  id: string;
  label: string;
  description: string;
  focusWeights?: Partial<Record<CareerFocus, number>>;
  categoryWeights?: Partial<Record<CareerCategory, number>>;
  keywords?: string[];
};

export type PathfinderQuestion = {
  id: string;
  eyebrow: string;
  title: string;
  helper: string;
  options: PathfinderOption[];
};
