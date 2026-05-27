"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import CodeEditor from "@/components/CodeEditor";
import { Button } from "@/components/ui";
import { PreviewToolbar, SegmentedControl, WarningPanel, type WarningMessage } from "@/features/tools/components";

type EditorTab = "html" | "css" | "js";

const editorTabs: Array<{ value: EditorTab; label: string }> = [
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "js", label: "JS" },
];

export default function CodePreviewTool() {
  const [html, setHtml] = useState('<div id="hello">Hello World</div>');
  const [css, setCss] = useState("#hello { color: var(--color-primary); font-size: 20px; font-weight: 800; }");
  const [js, setJs] = useState('console.log("Hello from JS");');
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<EditorTab>("html");
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const iframeContent = useMemo(() => `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <style>
        :root { color-scheme: light; --color-primary: #f05a28; }
        body { margin: 0; min-height: 100vh; display: grid; place-items: center; font-family: Inter, ui-sans-serif, system-ui, sans-serif; background: #fffdf8; color: #191817; }
        ${css}
      </style>
    </head>
    <body>
      ${html}
      <script>
        window.onerror = function(message, source, lineno) {
          window.parent.postMessage({ type: 'darma-code-preview:error', message: String(message), lineno: lineno || 1 }, '*');
          return true;
        };
        try {
          ${js}
          window.parent.postMessage({ type: 'darma-code-preview:success' }, '*');
        } catch (error) {
          window.parent.postMessage({ type: 'darma-code-preview:error', message: error && error.message ? String(error.message) : 'Unknown runtime error', lineno: 1 }, '*');
        }
      </script>
    </body>
    </html>
  `, [css, html, js]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      if (event.data?.type === "darma-code-preview:error") {
        setError(`Error: ${event.data.message} (Line ${event.data.lineno})`);
      } else if (event.data?.type === "darma-code-preview:success") {
        setError(null);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  useEffect(() => {
    setError(null);
  }, [html, css, js]);

  const warnings = useMemo<WarningMessage[]>(() => error ? [{ id: "runtime", severity: "danger", message: error }] : [], [error]);
  const activeCode = activeTab === "html" ? html : activeTab === "css" ? css : js;
  const setActiveCode = activeTab === "html" ? setHtml : activeTab === "css" ? setCss : setJs;
  const activeLanguage = activeTab === "html" ? "html" : activeTab === "css" ? "css" : "javascript";

  return (
    <div className="grid min-h-[720px] gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] shadow-[var(--shadow-sm)]">
        <PreviewToolbar
          title="Code editor"
          description="Switch between HTML, CSS, and JavaScript. The preview updates as you edit."
          actions={<SegmentedControl ariaLabel="Editor tab" value={activeTab} onChange={(v) => setActiveTab(v as EditorTab)} options={editorTabs} />}
        />
        <div className="h-[620px] min-h-0 border-t border-[var(--color-border-subtle)] bg-[var(--color-code-bg)] p-3">
          <CodeEditor
            code={activeCode}
            setCode={setActiveCode}
            language={activeLanguage}
            analyticsContext={`${activeTab} code from code preview page`}
          />
        </div>
      </section>

      <section className="flex min-h-0 flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] shadow-[var(--shadow-sm)]">
        <PreviewToolbar
          title="Live preview"
          description="Runs inside a sandboxed iframe without same-origin access to Darma."
          actions={<Button size="sm" variant="secondary" onClick={() => setError(null)}>Clear status</Button>}
        />
        <div className="min-h-0 flex-1 border-t border-[var(--color-border-subtle)] bg-[linear-gradient(90deg,var(--color-preview-grid)_1px,transparent_1px),linear-gradient(180deg,var(--color-preview-grid)_1px,transparent_1px),var(--color-preview-bg)] bg-[size:24px_24px] p-3">
          <iframe
            ref={iframeRef}
            srcDoc={iframeContent}
            sandbox="allow-scripts allow-forms"
            referrerPolicy="no-referrer"
            className="h-full min-h-[620px] w-full rounded-[var(--radius-md)] border border-[var(--color-preview-border)] bg-white shadow-[var(--shadow-sm)]"
            title="Live code preview"
          />
        </div>
        <WarningPanel messages={warnings} className="border-t border-[var(--color-border-subtle)] p-3" />
      </section>
    </div>
  );
}
