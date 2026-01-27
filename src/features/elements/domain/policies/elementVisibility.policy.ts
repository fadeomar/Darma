/* eslint-disable @typescript-eslint/no-explicit-any */
// src/features/projects/domain/policies/elementVisibility.policy.ts
import type { Specification } from "@/shared/specification";
import { NotDeletedSpec, ReviewedSpec } from "../specs/elementVisibility.spec";

export type VisibilityMode = "public" | "admin";

export type AdminVisibilityOptions = {
  includeDeleted?: boolean;
  reviewed?: "true" | "false" | "all";
};

/**
 * Public:
 * - Always exclude deleted
 */
export function applyPublicVisibility<T>(
  base: Specification<T>,
): Specification<T> {
  return base.and(new NotDeletedSpec() as any);
}

/**
 * Admin:
 * - includeDeleted=false => exclude deleted
 * - reviewed=all => no reviewed filter
 * - reviewed=true/false => filter
 */
export function applyAdminVisibility<T>(
  base: Specification<T>,
  opts: AdminVisibilityOptions,
): Specification<T> {
  let spec: Specification<T> = base;

  if (!opts.includeDeleted) {
    spec = spec.and(new NotDeletedSpec() as any);
  }

  if (opts.reviewed === "true") {
    spec = spec.and(new ReviewedSpec(true) as any);
  } else if (opts.reviewed === "false") {
    spec = spec.and(new ReviewedSpec(false) as any);
  }

  return spec;
}
