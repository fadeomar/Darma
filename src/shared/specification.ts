export interface Specification<T> {
  toPrismaWhere(): Record<string, unknown>;
  and(spec: Specification<T>): Specification<T>;
  or(spec: Specification<T>): Specification<T>;
}
