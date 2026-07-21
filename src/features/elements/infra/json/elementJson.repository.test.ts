import { describe, expect, it } from "vitest";

import { buildElementSearchSpec } from "../../domain/search/elementSearch.spec";
import type { Element } from "../../domain/element";
import { toElementDomainFromJson } from "./elementJson.mapper";
import { ElementJsonRepository } from "./elementJson.repository";

function element(overrides: Partial<Element> & Pick<Element, "id" | "title">): Element {
  return {
    id: overrides.id,
    slug: overrides.slug ?? `${overrides.id}-slug`,
    title: overrides.title,
    description: overrides.description ?? "general description",
    shortDescription: overrides.shortDescription ?? "short summary",
    html: overrides.html ?? "<div></div>",
    css: overrides.css ?? "div {}",
    js: overrides.js ?? null,
    tags: overrides.tags ?? [],
    mainCategory: overrides.mainCategory ?? ["ui"],
    secondaryCategory: overrides.secondaryCategory ?? ["cards"],
    reviewed: overrides.reviewed ?? true,
    deleted: overrides.deleted ?? false,
    createdAt: overrides.createdAt ?? new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: overrides.updatedAt ?? new Date("2026-01-02T00:00:00.000Z"),
  };
}

function repository(elements: Element[]) {
  return new ElementJsonRepository(async () => elements);
}

function publicSpec(input: {
  q?: string;
  exactMatch?: boolean;
  includeShortDescription?: boolean;
  mainCategory?: string[];
  secondaryCategory?: string[];
  page?: number;
  pageSize?: number;
  sort?: "newest" | "oldest" | "titleAsc" | "titleDesc";
} = {}) {
  return buildElementSearchSpec({
    filters: {
      q: input.q,
      exactMatch: input.exactMatch,
      includeShortDescription: input.includeShortDescription,
      mainCategory: input.mainCategory,
      secondaryCategory: input.secondaryCategory,
    },
    pagination: {
      page: input.page ?? 1,
      pageSize: input.pageSize ?? 100,
    },
    sort: input.sort ?? "newest",
    visibility: { mode: "public" },
  });
}

describe("Element JSON mapping", () => {
  it("converts timestamps to Date and preserves null values", () => {
    const mapped = toElementDomainFromJson(
      {
        schemaVersion: 1,
        id: "mapped",
        slug: null,
        title: "Mapped",
        description: null,
        shortDescription: null,
        html: "",
        css: "",
        js: null,
        tags: [],
        mainCategory: [],
        secondaryCategory: [],
        reviewed: true,
        deleted: false,
        createdAt: "2026-01-01T12:30:45.123",
        updatedAt: "2026-01-02T12:30:45.123",
      },
      "items/mapped.json",
    );

    expect(mapped.createdAt).toBeInstanceOf(Date);
    expect(mapped.updatedAt).toBeInstanceOf(Date);
    expect(mapped.createdAt.toISOString()).toBe("2026-01-01T12:30:45.123Z");
    expect(mapped.description).toBeNull();
    expect(mapped.shortDescription).toBeNull();
    expect(mapped.js).toBeNull();
    expect(mapped.slug).toBeNull();
    expect(mapped.html).toBe("");
  });
});

