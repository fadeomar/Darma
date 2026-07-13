"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Code2,
  Download,
  ExternalLink,
  FileArchive,
  FileCode2,
  Maximize2,
  Monitor,
  Play,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Tablet,
  Terminal,
} from "lucide-react";
import CodeEditor from "@/components/CodeEditor";
import { Badge, Button, CopyButton, Select } from "@/components/ui";
import {
  ControlSection,
  PresetGallery,
  PreviewToolbar,
  SegmentedControl,
} from "@/features/tools/components";
import { cn } from "@/lib/cn";
import {
  CODE_PREVIEW_PRESETS,
  DEFAULT_CODE_PREVIEW_PRESET,
  type CodePreviewPreset,
} from "./presets";

type EditorTab = "html" | "css" | "js";
type ViewportId = "desktop" | "tablet" | "mobile";
type RuntimeStatus = "idle" | "running" | "ready" | "error";
type ConsoleLevel = "log" | "info" | "warn" | "error";
type CheckStatus = "pass" | "warning" | "error";

type ProjectSource = {
  html: string;
  css: string;
  js: string;
};

type RenderedProject = ProjectSource & {
  version: number;
};

type ConsoleEntry = {
  id: string;
  level: ConsoleLevel;
  message: string;
};

type ProductionCheck = {
  id: string;
  label: string;
  detail: string;
  status: CheckStatus;
};

const editorTabs: Array<{ value: EditorTab; label: string }> = [
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "js", label: "JS" },
];

const viewports: Record<ViewportId, { label: string; width: number; height: number; icon: typeof Monitor }> = {
  desktop: { label: "Desktop", width: 1200, height: 760, icon: Monitor },
  tablet: { label: "Tablet", width: 768, height: 900, icon: Tablet },
  mobile: { label: "Mobile", width: 390, height: 844, icon: Smartphone },
};

const viewportOptions: Array<{ value: ViewportId; label: string }> = [
  { value: "desktop", label: "Desktop" },
  { value: "tablet", label: "Tablet" },
  { value: "mobile", label: "Mobile" },
];

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(bytes >= 10240 ? 0 : 1)} KB`;
}

function escapeRawTextClosingTag(value: string, tag: "script" | "style") {
  return value.replace(new RegExp(`</${tag}`, "gi"), `<\\/${tag}`);
}

function buildStandaloneDocument(source: ProjectSource, externalFiles = false) {
  const styles = externalFiles
    ? '<link rel="stylesheet" href="styles.css" />'
    : `<style>\n${escapeRawTextClosingTag(source.css, "style")}\n</style>`;
  const scripts = externalFiles
    ? '<script src="script.js" defer></script>'
    : `<script>\n${escapeRawTextClosingTag(source.js, "script")}\n</script>`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Darma code preview</title>
  ${styles}
</head>
<body>
${source.html}
  ${scripts}
</body>
</html>`;
}

function buildProjectJson(source: ProjectSource) {
  return JSON.stringify(
    {
      schemaVersion: 1,
      tool: "darma-code-preview",
      exportedAt: new Date().toISOString(),
      files: {
        "index.html": source.html,
        "styles.css": source.css,
        "script.js": source.js,
      },
    },
    null,
    2,
  );
}

function getDuplicateIds(html: string) {
  const ids = Array.from(html.matchAll(/\bid\s*=\s*["']([^"']+)["']/gi), (match) => match[1]);
  const counts = new Map<string, number>();
  ids.forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1));
  return Array.from(counts.entries())
    .filter(([, count]) => count > 1)
    .map(([id]) => id);
}

function hasBalancedCssBraces(css: string) {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
  let depth = 0;
  for (const char of withoutComments) {
    if (char === "{") depth += 1;
    if (char === "}") depth -= 1;
    if (depth < 0) return false;
  }
  return depth === 0;
}

function canCompileJavascript(js: string) {
  if (!js.trim()) return true;
  try {
    // Syntax check only. The function is never executed here.
    new Function(js);
    return true;
  } catch {
    return false;
  }
}

