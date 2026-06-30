"use client";

import { useState } from "react";
import { ChevronDown, MousePointerClick } from "lucide-react";
import { cn } from "@/lib/cn";

const STEPS = [
  { n: 1, title: "Choose a beam type", text: "Simply supported, cantilever, or advanced." },
  { n: 2, title: "Set span length", text: "Enter the beam length in metres." },
  { n: 3, title: "Add loads", text: "Point loads, UDLs, or moments — then drag to place." },
  { n: 4, title: "Read results", text: "Reactions, shear (SFD) and moment (BMD) update live." },
];

export function BeamHowTo() {
  const [open, setOpen] = useState(true);

  return (
    <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-xs)]">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-bold text-[var(--color-text-primary)]">
          <MousePointerClick className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
          How to use Beam Calculator Studio
        </span>
        <ChevronDown className={cn("h-4 w-4 text-[var(--color-text-tertiary)] transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      {open ? (
        <ol className="grid gap-2 border-t border-[var(--color-border-subtle)] p-3 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <li key={step.n} className="flex gap-2.5 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-black text-[var(--color-primary-text)]">
                {step.n}
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-bold text-[var(--color-text-primary)]">{step.title}</span>
                <span className="mt-0.5 block text-[11px] leading-4 text-[var(--color-text-tertiary)]">{step.text}</span>
              </span>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}
