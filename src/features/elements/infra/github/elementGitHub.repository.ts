import type {
  AdminDashboardSummary,
  AdminElementListInput,
  AdminElementListResult,
  ElementAdminRepository,
  ElementAdminUpdate,
} from "../../domain/admin/elementAdmin.repository";
import type { Element } from "../../domain/element";
import {
  assertManifestCatalogParity,
  buildExplorerManifest,
  EXPLORER_CATALOG_PATH,
  EXPLORER_ITEMS_ROOT,
  EXPLORER_MANIFEST_PATH,
  parseExplorerCatalog,
  parseExplorerManifest,
  serializeElementRecord,
  serializeExplorerCatalog,
  serializeExplorerManifest,
  type ExplorerManifest,
} from "../json/elementJson.content";
import type { GitHubExplorerClient } from "./githubExplorer.client";

type Snapshot = {
  headSha: string;
  manifest: ExplorerManifest;
  elements: Element[];
};

type MutationResult<T> = {
  value: T;
  elements: Element[];
  changedIds: string[];
  message: string;
};

function cloneElement(element: Element): Element {
  return {
    ...element,
    tags: [...element.tags],
    mainCategory: [...element.mainCategory],
    secondaryCategory: [...element.secondaryCategory],
    createdAt: new Date(element.createdAt),
    updatedAt: new Date(element.updatedAt),
  };
}

function matchesAdminQuery(element: Element, query: string): boolean {
  if (!query) return true;
  const normalized = query.toLowerCase();
  return (
    element.title.toLowerCase().includes(normalized) ||
    element.description?.toLowerCase().includes(normalized) === true ||
    element.shortDescription?.toLowerCase().includes(normalized) === true ||
    element.tags.includes(query)
  );
}

function matchesStatus(element: Element, status: AdminElementListInput["status"]): boolean {
  switch (status) {
    case "pending":
      return !element.reviewed && !element.deleted;
    case "deleted":
      return element.deleted;
    case "approved":
      return element.reviewed && !element.deleted;
    case "needSlug":
      return !element.deleted && (element.slug === null || element.slug === "");
    case "active":
      return !element.deleted;
    case "reviewQueue":
      return (!element.reviewed && !element.deleted) || element.deleted;
    case "all":
    default:
      return true;
  }
}

function newestFirst(left: Element, right: Element): number {
  const date = right.createdAt.getTime() - left.createdAt.getTime();
  return date || left.id.localeCompare(right.id);
}

function updatedFirst(left: Element, right: Element): number {
  const date = right.updatedAt.getTime() - left.updatedAt.getTime();
  return date || left.id.localeCompare(right.id);
}

export class ElementGitHubRepository implements ElementAdminRepository {
  private snapshot: Snapshot | null = null;
  private snapshotLoad: Promise<Snapshot> | null = null;

