"use client";

import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Database,
  Download,
  FileJson2,
  History,
  ListTree,
  Maximize2,
  Minimize2,
  PanelTopOpen,
  RotateCcw,
  Sparkles,
  Table2,
  Upload,
  Wand2,
} from "lucide-react";
import { Badge, Button, CopyButton, Select } from "@/components/ui";
import { downloadText } from "../_shared/clientUtils";
import { cn } from "@/lib/cn";
import JsonCodeEditor, { type JsonCodeEditorHandle } from "./JsonCodeEditor";
import JsonStatsPanel from "./JsonStatsPanel";
import JsonTableView from "./JsonTableView";
import JsonTreeView from "./JsonTreeView";
import {
  analyzeJSON,
  formatJSON,
  jsonToTableData,
  minifyJSON,
  parseJSON,
  repairLooseJSON,
  SAMPLE_JSON,
  TABLE_SAMPLE_JSON,
  validateJSON,
  type IndentOption,
  type JsonValue,
  type ValidationResult,
} from "./utils";

type JsonAction = "format" | "minify" | "validate" | "fix" | "sort";
type JsonView = "text" | "tree" | "table" | "stats";

type HistoryItem = {
  id: string;
  title: string;
  value: string;
  createdAt: string;
};

type Notice = {
  tone: "info" | "success" | "danger" | "warning";
  title: string;
  message: string;
};

const JSON_VIEW_OPTIONS: Array<{ value: JsonView; label: string }> = [
  { value: "text", label: "Text" },
  { value: "tree", label: "Tree" },
  { value: "table", label: "Table" },
  { value: "stats", label: "Stats" },
];

function OutputViewTabs({ value, onChange }: { value: JsonView; onChange: (value: JsonView) => void }) {
  return (
    <div
      role="radiogroup"
      aria-label="JSON output view"
      className="flex w-full flex-wrap items-center gap-1 rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-control-track)] p-1 shadow-[var(--shadow-xs)] sm:w-fit sm:flex-nowrap"
    >
      {JSON_VIEW_OPTIONS.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "h-8 min-w-[76px] flex-1 whitespace-nowrap rounded-[calc(var(--radius-md)-5px)] px-3 text-center text-[11px] font-bold uppercase tracking-[0.04em] transition duration-[var(--duration-fast)] sm:flex-none",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-soft)]",
              active
                ? "bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] shadow-[var(--shadow-xs)]"
                : "text-[var(--color-text-secondary)] hover:bg-[var(--color-control-hover)] hover:text-[var(--color-text-primary)]",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

const HISTORY_KEY = "darma:json-formatter:history";
const MAX_HISTORY_ITEMS = 8;

function validationMessage(validation: ValidationResult | null) {
  if (!validation || !("error" in validation)) return "";
  const location = validation.line
    ? ` at line ${validation.line}${validation.col ? `, column ${validation.col}` : ""}`
    : "";
  return `${validation.error}${location}`;
}

function makeHistoryTitle(value: string) {
  const parsed = parseJSON(value);
  if (parsed.ok && parsed.parsed !== undefined) {
    if (Array.isArray(parsed.parsed)) return `Array · ${parsed.parsed.length} items`;
    if (parsed.parsed !== null && typeof parsed.parsed === "object") {
      return `Object · ${Object.keys(parsed.parsed).length} keys`;
    }
  }
  return `${value.length.toLocaleString()} characters`;
}

function loadHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HistoryItem[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_HISTORY_ITEMS) : [];
  } catch {
    return [];
  }
}

function StatusPill({ validation }: { validation: ValidationResult | null }) {
  if (!validation) {
    return <Badge variant="info">Browser-only</Badge>;
  }
  if (validation.ok) {
    return <Badge variant="success">Valid JSON</Badge>;
  }
  return <Badge variant="danger">Invalid JSON</Badge>;
}

