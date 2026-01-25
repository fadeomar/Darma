// src/features/projects/dto/element.dto.ts

export type ElementDTO = {
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

  createdAt: string; // ISO
  updatedAt: string; // ISO
};

export type PaginatedResultDTO<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};
