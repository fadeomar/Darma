
"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="inline-flex min-h-[38px] items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] px-3 text-sm font-semibold text-[var(--color-text-secondary)] shadow-[var(--shadow-xs)] transition hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-text-primary)]"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden />
      Back
    </button>
  );
}
