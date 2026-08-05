"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { RotateCcw, Search, SlidersHorizontal, X } from "lucide-react";
import { Badge, Button, Input, Select } from "@/components/ui";
import type { BackgroundPreset } from "@/types/animatedBackgroundTypes";
import { cn } from "@/lib/cn";
import { getAnimatedBackgroundMotionScore, getAnimatedBackgroundPerformanceScore } from "../lib/studio";
import { presetToState } from "../lib/presets";
import PresetGallery from "./PresetGallery";

interface PresetBrowserDrawerProps {
  open: boolean;
  presets: BackgroundPreset[];
  activeId: string;
  onClose: () => void;
  onSelect: (preset: BackgroundPreset) => void;
}

type PresetSort = "recommended" | "name" | "motion" | "render";

function searchableText(preset: BackgroundPreset): string {
  return [preset.name, preset.description, preset.searchIntent, ...preset.tags, ...preset.bestFor].join(" ").toLowerCase();
}

export default function PresetBrowserDrawer({ open, presets, activeId, onClose, onSelect }: PresetBrowserDrawerProps) {
  const searchRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("all");
  const [sort, setSort] = useState<PresetSort>("recommended");

  const tags = useMemo(() => {
    const frequency = new Map<string, number>();
    presets.forEach((preset) => preset.tags.forEach((item) => frequency.set(item, (frequency.get(item) ?? 0) + 1)));
    return [...frequency.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([item]) => item);
  }, [presets]);

  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = presets.filter((preset) => {
      const matchesQuery = !normalizedQuery || searchableText(preset).includes(normalizedQuery);
      const matchesTag = tag === "all" || preset.tags.includes(tag);
      return matchesQuery && matchesTag;
    });

    if (sort === "name") return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "motion") return [...filtered].sort((a, b) => getAnimatedBackgroundMotionScore(presetToState(a)) - getAnimatedBackgroundMotionScore(presetToState(b)));
    if (sort === "render") return [...filtered].sort((a, b) => getAnimatedBackgroundPerformanceScore(presetToState(a)) - getAnimatedBackgroundPerformanceScore(presetToState(b)));
    return filtered;
  }, [presets, query, sort, tag]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => searchRef.current?.focus(), 40);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      )].filter((element) => element.offsetParent !== null);
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus();
    };
  }, [onClose, open]);

  if (!mounted || !open) return null;

  const resetFilters = () => {
    setQuery("");
    setTag("all");
    setSort("recommended");
    searchRef.current?.focus();
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex justify-end" role="presentation">
      <button type="button" aria-label="Close preset browser" onClick={onClose} className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]" />
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="animated-background-preset-browser-title"
        className="relative flex h-full w-full max-w-6xl flex-col border-l border-[var(--color-border-default)] bg-[var(--color-surface-base)] shadow-2xl"
      >
        <header className="shrink-0 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-overlay)] px-4 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="accent">Preset browser</Badge>
                <Badge variant="outline">{presets.length} production starters</Badge>
              </div>
              <h2 id="animated-background-preset-browser-title" className="mt-2 text-xl font-black tracking-[-0.025em] text-[var(--color-text-primary)]">Find the right background faster</h2>
              <p className="mt-1 text-sm leading-6 text-[var(--color-text-tertiary)]">Search by style or use case, filter tags, then sort by motion or estimated render cost.</p>
            </div>
            <Button size="icon" variant="ghost" onClick={onClose} leftIcon={<X className="h-5 w-5" aria-hidden />}>Close preset browser</Button>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_auto]">
            <label className="relative block">
              <span className="sr-only">Search presets</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-tertiary)]" aria-hidden />
              <Input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search SaaS, dashboard, AI, portfolio…" className="pl-9" />
            </label>
            <label className="grid gap-1">
              <span className="sr-only">Sort presets</span>
              <Select value={sort} onChange={(event) => setSort(event.target.value as PresetSort)}>
                <option value="recommended">Recommended order</option>
                <option value="name">Name A–Z</option>
                <option value="motion">Lowest motion first</option>
                <option value="render">Lowest render cost first</option>
              </Select>
            </label>
            <Button size="sm" variant="secondary" leftIcon={<RotateCcw className="h-4 w-4" aria-hidden />} onClick={resetFilters}>Reset filters</Button>
          </div>

          <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1" aria-label="Filter presets by tag">
            <SlidersHorizontal className="h-4 w-4 shrink-0 text-[var(--color-text-tertiary)]" aria-hidden />
            {["all", ...tags].map((item) => {
              const active = tag === item;
              return (
                <button
                  key={item}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setTag(item)}
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold transition focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]",
                    active
                      ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                      : "border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]",
                  )}
                >
                  {item === "all" ? "All styles" : item}
                </button>
              );
            })}
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-bold text-[var(--color-text-primary)]">{results.length} preset{results.length === 1 ? "" : "s"} found</p>
            <p className="text-xs text-[var(--color-text-tertiary)]">Selecting a preset closes the browser and updates the workspace.</p>
          </div>

          {results.length ? (
            <PresetGallery
              presets={results}
              activeId={activeId}
              onSelect={(preset) => {
                onSelect(preset);
                onClose();
              }}
            />
          ) : (
            <div className="rounded-[var(--radius-xl)] border border-dashed border-[var(--color-border-default)] bg-[var(--color-surface-subtle)] px-5 py-14 text-center">
              <p className="text-lg font-black text-[var(--color-text-primary)]">No presets match these filters</p>
              <p className="mt-2 text-sm text-[var(--color-text-tertiary)]">Try another search term or clear the active tag.</p>
              <Button className="mt-5" size="sm" variant="secondary" onClick={resetFilters}>Clear filters</Button>
            </div>
          )}
        </div>
      </section>
    </div>,
    document.body,
  );
}
