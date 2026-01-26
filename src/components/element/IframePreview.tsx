"use client";

import React, { useMemo } from "react";
import ResizableContainer from "@/components/ResizableContainer";
import { buildIframeDoc } from "@/features/elements/utils/buildIframeDoc";

type Props = {
  html: string;
  css: string;
  js: string;

  /** Optional: lets parent react to width changes (if needed elsewhere) */
  onWidthChange?: (width: number) => void;

  className?: string;
};

export default function IframePreview({
  html,
  css,
  js,
  onWidthChange,
  className = "",
}: Props) {
  const srcDoc = useMemo(() => {
    return buildIframeDoc({ html, css, js });
  }, [html, css, js]);

  const handleSizeChange = (size: { width: number; height: number }) => {
    onWidthChange?.(size.width);
  };

  return (
    <div className={["w-full max-w-full", className].join(" ")}>
      <ResizableContainer onSizeChange={handleSizeChange}>
        <div className="bg-white dark:bg-black rounded-2xl shadow-xl p-1 border border-gray-200 dark:border-gray-800 h-full min-h-[80vh]">
          <iframe
            srcDoc={srcDoc}
            className="w-full h-full rounded-xl bg-white dark:bg-black border border-gray-200 dark:border-gray-800 shadow-md"
            title="Element Preview"
          />
        </div>
      </ResizableContainer>
    </div>
  );
}
