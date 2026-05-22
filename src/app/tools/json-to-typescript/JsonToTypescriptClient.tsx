"use client";

import { useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Download, FileCode2, RefreshCw, ShieldCheck, Sparkles, Trash2 } from "lucide-react";
import { Badge, Button, CopyButton, Field, Input, Select, Textarea } from "@/components/ui";
import { cn } from "@/lib/cn";
import { inferTypeScript, JSON_TO_TS_INPUT_LIMIT, parseJsonInput, toPascalCaseName } from "./infer";
import { DEFAULT_OPTIONS, JSON_EXAMPLES, OPTION_HELP, SAMPLE_JSON } from "./presets";
import type { ArrayHandling, InferOptions, JsonExample, NullHandling, OutputStyle } from "./types";

function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function ToggleButton({ enabled, children, onClick }: { enabled: boolean; children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={enabled}
      className={cn(
        "min-h-10 rounded-[var(--radius-sm)] border px-3 text-sm font-bold transition",
        enabled
          ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-text)]"
          : "border-[var(--color-border)] bg-[var(--color-surface-strong)] text-[var(--color-text-muted)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)]",
      )}
    >
      {children}
    </button>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-soft)] p-3">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--color-text-soft)]">{label}</p>
      <p className="mt-1 font-mono text-lg font-black text-[var(--color-text)]">{value}</p>
    </div>
  );
}

