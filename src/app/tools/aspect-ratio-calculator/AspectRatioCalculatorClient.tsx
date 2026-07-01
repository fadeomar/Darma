"use client";

import { useMemo, useState } from "react";
import { Button, CopyButton, Input, Select } from "@/components/ui";
import { ToolControlPanel, ControlSection, ControlGrid, WarningPanel } from "@/features/tools/components";
import { ToolLayoutTextWorkbench } from "@/features/tools/layouts";
import {
  closestPreset,
  cropToRatio,
  cssAspectRatio,
  dimensionsFromRatioAndLongEdge,
  fitWithinBounds,
  formatDimensionPair,
  heightFromWidth,
  paddingTopPercent,
  RATIO_PRESETS,
  roundDimension,
  scaledDimensions,
  simplifyRatio,
  widthFromHeight,
} from "./aspect";

const SCALE_OPTIONS = [25, 50, 75, 100, 125, 150, 200];
const LONG_EDGE_PRESETS = [720, 1080, 1200, 1600, 1920, 2048, 2560, 3840];

function toInput(value: number): string {
  return Number.isFinite(value) ? String(roundDimension(value)) : "";
}

function parsePositive(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : NaN;
}

function labelCase(value: string): string {
  return value.slice(0, 1).toUpperCase() + value.slice(1);
}

