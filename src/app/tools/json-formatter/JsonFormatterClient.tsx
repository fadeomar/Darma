"use client";

import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import JSZip from "jszip";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Archive,
  Braces,
  Database,
  Download,
  FileCode2,
  FileJson2,
  FileSpreadsheet,
  Gauge,
  History,
  Info,
  ListTree,
  Maximize2,
  Minimize2,
  PanelTopOpen,
  RotateCcw,
  Settings2,
  ShieldCheck,
  Sparkles,
  Table2,
  Upload,
  Wand2,
} from "lucide-react";
import { Badge, Button, CopyButton, Select } from "@/components/ui";
import { ToolMobileActions } from "@/features/tools/components";
import { downloadText } from "../_shared/clientUtils";
import { downloadBlobFile } from "@/features/tools/export/downloadBlob";
import { cn } from "@/lib/cn";
import JsonCodeEditor, { type JsonCodeEditorHandle } from "./JsonCodeEditor";
import JsonStatsPanel from "./JsonStatsPanel";
import JsonTableView from "./JsonTableView";
import JsonTreeView from "./JsonTreeView";
import {
  JSON_FORMATTER_PRESETS,
  MAX_JSON_IMPORT_BYTES,
  buildJsonFormatterAudit,
  buildJsonFormatterJavaScriptModule,
  buildJsonFormatterMarkdownReport,
  buildJsonFormatterMetricsCsv,
  buildJsonFormatterProductionFiles,
  buildJsonFormatterSnapshot,
  buildJsonFormatterSummaryCards,
  buildJsonFormatterTypeScriptModule,
  createJsonFormatterProfile,
  findUnsafeIntegerLiterals,
  parseJsonFormatterProfile,
  summarizeJsonFormatterAudit,
  type JsonAuditCheck,
  type JsonFormatterOperation,
  type JsonFormatterSettings,
  type JsonFormatterView,
} from "./studio";
import {
  analyzeJSON,
  escapeJSONString,
  formatJSON,
  jsonToTableData,
  minifyJSON,
  parseJSON,
  repairLooseJSON,
  SAMPLE_JSON,
  TABLE_SAMPLE_JSON,
  unescapeJSONString,
  validateJSON,
  type IndentOption,
  type JsonValue,
  type ValidationResult,
} from "./utils";

type JsonAction = "format" | "minify" | "validate" | "fix" | "sort" | "escape" | "unescape";
type JsonView = JsonFormatterView;
type TreeExpansion = "auto" | "expanded" | "collapsed";

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
              "h-8 min-w-[76px] flex-1 whitespace-nowrap rounded-[calc(var(--radius-md)-5px)] px-3 text-center text-xs font-bold uppercase tracking-[0.04em] transition duration-[var(--duration-fast)] sm:flex-none",
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
      <p className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{label}</p>
      <p className="mt-1 text-lg font-black tracking-[-0.03em] text-[var(--color-text-primary)]">{value}</p>
    </div>
  );
}

function SummaryCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="min-w-0 rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-4 shadow-[var(--shadow-sm)]">
      <p className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{label}</p>
      <p className="mt-2 truncate text-xl font-black tracking-[-0.04em] text-[var(--color-text-primary)]">{value}</p>
      <p className="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">{detail}</p>
    </div>
  );
}

const AUDIT_BADGE_VARIANT: Record<JsonAuditCheck["severity"], "danger" | "warning" | "info" | "success"> = {
  error: "danger",
  warning: "warning",
  info: "info",
  pass: "success",
};