  constructor(
    private readonly client: GitHubExplorerClient,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async list(input: AdminElementListInput): Promise<AdminElementListResult> {
    const snapshot = await this.loadSnapshot();
    const query = input.query?.trim() || "";
    const filtered = snapshot.elements
      .filter((element) => matchesStatus(element, input.status))
      .filter((element) => matchesAdminQuery(element, query))
      .sort(newestFirst);
    const skip = (input.page - 1) * input.pageSize;

    return {
      items: filtered.slice(skip, skip + input.pageSize).map(cloneElement),
      total: filtered.length,
      page: input.page,
      pageSize: input.pageSize,
    };
  }

  async getById(id: string): Promise<Element | null> {
    const snapshot = await this.loadSnapshot();
    const element = snapshot.elements.find((candidate) => candidate.id === id);
    return element ? cloneElement(element) : null;
  }

  async getBySlug(slug: string): Promise<Element | null> {
    const snapshot = await this.loadSnapshot();
    const element = snapshot.elements.find((candidate) => candidate.slug === slug);
    return element ? cloneElement(element) : null;
  }

  async create(element: Element): Promise<Element> {
    const result = await this.mutate((snapshot) => {
      if (snapshot.elements.some((candidate) => candidate.id === element.id)) {
        throw new Error(`Element id already exists: ${element.id}`);
      }
      this.assertUniqueSlug(snapshot.elements, element.slug, element.id);
      const created = cloneElement(element);
      return {
        value: created,
        elements: [...snapshot.elements.map(cloneElement), created],
        changedIds: [created.id],
        message: `content(explorer): add ${created.id}`,
      };
    });
    if (!result) throw new Error("GitHub Explorer create returned no element");
    return result;
  }

  async update(
    id: string,
    changes: ElementAdminUpdate,
  ): Promise<Element | null> {
    return this.mutate((snapshot) => {
      const index = snapshot.elements.findIndex((candidate) => candidate.id === id);
      if (index < 0) return null;

      const updated = cloneElement({
        ...snapshot.elements[index],
        ...changes,
        id,
        createdAt: snapshot.elements[index].createdAt,
      });
      this.assertUniqueSlug(snapshot.elements, updated.slug, id);

      const next = snapshot.elements.map(cloneElement);
      next[index] = updated;
      return {
        value: cloneElement(updated),
        elements: next,
        changedIds: [id],
        message: `content(explorer): update ${id}`,
      };
    });
  }

  async softDelete(id: string): Promise<Element | null> {
    return this.changeFlag(id, "deleted", true, `content(explorer): delete ${id}`);
  }

  async restore(id: string): Promise<Element | null> {
    return this.changeFlag(id, "deleted", false, `content(explorer): restore ${id}`);
  }

  async bulkApprove(ids: readonly string[] | "pending"): Promise<number> {
    const result = await this.mutate((snapshot) => {
      const selected =
        ids === "pending" ? null : new Set(ids.filter((id) => id.length > 0));
      const changedIds: string[] = [];
      const elements = snapshot.elements.map((element) => {
        const shouldApprove =
          !element.deleted &&
          !element.reviewed &&
          (selected === null || selected.has(element.id));
        if (!shouldApprove) return cloneElement(element);
        changedIds.push(element.id);
        return { ...cloneElement(element), reviewed: true, updatedAt: this.now() };
      });

      if (changedIds.length === 0) {
        return {
          value: 0,
          elements,
          changedIds: [],
          message: "content(explorer): approve elements",
        };
      }

      return {
        value: changedIds.length,
        elements,
        changedIds,
        message: `content(explorer): approve ${changedIds.length} element${changedIds.length === 1 ? "" : "s"}`,
      };
    });
    return result ?? 0;
  }

  async bulkSoftDelete(ids: readonly string[]): Promise<number> {
    const result = await this.mutate((snapshot) => {
      const selected = new Set(ids.filter((id) => id.length > 0));
      const changedIds: string[] = [];
      const elements = snapshot.elements.map((element) => {
        const shouldDelete = !element.deleted && selected.has(element.id);
        if (!shouldDelete) return cloneElement(element);
        changedIds.push(element.id);
        return { ...cloneElement(element), deleted: true, updatedAt: this.now() };
      });

      if (changedIds.length === 0) {
        return {
          value: 0,
          elements,
          changedIds: [],
          message: "content(explorer): reject elements",
        };
      }

      return {
        value: changedIds.length,
        elements,
        changedIds,
        message: `content(explorer): reject ${changedIds.length} element${changedIds.length === 1 ? "" : "s"}`,
      };
    });
    return result ?? 0;
  }

  async getDashboardSummary(): Promise<AdminDashboardSummary> {
    const snapshot = await this.loadSnapshot();
    const active = snapshot.elements.filter((element) => !element.deleted);
    return {
      total: snapshot.elements.length,
      published: snapshot.elements.filter(
        (element) => element.reviewed && !element.deleted,
      ).length,
      pending: snapshot.elements.filter(
        (element) => !element.reviewed && !element.deleted,
      ).length,
      deleted: snapshot.elements.filter((element) => element.deleted).length,
      missingCategory: active.filter((element) => element.mainCategory.length === 0)
        .length,
      missingShortDescription: active.filter(
        (element) =>
          element.shortDescription === null || element.shortDescription === "",
      ).length,
      missingTags: active.filter((element) => element.tags.length === 0).length,
      recent: [...snapshot.elements].sort(updatedFirst).slice(0, 6).map(cloneElement),
    };
  }

  private async changeFlag(
    id: string,
    field: "deleted",
    value: boolean,
    message: string,
  ): Promise<Element | null> {
    return this.mutate((snapshot) => {
      const index = snapshot.elements.findIndex((element) => element.id === id);
      if (index < 0) return null;
      const next = snapshot.elements.map(cloneElement);
      if (next[index][field] === value) {
        return {
          value: cloneElement(next[index]),
          elements: next,
          changedIds: [],
          message,
        };
      }
      const updated = {
        ...next[index],
        [field]: value,
        updatedAt: this.now(),
      };
      next[index] = updated;
      return { value: cloneElement(updated), elements: next, changedIds: [id], message };
    });
  }

  private async mutate<T>(
    update: (snapshot: Snapshot) => MutationResult<T> | null,
  ): Promise<T | null> {
    const snapshot = await this.loadSnapshot(true);
    const mutation = update(snapshot);
    if (mutation === null) return null;
    if (mutation.changedIds.length === 0) return mutation.value;

    const now = this.now();
    const changedSet = new Set(mutation.changedIds);
    const manifest = buildExplorerManifest(
      snapshot.manifest,
      mutation.elements,
      now,
      changedSet,
    );
    const changedElements = mutation.elements.filter((element) =>
      changedSet.has(element.id),
    );
    const files = [
      {
        path: EXPLORER_MANIFEST_PATH,
        content: serializeExplorerManifest(manifest),
      },
      {
        path: EXPLORER_CATALOG_PATH,
        content: serializeExplorerCatalog(mutation.elements),
      },
      ...changedElements.map((element) => ({
        path: `${EXPLORER_ITEMS_ROOT}/${element.id}.json`,
        content: serializeElementRecord(element),
      })),
    ];

    const result = await this.client.commitFiles({
      message: mutation.message,
      files,
      expectedHeadSha: snapshot.headSha,
    });

    this.snapshot = {
      headSha: result.commitSha,
      manifest,
      elements: mutation.elements.map(cloneElement),
    };
    return mutation.value;
  }

  private async loadSnapshot(force = false): Promise<Snapshot> {
    const headSha = await this.client.getHeadSha();
    if (!force && this.snapshot?.headSha === headSha) return this.snapshot;
    if (!force && this.snapshotLoad) return this.snapshotLoad;

    const promise = this.readSnapshot(headSha);
    this.snapshotLoad = promise;
    try {
      const snapshot = await promise;
      this.snapshot = snapshot;
      return snapshot;
    } finally {
      if (this.snapshotLoad === promise) this.snapshotLoad = null;
    }
  }

  private async readSnapshot(headSha: string): Promise<Snapshot> {
    const [manifestSource, catalogSource] = await Promise.all([
      this.client.readTextFile(EXPLORER_MANIFEST_PATH, headSha),
      this.client.readTextFile(EXPLORER_CATALOG_PATH, headSha),
    ]);
    const manifest = parseExplorerManifest(manifestSource);
    const elements = parseExplorerCatalog(catalogSource);
    assertManifestCatalogParity(manifest, elements);
    return { headSha, manifest, elements };
  }

  private assertUniqueSlug(
    elements: readonly Element[],
    slug: string | null | undefined,
    elementId: string,
  ): void {
    if (!slug) return;
    const duplicate = elements.find(
      (element) => element.slug === slug && element.id !== elementId,
    );
    if (duplicate) throw new Error(`Element slug already exists: ${slug}`);
  }
}
