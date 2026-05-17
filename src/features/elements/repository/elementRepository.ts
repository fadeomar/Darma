// src/features/projects/repository/elementRepository.ts
import type { Prisma } from "@prisma/client";
import type { Element } from "../domain/element";
import type {
  ElementCreateInput,
  ElementUpdateInput,
} from "../validation/elementWriteSchemas";

export type Tx = Prisma.TransactionClient;

export type GetByIdOptions = {
  includeDeleted?: boolean;
};

export interface ElementRepository {
  getById(tx: Tx, id: string, opts?: GetByIdOptions): Promise<Element | null>;
  create(tx: Tx, input: ElementCreateInput): Promise<Element>;
  update(tx: Tx, id: string, input: ElementUpdateInput): Promise<Element>;
  softDelete(tx: Tx, id: string): Promise<Element>;
  restore(tx: Tx, id: string): Promise<Element>;
}
