"use client";

import { useEffect, useMemo, useState } from "react";
import type { ElementDTO } from "@/features/elements/dto/element.dto";
import PreviewCard from "@/components/TestCard";
import { CheckCircle2, RotateCcw, Trash2 } from "lucide-react";

type ApiResponse = {
  items: ElementDTO[];
  total: number;
  page: number;
  pageSize: number;
};

type Status = "pending" | "deleted" | "all";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function AdminReviewPage() {
  const [items, setItems] = useState<ElementDTO[]>([]);
  const [status, setStatus] = useState<Status>("pending");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [total, setTotal] = useState(0);
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total],
  );

  const [loading, setLoading] = useState(true);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);
  const [previewed, setPreviewed] = useState<ElementDTO | null>(null);

  async function load() {
    setLoading(true);
    try {
      const url = `/api/admin/review-queue?status=${status}&page=${page}&pageSize=${pageSize}`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      const json = (await res.json()) as ApiResponse;
      setItems(json.items ?? []);
      setTotal(json.total ?? 0);
    } catch (e) {
      console.error(e);
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, page]);

  async function approve(id: string) {
    setActionBusyId(id);
    try {
      const res = await fetch(`/api/elements/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewed: true }),
      });
      if (!res.ok) throw new Error(`Approve failed: ${res.status}`);
      await load();
    } finally {
      setActionBusyId(null);
    }
  }

  async function reject(id: string) {
    setActionBusyId(id);
    try {
      const res = await fetch(`/api/elements/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Reject failed: ${res.status}`);
      await load();
    } finally {
      setActionBusyId(null);
    }
  }

  async function restore(id: string) {
    setActionBusyId(id);
    try {
      const res = await fetch(`/api/elements/${id}/restore`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(`Restore failed: ${res.status}`);
      await load();
    } finally {
      setActionBusyId(null);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Review Queue</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Approve pending items or restore deleted ones.
        </p>
      </div>

      <div className="mb-4 rounded-2xl border bg-white p-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value as Status);
            }}
            className="rounded-xl border px-3 py-2 text-sm"
          >
            <option value="pending">Pending (unreviewed)</option>
            <option value="deleted">Deleted (rejected)</option>
            <option value="all">All</option>
          </select>

          <div className="ml-auto flex items-center gap-2">
            <button
              className="rounded-xl border px-3 py-2 text-sm font-semibold hover:bg-zinc-50"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </button>
            <div className="text-sm text-zinc-600">
              Page <b>{page}</b> / {totalPages}
            </div>
            <button
              className="rounded-xl border px-3 py-2 text-sm font-semibold hover:bg-zinc-50"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-10 text-center text-sm text-zinc-600">Loading…</div>
      ) : items.length === 0 ? (
        <div className="py-10 text-center text-sm text-zinc-600">No items.</div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {items.map((el) => {
            const busy = actionBusyId === el.id;
            return (
              <div key={el.id} className="rounded-2xl border bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-base font-semibold">
                      {el.title}
                    </div>
                    <div className="mt-1 text-sm text-zinc-600">
                      {el.shortDescription || el.description || "—"}
                    </div>
                    <div className="mt-2 text-xs text-zinc-500">
                      reviewed: {String(el.reviewed)} • deleted:{" "}
                      {String(el.deleted)}
                    </div>

                    <div className="mt-3">
                      <button
                        onClick={() => setPreviewed(el)}
                        className="rounded-xl border px-3 py-2 text-sm font-semibold hover:bg-zinc-50"
                      >
                        Preview
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!el.deleted && !el.reviewed && (
                      <>
                        <button
                          disabled={busy}
                          onClick={() => approve(el.id)}
                          className={cn(
                            "inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800",
                            busy && "opacity-60",
                          )}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Approve
                        </button>
                        <button
                          disabled={busy}
                          onClick={() => reject(el.id)}
                          className={cn(
                            "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold hover:bg-zinc-50",
                            busy && "opacity-60",
                          )}
                        >
                          <Trash2 className="h-4 w-4" />
                          Reject
                        </button>
                      </>
                    )}

                    {el.deleted && (
                      <button
                        disabled={busy}
                        onClick={() => restore(el.id)}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold hover:bg-zinc-50",
                          busy && "opacity-60",
                        )}
                      >
                        <RotateCcw className="h-4 w-4" />
                        Restore
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview modal */}
      {previewed && (
        <div className="fixed inset-0 z-50 bg-black/50 p-4">
          <div className="mx-auto flex h-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between gap-3 border-b px-5 py-4">
              <div className="min-w-0">
                <div className="text-xs font-semibold text-zinc-500">
                  Preview
                </div>
                <div className="truncate text-lg font-semibold">
                  {previewed.title}
                </div>
              </div>
              <button
                onClick={() => setPreviewed(null)}
                className="rounded-xl border px-3 py-2 text-sm font-semibold hover:bg-zinc-50"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-auto p-5">
              <PreviewCard element={previewed} status="preview" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
