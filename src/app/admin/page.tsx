"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Library, ClipboardCheck, Trash2 } from "lucide-react";

type ReviewQueueResponse = { total: number };
type ElementsResponse = {
  total?: number;
  items?: unknown[];
  elements?: unknown[];
  data?: unknown[];
};

function StatCard({
  title,
  value,
  icon,
  href,
  hint,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  href: string;
  hint: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-zinc-900">{title}</div>
          <div className="mt-1 text-3xl font-semibold tracking-tight">
            {value}
          </div>
          <div className="mt-2 text-xs text-zinc-500">{hint}</div>
        </div>
        <div className="rounded-2xl border bg-zinc-50 p-3 text-zinc-800">
          {icon}
        </div>
      </div>
      <div className="mt-4 text-sm font-semibold text-zinc-800 group-hover:underline">
        Open →
      </div>
    </Link>
  );
}

export default function AdminDashboardPage() {
  const [pending, setPending] = useState<number>(0);
  const [deleted, setDeleted] = useState<number>(0);
  const [elementsTotal, setElementsTotal] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // Pending count (review queue)
        const pendingRes = await fetch(
          "/api/admin/review-queue?status=pending&page=1&pageSize=1",
          { cache: "no-store" },
        );
        if (pendingRes.ok) {
          const json = (await pendingRes.json()) as ReviewQueueResponse;
          if (!cancelled) setPending(Number(json.total ?? 0));
        }

        // Deleted count (review queue)
        const deletedRes = await fetch(
          "/api/admin/review-queue?status=deleted&page=1&pageSize=1",
          { cache: "no-store" },
        );
        if (deletedRes.ok) {
          const json = (await deletedRes.json()) as ReviewQueueResponse;
          if (!cancelled) setDeleted(Number(json.total ?? 0));
        }

        // Elements total (public list endpoint you already have)
        const elsRes = await fetch("/api/elements?page=1&pageSize=1&search=", {
          cache: "no-store",
        });
        if (elsRes.ok) {
          const json = (await elsRes.json()) as ElementsResponse;
          const total =
            typeof json.total === "number"
              ? json.total
              : (json.items?.length ??
                json.elements?.length ??
                json.data?.length ??
                0);
          if (!cancelled) setElementsTotal(Number(total ?? 0));
        }
      } catch {
        // ignore
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  return (
    <div>
      <div className="rounded-2xl border bg-zinc-50 p-5">
        <div className="text-xs font-semibold text-zinc-500">{greeting}</div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Admin Dashboard
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Manage elements, review submissions, and keep the library clean.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/admin/elements"
            className="rounded-xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            Create / Edit Elements
          </Link>
          <Link
            href="/admin/review"
            className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
          >
            Review Queue
          </Link>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          title="Total elements"
          value={elementsTotal}
          icon={<Library className="h-5 w-5" />}
          href="/admin/elements"
          hint="All items in the library."
        />
        <StatCard
          title="Pending review"
          value={pending}
          icon={<ClipboardCheck className="h-5 w-5" />}
          href="/admin/review"
          hint="Approve or reject new items."
        />
        <StatCard
          title="Deleted"
          value={deleted}
          icon={<Trash2 className="h-5 w-5" />}
          href="/admin/review?status=deleted"
          hint="Soft-deleted items that can be restored."
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border p-5">
          <div className="text-sm font-semibold">Recommended workflow</div>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-zinc-700">
            <li>
              Start with <b>Review Queue</b> — approve or reject pending.
            </li>
            <li>
              Go to <b>Elements</b> — polish metadata, slug, categories.
            </li>
            <li>Preview element — ensure it renders safely.</li>
          </ol>
        </div>

        <div className="rounded-2xl border p-5">
          <div className="text-sm font-semibold">
            Next improvements (Milestone 2)
          </div>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
            <li>Admin-only listing API: filters (reviewed/deleted/tags)</li>
            <li>Bulk actions (approve/delete/restore)</li>
            <li>Draft + preview links (Milestone 4)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
