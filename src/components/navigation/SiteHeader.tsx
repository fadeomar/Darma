"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/explore", label: "Explore" },
  { href: "/tools", label: "Tools" },
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
    <header className="sticky top-0 z-40 border-b border-black/10 bg-[color:var(--background)]/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-black tracking-tight text-[color:var(--textColor)]">
            Darma
          </Link>
          <nav className="hidden items-center gap-2 md:flex">
            {NAV_ITEMS.map((item) => {
              const active = activeHref === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "rounded-full px-4 py-2 text-sm font-semibold transition",
                    active
                      ? "bg-[color:var(--textColor)] text-[color:var(--textColorOpposite)]"
                      : "text-[color:var(--textColor)] hover:bg-white/50",
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
            className="hidden rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow md:inline-flex"
          >
            Open tools
          </Link>
          <ThemeToggle />
        </div>
      </div>
      <div className="border-t border-black/5 px-4 py-2 md:hidden">
        <nav className="mx-auto flex max-w-7xl gap-2 overflow-x-auto pb-1">
          {NAV_ITEMS.map((item) => {
            const active = activeHref === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition",
                  active
                    ? "bg-[color:var(--textColor)] text-[color:var(--textColorOpposite)]"
                    : "bg-white/60 text-[color:var(--textColor)]",
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