export default function AspectRatioCalculatorClient() {
  const [ratioW, setRatioW] = useState(16);
  const [ratioH, setRatioH] = useState(9);
  const [rawWidth, setRawWidth] = useState("1920");
  const [rawHeight, setRawHeight] = useState("1080");
  const [maxWidth, setMaxWidth] = useState("1200");
  const [maxHeight, setMaxHeight] = useState("900");
  const [fitMode, setFitMode] = useState<"contain" | "cover">("contain");
  const [longEdge, setLongEdge] = useState("1920");

  const width = parsePositive(rawWidth);
  const height = parsePositive(rawHeight);
  const boundWidth = parsePositive(maxWidth);
  const boundHeight = parsePositive(maxHeight);
  const longEdgeValue = parsePositive(longEdge);

  function applyRatio(nextW: number, nextH: number) {
    if (!Number.isFinite(nextW) || !Number.isFinite(nextH) || nextW <= 0 || nextH <= 0) {
      setRatioW(nextW);
      setRatioH(nextH);
      return;
    }

    setRatioW(nextW);
    setRatioH(nextH);
    const nextHeight = heightFromWidth(nextW, nextH, parsePositive(rawWidth));
    if (Number.isFinite(nextHeight)) setRawHeight(toInput(nextHeight));
  }

  function changeWidth(value: string) {
    setRawWidth(value);
    const next = heightFromWidth(ratioW, ratioH, parsePositive(value));
    if (Number.isFinite(next)) setRawHeight(toInput(next));
  }

  function changeHeight(value: string) {
    setRawHeight(value);
    const next = widthFromHeight(ratioW, ratioH, parsePositive(value));
    if (Number.isFinite(next)) setRawWidth(toInput(next));
  }

  function applyLongEdge(edge: number) {
    setLongEdge(String(edge));
    const next = dimensionsFromRatioAndLongEdge(ratioW, ratioH, edge);
    if (next) {
      setRawWidth(toInput(next.width));
      setRawHeight(toInput(next.height));
    }
  }

  function flipRatio() {
    applyRatio(ratioH, ratioW);
  }

  const simplified = useMemo(() => simplifyRatio(width, height), [width, height]);
  const valid = Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0;
  const activePreset = RATIO_PRESETS.find((preset) => preset.w === ratioW && preset.h === ratioH);
  const nearest = useMemo(() => closestPreset(width, height), [width, height]);
  const fit = useMemo(() => fitWithinBounds(width, height, boundWidth, boundHeight, fitMode), [width, height, boundWidth, boundHeight, fitMode]);
  const crop = useMemo(() => cropToRatio(width, height, ratioW, ratioH), [width, height, ratioW, ratioH]);
  const longEdgeResult = useMemo(() => dimensionsFromRatioAndLongEdge(ratioW, ratioH, longEdgeValue), [ratioW, ratioH, longEdgeValue]);

  const cssSnippet = cssAspectRatio(ratioW, ratioH);
  const paddingFallback = paddingTopPercent(ratioW, ratioH);
  const summary = valid
    ? [
        `${formatDimensionPair(width, height)} — ratio ${simplified?.label ?? `${ratioW}:${ratioH}`}`,
        `CSS: ${cssSnippet}`,
        Number.isFinite(paddingFallback) ? `Legacy padding-top: ${paddingFallback}%` : "",
      ]
        .filter(Boolean)
        .join("\n")
    : "";

  const presetGroups = ["social", "video", "photo", "web", "print"] as const;

  return (
    <ToolLayoutTextWorkbench
      inputSlot={
        <ToolControlPanel title="Aspect ratio studio" description="Solve dimensions, preview crops, fit inside bounds, generate CSS, and prepare common creator sizes without uploading anything.">
          <ControlSection title="Professional presets">
            <div className="space-y-3">
              {presetGroups.map((group) => {
                const items = RATIO_PRESETS.filter((preset) => preset.group === group);
                if (!items.length) return null;
                return (
                  <div key={group}>
                    <p className="mb-1 text-[10px] font-black uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{labelCase(group)}</p>
                    <div className="flex flex-wrap gap-2">
                      {items.map((preset) => {
                        const active = preset.w === ratioW && preset.h === ratioH;
                        return (
                          <Button
                            key={preset.id}
                            size="sm"
                            variant={active ? "soft" : "secondary"}
                            aria-pressed={active}
                            title={preset.hint}
                            onClick={() => applyRatio(preset.w, preset.h)}
                          >
                            {preset.label}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            {activePreset ? (
              <div className="mt-3 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3 text-xs text-[var(--color-text-secondary)]">
                <strong className="text-[var(--color-text-primary)]">{activePreset.label}</strong> — {activePreset.hint}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {activePreset.useCases.map((item) => (
                    <span key={item} className="rounded-[var(--radius-full)] bg-[var(--color-surface-subtle)] px-2 py-1 text-[10px] font-bold text-[var(--color-text-tertiary)]">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </ControlSection>

          <ControlSection title="Ratio and dimensions">
            <ControlGrid columns={2}>
              <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                Ratio width
                <Input className="mt-1" type="text" inputMode="decimal" value={String(ratioW)} onChange={(event) => applyRatio(Number.parseFloat(event.target.value), ratioH)} aria-label="Ratio width" />
              </label>
              <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                Ratio height
                <Input className="mt-1" type="text" inputMode="decimal" value={String(ratioH)} onChange={(event) => applyRatio(ratioW, Number.parseFloat(event.target.value))} aria-label="Ratio height" />
              </label>
            </ControlGrid>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={flipRatio}>Flip ratio</Button>
              <CopyButton text={cssSnippet} size="sm" variant="secondary" disabled={!cssSnippet}>Copy CSS</CopyButton>
            </div>
            <ControlGrid columns={2} className="mt-4">
              <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                Width
                <Input className="mt-1" type="text" inputMode="decimal" value={rawWidth} onChange={(event) => changeWidth(event.target.value)} aria-label="Width in pixels" />
              </label>
              <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                Height
                <Input className="mt-1" type="text" inputMode="decimal" value={rawHeight} onChange={(event) => changeHeight(event.target.value)} aria-label="Height in pixels" />
              </label>
            </ControlGrid>
          </ControlSection>

          <ControlSection title="Resize tools">
            <ControlGrid columns={2}>
              <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                Long edge
                <Input className="mt-1" type="text" inputMode="decimal" value={longEdge} onChange={(event) => setLongEdge(event.target.value)} aria-label="Long edge" />
              </label>
              <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                Fit mode
                <Select className="mt-1" value={fitMode} onChange={(event) => setFitMode(event.target.value as "contain" | "cover")} aria-label="Fit mode">
                  <option value="contain">Contain</option>
                  <option value="cover">Cover</option>
                </Select>
              </label>
            </ControlGrid>
            <div className="mt-2 flex flex-wrap gap-2">
              {LONG_EDGE_PRESETS.map((edge) => (
                <Button key={edge} size="sm" variant="secondary" onClick={() => applyLongEdge(edge)}>{edge}px</Button>
              ))}
            </div>
            <ControlGrid columns={2} className="mt-4">
              <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                Max width
                <Input className="mt-1" type="text" inputMode="decimal" value={maxWidth} onChange={(event) => setMaxWidth(event.target.value)} aria-label="Maximum width" />
              </label>
              <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                Max height
                <Input className="mt-1" type="text" inputMode="decimal" value={maxHeight} onChange={(event) => setMaxHeight(event.target.value)} aria-label="Maximum height" />
              </label>
            </ControlGrid>
          </ControlSection>

          {!valid ? <p className="mt-2 text-xs font-semibold text-[var(--color-danger)]">Enter positive width and height values.</p> : null}
        </ToolControlPanel>
      }
      outputSlot={
        <section className="flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-sm)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/75 px-4 py-3">
            <div>
              <h2 className="text-sm font-bold tracking-[-0.01em] text-[var(--color-text-primary)]">Design-ready output</h2>
              <p className="text-xs text-[var(--color-text-tertiary)]">Ratio, crop, fit, CSS, and quick scale sizes.</p>
            </div>
            <CopyButton text={summary} size="sm" variant="secondary" disabled={!valid}>Copy report</CopyButton>
          </div>
          <div className="flex flex-1 flex-col gap-4 p-4">
            {valid && simplified ? (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  <MetricCard label="Simplified ratio" value={simplified.label} />
                  <MetricCard label="Decimal" value={String(roundDimension(simplified.decimal))} />
                  <MetricCard label="Orientation" value={labelCase(simplified.orientation)} />
                </div>

                <div className="flex items-center justify-center rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-4">
                  <div
                    className="flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] px-3 text-center text-[10px] font-black uppercase tracking-[0.08em] text-[var(--color-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
                    style={{ aspectRatio: `${simplified.decimal}`, width: "min(100%, 260px)", maxHeight: 170 }}
                  >
                    {formatDimensionPair(width, height)}
                  </div>
                </div>

                <div className="grid gap-3 lg:grid-cols-2">
                  <InfoPanel title="Closest preset" lines={[nearest ? `${nearest.label} — ${nearest.hint}` : "No close preset found"]} />
                  <InfoPanel title="Long edge result" lines={[longEdgeResult ? formatDimensionPair(longEdgeResult.width, longEdgeResult.height) : "Enter a valid long edge"]} />
                  <InfoPanel title={`${fitMode === "contain" ? "Fit inside" : "Cover"} bounds`} lines={[fit ? `${formatDimensionPair(fit.width, fit.height)} (${roundDimension(fit.scale * 100)}%)` : "Enter valid bounds"]} />
                  <InfoPanel title="Centered crop" lines={crop ? [`${formatDimensionPair(crop.cropWidth, crop.cropHeight)} crop area`, `Offset X ${crop.cropX}px / Y ${crop.cropY}px`] : ["Enter valid dimensions"]} />
                </div>

                <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-black text-[var(--color-text-primary)]">Responsive scale ladder</h3>
                    <CopyButton
                      text={SCALE_OPTIONS.map((scale) => {
                        const scaled = scaledDimensions(width, height, scale);
                        return scaled ? `${scale}%: ${formatDimensionPair(scaled.width, scaled.height)}` : "";
                      }).filter(Boolean).join("\n")}
                      size="sm"
                      variant="secondary"
                    >
                      Copy sizes
                    </CopyButton>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    {SCALE_OPTIONS.map((scale) => {
                      const scaled = scaledDimensions(width, height, scale);
                      return (
                        <div key={scale} className="rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-overlay)] p-2 text-xs">
                          <div className="font-black text-[var(--color-text-primary)]">{scale}%</div>
                          <div className="mt-1 font-mono text-[var(--color-text-secondary)]">{scaled ? `${scaled.width} × ${scaled.height}` : "—"}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-black text-[var(--color-text-primary)]">CSS output</h3>
                    <CopyButton text={`${cssSnippet}\n/* Legacy fallback */\npadding-top: ${paddingFallback}%;`} size="sm" variant="secondary">Copy CSS</CopyButton>
                  </div>
                  <pre className="mt-3 overflow-auto rounded-[var(--radius-sm)] bg-[var(--color-surface-subtle)] p-3 text-xs text-[var(--color-text-primary)]"><code>{`${cssSnippet}\n/* Legacy fallback */\npadding-top: ${paddingFallback}%;`}</code></pre>
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center text-sm text-[var(--color-text-tertiary)]">Enter a width and height to see the ratio studio.</div>
            )}
          </div>
        </section>
      }
      statsSlot={
        <WarningPanel
          messages={[
            { id: "how", severity: "info", title: "Designer workflow", message: "Use presets for social/video, solve exact dimensions, then copy CSS or a full production-size report." },
            { id: "crop", severity: "info", title: "Crop vs fit", message: "Contain keeps the whole asset visible. Cover fills the target box and may require cropping." },
            { id: "local", severity: "info", title: "Local calculation", message: "Everything is calculated in your browser — no images or dimensions are uploaded." },
          ]}
        />
      }
    />
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 text-center shadow-[inset_0_1px_0_var(--color-border-subtle)]">
      <div className="font-mono text-2xl font-black tracking-tight text-[var(--color-text-primary)]">{value}</div>
      <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{label}</div>
    </div>
  );
}

function InfoPanel({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3">
      <div className="text-[10px] font-black uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{title}</div>
      <div className="mt-2 space-y-1 text-sm font-semibold text-[var(--color-text-primary)]">
        {lines.filter(Boolean).map((line) => <p key={line}>{line}</p>)}
      </div>
    </div>
  );
}
