"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

function parseStatus(v: string | null): Status {
  if (v === "pending" || v === "deleted" || v === "all") return v;
  return "pending";
}

function parsePage(v: string | null): number {
  const n = Number(v);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

export default function AdminReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const statusFromUrl = useMemo(
    () => parseStatus(searchParams.get("status")),
    [searchParams],
  );
  const pageFromUrl = useMemo(
    () => parsePage(searchParams.get("page")),
    [searchParams],
  );

  const [status, setStatus] = useState<Status>(statusFromUrl);
  const [page, setPage] = useState<number>(pageFromUrl);

  const pageSize = 10;

  const [items, setItems] = useState<ElementDTO[]>([]);
  const [total, setTotal] = useState(0);
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total],
  );

  const [loading, setLoading] = useState(true);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);
  const [previewed, setPreviewed] = useState<ElementDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Optional counts for nicer tabs (kept lightweight)
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [deletedCount, setDeletedCount] = useState<number | null>(null);

  // Keep local state in sync when user navigates via links (e.g. dashboard cards)
  useEffect(() => {
    setStatus(statusFromUrl);
    setPage(pageFromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFromUrl, pageFromUrl]);

  function pushUrl(next: { status?: Status; page?: number }) {
    const nextStatus = next.status ?? status;
    const nextPage = next.page ?? page;

    const params = new URLSearchParams();
    if (nextStatus !== "pending") params.set("status", nextStatus);
    if (nextPage !== 1) params.set("page", String(nextPage));

    const qs = params.toString();
    router.push(qs ? `/admin/review?${qs}` : "/admin/review");
  }

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const url = `/api/admin/review-queue?status=${status}&page=${page}&pageSize=${pageSize}`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      const json = (await res.json()) as ApiResponse;

      setItems(Array.isArray(json.items) ? json.items : []);
      setTotal(Number(json.total ?? 0));
    } catch (e) {
      console.error(e);
      setItems([]);
      setTotal(0);
      setError("Failed to load review queue. Please refresh and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function loadCounts() {
    try {
      const [pRes, dRes] = await Promise.all([
        fetch("/api/admin/review-queue?status=pending&page=1&pageSize=1", {
          cache: "no-store",
        }),
        fetch("/api/admin/review-queue?status=deleted&page=1&pageSize=1", {
          cache: "no-store",
        }),
      ]);

      if (pRes.ok) {
        const j = (await pRes.json()) as { total?: number };
        setPendingCount(Number(j.total ?? 0));
      }
      if (dRes.ok) {
        const j = (await dRes.json()) as { total?: number };
        setDeletedCount(Number(j.total ?? 0));
      }
    } catch {
      // counts are optional; ignore failures
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, page]);

  useEffect(() => {
    loadCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function approve(id: string) {
    setActionBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/elements/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewed: true }),
      });
      if (!res.ok) throw new Error(`Approve failed: ${res.status}`);
      await Promise.all([load(), loadCounts()]);
    } catch (e) {
      console.error(e);
      setError("Approve failed. Please try again.");
    } finally {
      setActionBusyId(null);
    }
  }

  async function reject(id: string) {
    if (!window.confirm("Reject this item? It will be moved to Deleted.")) return;

    setActionBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/elements/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Reject failed: ${res.status}`);
      await Promise.all([load(), loadCounts()]);
    } catch (e) {
      console.error(e);
      setError("Reject failed. Please try again.");
    } finally {
      setActionBusyId(null);
    }
  }

  async function restore(id: string) {
    if (!window.confirm("Restore this deleted item?")) return;

    setActionBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/elements/${id}/restore`, { method: "POST" });
      if (!res.ok) throw new Error(`Restore failed: ${res.status}`);
      await Promise.all([load(), loadCounts()]);
    } catch (e) {
      console.error(e);
      setError("Restore failed. Please try again.");
    } finally {
      setActionBusyId(null);
    }
  }

  const emptyMessage = useMemo(() => {
    if (status === "pending") return "No items pending review 🎉";
    if (status === "deleted") return "No deleted items.";
    return "No items found.";
  }, [status]);

  function StatusTab({
    value,
    label,
    count,
  }: {
    value: Status;
    label: string;
    count: number | null;
  }) {
    const active = status === value;
    return (
      <button
        type="button"
        onClick={() => {
          // reset page when changing filter, and keep URL in sync
          setPage(1);
          setStatus(value);
          pushUrl({ status: value, page: 1 });
        }}
        className={cn(
          "rounded-xl px-3 py-2 text-sm font-semibold transition",
          active
            ? "bg-zinc-900 text-white"
            : "border bg-white text-zinc-800 hover:bg-zinc-50",
        )}
      >
        {label}
        {typeof count === "number" ? (
          <span className={cn("ml-2 rounded-lg px-2 py-0.5 text-xs", active ? "bg-white/15" : "bg-zinc-100")}>
            {count}
          </span>
        ) : null}
      </button>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Review Queue</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Approve pending items or restore deleted ones.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatusTab value="pending" label="Pending" count={pendingCount} />
          <StatusTab value="deleted" label="Deleted" count={deletedCount} />
          <StatusTab value="all" label="All" count={null} />
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <div className="mb-4 rounded-2xl border bg-white p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-sm text-zinc-600">
            Showing <b>{items.length}</b> of <b>{total}</b>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              className="rounded-xl border px-3 py-2 text-sm font-semibold hover:bg-zinc-50"
              disabled={page <= 1 || loading}
              onClick={() => {
                const next = Math.max(1, page - 1);
                setPage(next);
                pushUrl({ page: next });
              }}
            >
              Prev
            </button>
            <div className="text-sm text-zinc-600">
              Page <b>{page}</b> / {totalPages}
            </div>
            <button
              className="rounded-xl border px-3 py-2 text-sm font-semibold hover:bg-zinc-50"
              disabled={page >= totalPages || loading}
              onClick={() => {
                const next = Math.min(totalPages, page + 1);
                setPage(next);
                pushUrl({ page: next });
              }}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-10 text-center text-sm text-zinc-600">Loading…</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border bg-white py-10 text-center text-sm text-zinc-600">
          {emptyMessage}
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {status !== "pending" ? (
              <button
                className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                onClick={() => {
                  setPage(1);
                  setStatus("pending");
                  pushUrl({ status: "pending", page: 1 });
                }}
              >
                View pending
              </button>
            ) : null}
            {status !== "deleted" ? (
              <button
                className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                onClick={() => {
                  setPage(1);
                  setStatus("deleted");
                  pushUrl({ status: "deleted", page: 1 });
                }}
              >
                View deleted
              </button>
            ) : null}
          </div>
        </div>
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
                <div className="text-xs font-semibold text-zinc-500">Preview</div>
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
