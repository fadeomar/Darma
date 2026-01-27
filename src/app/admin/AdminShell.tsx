"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  LayoutDashboard,
  Library,
  ClipboardCheck,
  // Settings,
  // LogOut,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  description?: string;
};

const NAV: NavItem[] = [
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

export default function AdminShell({
  children,
  logoutButton,
}: {
  children: ReactNode;
  logoutButton: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto max-w-[1440px] px-4 py-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
          {/* Sidebar */}
          <aside className="rounded-2xl border bg-white shadow-sm lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)]">
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold tracking-tight">
                    Darma Admin
                  </div>
                  <div className="mt-0.5 text-xs text-zinc-500">
                    Content management & moderation
                  </div>
                </div>

                <div className="rounded-xl bg-zinc-900 px-2 py-1 text-xs font-semibold text-white">
                  Admin
                </div>
              </div>

              <div className="mt-4 space-y-1">
                {NAV.map((item) => {
                  const active =
                    pathname === item.href ||
                    (item.href !== "/admin" && pathname?.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition",
                        active
                          ? "bg-zinc-900 text-white"
                          : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900",
                      )}
                    >
                      {item.icon}
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>

              <div className="mt-6 rounded-2xl border bg-zinc-50 p-3">
                <div className="text-xs font-semibold text-zinc-700">
                  Quick tips
                </div>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-zinc-600">
                  <li>Use filters to find pending or deleted items fast.</li>
                  <li>Preview before approving.</li>
                  <li>Soft delete keeps history safe.</li>
                </ul>
              </div>
            </div>

            <div className="mt-auto border-t p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs text-zinc-500">Session</div>
                  <div className="truncate text-sm font-semibold">
                    Signed in
                  </div>
                </div>
                <div className="shrink-0">{logoutButton}</div>
              </div>
            </div>
          </aside>

          {/* Main */}
          <main className="rounded-2xl border bg-white p-4 shadow-sm lg:p-6">
            {/* Top bar */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-medium text-zinc-500">Admin</div>
                <div className="truncate text-lg font-semibold tracking-tight">
                  {pathname === "/admin"
                    ? "Dashboard"
                    : pathname?.startsWith("/admin/elements")
                      ? "Elements"
                      : pathname?.startsWith("/admin/review")
                        ? "Review Queue"
                        : "Admin"}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/admin/elements"
                  className="rounded-xl border px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                >
                  Go to Elements
                </Link>
                <Link
                  href="/admin/review"
                  className="rounded-xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
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
