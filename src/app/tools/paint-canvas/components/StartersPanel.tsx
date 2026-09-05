import { useState } from "react";
import { Button } from "@/components/ui";
import { PAINT_STARTERS, STARTER_PREVIEW_COUNT, type PaintStarter } from "../editor/starters";
import type { PaintSettings } from "../types";

function isActive(starter: PaintStarter, settings: PaintSettings): boolean {
  return (Object.keys(starter.settings) as Array<keyof PaintSettings>).every(
    (key) => settings[key] === starter.settings[key],
  );
}

export default function StartersPanel({
  settings,
  onApply,
}: {
  settings: PaintSettings;
  onApply: (starter: PaintStarter) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? PAINT_STARTERS : PAINT_STARTERS.slice(0, STARTER_PREVIEW_COUNT);

  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-text-tertiary)]">Quick starting styles</div>
          <p className="mt-1 text-xs leading-5 text-[var(--color-text-tertiary)]">
            Pick the drawing intent first, then fine-tune. Starters change tool settings only and never touch existing artwork.
          </p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowAll((value) => !value)}
          aria-expanded={showAll}
        >
          {showAll ? "Show fewer" : `Show all ${PAINT_STARTERS.length}`}
        </Button>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
        {visible.map((starter) => {
          const active = isActive(starter, settings);
          return (
            <li key={starter.id}>
              <button
                type="button"
                aria-pressed={active}
                onClick={() => onApply(starter)}
                className={`w-full rounded-[var(--radius-md)] border px-2.5 py-2 text-left transition ${
                  active
                    ? "border-[var(--color-primary)] bg-[var(--color-surface-subtle)]"
                    : "border-[var(--color-border-subtle)] hover:border-[var(--color-border-default)]"
                }`}
              >
                <span className="block text-xs font-bold text-[var(--color-text-primary)]">{starter.label}</span>
                <span className="mt-0.5 block text-xs leading-4 text-[var(--color-text-tertiary)]">{starter.description}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
