"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, Heart, Sparkles } from "lucide-react";
import { Button } from "@/components/ui";
import { copyTextToClipboard } from "@/lib/copy-to-clipboard";
import { cn } from "@/lib/cn";
import { generateButtonCss } from "./generators";
import { ButtonPreviewElement } from "./ButtonPreviewElement";
import { buttonPresetCategories, buttonPresets } from "./presets";
import type { ButtonPreset, ButtonPresetCategory, PreviewBackground } from "./types";

type CategoryFilter = "all" | "favorites" | ButtonPresetCategory;
const FAVORITES_KEY = "darma-button-favorites-v1";

function canvasStyle(background: PreviewBackground | undefined) {
  if (background === "dark") return { background: "linear-gradient(135deg, #020617, #111827 55%, #1e293b)" };
  if (background === "gradient") return { background: "linear-gradient(135deg, #0f172a 0%, #4c1d95 44%, #0891b2 100%)" };
  return { background: "linear-gradient(135deg, #ffffff, #f8fafc)" };
}

function ExampleCard({ preset, selected, favorite, onSelect, onToggleFavorite }: { preset: ButtonPreset; selected: boolean; favorite: boolean; onSelect: (preset: ButtonPreset) => void; onToggleFavorite: (presetId: string) => void }) {
  const previewConfig = useMemo(() => ({ ...preset.config, className: `darma-example-${preset.id}` }), [preset]);
  const css = useMemo(() => generateButtonCss(previewConfig), [previewConfig]);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  async function copyCss() {
    const copied = await copyTextToClipboard(css);
    setCopyState(copied ? "copied" : "failed");
    window.setTimeout(() => setCopyState("idle"), 1600);
  }

  return (
    <article className={cn(
      "group overflow-hidden rounded-[var(--radius-lg)] border bg-[var(--color-surface)] shadow-[var(--shadow-xs)] transition duration-200",
      "hover:-translate-y-0.5 hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-sm)]",
      selected ? "border-[var(--color-primary)] ring-2 ring-[var(--color-primary-soft)]" : "border-[var(--color-border-default)]",
    )}>
      <style>{css}</style>
      <div className="relative flex min-h-[132px] items-center justify-center p-5" style={canvasStyle(preset.recommendedBackground)}>
        <button
          type="button"
          aria-label={favorite ? `Remove ${preset.name} from favorites` : `Save ${preset.name} to favorites`}
          aria-pressed={favorite}
          onClick={() => onToggleFavorite(preset.id)}
          className={cn("absolute right-2.5 top-2.5 grid h-8 w-8 place-items-center rounded-full border border-black/10 bg-white/90 text-slate-600 shadow-sm backdrop-blur transition hover:scale-105 hover:text-rose-600", favorite && "text-rose-600")}
        >
          <Heart className={cn("h-4 w-4", favorite && "fill-current")} />
        </button>
        <ButtonPreviewElement config={previewConfig} />
      </div>
      <div className="space-y-3 p-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-black tracking-[-0.01em] text-[var(--color-text-primary)]">{preset.name}</h3>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--color-text-tertiary)]">{preset.description}</p>
          </div>
          {preset.cssOnly ? <span className="shrink-0 rounded-full border border-[var(--color-border-subtle)] px-2 py-1 font-mono text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">CSS only</span> : null}
        </div>
        <div className="flex gap-2">
          <Button size="sm" className="flex-1" onClick={() => onSelect(preset)}>Customize</Button>
          <Button size="sm" variant="secondary" aria-label={`Copy ${preset.name} CSS`} title="Copy CSS" onClick={copyCss} leftIcon={<Copy className="h-3.5 w-3.5" />}>{copyState === "copied" ? "Copied" : copyState === "failed" ? "Copy failed" : "CSS"}</Button>
        </div>
      </div>
    </article>
  );
}

export function ButtonExamplesGallery({ selectedPresetId, onSelect }: { selectedPresetId?: string; onSelect: (preset: ButtonPreset) => void }) {
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [showAll, setShowAll] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? "[]");
      if (Array.isArray(saved)) {
        const validIds = new Set(buttonPresets.map((preset) => preset.id));
        setFavorites(saved.filter((item): item is string => typeof item === "string" && validIds.has(item)));
      }
    } catch {
      setFavorites([]);
    }
  }, []);

  function toggleFavorite(presetId: string) {
    setFavorites((current) => {
      const next = current.includes(presetId) ? current.filter((id) => id !== presetId) : [...current, presetId];
      try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(next)); } catch { /* local storage is optional */ }
      return next;
    });
  }

  const filtered = useMemo(() => {
    const source = category === "all"
      ? buttonPresets
      : category === "favorites"
        ? buttonPresets.filter((preset) => favorites.includes(preset.id))
        : buttonPresets.filter((preset) => preset.category === category);
    return showAll || category !== "all" ? source : source.slice(0, 12);
  }, [category, favorites, showAll]);

  const randomPreset = () => {
    const source = category === "all"
      ? buttonPresets
      : category === "favorites"
        ? buttonPresets.filter((preset) => favorites.includes(preset.id))
        : buttonPresets.filter((preset) => preset.category === category);
    if (!source.length) return;
    onSelect(source[Math.floor(Math.random() * source.length)]);
  };

  const categories = [...buttonPresetCategories, { value: "favorites", label: `Favorites${favorites.length ? ` ${favorites.length}` : ""}` }] as const;

  return (
    <section className="space-y-4 rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-xs)] sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-primary-text-strong)]">Explore first</div>
          <h2 className="mt-1 text-xl font-black tracking-[-0.035em] text-[var(--color-text-primary)]">Choose a button, then make it yours</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--color-text-tertiary)]">Hover live examples, save favorites locally, copy the CSS immediately, or load any style into the studio.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={randomPreset} leftIcon={<Sparkles className="h-4 w-4" />}>Inspire me</Button>
      </div>

      <div role="group" className="flex gap-2 overflow-x-auto pb-1" aria-label="Button categories">
        {categories.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setCategory(item.value as CategoryFilter)}
            aria-pressed={category === item.value}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold transition",
              category === item.value
                ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                : "border-[var(--color-border-default)] bg-[var(--color-surface-strong)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)]",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {category === "favorites" && !filtered.length ? (
        <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-default)] bg-[var(--color-surface-strong)] px-5 py-10 text-center">
          <Heart className="mx-auto h-5 w-5 text-[var(--color-text-tertiary)]" />
          <p className="mt-2 text-sm font-bold text-[var(--color-text-primary)]">No favorite buttons yet</p>
          <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">Use the heart on any example. Favorites stay in this browser only.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((preset) => <ExampleCard key={preset.id} preset={preset} selected={preset.id === selectedPresetId} favorite={favorites.includes(preset.id)} onSelect={onSelect} onToggleFavorite={toggleFavorite} />)}
        </div>
      )}

      {category === "all" && buttonPresets.length > 12 ? (
        <div className="flex justify-center pt-1">
          <Button variant="secondary" size="sm" onClick={() => setShowAll((value) => !value)}>{showAll ? "Show fewer examples" : `View all ${buttonPresets.length} examples`}</Button>
        </div>
      ) : null}
    </section>
  );
}
