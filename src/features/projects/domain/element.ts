// src/features/projects/domain/element.ts

export type ElementId = string;

export type Element = {
  id: ElementId;

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
  slug?: string | null;
};
