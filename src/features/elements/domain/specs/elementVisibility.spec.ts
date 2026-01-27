// src/features/projects/domain/specs/elementVisibility.spec.ts
import { BaseSpecification } from "@/shared/specification.base";

/**
 * These specs output Prisma "where" fragments.
 * Keep them tiny and composable.
 *
 * NOTE: no need to reference Element type at compile time here.
 */

export class NotDeletedSpec extends BaseSpecification<unknown> {
  toPrismaWhere() {
    return { deleted: false };
  }
}

export class IncludeDeletedSpec extends BaseSpecification<unknown> {
  toPrismaWhere() {
    // No filtering; admin can see everything
    return {};
  }
}

export class ReviewedSpec extends BaseSpecification<unknown> {
  constructor(private readonly reviewed: boolean) {
    super();
  }

  toPrismaWhere() {
    return { reviewed: this.reviewed };
  }
}
