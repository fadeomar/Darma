"use client";

import { useEffect, useRef, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type TabItem<T extends string> = {
  value: T;
  label: ReactNode;
  disabled?: boolean;
};

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  className,
  ariaLabel,
  fullWidth = false,
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  ariaLabel?: string;
  /** Stretch the strip to fill its container, distributing tabs evenly. */
  fullWidth?: boolean;
}) {
  const listRef = useRef<HTMLDivElement | null>(null);
  const activeRef = useRef<HTMLButtonElement | null>(null);

  // Keep the selected tab visible when the strip is scrolled horizontally.
  // Selection can change from outside this component (presets, deep links),
  // which would otherwise leave the active tab off-screen.
  useEffect(() => {
    const list = listRef.current;
    const active = activeRef.current;
    if (!list || !active) return;
    if (list.scrollWidth <= list.clientWidth) return;

    const listBox = list.getBoundingClientRect();
    const activeBox = active.getBoundingClientRect();
    if (activeBox.left < listBox.left) {
      list.scrollBy({ left: activeBox.left - listBox.left, behavior: "smooth" });
    } else if (activeBox.right > listBox.right) {
      list.scrollBy({ left: activeBox.right - listBox.right, behavior: "smooth" });
    }
  }, [value]);

  const enabled = items.filter((item) => !item.disabled);

  // Arrow-key navigation is what `role="tablist"` promises. This is additive:
  // every tab keeps its natural tab stop, so existing Tab-key behaviour is
  // unchanged.
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    if (enabled.length === 0) return;

    const currentIndex = enabled.findIndex((item) => item.value === value);
    let nextIndex: number;
    if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = enabled.length - 1;
    } else {
      const step = event.key === "ArrowRight" ? 1 : -1;
      const from = currentIndex === -1 ? 0 : currentIndex;
      nextIndex = (from + step + enabled.length) % enabled.length;
    }

    const next = enabled[nextIndex];
    if (!next || next.value === value) return;

    event.preventDefault();
    onChange(next.value);
    listRef.current?.querySelector<HTMLButtonElement>(`[data-tab-value="${next.value}"]`)?.focus();
  }

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
      className={cn(
        // `inline-flex` + `max-w-full` keeps the pill hugging its content when
        // the tabs fit, and constrains it to the parent when they do not —
        // rather than overflowing the parent and being clipped unreachably by
        // an ancestor. `overflow-x-auto` then scrolls the tabs inside the pill
        // instead of pushing horizontal scroll onto the page.
        //
        // `p-1` is required, not cosmetic: `overflow-x:auto` forces overflow-y
        // to a scrolling value, so without 4px of inset the 4px focus ring on a
        // tab gets clipped by this container. Matches SegmentedControl.
        "darma-tab-strip snap-x overflow-x-auto overflow-y-hidden rounded-[var(--radius-full)] border border-[var(--color-border-default)] bg-[var(--color-control-track)] p-1",
        fullWidth ? "flex w-full" : "inline-flex max-w-full",
        className,
      )}
    >
      {items.map((item) => {
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            ref={selected ? activeRef : undefined}
            data-tab-value={item.value}
            type="button"
            role="tab"
            aria-selected={selected}
            disabled={item.disabled}
            onClick={() => onChange(item.value)}
            className={cn(
              // `shrink-0` and `whitespace-nowrap` stop labels collapsing into
              // vertical character columns once the strip is scrollable.
              "min-h-[38px] shrink-0 snap-start whitespace-nowrap rounded-[var(--radius-full)] px-3 font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--color-text-secondary)] transition disabled:opacity-45",
              fullWidth && "flex-1 basis-0 text-center",
              selected
                ? "bg-[var(--color-surface-raised)] text-[var(--color-text-primary)]"
                : "hover:bg-[var(--color-control-hover)] hover:text-[var(--color-text-primary)]",
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