function ProductionAudit({ checks }: { checks: JsonAuditCheck[] }) {
  const summary = summarizeJsonFormatterAudit(checks);
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-4 shadow-[var(--shadow-sm)] sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[var(--color-primary-text-strong)]" aria-hidden />
            <h3 className="text-base font-black text-[var(--color-text-primary)]">4. Production checks</h3>
          </div>
          <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">
            Syntax, precision, payload size, risky keys, privacy, and downstream contract reminders.
          </p>
        </div>
        <Badge variant={summary.status === "Blocked" ? "danger" : summary.status === "Review" ? "warning" : "success"}>
          {summary.status}
        </Badge>
      </div>

      <div className="mt-4 grid gap-2 lg:grid-cols-2">
        {checks.map((check) => {
          const Icon = check.severity === "error" || check.severity === "warning"
            ? AlertTriangle
            : check.severity === "pass"
              ? CheckCircle2
              : Info;
          return (
            <div key={check.id} className="flex min-w-0 items-start gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-3">
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-text-tertiary)]" aria-hidden />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-bold text-[var(--color-text-primary)]">{check.title}</p>
                  <Badge variant={AUDIT_BADGE_VARIANT[check.severity]}>{check.severity}</Badge>
                </div>
                <p className="mt-1 break-words text-xs leading-5 text-[var(--color-text-secondary)]">{check.message}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
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
  const [treeExpansion, setTreeExpansion] = useState<TreeExpansion>("auto");
  const [lastOperation, setLastOperation] = useState<JsonFormatterOperation>("preview");
  const [repairChanges, setRepairChanges] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);

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

  const unsafeInputIntegers = useMemo(() => findUnsafeIntegerLiterals(input), [input]);
  const stats = useMemo(() => {
    if (parsedTarget === undefined) return undefined;
    return analyzeJSON(parsedTarget, parseTarget);
  }, [parsedTarget, parseTarget]);

  const tableData = useMemo(() => jsonToTableData(parsedTarget), [parsedTarget]);
  const error = validationMessage(validation);
  const autoFormattedOutput = useMemo(() => {
    if (output || !input.trim() || unsafeInputIntegers.length) return "";
    const result = formatJSON(input, indent, sortKeys);
    return result.ok && result.output ? result.output : "";
  }, [input, indent, sortKeys, output, unsafeInputIntegers.length]);
  const outputForCopy = output || autoFormattedOutput;
  const isLiveFormattedPreview = !output && Boolean(autoFormattedOutput);
  const inputLines = input ? input.split("\n").length : 0;
  const outputLines = outputForCopy ? outputForCopy.split("\n").length : 0;
  const formatterSettings = useMemo<JsonFormatterSettings>(() => ({
    indent,
    sortKeys,
    preferredView: activeView,
  }), [activeView, indent, sortKeys]);
  const productionSnapshot = useMemo(() => buildJsonFormatterSnapshot({
    input,
    resultText: outputForCopy,
    settings: formatterSettings,
    operation: lastOperation,
    repairChanges,
    historyEnabled,
  }), [formatterSettings, historyEnabled, input, lastOperation, outputForCopy, repairChanges]);
  const productionChecks = useMemo(
    () => buildJsonFormatterAudit(productionSnapshot),
    [productionSnapshot],
  );
  const summaryCards = useMemo(
    () => buildJsonFormatterSummaryCards(productionSnapshot, productionChecks),
    [productionChecks, productionSnapshot],
  );
  const payloadExportReady = productionSnapshot.valid && productionSnapshot.unsafeIntegerLiterals.length === 0;

  function handleInputChange(nextValue: string) {
    setInput(nextValue);
    setOutput("");
    setLastOperation("preview");
    setRepairChanges([]);
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
    if (findUnsafeIntegerLiterals(value).length) {
      setOutput("");
      setLastOperation(action === "sort" ? "sort" : action === "fix" ? "repair" : action);
      setNotice({
        tone: "danger",
        title: "Unsafe integer precision",
        message: "Formatting or minifying this payload through JSON.parse would change at least one integer. Encode exact large identifiers as strings first.",
      });
      return;
    }
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
    setLastOperation(action === "sort" ? "sort" : action === "fix" ? "repair" : action);
    setRepairChanges([]);
    saveToHistory(result.output);
    setActiveView("text");
    setNotice({
      tone: "success",
      title: action === "minify" ? "Minified successfully" : action === "sort" ? "Sorted successfully" : "Formatted successfully",
      message: action === "sort" ? "All object keys were sorted alphabetically without changing values." : "The JSON parsed successfully and the output is ready to copy or download.",
    });
  }

  function handleStringResult(action: "escape" | "unescape") {
    const result = action === "escape" ? escapeJSONString(input) : unescapeJSONString(input);
    setValidation(result.validation);

    if (!result.ok || result.output === undefined) {
      setOutput("");
      setNotice({
        tone: "danger",
        title: action === "escape" ? "Could not escape string" : "Could not unescape string",
        message: validationMessage(result.validation) || "Check the input and try again.",
      });
      setActiveView("text");
      return;
    }

    setOutput(result.output);
    setLastOperation(action);
    setRepairChanges([]);
    saveToHistory(result.output);
    setActiveView("text");
    setNotice({
      tone: "success",
      title: action === "escape" ? "String escaped" : "String unescaped",
      message: action === "escape"
        ? "The input was converted into a JSON-safe string literal."
        : "The JSON string literal was converted back to plain text.",
    });
  }

  function runAction(action: JsonAction) {
    if (action === "escape" || action === "unescape") {
      handleStringResult(action);
      return;
    }

    if (action === "validate") {
      const result = validateJSON(input);
      setValidation(result);
      setLastOperation("validate");
      setRepairChanges([]);
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
      if (unsafeInputIntegers.length) {
        setOutput("");
        setLastOperation("repair");
        setNotice({
          tone: "danger",
          title: "Repair paused to protect integer precision",
          message: "Convert exact integers beyond JavaScript's safe range to quoted strings before automatic repair.",
        });
        return;
      }
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
      setLastOperation("repair");
      setRepairChanges(result.changes);
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
    if (file.size > MAX_JSON_IMPORT_BYTES) {
      setNotice({
        tone: "danger",
        title: "File is too large",
        message: "The browser workbench accepts JSON files up to 5 MB. Use a streaming or command-line tool for larger payloads.",
      });
      return;
    }

    const content = await file.text();
    if (!content.trim()) {
      setNotice({
        tone: "danger",
        title: "File is empty",
        message: "Choose a JSON payload or a Darma JSON Formatter profile that contains data.",
      });
      return;
    }

    let parsedFile: { schema?: unknown } | null = null;
    try {
      parsedFile = JSON.parse(content) as { schema?: unknown };
    } catch {
      // Invalid payload JSON is still useful input for validation and repair.
    }

    if (parsedFile && typeof parsedFile === "object" && parsedFile.schema === "darma.json-formatter-profile") {
      try {
        const imported = parseJsonFormatterProfile(content);
        setIndent(imported.indent);
        setSortKeys(imported.sortKeys);
        setActiveView(imported.preferredView);
        setNotice({
          tone: "success",
          title: "Formatter profile imported",
          message: `${file.name} updated indentation, key sorting, and the preferred inspector view without replacing your payload.`,
        });
      } catch (error) {
        setNotice({
          tone: "danger",
          title: "Formatter profile could not be imported",
          message: error instanceof Error ? error.message : "The selected profile is not supported.",
        });
      }
      return;
    }

    setInput(content.replace(/^\uFEFF/, ""));
    setOutput("");
    setLastOperation("preview");
    setRepairChanges([]);
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
    setLastOperation("preview");
    setRepairChanges([]);
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
    setLastOperation("preview");
    setRepairChanges([]);
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
    setLastOperation("preview");
    setRepairChanges([]);
    setNotice({
      tone: "success",
      title: "Input replaced",
      message: "The generated output is now your input, ready for another operation.",
    });
  }

  function applyPreset(preset: (typeof JSON_FORMATTER_PRESETS)[number]) {
    setIndent(preset.settings.indent);
    setSortKeys(preset.settings.sortKeys);
    setActiveView(preset.settings.preferredView);
    setRepairChanges([]);

    if (!input.trim()) {
      setNotice({
        tone: "info",
        title: `${preset.title} preset selected`,
        message: "The formatter settings are ready. Paste or upload JSON to apply them.",
      });
      return;
    }

    if (unsafeInputIntegers.length) {
      setOutput("");
      setNotice({
        tone: "danger",
        title: "Preset paused to protect integer precision",
        message: "Convert exact large integer identifiers to strings before formatting or minifying.",
      });
      return;
    }

    const result = preset.operation === "minify"
      ? minifyJSON(input, preset.settings.sortKeys)
      : formatJSON(input, preset.settings.indent, preset.operation === "sort" || preset.settings.sortKeys);
    setValidation(result.validation);
    if (!result.ok || !result.output) {
      setOutput("");
      setNotice({
        tone: "danger",
        title: "Preset could not be applied",
        message: validationMessage(result.validation) || "Resolve the JSON syntax error first.",
      });
      return;
    }

    setOutput(result.output);
    setLastOperation(preset.operation);
    saveToHistory(result.output);
    setNotice({
      tone: "success",
      title: `${preset.title} applied`,
      message: preset.description,
    });
  }

  function downloadProfile() {
    downloadText(
      "darma-json-formatter-profile.json",
      `${JSON.stringify(createJsonFormatterProfile(formatterSettings), null, 2)}\n`,
      "application/json;charset=utf-8",
    );
  }

  function downloadReport() {
    downloadText(
      "darma-json-audit.md",
      buildJsonFormatterMarkdownReport(productionSnapshot),
      "text/markdown;charset=utf-8",
    );
  }

  function downloadMetrics() {
    downloadText(
      "darma-json-metrics.csv",
      buildJsonFormatterMetricsCsv(productionSnapshot),
      "text/csv;charset=utf-8",
    );
  }

  function downloadJavaScriptModule() {
    try {
      downloadText(
        "json-data.js",
        buildJsonFormatterJavaScriptModule(productionSnapshot),
        "text/javascript;charset=utf-8",
      );
    } catch (error) {
      setNotice({ tone: "danger", title: "JavaScript export unavailable", message: error instanceof Error ? error.message : "Validate the JSON first." });
    }
  }

  function downloadTypeScriptModule() {
    try {
      downloadText(
        "json-data.ts",
        buildJsonFormatterTypeScriptModule(productionSnapshot),
        "text/typescript;charset=utf-8",
      );
    } catch (error) {
      setNotice({ tone: "danger", title: "TypeScript export unavailable", message: error instanceof Error ? error.message : "Validate the JSON first." });
    }
  }

  async function downloadProductionPack() {
    setIsExporting(true);
    try {
      const files = buildJsonFormatterProductionFiles(productionSnapshot);
      const zip = new JSZip();
      Object.entries(files).forEach(([filename, content]) => zip.file(filename, content));
      const blob = await zip.generateAsync({ type: "blob" });
      downloadBlobFile({ blob, filename: "darma-json-formatter-production-pack.zip" });
      setNotice({
        tone: "success",
        title: "Production pack created",
        message: "The ZIP contains formatted and minified JSON, JavaScript and TypeScript modules, a settings-only profile, an audit report, and metrics CSV.",
      });
    } catch (error) {
      setNotice({
        tone: "danger",
        title: "Production pack unavailable",
        message: error instanceof Error ? error.message : "Validate the JSON and try again.",
      });
    } finally {
      setIsExporting(false);
    }
  }

  const wrapperClass = isFullscreen
    ? "fixed inset-3 z-50 overflow-auto rounded-[var(--radius-xl)] border border-[var(--color-border-default)] bg-[var(--color-surface-page)] p-3 shadow-2xl sm:inset-6 sm:p-5"
    : "space-y-5";

  return (
    <div className={wrapperClass}>
      <input ref={fileInputRef} type="file" accept=".json,application/json,text/json,text/plain" onChange={handleFileInput} className="sr-only" />

      <section
        className={cn(
          "overflow-hidden rounded-[var(--radius-xl)] border bg-[var(--color-tool-workspace-bg)] shadow-[var(--shadow-tool-preview)]",
          isDragging ? "border-[var(--color-primary)] ring-4 ring-[var(--color-primary-soft)]" : "border-[var(--color-border-strong)]",
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
        <div className="border-b border-[var(--color-tool-controls-border)] bg-[var(--color-tool-controls-header)] p-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="accent">JSON Studio</Badge>
                <Badge variant="success">Local only</Badge>
                <StatusPill validation={validation} />
                {sortKeys ? <Badge variant="outline">Sort keys on</Badge> : null}
              </div>
              <h2 className="mt-3 text-xl font-black tracking-[-0.035em] text-[var(--color-text-primary)] sm:text-2xl">
                Paste JSON, transform it, then inspect the result
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-secondary)]">
                Keep the payload in view while you format, validate, repair, sort, and inspect it across text, tree, table, and stats views — entirely in your browser.
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

          <div className="mt-5 flex flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-3 shadow-[var(--shadow-xs)] lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="mb-2 font-mono text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Transform</p>
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
              <Button size="sm" variant="ghost" onClick={() => runAction("escape")}>
                Escape string
              </Button>
              <Button size="sm" variant="ghost" onClick={() => runAction("unescape")}>
                Unescape string
              </Button>
              </div>
            </div>

            <div className="min-w-0">
              <p className="mb-2 font-mono text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Format &amp; output</p>
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

          <div className="mt-3 flex flex-col gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-3 lg:flex-row lg:items-center">
            <div className="flex items-center gap-2 lg:mr-2">
              <Settings2 className="h-4 w-4 text-[var(--color-text-tertiary)]" aria-hidden />
              <p className="text-xs font-bold uppercase tracking-[0.06em] text-[var(--color-text-secondary)]">Practical presets</p>
            </div>
            <div className="flex min-w-0 flex-wrap gap-2">
              {JSON_FORMATTER_PRESETS.map((preset) => (
                <Button key={preset.id} size="sm" variant="ghost" onClick={() => applyPreset(preset)} title={preset.description}>
                  {preset.title}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
          <div data-tool-region="input" className="min-w-0 space-y-3 rounded-[var(--radius-lg)] border border-[var(--color-tool-input-border)] bg-[var(--color-tool-input-bg)] p-3 shadow-[var(--shadow-tool-controls)]">
            <div className="space-y-3">
              <div>
                <span className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Input</span>
                <h3 className="mt-1 text-base font-black text-[var(--color-text-primary)]">1. Input JSON</h3>
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
              height={isFullscreen ? "68vh" : "440px"}
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

          <div id="json-result" data-tool-region="output" className="min-w-0 scroll-mt-28 space-y-3 rounded-[var(--radius-lg)] border border-[var(--color-tool-output-border)] bg-[var(--color-tool-output-bg)] p-3 shadow-[var(--shadow-tool-result)]">
            <div className="space-y-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Output</span>
                  <h3 className="text-base font-black text-[var(--color-text-primary)]">2. Output & Inspector</h3>
                  {isLiveFormattedPreview ? <Badge variant="info">Live formatted preview</Badge> : null}
                </div>
                <p className="text-xs text-[var(--color-text-tertiary)]">Switch between text, tree, table, and stats views.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <OutputViewTabs value={activeView} onChange={setActiveView} />
                {activeView === "tree" ? (
                  <div className="flex flex-wrap items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setTreeExpansion("expanded")}>Expand all</Button>
                    <Button size="sm" variant="ghost" onClick={() => setTreeExpansion("collapsed")}>Collapse all</Button>
                    <Button size="sm" variant="ghost" onClick={() => setTreeExpansion("auto")}>Auto</Button>
                  </div>
                ) : null}
              </div>
            </div>

            {activeView === "text" ? (
              <JsonCodeEditor
                ariaLabel="Output JSON editor"
                placeholder="Formatted, minified, or repaired JSON will appear here..."
                value={outputForCopy}
                readOnly
                height={isFullscreen ? "68vh" : "440px"}
              />
            ) : null}
            {activeView === "tree" ? <JsonTreeView value={parsedTarget as JsonValue | undefined} expansion={treeExpansion} /> : null}
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
              <Button size="sm" variant="ghost" disabled={!output} onClick={() => {
                setOutput("");
                setLastOperation("preview");
                setRepairChanges([]);
              }}>
                Clear output
              </Button>
            </div>
          </div>
        </div>
      </section>

      <ToolMobileActions>
        <Button onClick={() => runAction("format")} leftIcon={<FileJson2 className="h-4 w-4" />}>Format JSON</Button>
        <a href="#json-result" className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] px-4 text-sm font-bold text-[var(--color-text-primary)]">View output</a>
      </ToolMobileActions>

      <section aria-labelledby="json-payload-summary" className="space-y-3">
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Step 3</p>
          <h3 id="json-payload-summary" className="mt-1 text-base font-black text-[var(--color-text-primary)]">Payload summary</h3>
          <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">Review the result after transforming or inspecting the payload, not before you start.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="JSON production summary">
          {summaryCards.map((card) => <SummaryCard key={card.label} {...card} />)}
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.55fr)]">
        <ProductionAudit checks={productionChecks} />

        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-4 shadow-[var(--shadow-sm)] sm:p-5">
          <div className="flex items-center gap-2">
            <Archive className="h-5 w-5 text-[var(--color-primary-text-strong)]" aria-hidden />
            <h3 className="text-base font-black text-[var(--color-text-primary)]">5. Production exports</h3>
          </div>
          <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">
            Export the payload for developers, or share a settings-only profile and metrics-only audit without JSON values.
          </p>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            <Button size="sm" variant="secondary" leftIcon={<Settings2 className="h-4 w-4" />} onClick={downloadProfile}>
              Profile JSON
            </Button>
            <Button size="sm" variant="secondary" leftIcon={<FileSpreadsheet className="h-4 w-4" />} onClick={downloadMetrics}>
              Metrics CSV
            </Button>
            <Button size="sm" variant="secondary" leftIcon={<Gauge className="h-4 w-4" />} onClick={downloadReport}>
              Audit Markdown
            </Button>
            <Button size="sm" variant="secondary" disabled={!payloadExportReady} leftIcon={<FileCode2 className="h-4 w-4" />} onClick={downloadJavaScriptModule}>
              JavaScript
            </Button>
            <Button size="sm" variant="secondary" disabled={!payloadExportReady} leftIcon={<Braces className="h-4 w-4" />} onClick={downloadTypeScriptModule}>
              TypeScript
            </Button>
            <Button size="sm" disabled={!payloadExportReady || isExporting} leftIcon={<Archive className="h-4 w-4" />} onClick={() => void downloadProductionPack()}>
              {isExporting ? "Building ZIP…" : "ZIP pack"}
            </Button>
          </div>

          <div className="mt-4 rounded-[var(--radius-md)] border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] p-3 text-xs leading-5 text-[var(--color-warning-text)]">
            The profile, audit, and metrics files exclude JSON values. JavaScript, TypeScript, formatted JSON, minified JSON, and the ZIP pack contain the current payload.
          </div>
        </section>
      </div>

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
                    setLastOperation("preview");
                    setRepairChanges([]);
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
          <FileJson2 className="h-5 w-5 text-[var(--color-primary-text-strong)]" aria-hidden />
          <h3 className="mt-3 text-sm font-bold text-[var(--color-text-primary)]">Readable formatting</h3>
          <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">Format with 2 spaces, 4 spaces, tabs, and optional sorted keys.</p>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-4 shadow-[var(--shadow-sm)]">
          <Wand2 className="h-5 w-5 text-[var(--color-primary-text-strong)]" aria-hidden />
          <h3 className="mt-3 text-sm font-bold text-[var(--color-text-primary)]">Safe repair</h3>
          <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">Fix common issues like comments, single quotes, unquoted keys, and trailing commas.</p>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-4 shadow-[var(--shadow-sm)]">
          <ListTree className="h-5 w-5 text-[var(--color-primary-text-strong)]" aria-hidden />
          <h3 className="mt-3 text-sm font-bold text-[var(--color-text-primary)]">Tree inspector</h3>
          <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">Browse nested objects and arrays without losing your place.</p>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-4 shadow-[var(--shadow-sm)]">
          <Table2 className="h-5 w-5 text-[var(--color-primary-text-strong)]" aria-hidden />
          <h3 className="mt-3 text-sm font-bold text-[var(--color-text-primary)]">Table preview</h3>
          <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">Turn arrays of objects into a quick, scrollable data table.</p>
        </div>
      </div>
    </div>
  );
}