function getProductionChecks(source: ProjectSource): ProductionCheck[] {
  const duplicateIds = getDuplicateIds(source.html);
  const images = Array.from(source.html.matchAll(/<img\b[^>]*>/gi), (match) => match[0]);
  const imagesWithoutAlt = images.filter((tag) => !/\balt\s*=\s*["'][^"']*["']/i.test(tag));
  const buttons = Array.from(source.html.matchAll(/<button\b[^>]*>/gi), (match) => match[0]);
  const buttonsWithoutType = buttons.filter((tag) => !/\btype\s*=/i.test(tag));
  const blankLinks = Array.from(source.html.matchAll(/<a\b[^>]*target\s*=\s*["']_blank["'][^>]*>/gi), (match) => match[0]);
  const unsafeBlankLinks = blankLinks.filter((tag) => !/\brel\s*=\s*["'][^"']*noopener[^"']*["']/i.test(tag));
  const hasInlineHandlers = /\son[a-z]+\s*=/i.test(source.html);
  const hasScriptTag = /<script\b/i.test(source.html);
  const hasDebugStatements = /\bconsole\.(log|debug)\s*\(/.test(source.js);

  return [
    {
      id: "html-source",
      label: "HTML source",
      detail: source.html.trim() ? "Markup is present." : "Add HTML before exporting or sharing the preview.",
      status: source.html.trim() ? "pass" : "error",
    },
    {
      id: "css-braces",
      label: "CSS structure",
      detail: hasBalancedCssBraces(source.css) ? "CSS braces are balanced." : "One or more CSS braces appear unmatched.",
      status: hasBalancedCssBraces(source.css) ? "pass" : "error",
    },
    {
      id: "js-syntax",
      label: "JavaScript syntax",
      detail: canCompileJavascript(source.js) ? "JavaScript passes a syntax compile check." : "JavaScript contains a syntax error.",
      status: canCompileJavascript(source.js) ? "pass" : "error",
    },
    {
      id: "duplicate-ids",
      label: "Unique element IDs",
      detail: duplicateIds.length ? `Duplicate IDs: ${duplicateIds.slice(0, 3).join(", ")}.` : "No duplicate IDs detected.",
      status: duplicateIds.length ? "warning" : "pass",
    },
    {
      id: "image-alt",
      label: "Image alternatives",
      detail: imagesWithoutAlt.length ? `${imagesWithoutAlt.length} image tag(s) are missing alt text.` : "All detected images include alt text.",
      status: imagesWithoutAlt.length ? "warning" : "pass",
    },
    {
      id: "button-types",
      label: "Button behavior",
      detail: buttonsWithoutType.length ? `${buttonsWithoutType.length} button(s) are missing an explicit type.` : "All detected buttons have an explicit type.",
      status: buttonsWithoutType.length ? "warning" : "pass",
    },
    {
      id: "blank-links",
      label: "External link safety",
      detail: unsafeBlankLinks.length ? `${unsafeBlankLinks.length} target=_blank link(s) need rel=noopener.` : "No unsafe target=_blank links detected.",
      status: unsafeBlankLinks.length ? "warning" : "pass",
    },
    {
      id: "inline-events",
      label: "Event separation",
      detail: hasInlineHandlers ? "Move inline on* handlers into the JavaScript panel." : "No inline event handlers detected.",
      status: hasInlineHandlers ? "warning" : "pass",
    },
    {
      id: "html-scripts",
      label: "Script placement",
      detail: hasScriptTag ? "Keep scripts in the JavaScript panel for predictable execution." : "No script tags found inside the HTML panel.",
      status: hasScriptTag ? "warning" : "pass",
    },
    {
      id: "debug-statements",
      label: "Debug statements",
      detail: hasDebugStatements ? "Remove console.log/debug calls before production export." : "No console.log/debug calls detected.",
      status: hasDebugStatements ? "warning" : "pass",
    },
  ];
}

function buildIframeDocument(project: RenderedProject) {
  const css = escapeRawTextClosingTag(project.css, "style");
  const js = escapeRawTextClosingTag(project.js, "script");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    :root { color-scheme: light; --color-primary: #f05a28; }
    html, body { min-height: 100%; }
    body { margin: 0; font-family: Inter, ui-sans-serif, system-ui, sans-serif; background: #fffdf8; color: #191817; }
    ${css}
  </style>
</head>
<body>
  ${project.html}
  <script>
    (() => {
      const version = ${project.version};
      const send = (payload) => window.parent.postMessage({ source: "darma-code-preview", version, ...payload }, "*");
      const format = (value) => {
        if (typeof value === "string") return value;
        if (value instanceof Error) return value.message;
        try { return JSON.stringify(value); } catch { return String(value); }
      };

      ["log", "info", "warn", "error"].forEach((level) => {
        const original = console[level].bind(console);
        console[level] = (...args) => {
          send({ type: "console", level, message: args.map(format).join(" ") });
          original(...args);
        };
      });

      window.addEventListener("error", (event) => {
        send({ type: "runtime-error", message: event.message || "Unknown runtime error", line: event.lineno || 1 });
      });

      window.addEventListener("unhandledrejection", (event) => {
        send({ type: "runtime-error", message: format(event.reason || "Unhandled promise rejection"), line: 1 });
      });

      try {
        ${js}
        requestAnimationFrame(() => send({ type: "runtime-ready" }));
      } catch (error) {
        send({ type: "runtime-error", message: format(error), line: 1 });
      }
    })();
  </script>
</body>
</html>`;
}

function downloadBlob(filename: string, content: BlobPart, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function SummaryCard({ label, value, detail, icon: Icon }: { label: string; value: string; detail: string; icon: typeof Monitor }) {
  return (
    <div className="min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-3 shadow-[var(--shadow-xs)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.09em] text-[var(--color-text-tertiary)]">{label}</p>
          <p className="mt-1 truncate text-lg font-black tracking-[-0.025em] text-[var(--color-text-primary)]">{value}</p>
          <p className="mt-1 truncate text-[11px] text-[var(--color-text-tertiary)]">{detail}</p>
        </div>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius-sm)] border border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
      </div>
    </div>
  );
}

export default function CodePreviewTool() {
  const [html, setHtml] = useState(DEFAULT_CODE_PREVIEW_PRESET.html);
  const [css, setCss] = useState(DEFAULT_CODE_PREVIEW_PRESET.css);
  const [js, setJs] = useState(DEFAULT_CODE_PREVIEW_PRESET.js);
  const [activeTab, setActiveTab] = useState<EditorTab>("html");
  const [selectedPresetId, setSelectedPresetId] = useState(DEFAULT_CODE_PREVIEW_PRESET.id);
  const [viewportId, setViewportId] = useState<ViewportId>("desktop");
  const [autoRun, setAutoRun] = useState(true);
  const [runtimeStatus, setRuntimeStatus] = useState<RuntimeStatus>("running");
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const [consoleEntries, setConsoleEntries] = useState<ConsoleEntry[]>([]);
  const [renderedProject, setRenderedProject] = useState<RenderedProject>({
    html: DEFAULT_CODE_PREVIEW_PRESET.html,
    css: DEFAULT_CODE_PREVIEW_PRESET.css,
    js: DEFAULT_CODE_PREVIEW_PRESET.js,
    version: 1,
  });
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const previewPanelRef = useRef<HTMLDivElement | null>(null);
  const previewCanvasRef = useRef<HTMLDivElement | null>(null);
  const versionRef = useRef(1);
  const [previewCanvasWidth, setPreviewCanvasWidth] = useState(0);

  const source = useMemo<ProjectSource>(() => ({ html, css, js }), [css, html, js]);
  const productionChecks = useMemo(() => getProductionChecks(source), [source]);
  const passingChecks = productionChecks.filter((check) => check.status === "pass").length;
  const blockingChecks = productionChecks.filter((check) => check.status === "error").length;
  const warningChecks = productionChecks.filter((check) => check.status === "warning").length;
  const sourceBytes = new Blob([html, css, js]).size;
  const viewport = viewports[viewportId];
  const previewScale = previewCanvasWidth > 0 ? Math.min(1, Math.max(0.25, (previewCanvasWidth - 8) / viewport.width)) : 1;
  const scaledPreviewWidth = Math.round(viewport.width * previewScale);
  const scaledPreviewHeight = Math.round(viewport.height * previewScale);
  const iframeContent = useMemo(() => buildIframeDocument(renderedProject), [renderedProject]);
  const standaloneDocument = useMemo(() => buildStandaloneDocument(source), [source]);
  const projectJson = useMemo(() => buildProjectJson(source), [source]);

  const runPreview = useCallback(() => {
    versionRef.current += 1;
    setRuntimeError(null);
    setConsoleEntries([]);
    setRuntimeStatus("running");
    setRenderedProject({ ...source, version: versionRef.current });
  }, [source]);

  useEffect(() => {
    if (!autoRun) return;
    const timeoutId = window.setTimeout(runPreview, 350);
    return () => window.clearTimeout(timeoutId);
  }, [autoRun, runPreview]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      if (event.data?.source !== "darma-code-preview") return;
      if (event.data?.version !== versionRef.current) return;

      if (event.data.type === "runtime-error") {
        const message = `${String(event.data.message)}${event.data.line ? ` (line ${event.data.line})` : ""}`;
        setRuntimeError(message);
        setRuntimeStatus("error");
        return;
      }

      if (event.data.type === "runtime-ready") {
        setRuntimeStatus((current) => (current === "error" ? current : "ready"));
        return;
      }

      if (event.data.type === "console") {
        const level = (["log", "info", "warn", "error"] as ConsoleLevel[]).includes(event.data.level)
          ? event.data.level
          : "log";
        setConsoleEntries((entries) => [
          ...entries.slice(-49),
          {
            id: `${Date.now()}-${entries.length}`,
            level,
            message: String(event.data.message),
          },
        ]);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);


  useEffect(() => {
    const element = previewCanvasRef.current;
    if (!element || typeof ResizeObserver === "undefined") return;

    const updateWidth = () => setPreviewCanvasWidth(element.clientWidth);
    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);
    updateWidth();

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleKeyboard = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        runPreview();
      }
    };
    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, [runPreview]);

  const createSourceSetter = useCallback(
    (setter: Dispatch<SetStateAction<string>>): Dispatch<SetStateAction<string>> =>
      (value) => {
        setSelectedPresetId("custom");
        setter(value);
      },
    [],
  );

  const updateHtml = useMemo(() => createSourceSetter(setHtml), [createSourceSetter]);
  const updateCss = useMemo(() => createSourceSetter(setCss), [createSourceSetter]);
  const updateJs = useMemo(() => createSourceSetter(setJs), [createSourceSetter]);

  const activeCode = activeTab === "html" ? html : activeTab === "css" ? css : js;
  const setActiveCode = activeTab === "html" ? updateHtml : activeTab === "css" ? updateCss : updateJs;
  const activeLanguage = activeTab === "html" ? "html" : activeTab === "css" ? "css" : "javascript";
  const activeFilename = activeTab === "html" ? "index.html" : activeTab === "css" ? "styles.css" : "script.js";
  const activeLineCount = activeCode ? activeCode.split(/\r\n|\r|\n/).length : 0;

  function applyPreset(_id: string, preset: CodePreviewPreset) {
    setSelectedPresetId(preset.id);
    setHtml(preset.html);
    setCss(preset.css);
    setJs(preset.js);
    setActiveTab("html");
  }

  function resetProject() {
    applyPreset(DEFAULT_CODE_PREVIEW_PRESET.id, DEFAULT_CODE_PREVIEW_PRESET);
    setViewportId("desktop");
    setAutoRun(true);
  }

  function openPreview() {
    const blob = new Blob([standaloneDocument], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
  }

  async function downloadProjectZip() {
    const { default: JSZip } = await import("jszip");
    const zip = new JSZip();
    zip.file("index.html", buildStandaloneDocument(source, true));
    zip.file("styles.css", css);
    zip.file("script.js", js);
    zip.file("darma-project.json", projectJson);
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob("darma-code-preview-project.zip", blob, "application/zip");
  }

  async function enterFullscreen() {
    if (!previewPanelRef.current) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }
    await previewPanelRef.current.requestFullscreen();
  }

  const runtimeLabel = runtimeStatus === "running" ? "Running" : runtimeStatus === "error" ? "Error" : runtimeStatus === "ready" ? "Ready" : "Idle";
  const runtimeDetail = runtimeError ?? (autoRun ? "Auto-run enabled" : "Manual run mode");

  return (
    <div className="space-y-4">
      <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4" aria-label="Project summary">
        <SummaryCard label="Runtime" value={runtimeLabel} detail={runtimeDetail} icon={runtimeStatus === "error" ? AlertTriangle : Play} />
        <SummaryCard label="Source" value={formatBytes(sourceBytes)} detail="HTML + CSS + JavaScript" icon={FileCode2} />
        <SummaryCard label="Production" value={`${passingChecks}/${productionChecks.length} pass`} detail={`${blockingChecks} blocking · ${warningChecks} warnings`} icon={ShieldCheck} />
        <SummaryCard label="Viewport" value={`${viewport.width} × ${viewport.height}`} detail={viewport.label} icon={viewport.icon} />
      </section>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(420px,0.92fr)_minmax(520px,1.08fr)]">
        <section className="min-w-0 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] shadow-[var(--shadow-sm)]">
          <div className="border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-4 py-3">
            <ControlSection
              title="Practical presets"
              description="Start from a complete responsive example, then edit each source file."
              compact
            >
              <PresetGallery
                presets={CODE_PREVIEW_PRESETS}
                selectedId={selectedPresetId}
                onSelect={applyPreset}
                getId={(preset) => preset.id}
                getLabel={(preset) => preset.name}
                getDescription={(preset) => preset.description}
                compact
                className="lg:grid-cols-3"
              />
            </ControlSection>
          </div>

          <PreviewToolbar
            title="Source editor"
            description={`${activeFilename} · ${activeLineCount} lines · ${formatBytes(new Blob([activeCode]).size)}`}
            actions={
              <div className="flex flex-wrap items-center gap-2">
                <SegmentedControl
                  ariaLabel="Editor source file"
                  value={activeTab}
                  onChange={(value) => setActiveTab(value as EditorTab)}
                  options={editorTabs}
                />
                <CopyButton text={activeCode} size="sm" variant="secondary">Copy file</CopyButton>
              </div>
            }
          />

          <div className="h-[500px] min-h-0 bg-[var(--color-code-bg)] p-2 sm:p-3">
            <CodeEditor
              code={activeCode}
              setCode={setActiveCode}
              language={activeLanguage}
              showCopyButton={false}
              height="476px"
              analyticsContext={`${activeTab} code from code preview studio`}
            />
          </div>
        </section>

        <section
          ref={previewPanelRef}
          className="flex min-h-[620px] min-w-0 flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] shadow-[var(--shadow-sm)] fullscreen:bg-[var(--color-surface-raised)]"
        >
          <PreviewToolbar
            title="Responsive preview"
            description="Sandboxed iframe with runtime and console reporting."
            actions={
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  size="sm"
                  width="short"
                  aria-label="Preview viewport"
                  value={viewportId}
                  onChange={(event) => setViewportId(event.target.value as ViewportId)}
                >
                  {viewportOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </Select>
                <Button size="sm" variant="secondary" onClick={runPreview} leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>Run</Button>
                <Button size="icon" variant="ghost" onClick={enterFullscreen} title="Toggle fullscreen"><Maximize2 className="h-4 w-4" /></Button>
              </div>
            }
          >
            <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-[var(--color-text-secondary)]">
              <input
                type="checkbox"
                checked={autoRun}
                onChange={(event) => setAutoRun(event.target.checked)}
                className="h-4 w-4 accent-[var(--color-primary)]"
              />
              Auto-run after edits
              <span className="font-mono text-[10px] font-medium text-[var(--color-text-tertiary)]">Ctrl/⌘ + Enter</span>
            </label>
          </PreviewToolbar>

          <div
            ref={previewCanvasRef}
            className="relative flex min-h-0 flex-1 items-start justify-center overflow-auto border-t border-[var(--color-border-subtle)] bg-[linear-gradient(90deg,var(--color-preview-grid)_1px,transparent_1px),linear-gradient(180deg,var(--color-preview-grid)_1px,transparent_1px),var(--color-preview-bg)] bg-[size:24px_24px] p-3 sm:p-5"
          >
            <div
              className="relative shrink-0 overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-preview-border)] bg-white shadow-[var(--shadow-md)] transition-[width,height] duration-300"
              style={{ width: scaledPreviewWidth, height: scaledPreviewHeight }}
            >
              {runtimeStatus === "running" ? (
                <div className="absolute inset-x-0 top-0 z-10 h-0.5 overflow-hidden bg-[var(--color-primary-soft)]">
                  <span className="block h-full w-1/2 animate-pulse bg-[var(--color-primary)]" />
                </div>
              ) : null}
              <div
                className="absolute left-0 top-0 origin-top-left"
                style={{ width: viewport.width, height: viewport.height, transform: `scale(${previewScale})` }}
              >
                <iframe
                  ref={iframeRef}
                  srcDoc={iframeContent}
                  sandbox="allow-scripts allow-forms"
                  referrerPolicy="no-referrer"
                  className="h-full w-full bg-white"
                  title="Live code preview"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-3 py-2.5">
            <div className="flex items-center gap-2">
              <Badge variant={runtimeStatus === "error" ? "danger" : runtimeStatus === "ready" ? "success" : "info"}>{runtimeLabel}</Badge>
              <span className="max-w-[32rem] truncate text-xs text-[var(--color-text-tertiary)]">{runtimeDetail}</span>
            </div>
            <Button size="sm" variant="ghost" onClick={openPreview} leftIcon={<ExternalLink className="h-3.5 w-3.5" />}>Open preview</Button>
          </div>
        </section>
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[1.08fr_0.92fr]">
        <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-sm)]">
          <PreviewToolbar
            title="Production checks"
            description="Fast browser-side checks for common HTML, CSS, JavaScript, accessibility, and safety issues."
            actions={<Badge variant={blockingChecks ? "danger" : warningChecks ? "warning" : "success"}>{blockingChecks ? `${blockingChecks} blocking` : warningChecks ? `${warningChecks} warnings` : "All clear"}</Badge>}
          />
          <div className="grid gap-2 p-3 sm:grid-cols-2">
            {productionChecks.map((check) => (
              <div
                key={check.id}
                className={cn(
                  "flex min-w-0 items-start gap-2 rounded-[var(--radius-md)] border px-3 py-2.5",
                  check.status === "pass" && "border-[var(--color-success-border)] bg-[var(--color-success-bg)]",
                  check.status === "warning" && "border-[var(--color-warning-border)] bg-[var(--color-warning-bg)]",
                  check.status === "error" && "border-[var(--color-danger-border)] bg-[var(--color-danger-bg)]",
                )}
              >
                {check.status === "pass" ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-success-text)]" />
                ) : (
                  <AlertTriangle className={cn("mt-0.5 h-4 w-4 shrink-0", check.status === "error" ? "text-[var(--color-danger-text)]" : "text-[var(--color-warning-text)]")} />
                )}
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[var(--color-text-primary)]">{check.label}</p>
                  <p className="mt-0.5 text-[11px] leading-4 text-[var(--color-text-secondary)]">{check.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-sm)]">
          <PreviewToolbar
            title="Console & exports"
            description="Inspect runtime messages and package the current project."
            actions={<Badge variant="outline">{consoleEntries.length} messages</Badge>}
          />
          <div className="space-y-3 p-3">
            <div className="min-h-36 max-h-48 overflow-auto rounded-[var(--radius-md)] border border-[var(--color-code-border)] bg-[var(--color-code-bg)] p-3 font-mono text-xs text-[var(--color-code-text)]">
              {runtimeError ? (
                <div className="mb-2 flex gap-2 text-red-300"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{runtimeError}</span></div>
              ) : null}
              {consoleEntries.length ? consoleEntries.map((entry) => (
                <div key={entry.id} className={cn("flex gap-2 border-b border-white/5 py-1.5 last:border-b-0", entry.level === "error" && "text-red-300", entry.level === "warn" && "text-amber-300", entry.level === "info" && "text-sky-300")}>
                  <span className="w-10 shrink-0 uppercase opacity-60">{entry.level}</span>
                  <span className="min-w-0 break-words">{entry.message}</span>
                </div>
              )) : (
                <div className="flex min-h-28 items-center justify-center gap-2 text-[var(--color-code-muted)]">
                  <Terminal className="h-4 w-4" />
                  Runtime messages appear here.
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <CopyButton text={standaloneDocument} size="sm" variant="secondary">Copy HTML</CopyButton>
              <Button size="sm" variant="secondary" onClick={() => downloadBlob("darma-preview.html", standaloneDocument, "text/html;charset=utf-8")} leftIcon={<Download className="h-3.5 w-3.5" />}>HTML</Button>
              <Button size="sm" variant="secondary" onClick={() => downloadBlob("darma-project.json", projectJson, "application/json;charset=utf-8")} leftIcon={<Code2 className="h-3.5 w-3.5" />}>JSON</Button>
              <Button size="sm" variant="secondary" onClick={downloadProjectZip} leftIcon={<FileArchive className="h-3.5 w-3.5" />}>Project ZIP</Button>
              <Button size="sm" variant="ghost" onClick={resetProject} leftIcon={<RotateCcw className="h-3.5 w-3.5" />}>Reset</Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