describe("ElementJsonRepository", () => {
  const fixtures = [
    element({
      id: "approved-a",
      slug: "approved-a",
      title: "Alpha Button",
      description: "Build a bright panel",
      shortDescription: "Hidden needle text",
      tags: ["ButtonTag"],
      mainCategory: ["ui", "examples"],
      secondaryCategory: ["buttons", "common"],
      createdAt: new Date("2026-01-03T00:00:00.000Z"),
    }),
    element({
      id: "approved-b",
      slug: "approved-b",
      title: "beta card",
      description: "Contains canvas animation",
      tags: ["canvas"],
      mainCategory: ["graphics"],
      secondaryCategory: ["animation", "common"],
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    }),
    element({
      id: "pending",
      slug: "pending",
      title: "Pending Element",
      reviewed: false,
      mainCategory: ["ui"],
      secondaryCategory: ["pending-only"],
    }),
    element({
      id: "deleted",
      slug: "deleted",
      title: "Deleted Element",
      deleted: true,
      mainCategory: ["ui"],
      secondaryCategory: ["deleted-only"],
    }),
  ];

  it("excludes pending and deleted elements from public search", async () => {
    const result = await repository(fixtures).search(publicSpec());
    expect(result.items.map((item) => item.id)).toEqual([
      "approved-a",
      "approved-b",
    ]);
  });

  it("filters by intersecting main categories", async () => {
    const result = await repository(fixtures).search(
      publicSpec({ mainCategory: ["examples"] }),
    );
    expect(result.items.map((item) => item.id)).toEqual(["approved-a"]);
  });

  it("filters by intersecting secondary categories", async () => {
    const result = await repository(fixtures).search(
      publicSpec({ secondaryCategory: ["animation"] }),
    );
    expect(result.items.map((item) => item.id)).toEqual(["approved-b"]);
  });

  it("supports case-insensitive exact title search", async () => {
    const result = await repository(fixtures).search(
      publicSpec({ q: "ALPHA BUTTON", exactMatch: true }),
    );
    expect(result.items.map((item) => item.id)).toEqual(["approved-a"]);
  });

  it("supports non-exact title and description search", async () => {
    const titleResult = await repository(fixtures).search(
      publicSpec({ q: "BETA" }),
    );
    const descriptionResult = await repository(fixtures).search(
      publicSpec({ q: "BRIGHT PANEL" }),
    );

    expect(titleResult.items.map((item) => item.id)).toEqual(["approved-b"]);
    expect(descriptionResult.items.map((item) => item.id)).toEqual([
      "approved-a",
    ]);
  });

  it("searches short descriptions only when requested", async () => {
    const defaultResult = await repository(fixtures).search(
      publicSpec({ q: "needle" }),
    );
    const categoryResult = await repository(fixtures).search(
      publicSpec({ q: "needle", includeShortDescription: true }),
    );

    expect(defaultResult.total).toBe(0);
    expect(categoryResult.items.map((item) => item.id)).toEqual([
      "approved-a",
    ]);
  });

  it("matches exact tag-array values without changing tag case", async () => {
    const exactCase = await repository(fixtures).search(
      publicSpec({ q: "ButtonTag" }),
    );
    const changedCase = await repository(fixtures).search(
      publicSpec({ q: "buttontag" }),
    );

    expect(exactCase.items.map((item) => item.id)).toEqual(["approved-a"]);
    expect(changedCase.total).toBe(0);
  });

  it.each([
    ["newest", ["same-a", "same-b", "old"]],
    ["oldest", ["old", "same-a", "same-b"]],
    ["titleAsc", ["old", "same-a", "same-b"]],
    ["titleDesc", ["same-a", "same-b", "old"]],
  ] as const)("implements %s sorting with id tie-breaks", async (sort, ids) => {
    const sortable = [
      element({
        id: "same-b",
        title: "Zulu",
        createdAt: new Date("2026-02-01T00:00:00.000Z"),
      }),
      element({
        id: "old",
        title: "Alpha",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      }),
      element({
        id: "same-a",
        title: "Zulu",
        createdAt: new Date("2026-02-01T00:00:00.000Z"),
      }),
    ];

    const result = await repository(sortable).search(publicSpec({ sort }));
    expect(result.items.map((item) => item.id)).toEqual(ids);
  });

  it("paginates after filtering and reports the full total", async () => {
    const items = [
      element({ id: "one", title: "One", createdAt: new Date("2026-01-03T00:00:00.000Z") }),
      element({ id: "two", title: "Two", createdAt: new Date("2026-01-02T00:00:00.000Z") }),
      element({ id: "three", title: "Three", createdAt: new Date("2026-01-01T00:00:00.000Z") }),
    ];
    const result = await repository(items).search(
      publicSpec({ page: 2, pageSize: 1 }),
    );

    expect(result.total).toBe(3);
    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(1);
    expect(result.items.map((item) => item.id)).toEqual(["two"]);
  });

  it("returns only public elements from getById and getBySlug", async () => {
    const repo = repository(fixtures);

    expect((await repo.getById("approved-a"))?.id).toBe("approved-a");
    expect(await repo.getById("pending")).toBeNull();
    expect(await repo.getById("deleted")).toBeNull();
    expect((await repo.getBySlug("approved-b"))?.id).toBe("approved-b");
    expect(await repo.getBySlug("pending")).toBeNull();
    expect(await repo.getBySlug("deleted")).toBeNull();
  });

  it("aggregates unique sorted public secondary categories", async () => {
    const result = await repository(fixtures).getPublicSecondaryCategories("ui");
    expect(result).toEqual(["buttons", "common"]);
  });
});
