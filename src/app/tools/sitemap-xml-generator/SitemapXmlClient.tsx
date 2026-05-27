"use client";

import { useMemo, useState } from "react";
import { Button, CopyButton, Select } from "@/components/ui";
import { CodeOutputPanel, EditorPanel, ToolControlPanel, ControlSection, ControlGrid, WarningPanel } from "@/features/tools/components";
import { ToolLayoutTextWorkbench } from "@/features/tools/layouts";
import { downloadText } from "../_shared/clientUtils";
import { applySitemapDefaults, dedupeEntries, generateSitemapXml, parseUrlList, validateSitemapEntries } from "./sitemapXml";
import { CHANGEFREQ_OPTIONS, DEFAULT_SITEMAP_OPTIONS, PRIORITY_OPTIONS, SITEMAP_PRESETS, SITEMAP_SAMPLE_INPUT } from "./presets";
import type { DefaultChangeFrequency, DefaultPriority } from "./types";

export default function SitemapXmlClient() {
  const [input, setInput] = useState(SITEMAP_SAMPLE_INPUT);
  const [options, setOptions] = useState(DEFAULT_SITEMAP_OPTIONS);
  const entries = useMemo(() => dedupeEntries(parseUrlList(input)).map((entry) => applySitemapDefaults(entry, options)), [input, options]);
  const warnings = useMemo(() => validateSitemapEntries(entries), [entries]);
  const xml = useMemo(() => generateSitemapXml(entries, options), [entries, options]);
  return <ToolLayoutTextWorkbench
    inputSlot={<EditorPanel title="URL list" language="URLs" value={input} onChange={setInput} minRows={15} placeholder="One URL per line..." actions={<><Button size="sm" variant="secondary" onClick={() => setInput(SITEMAP_SAMPLE_INPUT)}>Sample</Button><Button size="sm" variant="ghost" onClick={() => setInput("")}>Clear</Button></>} footer={`${entries.length.toLocaleString()} URL(s) parsed`} />}
    outputSlot={<CodeOutputPanel title="Generated sitemap.xml" tabs={[{ id: "xml", label: "XML", code: xml, language: "xml", filename: "sitemap.xml" }]} onDownload={(tab) => downloadText(tab.filename ?? "sitemap.xml", tab.code, "application/xml;charset=utf-8")} />}
    actionsSlot={<><CopyButton text={xml} size="sm">Copy XML</CopyButton><Button size="sm" variant="secondary" onClick={() => downloadText("sitemap.xml", xml, "application/xml;charset=utf-8")}>Download sitemap.xml</Button></>}
    optionsSlot={<ToolControlPanel title="Sitemap options"><ControlSection title="Presets"><div className="flex flex-wrap gap-2">{SITEMAP_PRESETS.map((preset) => <Button key={preset.id} size="sm" variant="secondary" onClick={() => { setInput(preset.input); setOptions(preset.options); }}>{preset.label}</Button>)}</div></ControlSection><ControlSection title="Defaults"><ControlGrid columns={2}><label className="text-xs font-semibold text-[var(--color-text-muted)]">Changefreq<Select size="sm" className="mt-1" value={options.defaultChangefreq} onChange={(e) => setOptions((o) => ({ ...o, defaultChangefreq: e.target.value as DefaultChangeFrequency }))}>{CHANGEFREQ_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Select></label><label className="text-xs font-semibold text-[var(--color-text-muted)]">Priority<Select size="sm" className="mt-1" value={options.defaultPriority} onChange={(e) => setOptions((o) => ({ ...o, defaultPriority: e.target.value as DefaultPriority }))}>{PRIORITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Select></label></ControlGrid></ControlSection></ToolControlPanel>}
    statsSlot={<WarningPanel messages={warnings.length ? warnings.map((w) => ({ id: w.id, severity: w.level, title: "Sitemap warning", message: w.message })) : [{ id: "ok", severity: "success", title: "Valid-looking sitemap", message: "URLs parsed successfully. Validate with your search engine tools before production." }]} />}
  />;
}
