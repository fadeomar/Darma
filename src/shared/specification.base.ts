// src/shared/specification.base.ts
import type { Specification } from "./specification";

export abstract class BaseSpecification<T> implements Specification<T> {
  abstract toPrismaWhere(): Record<string, unknown>;

  and(spec: Specification<T>): Specification<T> {
    return new AndSpecification(this, spec);
  }

  or(spec: Specification<T>): Specification<T> {
    return new OrSpecification(this, spec);
  }
}

class AndSpecification<T> extends BaseSpecification<T> {
  constructor(
    private readonly left: Specification<T>,
    private readonly right: Specification<T>,
  ) {
    super();
  }

  toPrismaWhere() {
    return {
      AND: [this.left.toPrismaWhere(), this.right.toPrismaWhere()],
    };
  }
}

class OrSpecification<T> extends BaseSpecification<T> {
  constructor(
    private readonly left: Specification<T>,
    private readonly right: Specification<T>,
  ) {
    super();
  }

  toPrismaWhere() {
    return {
      OR: [this.left.toPrismaWhere(), this.right.toPrismaWhere()],
    };
  }
}
