"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ClipboardCheck, LayoutDashboard, Library } from "lucide-react";

const NAV: Array<{ href: string; label: string; icon: ReactNode }> = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    href: "/admin/elements",
    label: "Elements",
    icon: <Library className="h-4 w-4" />,
  },
  {
    href: "/admin/review",
    label: "Review Queue",
    icon: <ClipboardCheck className="h-4 w-4" />,
  },
];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function adminTitle(pathname: string | null) {
  if (pathname === "/admin") return "Dashboard";
  if (pathname?.startsWith("/admin/elements")) return "Elements";
  if (pathname?.startsWith("/admin/review")) return "Review Queue";
  return "Admin";
}

const linkButtonBase =
  "inline-flex min-h-[38px] items-center justify-center rounded-[var(--radius-sm)] px-3 text-sm font-semibold transition duration-[var(--duration-fast)]";

export default function AdminShell({
  children,
  logoutButton,
}: {
  children: ReactNode;
  logoutButton: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[var(--color-page-bg)] text-[var(--color-text-primary)]">
      <div className="mx-auto max-w-[1440px] px-4 py-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="flex rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-card)] lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:flex-col">
            <div className="flex-1 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold tracking-tight text-[var(--color-text-primary)]">
                    Darma Admin
                  </div>
                  <div className="mt-1 text-xs leading-5 text-[var(--color-text-tertiary)]">
                    Dense controls for content review and moderation.
                  </div>
                </div>

                <span className="rounded-[var(--radius-full)] border border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-primary)]">
                  Admin
                </span>
              </div>

              <nav className="mt-5 space-y-1" aria-label="Admin navigation">
                {NAV.map((item) => {
                  const active =
                    pathname === item.href ||
                    (item.href !== "/admin" && pathname?.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex min-h-[38px] items-center gap-2 rounded-[var(--radius-sm)] px-3 text-sm font-semibold transition duration-[var(--duration-fast)]",
                        active
                          ? "border border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                          : "text-[var(--color-text-secondary)] hover:bg-[var(--color-control-hover)] hover:text-[var(--color-text-primary)]",
                      )}
                    >
                      {item.icon}
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-6 rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-subtle)] p-3">
                <div className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
                  Review habits
                </div>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-5 text-[var(--color-text-secondary)]">
                  <li>Filter pending and deleted items before editing.</li>
                  <li>Preview submissions before approving.</li>
                  <li>Soft delete keeps recovery safe.</li>
                </ul>
              </div>
            </div>

            <div className="border-t border-[var(--color-border-default)] p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
                    Session
                  </div>
                  <div className="mt-1 truncate text-sm font-semibold text-[var(--color-text-primary)]">
                    Signed in
                  </div>
                </div>
                <div className="shrink-0">{logoutButton}</div>
              </div>
            </div>
          </aside>

          <main className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] p-4 shadow-[var(--shadow-card)] lg:p-6">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border-default)] pb-4">
              <div className="min-w-0">
                <div className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
                  Admin
                </div>
                <div className="mt-1 truncate text-lg font-semibold tracking-tight text-[var(--color-text-primary)]">
                  {adminTitle(pathname)}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href="/admin/elements"
                  className={cn(
                    linkButtonBase,
                    "border border-[var(--color-border-default)] bg-[var(--color-surface-base)] text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-subtle)]",
                  )}
                >
                  Elements
                </Link>
                <Link
                  href="/admin/review"
                  className={cn(
                    linkButtonBase,
                    "border border-transparent bg-[var(--color-primary)] text-[var(--color-primary-text)] hover:bg-[var(--color-primary-hover)]",
                  )}
                >
                  Review Queue
                </Link>
              </div>
            </div>

            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
