"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/explore", label: "Explore" },
  { href: "/collections", label: "Collections" },
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
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-black tracking-tight text-[var(--color-text-primary)]">
            Darma
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map((item) => {
              const active = activeHref === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "rounded-[var(--radius-full)] px-4 py-2 text-sm font-semibold transition",
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
        <div className="flex items-center gap-3">
          <Link
            href="/tools"
            className="hidden rounded-[var(--radius-full)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] px-4 py-2 text-sm font-semibold text-[var(--color-text-primary)] shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--color-border-strong)] hover:shadow md:inline-flex"
          >
            Open tools
          </Link>
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
