
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FlaskConical } from "lucide-react";
import BackButton from "@/components/BackButton";
import type { ElementDTO } from "@/features/elements/dto/element.dto";
import CodeTabs from "@/components/element/CodeTabs";
import ElementSidebar from "@/components/element/ElementSidebar";
import IframePreview from "@/components/element/IframePreview";
import Editor from "../Editor";
import { trackEvent } from "@/lib/analytics/gtag";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { markWorkflowStepComplete, writeCodePreviewHandoff } from "@/features/tools/workflows/browserState";

type Props = {
  element: ElementDTO;
};

export default function ElementPreviewShell({ element }: Props) {
  const router = useRouter();
  const [htmlCode, setHtmlCode] = useState(element?.html || "");
  const [cssCode, setCssCode] = useState(element?.css || "");
  const [jsCode, setJsCode] = useState(element?.js || "");
  const [handoffError, setHandoffError] = useState<string | null>(null);

  useEffect(() => {
    setHtmlCode(element?.html || "");
    setCssCode(element?.css || "");
    setJsCode(element?.js || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [element?.id, element?.slug]);

  const openInCodePreview = () => {
    setHandoffError(null);
    const saved = writeCodePreviewHandoff({
      source: { html: htmlCode, css: cssCode, js: jsCode },
      title: element.title,
      elementId: element.id,
      elementSlug: element.slug,
      createdAt: Date.now(),
    });

    if (!saved) {
      setHandoffError("Code Preview could not be opened because browser storage is unavailable or full.");
      return;
    }
    markWorkflowStepComplete("explorer-code-preview", "choose-element");
    router.push("/tools/code-preview-tool?workflow=explorer-code-preview&source=explorer");
  };

  const exportAsHtml = () => {
    const content = `<style>${cssCode || ""}</style>\n${htmlCode || ""}\n<script>${jsCode || ""}</script>`;
    const blob = new Blob([content], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(element.title || "preview").trim()}.html`;
    trackEvent(ANALYTICS_EVENTS.ELEMENT_EXPORT_HTML, {
      element_id: element.id,
      element_slug: element.slug ?? undefined,
      element_title: element.title ?? undefined,
      file_name: `${(element.title || "preview").trim()}.html`,
    });
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-[var(--color-page-bg)]">
      <header className="sticky top-0 z-10 border-b border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] backdrop-blur">
        <div className="mx-auto flex max-w-[var(--container-wide)] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:flex-nowrap sm:gap-4 sm:px-6 lg:px-8">
          <BackButton />
          <div className="min-w-0 flex-1">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">Element preview</p>
            <h1 className="truncate text-lg font-black tracking-[-0.02em] text-[var(--color-text-primary)] sm:text-xl">
              {element.title}
            </h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={openInCodePreview}
              className="inline-flex min-h-[38px] items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-3 text-sm font-semibold text-[var(--color-text-primary)] shadow-[var(--shadow-xs)] transition hover:border-[var(--color-primary-border)]"
            >
              <FlaskConical className="h-4 w-4" aria-hidden />
              <span className="hidden md:inline">Open in Code Preview</span>
              <span className="md:hidden">Preview</span>
            </button>
            <button
              type="button"
              onClick={exportAsHtml}
              className="inline-flex min-h-[38px] items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-4 text-sm font-semibold text-[var(--color-primary-text)] shadow-[var(--shadow-xs)] transition hover:bg-[var(--color-primary-hover)]"
            >
              <span className="hidden sm:inline">Export HTML</span>
              <span className="sm:hidden">Export</span>
            </button>
          </div>
        </div>
        {handoffError ? (
          <p role="alert" className="mx-auto max-w-[var(--container-wide)] px-4 pb-3 text-sm font-semibold text-[var(--color-danger)] sm:px-6 lg:px-8">
            {handoffError}
          </p>
        ) : null}
      </header>

      <div className="mx-auto grid max-w-[var(--container-wide)] grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8">
        <div className="space-y-6">
          <IframePreview html={htmlCode} css={cssCode} js={jsCode} />
          <CodeTabs
            htmlCode={htmlCode}
            cssCode={cssCode}
            jsCode={jsCode}
            setHtmlCode={setHtmlCode}
            setCssCode={setCssCode}
            setJsCode={setJsCode}
          />
          <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-5 shadow-[var(--shadow-card)]">
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Description</h2>
            <div className="prose mt-4 max-w-none overflow-visible whitespace-normal dark:prose-invert">
              <Editor content={element.description || "No description"} onUpdate={() => {}} previewMode={true} className="max-w-none" />
            </div>
          </section>
        </div>

        <ElementSidebar element={element} />
      </div>
    </main>
  );
}
