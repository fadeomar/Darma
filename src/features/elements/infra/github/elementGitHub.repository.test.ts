import { describe, expect, it } from "vitest";

import type { Element } from "../../domain/element";
import {
  buildExplorerManifest,
  parseExplorerCatalog,
  parseExplorerManifest,
  serializeExplorerCatalog,
  serializeExplorerManifest,
  type ExplorerManifest,
} from "../json/elementJson.content";
import { ElementGitHubRepository } from "./elementGitHub.repository";
import type {
  GitHubCommitFile,
  GitHubCommitResult,
  GitHubExplorerClient,
} from "./githubExplorer.client";

function element(overrides: Partial<Element> = {}): Element {
  return {
    id: "one",
    slug: "one",
    title: "One",
    description: "Description",
    shortDescription: null,
    html: "<div>one</div>",
    css: "",
    js: null,
    tags: ["tag"],
    mainCategory: ["main"],
    secondaryCategory: ["secondary"],
    reviewed: false,
    deleted: false,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

function baseManifest(elements: Element[]): ExplorerManifest {
  return buildExplorerManifest(
    {
      schemaVersion: 1,
      exportedAt: "2026-01-01T00:00:00.000Z",
      source: "neon-postgresql",
      table: 'public."Element"',
      total: 0,
      counts: {
        publicApproved: 0,
        pending: 0,
        deleted: 0,
        reviewedAndDeleted: 0,
      },
      items: [],
    },
    elements,
    new Date("2026-01-01T00:00:00.000Z"),
  );
}

class MemoryGitHubClient implements GitHubExplorerClient {
  headSha = "head-1";
  commits: Array<{ message: string; files: readonly GitHubCommitFile[] }> = [];
  files = new Map<string, string>();

  constructor(elements: Element[]) {
    this.files.set(
      "content/explorer/manifest.json",
      serializeExplorerManifest(baseManifest(elements)),
    );
    this.files.set(
      "content/explorer/catalog.json",
      serializeExplorerCatalog(elements),
    );
  }

  async getHeadSha(): Promise<string> {
    return this.headSha;
  }

  async readTextFile(path: string): Promise<string> {
    const source = this.files.get(path);
    if (source === undefined) throw new Error(`missing ${path}`);
    return source;
  }

  async commitFiles(input: {
    message: string;
    files: readonly GitHubCommitFile[];
    expectedHeadSha: string;
  }): Promise<GitHubCommitResult> {
    expect(input.expectedHeadSha).toBe(this.headSha);
    for (const file of input.files) this.files.set(file.path, file.content);
    this.commits.push({ message: input.message, files: input.files });
    const previousHeadSha = this.headSha;
    this.headSha = `head-${this.commits.length + 1}`;
    return { previousHeadSha, commitSha: this.headSha };
  }
}

describe("ElementGitHubRepository", () => {
  it("lists all admin visibility states and searches short descriptions", async () => {
    const client = new MemoryGitHubClient([
      element(),
      element({ id: "approved", title: "Approved", reviewed: true }),
      element({ id: "deleted", title: "Deleted", deleted: true }),
      element({ id: "short", title: "Other", shortDescription: "Find me" }),
    ]);
    const repo = new ElementGitHubRepository(client);

    await expect(
      repo.list({ status: "pending", page: 1, pageSize: 10 }),
    ).resolves.toMatchObject({ total: 2 });
    await expect(
      repo.list({ status: "deleted", page: 1, pageSize: 10 }),
    ).resolves.toMatchObject({ total: 1 });
    await expect(
      repo.list({ query: "find", status: "all", page: 1, pageSize: 10 }),
    ).resolves.toMatchObject({ total: 1, items: [{ id: "short" }] });
  });

  it("creates an item and atomically writes item, manifest, and catalog", async () => {
    const client = new MemoryGitHubClient([element()]);
    const repo = new ElementGitHubRepository(
      client,
      () => new Date("2026-02-01T00:00:00.000Z"),
    );
    const created = element({
      id: "two",
      slug: "two",
      title: "Two",
      description: null,
      shortDescription: null,
      js: null,
      reviewed: true,
      createdAt: new Date("2026-02-01T00:00:00.000Z"),
      updatedAt: new Date("2026-02-01T00:00:00.000Z"),
    });

    await expect(repo.create(created)).resolves.toMatchObject({ id: "two" });
    expect(client.commits).toHaveLength(1);
    expect(client.commits[0].files.map((file) => file.path)).toEqual([
      "content/explorer/manifest.json",
      "content/explorer/catalog.json",
      "content/explorer/items/two.json",
    ]);

    const catalog = parseExplorerCatalog(
      client.files.get("content/explorer/catalog.json")!,
    );
    expect(catalog).toHaveLength(2);
    expect(catalog[1].description).toBeNull();
    expect(catalog[1].shortDescription).toBeNull();
    expect(catalog[1].js).toBeNull();

    const manifest = parseExplorerManifest(
      client.files.get("content/explorer/manifest.json")!,
    );
    expect(manifest.total).toBe(2);
    expect(manifest.counts.publicApproved).toBe(1);
    expect(manifest.counts.pending).toBe(1);
  });

  it("updates, soft-deletes, restores, and bulk-approves", async () => {
    let tick = 0;
    const client = new MemoryGitHubClient([
      element(),
      element({ id: "two", slug: "two", title: "Two" }),
    ]);
    const repo = new ElementGitHubRepository(client, () => {
      tick += 1;
      return new Date(`2026-03-0${tick}T00:00:00.000Z`);
    });

    const original = await repo.getById("one");
    await repo.update(original!.id, { title: "Updated", slug: "updated" });
    await expect(repo.softDelete("one")).resolves.toMatchObject({ deleted: true });
    await expect(repo.restore("one")).resolves.toMatchObject({ deleted: false });
    await expect(repo.bulkApprove("pending")).resolves.toBe(2);

    const list = await repo.list({ status: "approved", page: 1, pageSize: 10 });
    expect(list.total).toBe(2);
    expect(client.commits).toHaveLength(4);
  });

  it("applies partial updates to the latest branch snapshot", async () => {
    const client = new MemoryGitHubClient([element()]);
    const repo = new ElementGitHubRepository(client);

    await repo.getById("one");

    const externallyUpdated = element({ title: "External title" });
    client.files.set(
      "content/explorer/manifest.json",
      serializeExplorerManifest(baseManifest([externallyUpdated])),
    );
    client.files.set(
      "content/explorer/catalog.json",
      serializeExplorerCatalog([externallyUpdated]),
    );
    client.headSha = "external-head";

    const updated = await repo.update("one", {
      reviewed: true,
      updatedAt: new Date("2026-04-01T00:00:00.000Z"),
    });

    expect(updated).toMatchObject({
      title: "External title",
      reviewed: true,
    });
  });

  it("rejects duplicate slugs", async () => {
    const client = new MemoryGitHubClient([element()]);
    const repo = new ElementGitHubRepository(client);
    await expect(
      repo.create(element({ id: "two", slug: "one" })),
    ).rejects.toThrow("Element slug already exists");
  });
});
