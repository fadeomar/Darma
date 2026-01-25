// src/features/projects/dto/element.dto.mapper.ts

import type { Element } from "../domain/element";
import type { ElementDTO } from "./element.dto";

export function toElementDTO(el: Element): ElementDTO {
  return {
    id: el.id,
    title: el.title,
    description: el.description ?? null,
    shortDescription: el.shortDescription ?? null,
    html: el.html,
    css: el.css,
    js: el.js ?? null,
    tags: el.tags ?? [],
    mainCategory: el.mainCategory ?? [],
    secondaryCategory: el.secondaryCategory ?? [],
    deleted: el.deleted,
    reviewed: el.reviewed,
    createdAt: el.createdAt.toISOString(),
    updatedAt: el.updatedAt.toISOString(),
  };
}
