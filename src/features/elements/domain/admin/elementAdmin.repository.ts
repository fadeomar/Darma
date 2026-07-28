import type { Element } from "../element";

export type AdminElementStatus =
  | "all"
  | "pending"
  | "deleted"
  | "approved"
  | "needSlug"
  | "active"
  | "reviewQueue";

export type AdminElementListInput = {
  query?: string;
  status?: AdminElementStatus;
  page: number;
  pageSize: number;
};

export type AdminElementListResult = {
  items: Element[];
  total: number;
  page: number;
  pageSize: number;
};

export type ElementAdminUpdate = Partial<
  Omit<Element, "id" | "createdAt">
>;

export type AdminDashboardSummary = {
  total: number;
  published: number;
  pending: number;
  deleted: number;
  missingCategory: number;
  missingShortDescription: number;
  missingTags: number;
  recent: Element[];
};

export interface ElementAdminRepository {
  list(input: AdminElementListInput): Promise<AdminElementListResult>;
  getById(id: string): Promise<Element | null>;
  getBySlug(slug: string): Promise<Element | null>;
  create(element: Element): Promise<Element>;
  update(id: string, changes: ElementAdminUpdate): Promise<Element | null>;
  softDelete(id: string): Promise<Element | null>;
  restore(id: string): Promise<Element | null>;
  bulkApprove(ids: readonly string[] | "pending"): Promise<number>;
  bulkSoftDelete(ids: readonly string[]): Promise<number>;
  getDashboardSummary(): Promise<AdminDashboardSummary>;
}
