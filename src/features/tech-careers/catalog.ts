import careerData from "./tech-careers.json";
import {
  techCareerCatalogSchema,
  type CareerCategory,
  type CareerFocus,
  type TechCareer,
} from "./schema";

export const TECH_CAREERS: TechCareer[] = techCareerCatalogSchema.parse(careerData);
export const CAREER_CATEGORIES: CareerCategory[] = [
  "engineering",
  "quality-security",
  "design-research",
  "product-delivery",
  "leadership",
  "operations-growth",
];
export const CAREER_FOCUSES: CareerFocus[] = [
  "build",
  "quality",
  "design",
  "discovery",
  "delivery",
  "people",
  "business",
];

export const getTechCareers = () => TECH_CAREERS;
export const getTechCareer = (slug: string) => TECH_CAREERS.find((career) => career.slug === slug);
export const getFeaturedTechCareers = (limit = TECH_CAREERS.length) =>
  TECH_CAREERS.filter((career) => career.featured).slice(0, limit);
export const getTechCareersBySlugs = (slugs: string[]) =>
  slugs.map((slug) => getTechCareer(slug)).filter((career): career is TechCareer => Boolean(career));

export function getTechCareerLinksByResourceId() {
  const links: Record<string, Array<{ title: string; href: string }>> = {};
  for (const career of TECH_CAREERS) {
    for (const id of career.resourceIds) {
      links[id] ??= [];
      links[id].push({ title: career.shortTitle, href: `/tech-careers/${career.slug}` });
    }
  }
  return links;
}
