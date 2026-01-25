// src/app/admin/review/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { ElementDTO } from "@/features/projects/dto/element.dto";

type ApiResponse = {
  items: ElementDTO[];
  total: number;
  page: number;
  pageSize: number;
};

type Status = "pending" | "deleted" | "all";

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
    <main style={{ padding: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>
        Review Queue
      </h1>

      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          marginBottom: 12,
          flexWrap: "wrap",
        }}
      >
        <label style={{ fontWeight: 600 }}>View:</label>
        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value as Status);
          }}
        >
          <option value="pending">Pending (unreviewed)</option>
          <option value="deleted">Deleted (rejected)</option>
          <option value="all">All</option>
        </select>

        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <button
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </button>
          <span>
            Page {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : items.length === 0 ? (
        <p>No items.</p>
      ) : (
        <ul style={{ display: "grid", gap: 10, listStyle: "none", padding: 0 }}>
          {items.map((el) => {
            const busy = actionBusyId === el.id;
            return (
              <li
                key={el.id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: 10,
                  padding: 12,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700 }}>{el.title}</div>
                    <div style={{ opacity: 0.8, marginTop: 4 }}>
                      {el.shortDescription || el.description || "—"}
                    </div>
                    <div style={{ marginTop: 6, fontSize: 12, opacity: 0.75 }}>
                      reviewed: {String(el.reviewed)} • deleted:{" "}
                      {String(el.deleted)}
                    </div>
                  </div>

                  <div
                    style={{ display: "flex", gap: 8, alignItems: "center" }}
                  >
                    {!el.deleted && !el.reviewed && (
                      <>
                        <button disabled={busy} onClick={() => approve(el.id)}>
                          Approve
                        </button>
                        <button disabled={busy} onClick={() => reject(el.id)}>
                          Reject
                        </button>
                      </>
                    )}

                    {el.deleted && (
                      <button disabled={busy} onClick={() => restore(el.id)}>
                        Restore
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