function NoticePanel({ notice }: { notice: Notice }) {
  const Icon = notice.tone === "danger" ? AlertTriangle : notice.tone === "success" ? CheckCircle2 : Sparkles;
  const toneClass = {
    info: "border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-[var(--color-info-text)]",
    success: "border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-text)]",
    warning: "border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]",
    danger: "border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]",
  }[notice.tone];

  return (
    <div className={cn("flex items-start gap-3 rounded-[var(--radius-md)] border p-3 text-sm leading-6", toneClass)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div>
        <p className="font-bold">{notice.title}</p>
        <p className="opacity-90">{notice.message}</p>
      </div>
    </div>
  );
}

function WorkbenchStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-3 py-2">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{label}</p>
      <p className="mt-1 text-lg font-black tracking-[-0.03em] text-[var(--color-text-primary)]">{value}</p>
    </div>
  );
}

export default function JsonFormatterClient() {
  const inputEditorRef = useRef<JsonCodeEditorHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [indent, setIndent] = useState<IndentOption>(2);
  const [sortKeys, setSortKeys] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [activeView, setActiveView] = useState<JsonView>("text");
  const [notice, setNotice] = useState<Notice>({
    tone: "info",
    title: "Local processing",
    message: "Paste JSON, drop a .json file, or load a sample. Nothing is uploaded to a server.",
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [historyEnabled, setHistoryEnabled] = useState(false);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);

  useEffect(() => {
    if (!input.trim()) {
      setValidation(null);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setValidation(validateJSON(input));
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [input]);

  useEffect(() => {
    if (!historyEnabled) return;
    setHistoryItems(loadHistory());
  }, [historyEnabled]);

  useEffect(() => {
    if (!historyEnabled) return;
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(historyItems.slice(0, MAX_HISTORY_ITEMS)));
  }, [historyEnabled, historyItems]);

  const parseTarget = output.trim() ? output : input;
  const parsedTarget = useMemo(() => {
    const result = parseJSON(parseTarget);
    return result.ok ? result.parsed : undefined;
  }, [parseTarget]);

  const stats = useMemo(() => {
    if (parsedTarget === undefined) return undefined;
    return analyzeJSON(parsedTarget, parseTarget);
  }, [parsedTarget, parseTarget]);

  const tableData = useMemo(() => jsonToTableData(parsedTarget), [parsedTarget]);
  const error = validationMessage(validation);
  const autoFormattedOutput = useMemo(() => {
    if (output || !input.trim()) return "";
    const result = formatJSON(input, indent, sortKeys);
    return result.ok && result.output ? result.output : "";
  }, [input, indent, sortKeys, output]);
  const outputForCopy = output || autoFormattedOutput;
  const isLiveFormattedPreview = !output && Boolean(autoFormattedOutput);
  const inputLines = input ? input.split("\n").length : 0;
  const outputLines = outputForCopy ? outputForCopy.split("\n").length : 0;

  function handleInputChange(nextValue: string) {
    setInput(nextValue);
    setOutput("");
  }

  function saveToHistory(value: string) {
    if (!historyEnabled || !value.trim()) return;
    setHistoryItems((items) => {
      const nextItem: HistoryItem = {
        id: `${Date.now()}`,
        title: makeHistoryTitle(value),
        value,
        createdAt: new Date().toISOString(),
      };
      const deduped = items.filter((item) => item.value !== value);
      return [nextItem, ...deduped].slice(0, MAX_HISTORY_ITEMS);
    });
  }

  function handleResult(action: JsonAction, value: string) {
    const result = action === "minify"
      ? minifyJSON(value, sortKeys)
      : formatJSON(value, indent, action === "sort" ? true : sortKeys);

    setValidation(result.validation);

    if (!result.ok || !result.output) {
      setOutput("");
      setNotice({
        tone: "danger",
        title: "Invalid JSON",
        message: validationMessage(result.validation) || "The input could not be parsed.",
      });
      setActiveView("text");
      return;
    }

    setOutput(result.output);
    saveToHistory(result.output);
    setActiveView("text");
    setNotice({
      tone: "success",
      title: action === "minify" ? "Minified successfully" : action === "sort" ? "Sorted successfully" : "Formatted successfully",
      message: action === "sort" ? "All object keys were sorted alphabetically without changing values." : "The JSON parsed successfully and the output is ready to copy or download.",
    });
  }

  function runAction(action: JsonAction) {
    if (action === "validate") {
      const result = validateJSON(input);
      setValidation(result);
      if (result.ok) {
        saveToHistory(input.trim());
        setNotice({
          tone: "success",
          title: "Valid JSON",
          message: "The input parsed successfully. Use Tree, Table, or Stats to inspect the structure.",
        });
        setActiveView("stats");
      } else {
        setNotice({
          tone: "danger",
          title: "Invalid JSON",
          message: validationMessage(result) || "The input could not be parsed.",
        });
        inputEditorRef.current?.focusLine("line" in result ? result.line : undefined, "col" in result ? result.col : undefined);
      }
      return;
    }

    if (action === "fix") {
      const result = repairLooseJSON(input, indent, sortKeys);
      setValidation(result.validation);
      if (!result.ok || !result.output) {
        setOutput("");
        setNotice({
          tone: "danger",
          title: "Could not repair this JSON",
          message: validationMessage(result.validation) || "The repair helper fixed simple issues only. Please review the syntax manually.",
        });
        return;
      }
      setOutput(result.output);
      saveToHistory(result.output);
      setActiveView("text");
      setNotice({
        tone: result.changed ? "success" : "warning",
        title: result.changed ? "Repair completed" : "Already valid or no safe repair found",
        message: result.changes.length ? result.changes.join(" ") : "No safe automatic changes were needed before formatting.",
      });
      return;
    }

    handleResult(action, input);
  }

  async function handleFile(file?: File) {
    if (!file) return;
    const content = await file.text();
    setInput(content);
    setOutput("");
    setNotice({
      tone: "info",
      title: "File loaded",
      message: `${file.name} was loaded locally in your browser. Run Format, Validate, or Tree view next.`,
    });
  }

  function handleFileInput(event: ChangeEvent<HTMLInputElement>) {
    void handleFile(event.target.files?.[0]);
    event.target.value = "";
  }

  function clearAll() {
    setInput("");
    setOutput("");
    setValidation(null);
    setActiveView("text");
    setNotice({
      tone: "info",
      title: "Workspace cleared",
      message: "Paste JSON or load a sample to start again.",
    });
  }

  function loadSample(sample: "api" | "table") {
    const value = sample === "table" ? TABLE_SAMPLE_JSON : SAMPLE_JSON;
    setInput(value);
    setOutput("");
    setValidation({ ok: true });
    setActiveView(sample === "table" ? "table" : "text");
    setNotice({
      tone: "info",
      title: sample === "table" ? "Table sample loaded" : "API sample loaded",
      message: "The sample is loaded locally. Try Format, Sort keys, Tree, Table, or Stats.",
    });
  }

  function replaceInputWithOutput() {
    if (!output) return;
    setInput(output);
    setOutput("");
    setNotice({
      tone: "success",
      title: "Input replaced",
      message: "The generated output is now your input, ready for another operation.",
    });
  }

  const wrapperClass = isFullscreen
    ? "fixed inset-3 z-50 overflow-auto rounded-[var(--radius-xl)] border border-[var(--color-border-default)] bg-[var(--color-surface-page)] p-3 shadow-2xl sm:inset-6 sm:p-5"
    : "space-y-5";

  return (
    <div className={wrapperClass}>
      <input ref={fileInputRef} type="file" accept=".json,application/json,text/json,text/plain" onChange={handleFileInput} className="sr-only" />

      <section
        className={cn(
          "overflow-hidden rounded-[var(--radius-xl)] border bg-[var(--color-surface-overlay)] shadow-[var(--shadow-card)]",
          isDragging ? "border-[var(--color-primary)] ring-4 ring-[var(--color-primary-soft)]" : "border-[var(--color-border-default)]",
        )}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          void handleFile(event.dataTransfer.files?.[0]);
        }}
      >
        <div className="border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80 p-4 sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="accent">JSON Studio</Badge>
                <StatusPill validation={validation} />
                {sortKeys ? <Badge variant="outline">Sort keys on</Badge> : null}
              </div>
              <h2 className="mt-3 text-2xl font-black tracking-[-0.04em] text-[var(--color-text-primary)] sm:text-3xl">
                Format, validate, repair, and inspect JSON
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-secondary)]">
                A browser-only JSON workspace with live validation, line numbers, syntax highlighting, tree/table views, stats, drag-and-drop upload, and safe repair for common syntax mistakes.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="secondary" leftIcon={<Upload className="h-4 w-4" />} onClick={() => fileInputRef.current?.click()}>
                Upload JSON
              </Button>
              <Button size="sm" variant="ghost" leftIcon={isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />} onClick={() => setIsFullscreen((value) => !value)}>
                {isFullscreen ? "Exit full" : "Fullscreen"}
              </Button>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-3 shadow-[var(--shadow-xs)] lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" onClick={() => runAction("format")} leftIcon={<FileJson2 className="h-4 w-4" />}>
                Format
              </Button>
              <Button size="sm" variant="secondary" onClick={() => runAction("minify")} leftIcon={<PanelTopOpen className="h-4 w-4" />}>
                Minify
              </Button>
              <Button size="sm" variant="secondary" onClick={() => runAction("validate")} leftIcon={<ClipboardCheck className="h-4 w-4" />}>
                Validate
              </Button>
              <Button size="sm" variant="soft" onClick={() => runAction("fix")} leftIcon={<Wand2 className="h-4 w-4" />}>
                Fix JSON
              </Button>
              <Button size="sm" variant="outline" onClick={() => runAction("sort")} leftIcon={<Database className="h-4 w-4" />}>
                Sort keys
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select
                size="sm"
                width="short"
                value={String(indent)}
                onChange={(event) => setIndent(event.target.value === "tab" ? "tab" : Number(event.target.value) as IndentOption)}
                aria-label="Indent size"
              >
                <option value="2">2 spaces</option>
                <option value="4">4 spaces</option>
                <option value="tab">Tabs</option>
              </Select>
              <label className="inline-flex min-h-8 cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-control-bg)] px-3 text-xs font-semibold text-[var(--color-text-secondary)] shadow-[var(--shadow-xs)]">
                <input type="checkbox" checked={sortKeys} onChange={(event) => setSortKeys(event.target.checked)} className="h-3.5 w-3.5 accent-[var(--color-primary)]" />
                Sort on format
              </label>
              <CopyButton text={outputForCopy} disabled={!outputForCopy} size="sm" variant="secondary">
                Copy
              </CopyButton>
              <Button size="sm" variant="secondary" disabled={!outputForCopy} leftIcon={<Download className="h-4 w-4" />} onClick={() => downloadText("formatted.json", outputForCopy, "application/json;charset=utf-8")}>
                Download
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:p-5">
          <div className="min-w-0 space-y-3">
            <div className="min-h-[88px] space-y-3">
              <div>
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Input JSON</h3>
                <p className="text-xs text-[var(--color-text-tertiary)]">Paste, edit, or drop a .json file here.</p>
              </div>
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <Button size="sm" variant="secondary" onClick={() => loadSample("api")}>API sample</Button>
                <Button size="sm" variant="secondary" onClick={() => loadSample("table")}>Table sample</Button>
                {error ? (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => {
                      const validationError = validation?.ok === false ? validation : null;
                      inputEditorRef.current?.focusLine(validationError?.line, validationError?.col);
                    }}
                  >
                    Jump to error
                  </Button>
                ) : null}
                <Button size="sm" variant="ghost" leftIcon={<RotateCcw className="h-4 w-4" />} onClick={clearAll}>Clear</Button>
              </div>
            </div>

            <JsonCodeEditor
              ref={inputEditorRef}
              ariaLabel="Input JSON editor"
              placeholder="Paste JSON here, or drop a .json file anywhere on this card..."
              value={input}
              onChange={handleInputChange}
              height={isFullscreen ? "68vh" : "520px"}
              errorLine={validation && "line" in validation ? validation.line : undefined}
              errorColumn={validation && "col" in validation ? validation.col : undefined}
            />

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <WorkbenchStat label="Characters" value={input.length.toLocaleString()} />
              <WorkbenchStat label="Lines" value={inputLines.toLocaleString()} />
              <WorkbenchStat label="Status" value={validation?.ok ? "Valid" : validation ? "Invalid" : "Ready"} />
              <WorkbenchStat label="Privacy" value="Local" />
            </div>
          </div>

          <div className="min-w-0 space-y-3">
            <div className="min-h-[88px] space-y-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Output & Inspector</h3>
                  {isLiveFormattedPreview ? <Badge variant="info">Live formatted preview</Badge> : null}
                </div>
                <p className="text-xs text-[var(--color-text-tertiary)]">Switch between text, tree, table, and stats views.</p>
              </div>
              <OutputViewTabs value={activeView} onChange={setActiveView} />
            </div>

            {activeView === "text" ? (
              <JsonCodeEditor
                ariaLabel="Output JSON editor"
                placeholder="Formatted, minified, or repaired JSON will appear here..."
                value={outputForCopy}
                readOnly
                height={isFullscreen ? "68vh" : "520px"}
              />
            ) : null}
            {activeView === "tree" ? <JsonTreeView value={parsedTarget as JsonValue | undefined} /> : null}
            {activeView === "table" ? <JsonTableView table={tableData} /> : null}
            {activeView === "stats" ? <JsonStatsPanel stats={stats} /> : null}

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <WorkbenchStat label="Characters" value={outputForCopy.length.toLocaleString()} />
              <WorkbenchStat label="Lines" value={outputLines.toLocaleString()} />
              <WorkbenchStat label="Root" value={stats?.rootType ?? "—"} />
              <WorkbenchStat label="Depth" value={stats?.depth ?? "—"} />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="secondary" disabled={!output} onClick={replaceInputWithOutput}>
                Replace input with output
              </Button>
              <Button size="sm" variant="ghost" disabled={!output} onClick={() => setOutput("")}>
                Clear output
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <NoticePanel notice={notice} />

        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-4 shadow-[var(--shadow-sm)]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-[var(--color-text-tertiary)]" aria-hidden />
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Local history</h3>
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-[var(--color-text-secondary)]">
              <input type="checkbox" checked={historyEnabled} onChange={(event) => setHistoryEnabled(event.target.checked)} className="h-3.5 w-3.5 accent-[var(--color-primary)]" />
              Enable
            </label>
          </div>
          <p className="mt-2 text-xs leading-5 text-[var(--color-text-tertiary)]">
            Optional. Saved only in this browser with localStorage, never uploaded.
          </p>
          {historyEnabled && historyItems.length ? (
            <div className="mt-3 space-y-2">
              {historyItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setInput(item.value);
                    setOutput("");
                    setNotice({ tone: "info", title: "History restored", message: item.title });
                  }}
                  className="w-full rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-3 py-2 text-left text-xs text-[var(--color-text-secondary)] transition hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-subtle)]"
                >
                  <span className="block font-bold text-[var(--color-text-primary)]">{item.title}</span>
                  <span className="mt-0.5 block text-[var(--color-text-tertiary)]">{new Date(item.createdAt).toLocaleString()}</span>
                </button>
              ))}
            </div>
          ) : null}
          {historyEnabled && !historyItems.length ? (
            <div className="mt-3 rounded-[var(--radius-sm)] border border-dashed border-[var(--color-border-default)] p-3 text-xs leading-5 text-[var(--color-text-tertiary)]">
              Format or validate valid JSON to add recent snippets here.
            </div>
          ) : null}
        </section>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-4 shadow-[var(--shadow-sm)]">
          <FileJson2 className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
          <h3 className="mt-3 text-sm font-bold text-[var(--color-text-primary)]">Readable formatting</h3>
          <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">Format with 2 spaces, 4 spaces, tabs, and optional sorted keys.</p>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-4 shadow-[var(--shadow-sm)]">
          <Wand2 className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
          <h3 className="mt-3 text-sm font-bold text-[var(--color-text-primary)]">Safe repair</h3>
          <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">Fix common issues like comments, single quotes, unquoted keys, and trailing commas.</p>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-4 shadow-[var(--shadow-sm)]">
          <ListTree className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
          <h3 className="mt-3 text-sm font-bold text-[var(--color-text-primary)]">Tree inspector</h3>
          <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">Browse nested objects and arrays without losing your place.</p>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-4 shadow-[var(--shadow-sm)]">
          <Table2 className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
          <h3 className="mt-3 text-sm font-bold text-[var(--color-text-primary)]">Table preview</h3>
          <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">Turn arrays of objects into a quick, scrollable data table.</p>
        </div>
      </div>
    </div>
  );
}
