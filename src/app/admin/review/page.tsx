"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ElementDTO } from "@/features/elements/dto/element.dto";
import PreviewCard from "@/components/TestCard";
import { Badge, Button, Card, InlineError } from "@/components/ui";
import { CheckCircle2, Pencil, RotateCcw, Trash2 } from "lucide-react";

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
  const [bulkBusy, setBulkBusy] = useState(false);
  const [previewed, setPreviewed] = useState<ElementDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [deletedCount, setDeletedCount] = useState<number | null>(null);

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

  async function bulkApprove(payload: { ids: string[] } | { scope: "pending" }) {
    setBulkBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/review-queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", ...payload }),
      });
      if (!res.ok) throw new Error(`Bulk approve failed: ${res.status}`);
      await Promise.all([load(), loadCounts()]);
    } catch (e) {
      console.error(e);
      setError("Bulk approve failed. Please try again.");
    } finally {
      setBulkBusy(false);
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
          setPage(1);
          setStatus(value);
          pushUrl({ status: value, page: 1 });
        }}
        className={cn(
          "inline-flex min-h-[38px] items-center rounded-[var(--radius-sm)] px-3 text-sm font-semibold transition duration-[var(--duration-fast)]",
          active
            ? "border border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
            : "border border-[var(--color-border-default)] bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-text-primary)]",
        )}
      >
        {label}
        {typeof count === "number" ? (
          <span
            className={cn(
              "ml-2 rounded-[var(--radius-full)] px-2 py-0.5 font-mono text-[10px] font-bold",
              active
                ? "bg-[var(--color-primary)] text-[var(--color-primary-text)]"
                : "bg-[var(--color-control-track)] text-[var(--color-text-tertiary)]",
            )}
          >
            {count}
          </span>
        ) : null}
      </button>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            Review Queue
          </h1>
          <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">
            Approve pending items or restore deleted ones.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatusTab value="pending" label="Pending" count={pendingCount} />
          <StatusTab value="deleted" label="Deleted" count={deletedCount} />
          <StatusTab value="all" label="All" count={null} />
        </div>
      </div>

      {error ? <InlineError>{error}</InlineError> : null}

      <Card padding="sm">
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-sm text-[var(--color-text-secondary)]">
            Showing <b>{items.length}</b> of <b>{total}</b>
          </div>

          {status === "pending" && items.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={loading || bulkBusy}
                loading={bulkBusy}
                leftIcon={!bulkBusy ? <CheckCircle2 className="h-4 w-4" /> : undefined}
                onClick={() => bulkApprove({ ids: items.map((el) => el.id) })}
              >
                Approve page ({items.length})
              </Button>
              <Button
                size="sm"
                disabled={loading || bulkBusy}
                loading={bulkBusy}
                leftIcon={!bulkBusy ? <CheckCircle2 className="h-4 w-4" /> : undefined}
                onClick={() => {
                  const n = pendingCount ?? total;
                  if (window.confirm(`Approve all ${n} pending projects? They will become visible on Explore.`)) {
                    bulkApprove({ scope: "pending" });
                  }
                }}
              >
                Approve all pending{typeof pendingCount === "number" ? ` (${pendingCount})` : ""}
              </Button>
            </div>
          ) : null}

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => {
                const next = Math.max(1, page - 1);
                setPage(next);
                pushUrl({ page: next });
              }}
            >
              Prev
            </Button>
            <div className="text-sm text-[var(--color-text-secondary)]">
              Page <b>{page}</b> / {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => {
                const next = Math.min(totalPages, page + 1);
                setPage(next);
                pushUrl({ page: next });
              }}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {loading ? (
        <Card className="py-10 text-center text-sm text-[var(--color-text-secondary)]">
          Loading…
        </Card>
      ) : items.length === 0 ? (
        <Card className="py-10 text-center text-sm text-[var(--color-text-secondary)]">
          {emptyMessage}
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {status !== "pending" ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPage(1);
                  setStatus("pending");
                  pushUrl({ status: "pending", page: 1 });
                }}
              >
                View pending
              </Button>
            ) : null}
            {status !== "deleted" ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPage(1);
                  setStatus("deleted");
                  pushUrl({ status: "deleted", page: 1 });
                }}
              >
                View deleted
              </Button>
            ) : null}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {items.map((element) => {
            const busy = actionBusyId === element.id;
            return (
              <Card key={element.id} padding="sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-base font-semibold text-[var(--color-text-primary)]">
                      {element.title}
                    </div>
                    <div className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">
                      {element.shortDescription || element.description || "—"}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-tertiary)]">
                      <Badge variant={element.reviewed ? "success" : "warning"}>
                        {element.reviewed ? "Reviewed" : "Unreviewed"}
                      </Badge>
                      {element.deleted ? <Badge variant="danger">Deleted</Badge> : null}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewed(element)}
                      >
                        Preview
                      </Button>
                      <Button
                        type="button"
                        variant="soft"
                        size="sm"
                        leftIcon={<Pencil className="h-4 w-4" />}
                        onClick={() =>
                          router.push(`/admin/elements?edit=${element.id}`)
                        }
                      >
                        Edit
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {!element.deleted && !element.reviewed && (
                      <>
                        <Button
                          disabled={busy}
                          loading={busy}
                          onClick={() => approve(element.id)}
                          leftIcon={!busy ? <CheckCircle2 className="h-4 w-4" /> : undefined}
                        >
                          Approve
                        </Button>
                        <Button
                          disabled={busy}
                          variant="danger"
                          onClick={() => reject(element.id)}
                          leftIcon={<Trash2 className="h-4 w-4" />}
                        >
                          Reject
                        </Button>
                      </>
                    )}

                    {element.deleted && (
                      <Button
                        disabled={busy}
                        loading={busy}
                        variant="outline"
                        onClick={() => restore(element.id)}
                        leftIcon={!busy ? <RotateCcw className="h-4 w-4" /> : undefined}
                      >
                        Restore
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {previewed && (
        <div className="fixed inset-0 z-[var(--z-modal)] bg-black/55 p-4">
          <div className="mx-auto flex h-full max-w-6xl flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] shadow-[var(--shadow-lg)]">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border-default)] px-5 py-4">
              <div className="min-w-0">
                <div className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
                  Preview
                </div>
                <div className="mt-1 truncate text-lg font-semibold text-[var(--color-text-primary)]">
                  {previewed.title}
                </div>
              </div>
              <Button type="button" variant="outline" onClick={() => setPreviewed(null)}>
                Close
              </Button>
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
