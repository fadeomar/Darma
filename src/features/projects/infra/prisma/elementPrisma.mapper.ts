// src/features/projects/infra/prisma/elementPrisma.mapper.ts

import type { Element } from "../../domain/element";

export function toElementDomain(row: {
  id: string;
  title: string;
  description: string | null;
  shortDescription: string | null;

  html: string;
  css: string;
  js: string | null;

  tags: string[];
  mainCategory: string[];
  secondaryCategory: string[];

  deleted: boolean;
  reviewed: boolean;

  createdAt: Date;
  updatedAt: Date;

  slug: string | null;
}): Element {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    shortDescription: row.shortDescription ?? null,

    html: row.html,
    css: row.css,
    js: row.js ?? null,

    tags: row.tags ?? [],
    mainCategory: row.mainCategory ?? [],
    secondaryCategory: row.secondaryCategory ?? [],

    deleted: row.deleted,
    reviewed: row.reviewed,
    slug: row.slug,

    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
