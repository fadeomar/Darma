import { randomUUID } from "node:crypto";

import { slugify } from "@/lib/slug";
import type {
  ElementAdminRepository,
  ElementAdminUpdate,
} from "../domain/admin/elementAdmin.repository";
import type { Element } from "../domain/element";
import type {
  ElementCreateInput,
  ElementUpdateInput,
} from "../validation/elementWriteSchemas";

export class ElementWriteService {
  constructor(
    private readonly repo: ElementAdminRepository,
    private readonly now: () => Date = () => new Date(),
    private readonly createId: () => string = () => randomUUID(),
  ) {}

  async create(input: ElementCreateInput): Promise<Element> {
    const now = this.now();
    const slug = await this.makeUniqueSlug(slugify(input.title || "element"));
    return this.repo.create({
      id: this.createId(),
      title: input.title,
      slug,
      description: input.description ?? "",
      shortDescription: input.shortDescription ?? null,
      html: input.html,
      css: input.css ?? "",
      js: input.js ?? "",
      tags: input.tags ?? [],
      mainCategory: input.mainCategory ?? [],
      secondaryCategory: input.secondaryCategory ?? [],
      reviewed: input.reviewed ?? false,
      deleted: false,
      createdAt: now,
      updatedAt: now,
    });
  }

  async update(id: string, input: ElementUpdateInput): Promise<Element> {
    const existing = await this.repo.getById(id);
    if (!existing) throw new ElementNotFoundError(id);

    const changes: ElementAdminUpdate = { updatedAt: this.now() };

    if (input.title !== undefined) changes.title = input.title;
    if (input.description !== undefined) changes.description = input.description;
    if (input.shortDescription !== undefined) {
      changes.shortDescription = input.shortDescription;
    }
    if (input.html !== undefined) changes.html = input.html;
    if (input.css !== undefined) changes.css = input.css;
    if (input.js !== undefined) changes.js = input.js;
    if (input.tags !== undefined) changes.tags = [...input.tags];
    if (input.mainCategory !== undefined) {
      changes.mainCategory = [...input.mainCategory];
    }
    if (input.secondaryCategory !== undefined) {
      changes.secondaryCategory = [...input.secondaryCategory];
    }
    if (input.reviewed !== undefined) changes.reviewed = input.reviewed;

    if (typeof input.title === "string" && input.title.trim().length > 0) {
      changes.slug = await this.makeUniqueSlug(slugify(input.title), id);
    } else if (input.slug !== undefined) {
      // Preserve the previous API behavior for an explicitly supplied slug.
      // The repository/DB uniqueness constraint still rejects conflicts.
      changes.slug = input.slug;
    }

    const result = await this.repo.update(id, changes);
    if (!result) throw new ElementNotFoundError(id);
    return result;
  }

  async softDelete(id: string): Promise<Element> {
    const result = await this.repo.softDelete(id);
    if (!result) throw new ElementNotFoundError(id);
    return result;
  }

  async restore(id: string): Promise<Element> {
    const result = await this.repo.restore(id);
    if (!result) throw new ElementNotFoundError(id);
    return result;
  }

  private async makeUniqueSlug(base: string, excludeId?: string): Promise<string> {
    const cleanBase = (base || "element").trim();
    let slug = cleanBase;

    for (let index = 0; index < 200; index += 1) {
      const existing = await this.repo.getBySlug(slug);
      if (!existing || existing.id === excludeId) return slug;
      slug = `${cleanBase}-${index + 2}`;
    }

    return `${cleanBase}-${this.now().getTime()}`;
  }
}

export class ElementNotFoundError extends Error {
  readonly name = "ElementNotFoundError";

  constructor(public readonly id: string) {
    super(`Element not found: ${id}`);
  }
}
