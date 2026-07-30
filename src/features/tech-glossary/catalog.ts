import glossaryData from "./tech-glossary.json";
import { glossaryCatalogSchema, type GlossaryCategory, type GlossaryTerm } from "./schema";

export const TECH_GLOSSARY: GlossaryTerm[] = glossaryCatalogSchema.parse(glossaryData);
export const GLOSSARY_CATEGORIES: GlossaryCategory[] = [
  "engineering",
  "product",
  "delivery",
  "design",
  "operations",
  "people-business",
];

export const getGlossaryTerms = () => TECH_GLOSSARY;
export const getGlossaryTerm = (slug: string) => TECH_GLOSSARY.find((term) => term.slug === slug);
export const getGlossaryTermsBySlugs = (slugs: string[]) =>
  slugs.map((slug) => getGlossaryTerm(slug)).filter((term): term is GlossaryTerm => Boolean(term));
