import { describe, expect, it } from "vitest";

import type {
  AdminDashboardSummary,
  AdminElementListInput,
  AdminElementListResult,
  ElementAdminRepository,
} from "../domain/admin/elementAdmin.repository";
import type { Element } from "../domain/element";
import { ElementNotFoundError, ElementWriteService } from "./elementWriteService";

class MemoryAdminRepository implements ElementAdminRepository {
  constructor(readonly elements: Element[] = []) {}

  async list(input: AdminElementListInput): Promise<AdminElementListResult> {
    return { items: this.elements, total: this.elements.length, ...input };
  }
  async getById(id: string) {
    return this.elements.find((element) => element.id === id) ?? null;
  }
  async getBySlug(slug: string) {
    return this.elements.find((element) => element.slug === slug) ?? null;
  }
  async create(element: Element) {
    this.elements.push(element);
    return element;
  }
  async update(id: string, changes: Partial<Omit<Element, "id" | "createdAt">>) {
    const index = this.elements.findIndex((candidate) => candidate.id === id);
    if (index < 0) return null;
    this.elements[index] = { ...this.elements[index], ...changes };
    return this.elements[index];
  }
  async softDelete(id: string) {
    const element = await this.getById(id);
    if (!element) return null;
    element.deleted = true;
    return element;
  }
  async restore(id: string) {
    const element = await this.getById(id);
    if (!element) return null;
    element.deleted = false;
    return element;
  }
  async bulkApprove(ids: readonly string[] | "pending") {
    const selection = ids === "pending" ? null : new Set(ids);
    let count = 0;
    for (const element of this.elements) {
      if (!element.deleted && !element.reviewed && (!selection || selection.has(element.id))) {
        element.reviewed = true;
        count += 1;
      }
    }
    return count;
  }
  async getDashboardSummary(): Promise<AdminDashboardSummary> {
    throw new Error("not needed");
  }
}

const createInput = {
  title: "Hello World",
  description: "",
  shortDescription: null,
  html: "<div>Hello</div>",
  css: "",
  js: "",
  tags: [],
  mainCategory: [],
  secondaryCategory: [],
  reviewed: false,
};

describe("ElementWriteService", () => {
  it("creates a provider-independent element with a unique slug", async () => {
    const existing: Element = {
      id: "existing",
      slug: "hello-world",
      title: "Existing",
      description: "",
      shortDescription: null,
      html: "<div />",
      css: "",
      js: null,
      tags: [],
      mainCategory: [],
      secondaryCategory: [],
      reviewed: true,
      deleted: false,
      createdAt: new Date("2026-01-01T00:00:00Z"),
      updatedAt: new Date("2026-01-01T00:00:00Z"),
    };
    const repo = new MemoryAdminRepository([existing]);
    const service = new ElementWriteService(
      repo,
      () => new Date("2026-04-01T00:00:00Z"),
      () => "new-id",
    );

    const created = await service.create(createInput);
    expect(created).toMatchObject({
      id: "new-id",
      slug: "hello-world-2",
      deleted: false,
      reviewed: false,
    });
    expect(created.createdAt).toEqual(new Date("2026-04-01T00:00:00Z"));
  });

  it("updates fields, regenerates the slug from title, and preserves creation time", async () => {
    const createdAt = new Date("2026-01-01T00:00:00Z");
    const repo = new MemoryAdminRepository([
      {
        id: "one",
        slug: "old",
        title: "Old",
        description: null,
        shortDescription: null,
        html: "<div />",
        css: "",
        js: null,
        tags: [],
        mainCategory: [],
        secondaryCategory: [],
        reviewed: false,
        deleted: false,
        createdAt,
        updatedAt: createdAt,
      },
    ]);
    const service = new ElementWriteService(
      repo,
      () => new Date("2026-04-02T00:00:00Z"),
    );

    const updated = await service.update("one", {
      title: "New title",
      shortDescription: "Summary",
      reviewed: true,
    });
    expect(updated).toMatchObject({
      id: "one",
      slug: "new-title",
      title: "New title",
      shortDescription: "Summary",
      reviewed: true,
    });
    expect(updated.createdAt).toBe(createdAt);
    expect(updated.updatedAt).toEqual(new Date("2026-04-02T00:00:00Z"));
  });

  it("preserves an explicitly supplied slug when the title is unchanged", async () => {
    const createdAt = new Date("2026-01-01T00:00:00Z");
    const repo = new MemoryAdminRepository([
      {
        id: "one",
        slug: "old",
        title: "Old",
        description: "",
        shortDescription: null,
        html: "<div />",
        css: "",
        js: null,
        tags: [],
        mainCategory: [],
        secondaryCategory: [],
        reviewed: false,
        deleted: false,
        createdAt,
        updatedAt: createdAt,
      },
    ]);
    const service = new ElementWriteService(repo);

    await expect(service.update("one", { slug: "manual-slug" })).resolves.toMatchObject({
      slug: "manual-slug",
      title: "Old",
    });
  });

  it("throws the shared not-found error for missing updates", async () => {
    const service = new ElementWriteService(new MemoryAdminRepository());
    await expect(service.update("missing", { reviewed: true })).rejects.toBeInstanceOf(
      ElementNotFoundError,
    );
  });
});
