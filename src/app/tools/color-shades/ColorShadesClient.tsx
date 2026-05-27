"use client";

import { useMemo, useState } from "react";
import { CopyButton } from "@/components/ui";
import { CodeOutputPanel, ColorField, ControlGrid, ControlSection, NumberField, ResultPanel, ToolControlPanel, WarningPanel } from "@/features/tools/components";
import { ToolLayoutSingleUtility } from "@/features/tools/layouts";
import type { ColorShade, ColorShadesParams } from "@/types";
import { generateShades } from "@/utils/color-shades";

export default function ColorShadesClient({ initialParams, initialShades }: { initialParams: ColorShadesParams; initialShades: ColorShade[] }) {
  const [params, setParams] = useState<ColorShadesParams>(initialParams);
  const shades = useMemo(() => generateShades(params), [params]);
  const activeShades = shades.length ? shades : initialShades;
  const cssVars = activeShades.map((shade, index) => `--shade-${index + 1}: ${shade.hex};`).join("\n");
  function patch(next: Partial<ColorShadesParams>) { setParams((current) => ({ ...current, ...next })); }
  return <ToolLayoutSingleUtility
    resultSlot={<ResultPanel title="Shade palette" description="Copy individual values or export the palette as CSS variables." value={<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">{activeShades.map((shade, index) => <div key={`${shade.hex}-${index}`} className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)]"><div className="h-20" style={{ background: shade.hex }} /><div className="space-y-2 p-3 text-left"><p className="font-mono text-xs font-bold">{shade.hex}</p><p className="text-[11px] text-[var(--color-text-muted)]">{shade.rgb}</p><CopyButton text={shade.hex} size="sm" variant="secondary">Copy</CopyButton></div></div>)}</div>} />}
    actionsSlot={<><CopyButton text={cssVars} size="sm">Copy CSS variables</CopyButton><CopyButton text={JSON.stringify(activeShades.map((shade) => shade.hex), null, 2)} size="sm" variant="secondary">Copy JSON</CopyButton></>}
    controlsSlot={<ToolControlPanel title="Palette controls"><ControlSection title="Gradient range"><ControlGrid columns={3}><ColorField label="Start" value={params.color1} onChange={(color1) => patch({ color1 })} /><ColorField label="End" value={params.color2} onChange={(color2) => patch({ color2 })} /><NumberField label="Steps" value={params.steps} min={2} max={20} onChange={(steps) => patch({ steps })} /></ControlGrid></ControlSection></ToolControlPanel>}
    infoSlot={<><CodeOutputPanel title="Palette code" tabs={[{ id: "css", label: "CSS variables", code: cssVars, language: "css" }, { id: "json", label: "JSON", code: JSON.stringify(activeShades, null, 2), language: "json" }]} /><WarningPanel messages={activeShades.length ? [{ id: "text-values", severity: "info", title: "Accessible output", message: "Each swatch includes text values so the palette is not color-only." }] : [{ id: "invalid", severity: "danger", title: "Invalid palette", message: "Use valid colors and 2–20 steps." }]} /></>}
  />;
}
