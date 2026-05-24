import { cn } from "@/lib/cn";
import type { TransformOriginPreset } from "../types";

const origins: TransformOriginPreset[] = ["top left", "top center", "top right", "center left", "center center", "center right", "bottom left", "bottom center", "bottom right"];

export function OriginPicker({ value, onChange }: { value: TransformOriginPreset; onChange: (value: TransformOriginPreset) => void }) {
  return <div className="grid w-44 grid-cols-3 gap-1" role="radiogroup" aria-label="Transform origin">{origins.map((origin) => <button key={origin} type="button" role="radio" aria-checked={value === origin} onClick={() => onChange(origin)} className={cn("h-10 rounded-[var(--radius-sm)] border text-[10px] font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]", value === origin ? "border-[var(--color-accent)] bg-[var(--color-accent)]/15 text-[var(--color-text)]" : "border-[var(--color-border)] bg-[var(--color-surface-strong)] text-[var(--color-text-soft)]")}>{origin.replace(" ", "\n")}</button>)}</div>;
}
