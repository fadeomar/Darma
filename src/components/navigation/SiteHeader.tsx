"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import { GlobalSearchButton } from "@/features/search/components/GlobalSearchOverlay";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/explore", label: "Explore" },
  { href: "/collections", label: "Collections" },
  { href: "/search", label: "Search" },
  { href: "/tools", label: "Tools" },
  { href: "/games", label: "Games" },
  { href: "/tools/css-loaders", label: "Loaders" },
  { href: "/categories", label: "Categories" },
  { href: "/about", label: "About" },
];

function isPathActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function SiteHeader() {
  const pathname = usePathname();
  const activeHref = NAV_ITEMS.filter((item) => isPathActive(pathname, item.href)).sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <header className="sticky top-0 z-[var(--z-header)] border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-overlay)] backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        {/* min-w-0 lets this cluster shrink so the nav can scroll inside itself
            rather than pushing the page wider than the viewport. The nine nav
            items need ~1086px but the desktop nav appears at md (768px). */}
        <div className="flex min-w-0 items-center gap-6">
          <Link href="/" className="shrink-0 text-xl font-black tracking-tight text-[var(--color-text-primary)]">
            Darma
          </Link>
          <nav className="darma-scroll-strip hidden min-w-0 items-center gap-1 overflow-x-auto md:flex">
            {NAV_ITEMS.map((item) => {
              const active = activeHref === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    // shrink-0 + nowrap: inside a scroller, labels must keep
                    // their width instead of compressing into narrow columns.
                    "shrink-0 whitespace-nowrap rounded-[var(--radius-full)] px-4 py-2 text-sm font-semibold transition",
                    active
                      ? "bg-[var(--color-primary)] text-[var(--color-primary-text)]"
                      : "text-[var(--color-text-secondary)] hover:bg-[var(--color-control-hover)] hover:text-[var(--color-text-primary)]",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <GlobalSearchButton className="hidden md:inline-flex" />
          <ThemeToggle />
        </div>
      </div>
      <div className="border-t border-[var(--color-border-subtle)] px-4 py-2 md:hidden">
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto pb-1">
          {NAV_ITEMS.map((item) => {
            const active = activeHref === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "whitespace-nowrap rounded-[var(--radius-full)] px-3 py-1.5 text-sm font-medium transition",
                  active
                    ? "bg-[var(--color-primary)] text-[var(--color-primary-text)]"
                    : "bg-[var(--color-control-track)] text-[var(--color-text-secondary)] hover:bg-[var(--color-control-hover)]",
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
