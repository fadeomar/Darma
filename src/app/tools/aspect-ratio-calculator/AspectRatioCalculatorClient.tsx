"use client";

import { useMemo, useState } from "react";
import { Button, CopyButton, Input } from "@/components/ui";
import { ToolControlPanel, ControlSection, ControlGrid, WarningPanel } from "@/features/tools/components";
import { ToolLayoutTextWorkbench } from "@/features/tools/layouts";
import {
  heightFromWidth,
  RATIO_PRESETS,
  roundDimension,
  simplifyRatio,
  widthFromHeight,
} from "./aspect";

function toInput(value: number): string {
  return Number.isFinite(value) ? String(roundDimension(value)) : "";
}

export default function AspectRatioCalculatorClient() {
  const [ratioW, setRatioW] = useState(16);
  const [ratioH, setRatioH] = useState(9);
  const [rawWidth, setRawWidth] = useState("1920");
  const [rawHeight, setRawHeight] = useState("1080");

  const width = Number.parseFloat(rawWidth);
  const height = Number.parseFloat(rawHeight);

  function applyRatio(nextW: number, nextH: number) {
    setRatioW(nextW);
    setRatioH(nextH);
    // Keep the current width and re-solve the height to match the new ratio.
    const nextHeight = heightFromWidth(nextW, nextH, Number.parseFloat(rawWidth));
    if (Number.isFinite(nextHeight)) setRawHeight(toInput(nextHeight));
  }

  function changeWidth(value: string) {
    setRawWidth(value);
    const next = heightFromWidth(ratioW, ratioH, Number.parseFloat(value));
    if (Number.isFinite(next)) setRawHeight(toInput(next));
  }

  function changeHeight(value: string) {
    setRawHeight(value);
    const next = widthFromHeight(ratioW, ratioH, Number.parseFloat(value));
    if (Number.isFinite(next)) setRawWidth(toInput(next));
  }

  const simplified = useMemo(() => simplifyRatio(width, height), [width, height]);
  const valid = Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0;
  const activePreset = RATIO_PRESETS.find((preset) => preset.w === ratioW && preset.h === ratioH);

  const summary = valid
    ? `${roundDimension(width)} × ${roundDimension(height)} px — ratio ${simplified?.label ?? `${ratioW}:${ratioH}`}`
    : "";

  return (
    <ToolLayoutTextWorkbench
      inputSlot={
        <ToolControlPanel title="Aspect ratio" description="Pick a ratio, type one dimension, and the other is solved to match. Great for video, images, and social posts.">
          <ControlSection title="Common ratios">
            <div className="flex flex-wrap gap-2">
              {RATIO_PRESETS.map((preset) => {
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
            {activePreset ? (
              <p className="mt-2 text-xs text-[var(--color-text-tertiary)]">{activePreset.hint}</p>
            ) : null}
          </ControlSection>

          <ControlSection title="Ratio (width : height)">
            <ControlGrid columns={2}>
              <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                Ratio width
                <Input
                  className="mt-1"
                  type="text"
                  inputMode="decimal"
                  value={String(ratioW)}
                  onChange={(event) => applyRatio(Number.parseFloat(event.target.value), ratioH)}
                  aria-label="Ratio width"
                />
              </label>
              <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                Ratio height
                <Input
                  className="mt-1"
                  type="text"
                  inputMode="decimal"
                  value={String(ratioH)}
                  onChange={(event) => applyRatio(ratioW, Number.parseFloat(event.target.value))}
                  aria-label="Ratio height"
                />
              </label>
            </ControlGrid>
          </ControlSection>

          <ControlSection title="Dimensions (pixels)">
            <ControlGrid columns={2}>
              <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                Width
                <Input
                  className="mt-1"
                  type="text"
                  inputMode="decimal"
                  value={rawWidth}
                  onChange={(event) => changeWidth(event.target.value)}
                  aria-label="Width in pixels"
                />
              </label>
              <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                Height
                <Input
                  className="mt-1"
                  type="text"
                  inputMode="decimal"
                  value={rawHeight}
                  onChange={(event) => changeHeight(event.target.value)}
                  aria-label="Height in pixels"
                />
              </label>
            </ControlGrid>
          </ControlSection>

          {!valid ? (
            <p className="mt-2 text-xs font-semibold text-[var(--color-danger)]">Enter positive width and height values.</p>
          ) : null}
        </ToolControlPanel>
      }
      outputSlot={
        <section className="flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-sm)]">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/75 px-4 py-3">
            <h2 className="text-sm font-bold tracking-[-0.01em] text-[var(--color-text-primary)]">Result</h2>
            <CopyButton text={summary} size="sm" variant="secondary" disabled={!valid}>Copy result</CopyButton>
          </div>
          <div className="flex flex-1 flex-col gap-4 p-4">
            {valid && simplified ? (
              <>
                <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-5 text-center shadow-[inset_0_1px_0_var(--color-border-subtle)]">
                  <div className="text-3xl font-black tracking-tight text-[var(--color-text-primary)]">{simplified.label}</div>
                  <div className="mt-2 text-sm text-[var(--color-text-secondary)]">
                    {roundDimension(width)} × {roundDimension(height)} px
                  </div>
                </div>
                {/* Live ratio preview box */}
                <div className="flex items-center justify-center rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-4">
                  <div
                    className="flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-primary)]"
                    style={{ aspectRatio: `${simplified.decimal}`, width: "min(100%, 220px)", maxHeight: 150 }}
                  >
                    {simplified.label}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Decimal ratio", value: `${roundDimension(simplified.decimal)}` },
                    { label: "Orientation", value: width > height ? "Landscape" : width < height ? "Portrait" : "Square" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3 text-center">
                      <div className="font-mono text-lg font-black text-[var(--color-text-primary)]">{item.value}</div>
                      <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{item.label}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center text-sm text-[var(--color-text-tertiary)]">
                Enter a width and height to see the ratio.
              </div>
            )}
          </div>
        </section>
      }
      statsSlot={
        <WarningPanel
          messages={[
            { id: "how", severity: "info", title: "How it works", message: "Type a width and the height is solved from the chosen ratio (and vice-versa). Editing the ratio re-solves the height." },
            { id: "local", severity: "info", title: "Local calculation", message: "Everything is calculated in your browser — nothing is uploaded." },
          ]}
        />
      }
    />
  );
}
