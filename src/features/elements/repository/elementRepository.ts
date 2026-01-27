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

export interface ElementRepository {
  getById(tx: Tx, id: string, opts?: GetByIdOptions): Promise<any | null>; // "any" -> your Domain Element type
  create(tx: Tx, input: ElementCreateInput): Promise<any>;
  update(tx: Tx, id: string, input: ElementUpdateInput): Promise<any>;
  softDelete(tx: Tx, id: string): Promise<any>;
  restore(tx: Tx, id: string): Promise<any>; // ✅ NEW
}
