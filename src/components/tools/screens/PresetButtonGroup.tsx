"use client";

import type { ReactNode } from "react";

export default function PresetButtonGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={[
            "rounded-full px-4 py-2 text-xs font-bold transition",
            value === option.value
              ? "bg-[var(--textColor)] text-[var(--baseColor)]"
              : "border border-black/10 bg-white text-[var(--textColor)]/75 hover:bg-black/5",
          ].join(" ")}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
