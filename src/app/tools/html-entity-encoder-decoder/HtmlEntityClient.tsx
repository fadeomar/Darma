"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ArrowLeftRight, AlertTriangle, Download, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import { Badge, Button, CopyButton, Field, Select, Tabs, Textarea } from "@/components/ui";
import { cn } from "@/lib/cn";
import { decodeHtmlEntities, encodeHtmlEntities, getEntityStats, getMalformedNumericEntities, HTML_ENTITY_INPUT_LIMIT } from "./entities";
import { DECODE_EXAMPLES, DEFAULT_OPTIONS, ENCODE_EXAMPLES, QUICK_REFERENCE, SAMPLE_TEXT } from "./presets";
import type { EncodeScope, EntityExample, EntityFormat, EntityMode } from "./types";

const MODE_TABS: { value: EntityMode; label: string }[] = [
  { value: "encode", label: "Encode" },
  { value: "decode", label: "Decode" },
];

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

export default function HtmlEntityClient() {
  const [mode, setMode] = useState<EntityMode>("encode");
  const [input, setInput] = useState(SAMPLE_TEXT);
  const [autoConvert, setAutoConvert] = useState(true);
  const [manualOutput, setManualOutput] = useState("");
  const [options, setOptions] = useState(DEFAULT_OPTIONS);

  const isTooLarge = input.length > HTML_ENTITY_INPUT_LIMIT;
  const malformedNumericEntities = useMemo(() => (mode === "decode" ? getMalformedNumericEntities(input) : []), [input, mode]);

  const convertedOutput = useMemo(() => {
    if (isTooLarge) return "";
    return mode === "encode" ? encodeHtmlEntities(input, options) : decodeHtmlEntities(input);
  }, [input, isTooLarge, mode, options]);

  const output = autoConvert ? convertedOutput : manualOutput;
  const stats = useMemo(() => getEntityStats(input, output), [input, output]);

  function updateInput(value: string) {
    setInput(value.slice(0, HTML_ENTITY_INPUT_LIMIT + 1));
  }

  function updateOption<K extends keyof typeof options>(key: K, value: (typeof options)[K]) {
    setOptions((current) => ({ ...current, [key]: value }));
  }

  function loadExample(example: EntityExample) {
    setMode(example.mode);
    setInput(example.value);
    setManualOutput("");
  }

  function convertNow() {
    setManualOutput(convertedOutput);
  }

  function clearAll() {
    setInput("");
    setManualOutput("");
  }

  function swapInputOutput() {
    setInput(output.slice(0, HTML_ENTITY_INPUT_LIMIT));
    setManualOutput(input);
    setMode((current) => (current === "encode" ? "decode" : "encode"));
  }

  const examples = mode === "encode" ? ENCODE_EXAMPLES : DECODE_EXAMPLES;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-black text-[var(--color-text)]">HTML Entity Encoder / Decoder</h2>
            <Badge variant="success" className="gap-1">
              <ShieldCheck className="h-3 w-3" aria-hidden /> Browser-only
            </Badge>
            {isTooLarge ? <Badge variant="danger">Input too large</Badge> : <Badge variant="success">Ready</Badge>}
          </div>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--color-text-muted)]">
            Convert HTML-sensitive text locally. Use named entities for readability or numeric entities for broad character coverage.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => loadExample(examples[0])} leftIcon={<RefreshCw className="h-4 w-4" />}>
            Load sample
          </Button>
          <Button variant="secondary" onClick={clearAll} leftIcon={<Trash2 className="h-4 w-4" />}>
            Clear
          </Button>
          <Button variant="secondary" onClick={swapInputOutput} disabled={!output} leftIcon={<ArrowLeftRight className="h-4 w-4" />}>
            Swap
          </Button>
          <CopyButton text={output} disabled={!output} variant="secondary">
            Copy output
          </CopyButton>
          <Button variant="secondary" onClick={() => downloadFile("html-entities.txt", output, "text/plain")} disabled={!output} leftIcon={<Download className="h-4 w-4" />}>
            Download .txt
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-[var(--shadow-soft)]">
        <Tabs items={MODE_TABS} value={mode} onChange={(nextMode) => { setMode(nextMode); setManualOutput(""); }} ariaLabel="HTML entity mode" />
        <div className="flex flex-wrap gap-2">
          <ToggleButton enabled={autoConvert} onClick={() => setAutoConvert((current) => !current)}>Auto convert</ToggleButton>
          <Button variant="primary" onClick={convertNow} disabled={autoConvert || isTooLarge}>
            Convert
          </Button>
        </div>
      </div>

      {isTooLarge ? (
        <div className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-900">
          Input is over the {HTML_ENTITY_INPUT_LIMIT.toLocaleString()} character limit. Shorten it to resume conversion.
        </div>
      ) : null}

      {malformedNumericEntities.length ? (
        <div className="rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>
              Some numeric entities look malformed and were left unchanged: {malformedNumericEntities.slice(0, 4).join(", ")}
              {malformedNumericEntities.length > 4 ? "…" : ""}
            </span>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Input" description={`${input.length.toLocaleString()} / ${HTML_ENTITY_INPUT_LIMIT.toLocaleString()} characters`}>
            <Textarea
              value={input}
              onChange={(event) => updateInput(event.target.value)}
              placeholder={mode === "encode" ? "Paste text or HTML to encode…" : "Paste encoded HTML entities to decode…"}
              className="min-h-[420px] font-mono text-sm leading-6"
            />
          </Field>
          <Field label="Output" description="Copy, swap, or download the converted text.">
            <Textarea value={output} readOnly placeholder="Converted output will appear here…" className="min-h-[420px] font-mono text-sm leading-6" />
          </Field>
        </div>

        <aside className="space-y-4">
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-soft)]">
            <h3 className="font-black text-[var(--color-text)]">Options</h3>
            <div className="mt-4 space-y-4">
              <Field label="Entity format" description="Named entities fall back to numeric when no common name exists.">
                <Select value={options.format} disabled={mode === "decode"} onChange={(event) => updateOption("format", event.target.value as EntityFormat)}>
                  <option value="named">Named entities</option>
                  <option value="decimal">Decimal numeric</option>
                  <option value="hex">Hex numeric</option>
                </Select>
              </Field>
              <Field label="Encode scope" description="Choose how aggressively characters are escaped.">
                <Select value={options.scope} disabled={mode === "decode"} onChange={(event) => updateOption("scope", event.target.value as EncodeScope)}>
                  <option value="essential">Essential HTML characters only</option>
                  <option value="special">Special characters</option>
                  <option value="nonAscii">All non-ASCII characters</option>
                </Select>
              </Field>
              <div className="flex flex-wrap gap-2">
                <ToggleButton enabled={options.preserveLineBreaks} onClick={() => updateOption("preserveLineBreaks", !options.preserveLineBreaks)}>
                  Preserve line breaks
                </ToggleButton>
                <ToggleButton enabled={options.convertQuotes} onClick={() => updateOption("convertQuotes", !options.convertQuotes)}>
                  Convert quotes
                </ToggleButton>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Input" value={stats.inputCharacters.toLocaleString()} />
            <StatCard label="Output" value={stats.outputCharacters.toLocaleString()} />
            <StatCard label="Entities" value={stats.entityCount.toLocaleString()} />
            <StatCard label="Changed" value={stats.changedCharacters.toLocaleString()} />
          </div>
        </aside>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-soft)]">
          <h3 className="font-black text-[var(--color-text)]">Examples</h3>
          <div className="mt-3 grid gap-2">
            {[...ENCODE_EXAMPLES, ...DECODE_EXAMPLES].map((example) => (
              <button
                key={example.id}
                type="button"
                onClick={() => loadExample(example)}
                className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-3 text-left transition hover:border-[var(--color-primary)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-bold text-[var(--color-text)]">{example.label}</span>
                  <Badge variant="soft">{example.mode}</Badge>
                </div>
                <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">{example.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-soft)]">
          <h3 className="font-black text-[var(--color-text)]">Quick reference</h3>
          <div className="mt-3 overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)]">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--color-bg-soft)] text-xs uppercase tracking-[0.14em] text-[var(--color-text-soft)]">
                <tr>
                  <th className="px-3 py-2">Entity</th>
                  <th className="px-3 py-2">Character</th>
                  <th className="px-3 py-2">Use</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {QUICK_REFERENCE.map((item) => (
                  <tr key={item.entity}>
                    <td className="px-3 py-2 font-mono text-xs text-[var(--color-text)]">{item.entity}</td>
                    <td className="px-3 py-2 font-mono font-bold text-[var(--color-text)]">{item.character}</td>
                    <td className="px-3 py-2 text-xs text-[var(--color-text-muted)]">{item.use}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
