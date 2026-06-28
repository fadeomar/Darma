"use client";

import dynamic from "next/dynamic";

const BeamCalculatorClient = dynamic(() => import("./BeamCalculatorClient"), {
  ssr: false,
  loading: () => (
    <div className="h-[520px] animate-pulse rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-subtle)]" />
  ),
});

export default function BeamCalculatorShell() {
  return <BeamCalculatorClient />;
}
