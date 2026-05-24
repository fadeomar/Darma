"use client";

import { useMemo, useState } from "react";
import { Button, CopyButton, Select } from "@/components/ui";
import { CodeOutputPanel, ControlGrid, ControlSection, NumberField, SegmentedControl, ToolControlPanel, WarningPanel } from "@/features/tools/components";
import { ToolLayoutSingleUtility } from "@/features/tools/layouts";
import { downloadText } from "../_shared/clientUtils";
import { computeStats, formatReadingTime, generate } from "./generator";
import { DESIGN_PRESETS } from "./presets";
import type { GenerationMode, LoremConfig, OutputFormat, TextStyle } from "./types";

const DEFAULT_CONFIG: LoremConfig = { mode: "paragraphs", style: "readable", amount: 3, blockLength: "medium", outputFormat: "plain", startWithLorem: false, includeHeadings: false, includeLists: false, structuredBlock: "hero" };

export default function LoremIpsumClient() {
  const [config, setConfig] = useState<LoremConfig>(DEFAULT_CONFIG);
  const [nonce, setNonce] = useState(0);
  const output = useMemo(() => generate(config), [config, nonce]);
  const value = config.outputFormat === "html" ? output.html : output.plain;
  const stats = useMemo(() => computeStats(output.plain), [output.plain]);
  function patch(next: Partial<LoremConfig>) { setConfig((current) => ({ ...current, ...next })); }
  return <ToolLayoutSingleUtility
    resultSlot={<CodeOutputPanel title="Generated placeholder content" description={`${stats.words} words · ${formatReadingTime(stats.readingTimeSeconds)}`} tabs={[{ id: "plain", label: "Plain text", code: output.plain, language: "txt" }, { id: "html", label: "HTML", code: output.html, language: "html" }]} defaultTab={config.outputFormat === "html" ? "html" : "plain"} />}
    actionsSlot={<><Button size="sm" onClick={() => setNonce((n) => n + 1)}>Generate</Button><CopyButton text={value} size="sm" variant="secondary">Copy current</CopyButton><Button size="sm" variant="secondary" onClick={() => downloadText(config.outputFormat === "html" ? "lorem.html" : "lorem.txt", value, config.outputFormat === "html" ? "text/html;charset=utf-8" : "text/plain;charset=utf-8")}>Download</Button></>}
    controlsSlot={<ToolControlPanel title="Content settings"><ControlSection title="Mode"><SegmentedControl<GenerationMode> ariaLabel="Generation mode" value={config.mode} onChange={(mode) => patch({ mode })} options={[{ value: "words", label: "Words" }, { value: "sentences", label: "Sentences" }, { value: "paragraphs", label: "Paragraphs" }, { value: "structured", label: "Structured" }]} /></ControlSection><ControlSection title="Controls"><ControlGrid columns={3}><NumberField label="Amount" value={config.amount} min={1} max={50} onChange={(amount) => patch({ amount })} /><label className="text-xs font-semibold text-[var(--color-text-muted)]">Style<Select size="sm" className="mt-1" value={config.style} onChange={(e) => patch({ style: e.target.value as TextStyle })}><option value="classic">Classic</option><option value="readable">Readable</option><option value="startup">Startup</option><option value="ecommerce">Ecommerce</option><option value="blog">Blog</option><option value="profile">Profile</option></Select></label><label className="text-xs font-semibold text-[var(--color-text-muted)]">Format<Select size="sm" className="mt-1" value={config.outputFormat} onChange={(e) => patch({ outputFormat: e.target.value as OutputFormat })}><option value="plain">Plain</option><option value="html">HTML</option></Select></label></ControlGrid></ControlSection><ControlSection title="Design presets"><div className="flex flex-wrap gap-2">{DESIGN_PRESETS.slice(0, 8).map((preset) => <Button key={preset.id} size="sm" variant="secondary" onClick={() => patch(preset.config)}>{preset.icon} {preset.label}</Button>)}</div></ControlSection></ToolControlPanel>}
    infoSlot={<WarningPanel messages={[{ id: "copy", severity: "info", title: "Generated locally", message: "Use placeholder copy for layouts only. Replace with real content before publishing." }]} />}
  />;
}
