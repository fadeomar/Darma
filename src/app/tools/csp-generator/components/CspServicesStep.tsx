"use client";

import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { CSP_SERVICES, type CspServiceCategory } from "../services";

const CATEGORY_META: Array<{ id: "all" | CspServiceCategory; label: string }> = [
  { id: "all", label: "All" },
  { id: "core", label: "Core" },
  { id: "analytics", label: "Analytics" },
  { id: "media", label: "Media" },
  { id: "commerce", label: "Commerce" },
  { id: "backend", label: "Backend" },
  { id: "security", label: "Security" },
];

export function CspServicesStep({
  enabled,
  onToggle,
}: {
  enabled: string[];
  onToggle: (id: string) => void;
}) {
  const [category, setCategory] = useState<"all" | CspServiceCategory>("all");
  const enabledSet = useMemo(() => new Set(enabled), [enabled]);
  const visibleServices = useMemo(
    () => CSP_SERVICES.filter((service) => category === "all" || service.category === category),
    [category],
  );
  const notes = CSP_SERVICES.filter((service) => enabledSet.has(service.id) && service.note);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Service categories">
          {CATEGORY_META.map((item) => {
            const active = item.id === category;
            const count = item.id === "all" ? CSP_SERVICES.length : CSP_SERVICES.filter((service) => service.category === item.id).length;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setCategory(item.id)}
                className={cn(
                  "rounded-[var(--radius-full)] border px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.08em] transition",
                  active
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-text)]"
                    : "border-[var(--color-border-default)] bg-[var(--color-surface-base)] text-[var(--color-text-tertiary)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)]",
                )}
              >
                {item.label} <span className="opacity-70">{count}</span>
              </button>
            );
          })}
        </div>

        {enabled.length ? (
          <p className="rounded-[var(--radius-full)] bg-[var(--color-surface-subtle)] px-2.5 py-1 text-xs font-bold text-[var(--color-text-secondary)]">
            {enabled.length} selected
          </p>
        ) : null}
      </div>

      <div className="grid gap-2.5 md:grid-cols-2 2xl:grid-cols-3">
        {visibleServices.map((service) => {
          const active = enabledSet.has(service.id);
          return (
            <button
              key={service.id}
              type="button"
              role="checkbox"
              aria-checked={active}
              onClick={() => onToggle(service.id)}
              className={cn(
                "flex min-h-[84px] items-start gap-3 rounded-[var(--radius-md)] border p-3 text-left transition focus:outline-none focus:shadow-[var(--focus-ring)]",
                active
                  ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] shadow-[var(--shadow-xs)]"
                  : "border-[var(--color-border-default)] bg-[var(--color-surface-base)] hover:border-[var(--color-border-strong)]",
              )}
            >
              <span aria-hidden className="text-lg leading-none">{service.icon}</span>
              <span className="min-w-0 flex-1">
                <span className="flex items-start justify-between gap-2">
                  <span className="text-sm font-bold leading-5 text-[var(--color-text-primary)]">{service.label}</span>
                  <span
                    className={cn(
                      "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border",
                      active ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-text)]" : "border-[var(--color-border-strong)] bg-[var(--color-surface-raised)]",
                    )}
                  >
                    {active ? <Check className="h-3 w-3" aria-hidden /> : null}
                  </span>
                </span>
                <span className="mt-0.5 block text-xs leading-5 text-[var(--color-text-secondary)]">{service.description}</span>
              </span>
            </button>
          );
        })}
      </div>

      {notes.length ? (
        <div className="grid gap-1.5 sm:grid-cols-2">
          {notes.slice(0, 4).map((service) => (
            <p key={service.id} className="rounded-[var(--radius-sm)] border border-[var(--color-info-border)] bg-[var(--color-info-bg)] px-2.5 py-1.5 text-[11px] leading-4 text-[var(--color-info-text)]">
              <span className="font-bold">{service.label}:</span> {service.note}
            </p>
          ))}
          {notes.length > 4 ? (
            <p className="rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-2.5 py-1.5 text-[11px] leading-4 text-[var(--color-text-tertiary)]">
              +{notes.length - 4} more service note{notes.length - 4 === 1 ? "" : "s"} hidden to keep this step compact.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
