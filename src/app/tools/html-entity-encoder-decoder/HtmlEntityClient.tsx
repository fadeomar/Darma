"use client";

import { useMemo, useState } from "react";
import { Button, CopyButton, Select } from "@/components/ui";
import { EditorPanel, SegmentedControl, ToolControlPanel, ControlSection, ControlGrid, WarningPanel } from "@/features/tools/components";
import { ToolLayoutTextWorkbench } from "@/features/tools/layouts";
import { downloadText } from "../_shared/clientUtils";
import { decodeHtmlEntities, encodeHtmlEntities, getEntityStats, getMalformedNumericEntities } from "./entities";
import type { EncodeScope, EntityFormat, EntityMode } from "./types";

const SAMPLE = `<section class="card">Tom & Jerry said "hello" — مرحبا</section>`;

export default function HtmlEntityClient() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<EntityMode>("encode");
  const [format, setFormat] = useState<EntityFormat>("named");
  const [scope, setScope] = useState<EncodeScope>("special");
  const [convertQuotes, setConvertQuotes] = useState(true);
  const [preserveLineBreaks, setPreserveLineBreaks] = useState(true);
  const output = useMemo(() => mode === "encode" ? encodeHtmlEntities(input, { format, scope, convertQuotes, preserveLineBreaks }) : decodeHtmlEntities(input), [input, mode, format, scope, convertQuotes, preserveLineBreaks]);
  const stats = useMemo(() => getEntityStats(input, output), [input, output]);
  const malformed = useMemo(() => mode === "decode" ? getMalformedNumericEntities(input) : [], [input, mode]);
  return <ToolLayoutTextWorkbench
    inputSlot={<EditorPanel title="Input" language="HTML/Text" value={input} onChange={setInput} minRows={14} placeholder="Paste HTML or encoded entities..." actions={<><Button size="sm" variant="secondary" onClick={() => setInput(SAMPLE)}>Sample</Button><Button size="sm" variant="ghost" onClick={() => setInput("")}>Clear</Button></>} footer={`${input.length.toLocaleString()} characters`} />}
    outputSlot={<EditorPanel title="Output" language={mode === "encode" ? "HTML entities" : "Decoded text"} value={output} readOnly minRows={14} placeholder="Converted output will appear here." actions={<><CopyButton text={output} size="sm" variant="secondary">Copy</CopyButton><Button size="sm" variant="secondary" disabled={!output} onClick={() => downloadText("html-entities.txt", output)}>Download</Button></>} footer={`${stats.outputCharacters.toLocaleString()} characters · ${stats.entityCount.toLocaleString()} entities`} />}
    actionsSlot={<><SegmentedControl<EntityMode> ariaLabel="Entity mode" value={mode} onChange={setMode} options={[{ value: "encode", label: "Encode" }, { value: "decode", label: "Decode" }]} /><Button size="sm" onClick={() => { setInput(output); setMode(mode === "encode" ? "decode" : "encode"); }} disabled={!output}>Swap</Button></>}
    optionsSlot={<ToolControlPanel title="Entity options"><ControlSection title="Encoding"><ControlGrid columns={2}><label className="text-xs font-semibold text-[var(--color-text-muted)]">Format<Select size="sm" className="mt-1" value={format} onChange={(event) => setFormat(event.target.value as EntityFormat)}><option value="named">Named</option><option value="decimal">Decimal</option><option value="hex">Hex</option></Select></label><label className="text-xs font-semibold text-[var(--color-text-muted)]">Scope<Select size="sm" className="mt-1" value={scope} onChange={(event) => setScope(event.target.value as EncodeScope)}><option value="essential">Essential</option><option value="special">Special chars</option><option value="nonAscii">Non-ASCII</option></Select></label></ControlGrid><div className="mt-3 flex flex-wrap gap-2"><Button size="sm" variant={convertQuotes ? "primary" : "secondary"} onClick={() => setConvertQuotes((v) => !v)}>Convert quotes</Button><Button size="sm" variant={preserveLineBreaks ? "primary" : "secondary"} onClick={() => setPreserveLineBreaks((v) => !v)}>Preserve breaks</Button></div></ControlSection></ToolControlPanel>}
    statsSlot={<WarningPanel messages={malformed.length ? [{ id: "malformed", severity: "warning", title: "Malformed numeric entities", message: `${malformed.length} malformed numeric entity value(s) were detected.` }] : [{ id: "local", severity: "info", title: "Local conversion", message: "Entity conversion runs locally in your browser." }]} />}
  />;
}
