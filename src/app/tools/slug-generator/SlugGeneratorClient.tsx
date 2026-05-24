"use client";

import { useMemo, useState } from "react";
import { Button, CopyButton, Select } from "@/components/ui";
import { EditorPanel, NumberField, ToolControlPanel, ControlSection, ControlGrid, WarningPanel } from "@/features/tools/components";
import { ToolLayoutTextWorkbench } from "@/features/tools/layouts";
import { generateSlug, DEFAULT_SLUG_OPTIONS, type SlugCaseMode, type SlugSeparator } from "./slug";

const SAMPLE = "How to Build Better Browser-Only Developer Tools in 2026";

export default function SlugGeneratorClient() {
  const [input, setInput] = useState(SAMPLE);
  const [options, setOptions] = useState(DEFAULT_SLUG_OPTIONS);
  const result = useMemo(() => generateSlug(input, options), [input, options]);
  function patch(next: Partial<typeof options>) { setOptions((current) => ({ ...current, ...next })); }
  return <ToolLayoutTextWorkbench
    inputSlot={<EditorPanel title="Input" language="Text" value={input} onChange={setInput} minRows={8} placeholder="Paste titles or phrases..." actions={<><Button size="sm" variant="secondary" onClick={() => setInput(SAMPLE)}>Sample</Button><Button size="sm" variant="ghost" onClick={() => setInput("")}>Clear</Button></>} footer={`${result.stats.wordCount} words · ${result.stats.originalChars} characters`} />}
    outputSlot={<EditorPanel title="Slug output" language="Slug" value={result.slug} readOnly minRows={8} placeholder="Slug output will appear here." actions={<CopyButton text={result.slug} size="sm" variant="secondary">Copy slug</CopyButton>} footer={`${result.stats.slugChars} characters · ${result.stats.isUrlFriendly ? "URL-friendly" : "Needs review"}`} />}
    optionsSlot={<ToolControlPanel title="Slug options"><ControlSection title="Format"><ControlGrid columns={3}><label className="text-xs font-semibold text-[var(--color-text-muted)]">Separator<Select size="sm" className="mt-1" value={options.separator} onChange={(e) => patch({ separator: e.target.value as SlugSeparator })}><option value="-">Hyphen</option><option value="_">Underscore</option></Select></label><label className="text-xs font-semibold text-[var(--color-text-muted)]">Case<Select size="sm" className="mt-1" value={options.caseMode} onChange={(e) => patch({ caseMode: e.target.value as SlugCaseMode })}><option value="lower">lowercase</option><option value="keep">keep</option><option value="upper">UPPERCASE</option></Select></label><NumberField label="Max length" value={options.maxLength} min={20} max={160} onChange={(maxLength) => patch({ maxLength, maxLengthEnabled: true })} /></ControlGrid><div className="mt-3 flex flex-wrap gap-2">{([ ["keepNumbers", "Keep numbers"], ["removeStopWords", "Remove stop words"], ["preserveSlashes", "Preserve slashes"], ["maxLengthEnabled", "Limit length"] ] as const).map(([key, label]) => <Button key={key} size="sm" variant={options[key] ? "primary" : "secondary"} onClick={() => patch({ [key]: !options[key] } as Partial<typeof options>)}>{label}</Button>)}</div></ControlSection></ToolControlPanel>}
    statsSlot={<WarningPanel messages={result.warnings.length ? result.warnings.map((warning) => ({ id: warning, severity: warning === "empty-output" ? "danger" : "warning", title: "Slug warning", message: warning.replace(/-/g, " ") })) : [{ id: "ok", severity: "success", title: "Ready", message: "Slug is generated locally and ready to copy." }]} />}
  />;
}
