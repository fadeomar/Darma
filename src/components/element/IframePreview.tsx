
"use client";

import React, { useMemo } from "react";
import ResizableContainer from "@/components/ResizableContainer";
import { buildIframeDoc } from "@/features/elements/utils/buildIframeDoc";

type Props = {
  html: string;
  css: string;
  js: string;
  onWidthChange?: (width: number) => void;
  className?: string;
};

export default function IframePreview({ html, css, js, onWidthChange, className = "" }: Props) {
  const srcDoc = useMemo(() => buildIframeDoc({ html, css, js }), [html, css, js]);

  const handleSizeChange = (size: { width: number; height: number }) => {
    onWidthChange?.(size.width);
  };

  return (
    <section className={["w-full max-w-full", className].join(" ")}>
      <div className="mb-2 flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] px-3 py-2 shadow-[var(--shadow-xs)]">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">Live preview</p>
        <p className="text-xs text-[var(--color-text-tertiary)]">Drag corner to resize</p>
      </div>
      <ResizableContainer onSizeChange={handleSizeChange}>
        <div className="h-full rounded-[var(--radius-lg)] border border-[var(--color-preview-border)] bg-[var(--color-preview-bg)] p-1">
          <iframe
            srcDoc={srcDoc}
            className="h-full w-full rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-preview-bg)]"
            title="Element Preview"
          />
        </div>
      </ResizableContainer>
    </section>
  );
}
