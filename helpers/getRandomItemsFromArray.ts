import { CodeElement } from "@/types";

export interface RawElement {
  id: string;
  title: string;
  description: string;
  shortDescription?: string | null; // Optional in JSON
  html: string;
  css?: string | null; // Optional in JSON
  js?: string | null; // Optional in JSON
  tags: string[];
  mainCategory: string[];
  secondaryCategory: string[];
  deleted?: boolean; // Make optional to match JSON
  reviewed?: boolean; // Optional in JSON
  createdAt: string; // String in JSON
  updatedAt: string; // String in JSON
}

function getRandomItem(array: RawElement[], count: number): CodeElement[] {
  const result = new Set<RawElement>();
  const maxTries = 1000;
  let tries = 0;

  while (result.size < count && tries < maxTries && array.length > 0) {
    const randomIndex = Math.floor(Math.random() * array.length);
    result.add(array[randomIndex]);
    tries++;
  }

  return Array.from(result).map((item) => {
    const createdAt = new Date(item.createdAt);
    const updatedAt = new Date(item.updatedAt);

    if (isNaN(createdAt.getTime()) || isNaN(updatedAt.getTime())) {
      throw new Error(`Invalid date in item ${item.id || "unknown"}`);
    }

    return {
      id: item.id,
      title: item.title,
      description: item.description,
      shortDescription: item.shortDescription ?? null,
      html: item.html,
      css: item.css ?? null,
      js: item.js ?? null,
      tags: item.tags,
      mainCategory: item.mainCategory,
      secondaryCategory: item.secondaryCategory,
      deleted: item.deleted ?? false,
      reviewed: item.reviewed ?? true,
      createdAt,
      updatedAt,
    };
  });
}

export default getRandomItem;
