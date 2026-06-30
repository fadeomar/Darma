import type { CoreEntityKind } from "../registry";

export type CoreNavItem = {
  id: string;
  label: string;
  href: string;
  kind?: CoreEntityKind;
  order?: number;
  isPrimary?: boolean;
};

export const sortCoreNavItems = <TItem extends CoreNavItem>(items: readonly TItem[]): TItem[] =>
  [...items].sort((a, b) => (a.order ?? 999) - (b.order ?? 999) || a.label.localeCompare(b.label));

export const isCoreNavItemActive = (href: string, pathname: string) => {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
};
