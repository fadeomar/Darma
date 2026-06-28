"use client";

import { Download, Trash2 } from "lucide-react";
import type { BatchImageItem } from "./types";
import { formatBytes } from "./formatUtils";

type Props = {
  items: BatchImageItem[];
  onDownload: (item: BatchImageItem) => void;
  onRemove: (id: string) => void;
  disabled?: boolean;
};

export function BatchQueue({ items, onDownload, onRemove, disabled }: Props) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <BatchRow
          key={item.id}
          item={item}
          onDownload={() => onDownload(item)}
          onRemove={() => onRemove(item.id)}
          disabled={disabled}
        />
      ))}
    </div>
  );
}

const STATUS_CONFIG: Record<
  BatchImageItem["status"],
  { label: string; className: string }
> = {
  ready: {
    label: "Ready",
    className:
      "bg-[var(--color-surface-subtle)] text-[var(--color-text-tertiary)] border-[var(--color-border-default)]",
  },
  processing: {
    label: "Processing…",
    className:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700",
  },
  done: {
    label: "Done",
    className:
      "bg-[var(--color-success-bg)] text-[var(--color-success-text)] border-[var(--color-success-border)]",
  },
  failed: {
    label: "Failed",
    className:
      "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700",
  },
};

function BatchRow({
  item,
  onDownload,
  onRemove,
  disabled,
}: {
  item: BatchImageItem;
  onDownload: () => void;
  onRemove: () => void;
  disabled?: boolean;
}) {
  const { label, className } = STATUS_CONFIG[item.status];
  const previewSrc = item.output?.objectUrl ?? item.objectUrl;

  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-2.5 sm:p-3">
      {/* Thumbnail */}
      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] sm:h-12 sm:w-12">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={previewSrc}
          alt=""
          aria-hidden
          className="h-full w-full object-cover"
        />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-bold text-[var(--color-text-primary)]">
          {item.name}
        </p>
        <p className="mt-0.5 text-[11px] leading-4 text-[var(--color-text-tertiary)]">
          {item.width && item.height ? `${item.width} × ${item.height} · ` : ""}
          {formatBytes(item.size)}
          {item.output && (
            <>
              {" "}→{" "}
              <span className="font-bold text-[var(--color-success-text)]">
                {formatBytes(item.output.size)}
              </span>
              {"  "}
              <span className="font-bold text-[var(--color-success-text)]">
                −{item.output.savedPercent}%
              </span>
            </>
          )}
        </p>
        {item.error && (
          <p className="mt-0.5 text-[11px] text-red-600 dark:text-red-400">
            {item.error}
          </p>
        )}
      </div>

      {/* Status badge */}
      <span
        className={`hidden shrink-0 rounded-[var(--radius-full)] border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.05em] sm:inline-block ${className}`}
      >
        {label}
      </span>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={onDownload}
          disabled={item.status !== "done" || disabled}
          title={item.status === "done" ? "Download" : "Not ready yet"}
          className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-30 focus:outline-none focus:shadow-[var(--focus-ring)]"
        >
          <Download className="h-3.5 w-3.5" aria-hidden />
          <span className="sr-only">Download {item.name}</span>
        </button>
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          title="Remove"
          className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] transition hover:border-red-400 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-30 focus:outline-none focus:shadow-[var(--focus-ring)]"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
          <span className="sr-only">Remove {item.name}</span>
        </button>
      </div>
    </div>
  );
}