export default function JsonToTypescriptClient() {
  const [jsonInput, setJsonInput] = useState(SAMPLE_JSON);
  const [options, setOptions] = useState<InferOptions>(DEFAULT_OPTIONS);

  const parseResult = useMemo(() => parseJsonInput(jsonInput), [jsonInput]);
  const isTooLarge = jsonInput.length > JSON_TO_TS_INPUT_LIMIT;
  const generated = useMemo(() => {
    if (!parseResult.ok) return null;
    return inferTypeScript(parseResult.value, options);
  }, [options, parseResult]);

  const formattedJson = useMemo(() => {
    if (!parseResult.ok) return jsonInput;
    return JSON.stringify(parseResult.value, null, 2);
  }, [jsonInput, parseResult]);

  const output = generated?.code ?? "";
  const parseError = parseResult.ok ? null : parseResult.error;
  const lineColumn = !parseResult.ok && parseResult.line && parseResult.column ? ` Line ${parseResult.line}, column ${parseResult.column}.` : "";

  function updateOption<K extends keyof InferOptions>(key: K, value: InferOptions[K]) {
    setOptions((current) => ({ ...current, [key]: value }));
  }

  function handleInputChange(value: string) {
    setJsonInput(value.slice(0, JSON_TO_TS_INPUT_LIMIT + 1));
  }

  function loadExample(example: JsonExample) {
    setJsonInput(example.value);
    setOptions((current) => ({ ...current, rootName: example.rootName }));
  }

  function formatJson() {
    if (parseResult.ok) setJsonInput(JSON.stringify(parseResult.value, null, 2));
  }

  function clearAll() {
    setJsonInput("");
  }

  const rootNamePreview = toPascalCaseName(options.rootName || "Root");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-black text-[var(--color-text)]">JSON to TypeScript</h2>
            <Badge variant="success" className="gap-1">
              <ShieldCheck className="h-3 w-3" aria-hidden /> Browser-only
            </Badge>
            {parseResult.ok ? <Badge variant="success">Valid JSON</Badge> : <Badge variant="danger">Needs valid JSON</Badge>}
          </div>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--color-text-muted)]">
            Paste an API response, fixture, or config object and generate copy-ready TypeScript interfaces or types locally in your browser.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => loadExample(JSON_EXAMPLES[0])} leftIcon={<RefreshCw className="h-4 w-4" />}>
            Load sample
          </Button>
          <Button variant="secondary" onClick={formatJson} disabled={!parseResult.ok} leftIcon={<Sparkles className="h-4 w-4" />}>
            Format JSON
          </Button>
          <Button variant="secondary" onClick={clearAll} leftIcon={<Trash2 className="h-4 w-4" />}>
            Clear
          </Button>
          <CopyButton text={output} disabled={!output} variant="secondary">
            Copy TypeScript
          </CopyButton>
          <Button variant="secondary" onClick={() => downloadFile(`${rootNamePreview}.ts`, output, "text/typescript")} disabled={!output} leftIcon={<Download className="h-4 w-4" />}>
            Download .ts
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Root type name"
            description="Used for the top-level generated type. Names are normalized to PascalCase."
          >
            <Input value={options.rootName} onChange={(event) => updateOption("rootName", event.target.value)} placeholder="Root" />
          </Field>

          <Field label="Output style" description="Choose interface declarations or type aliases.">
            <Select value={options.outputStyle} onChange={(event) => updateOption("outputStyle", event.target.value as OutputStyle)}>
              <option value="interface">interface</option>
              <option value="type">type</option>
            </Select>
          </Field>

          <Field label="Null handling" description="Control whether null stays in unions or becomes optional.">
            <Select value={options.nullHandling} onChange={(event) => updateOption("nullHandling", event.target.value as NullHandling)}>
              <option value="include-null">Include null union</option>
              <option value="null-as-optional">Treat null as optional</option>
            </Select>
          </Field>

          <Field label="Array handling" description="Use all array items for safer inference or only the first item for quick samples.">
            <Select value={options.arrayHandling} onChange={(event) => updateOption("arrayHandling", event.target.value as ArrayHandling)}>
              <option value="all-items">Infer from all items</option>
              <option value="first-item">Infer from first item only</option>
            </Select>
          </Field>
        </div>

        <aside className="space-y-3">
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-soft)]">
            <h3 className="font-black text-[var(--color-text)]">Generator options</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              <ToggleButton enabled={options.exportTypes} onClick={() => updateOption("exportTypes", !options.exportTypes)}>
                export
              </ToggleButton>
              <ToggleButton enabled={options.optionalProperties} onClick={() => updateOption("optionalProperties", !options.optionalProperties)}>
                optional ?
              </ToggleButton>
              <ToggleButton enabled={options.readonlyProperties} onClick={() => updateOption("readonlyProperties", !options.readonlyProperties)}>
                readonly
              </ToggleButton>
              <ToggleButton enabled={options.useSemicolons} onClick={() => updateOption("useSemicolons", !options.useSemicolons)}>
                semicolons
              </ToggleButton>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Input" value={jsonInput.length.toLocaleString()} />
            <StatCard label="Output" value={output.length.toLocaleString()} />
          </div>
        </aside>
      </div>

      {isTooLarge ? (
        <div className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-900">
          JSON input is over the {JSON_TO_TS_INPUT_LIMIT.toLocaleString()} character limit. Shorten it to resume generation.
        </div>
      ) : null}

      {parseError ? (
        <div className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-900">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>{parseError}.{lineColumn}</span>
          </div>
        </div>
      ) : null}

      {generated?.warnings.length ? (
        <div className="grid gap-2">
          {generated.warnings.map((warning) => (
            <div key={warning} className="rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>{warning}</span>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="JSON input" description={`${jsonInput.length.toLocaleString()} / ${JSON_TO_TS_INPUT_LIMIT.toLocaleString()} characters`}>
          <Textarea
            value={jsonInput}
            onChange={(event) => handleInputChange(event.target.value)}
            placeholder="Paste JSON here..."
            className="min-h-[520px] font-mono text-xs leading-5"
            spellCheck={false}
          />
        </Field>

        <Field label="TypeScript output" description={output ? `Generated ${rootNamePreview} from the current JSON.` : "Output appears after valid JSON is entered."}>
          <pre className="min-h-[520px] overflow-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-slate-950 p-4 font-mono text-xs leading-5 text-slate-100 shadow-[var(--shadow-soft)]">
            {output || "// Generated TypeScript will appear here."}
          </pre>
        </Field>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-soft)]">
          <div className="flex items-center gap-2">
            <FileCode2 className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
            <h3 className="font-black text-[var(--color-text)]">Examples</h3>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {JSON_EXAMPLES.map((example) => (
              <button
                key={example.id}
                type="button"
                onClick={() => loadExample(example)}
                className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-3 text-left transition hover:border-[var(--color-border-strong)]"
              >
                <p className="text-sm font-black text-[var(--color-text)]">{example.label}</p>
                <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">{example.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-soft)]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
            <h3 className="font-black text-[var(--color-text)]">Inference notes</h3>
          </div>
          <div className="mt-3 grid gap-3">
            {OPTION_HELP.map((item) => (
              <div key={item.title} className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-soft)] p-3">
                <p className="text-sm font-bold text-[var(--color-text)]">{item.title}</p>
                <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <details className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-soft)]">
        <summary className="cursor-pointer text-sm font-black text-[var(--color-text)]">Formatted JSON preview</summary>
        <pre className="mt-3 max-h-96 overflow-auto rounded-[var(--radius-md)] bg-[var(--color-bg-soft)] p-4 font-mono text-xs leading-5 text-[var(--color-text-muted)]">
          {formattedJson}
        </pre>
      </details>
    </div>
  );
}
