/* eslint-disable @typescript-eslint/no-explicit-any */
// src/features/projects/repository/elementRepository.ts
import type { Prisma } from "@prisma/client";
import type {
  ElementCreateInput,
  ElementUpdateInput,
} from "../validation/elementWriteSchemas";

// Transaction client type
export type Tx = Prisma.TransactionClient;

export type GetByIdOptions = {
  includeDeleted?: boolean;
};

/**
 * Persistence-shaped create input.
 *
 * The HTTP/Zod create schema (`ElementCreateInput`) intentionally does NOT
 * include `slug` — the slug is generated and uniqueness-checked server-side by
 * `ElementWriteService.create`. This type is what actually reaches the DB.
 */
export type ElementCreatePersist = ElementCreateInput & { slug?: string | null };

export interface ElementRepository {
  getById(tx: Tx, id: string, opts?: GetByIdOptions): Promise<any | null>; // "any" -> your Domain Element type
  create(tx: Tx, input: ElementCreatePersist): Promise<any>;
  update(tx: Tx, id: string, input: ElementUpdateInput): Promise<any>;
  softDelete(tx: Tx, id: string): Promise<any>;
  restore(tx: Tx, id: string): Promise<any>; // ✅ NEW
}
