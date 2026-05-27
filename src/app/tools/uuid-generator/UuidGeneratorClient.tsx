"use client";

import { useMemo, useState } from "react";
import { Button, CopyButton, Select } from "@/components/ui";
import { CodeOutputPanel, ControlGrid, ControlSection, NumberField, ResultPanel, SegmentedControl, ToolControlPanel, WarningPanel } from "@/features/tools/components";
import { ToolLayoutSingleUtility } from "@/features/tools/layouts";
import { generateUuidBatch, serializeUuids, UUID_MAX_BATCH_SIZE } from "./uuid";
import type { UuidFormat, UuidOutputStyle } from "./types";

export default function UuidGeneratorClient() {
  const [count, setCount] = useState(5);
  const [format, setFormat] = useState<UuidFormat>("standard");
  const [style, setStyle] = useState<UuidOutputStyle>("lines");
  const [values, setValues] = useState(() => generateUuidBatch(1, "standard"));
  const current = values[0] ?? "";
  const serialized = useMemo(() => serializeUuids(values, style), [values, style]);
  function generateOne() { setValues(generateUuidBatch(1, format)); }
  function generateBatch() { setValues(generateUuidBatch(count, format)); }
  return <ToolLayoutSingleUtility
    resultSlot={<ResultPanel title="Current UUID" description="Generated locally using crypto.randomUUID when available." value={<div className="break-all font-mono text-xl font-bold">{current}</div>} actions={<CopyButton text={current} size="sm">Copy UUID</CopyButton>} />}
    actionsSlot={<><Button size="sm" onClick={generateOne}>Generate one</Button><Button size="sm" variant="secondary" onClick={generateBatch}>Generate batch</Button><CopyButton text={serialized} size="sm" variant="secondary">Copy all</CopyButton></>}
    controlsSlot={<ToolControlPanel title="UUID options"><ControlSection title="Batch and format"><ControlGrid columns={3}><NumberField label="Count" value={count} min={1} max={UUID_MAX_BATCH_SIZE} onChange={setCount} /><label className="text-xs font-semibold text-[var(--color-text-muted)]">Format<Select size="sm" className="mt-1" value={format} onChange={(event) => setFormat(event.target.value as UuidFormat)}><option value="standard">standard</option><option value="uppercase">uppercase</option><option value="no-hyphens">no hyphens</option><option value="urn">URN</option></Select></label><label className="text-xs font-semibold text-[var(--color-text-muted)]">Output<Select size="sm" className="mt-1" value={style} onChange={(event) => setStyle(event.target.value as UuidOutputStyle)}><option value="lines">Lines</option><option value="json">JSON</option><option value="csv">CSV</option></Select></label></ControlGrid></ControlSection></ToolControlPanel>}
    infoSlot={<><CodeOutputPanel title="Batch output" tabs={[{ id: "uuids", label: "UUIDs", code: serialized, language: style === "json" ? "json" : "txt" }]} /><WarningPanel messages={[{ id: "limit", severity: "info", title: "Reasonable batch limit", message: `Batch generation is capped at ${UUID_MAX_BATCH_SIZE} UUIDs to keep the browser responsive.` }]} /></>}
  />;
}
