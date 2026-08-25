"use client";

import { useMemo, useState } from "react";
import { Button, CopyButton, Input, Select } from "@/components/ui";
import { ControlGrid, ControlSection, ToolControlPanel, WarningPanel } from "@/features/tools/components";
import { ToolLayoutVisualGenerator } from "@/features/tools/layouts";
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

type ExportTab = "css" | "html" | "react" | "tokens";
type PreviewMode = "shape" | "social" | "crop";
type OverlayMode = "clean" | "safe" | "grid";
type TargetSpec = {
  id: string;
  label: string;
  width: number;
  height: number;
  group: "social" | "video" | "web" | "print";
  hint: string;
};

type CheckSeverity = "good" | "info" | "warn";

type ProductionCheck = {
  id: string;
  severity: CheckSeverity;
  title: string;
  message: string;
};

const SCALE_OPTIONS = [25, 50, 75, 100, 125, 150, 200];
const LONG_EDGE_PRESETS = [720, 1080, 1200, 1600, 1920, 2048, 2560, 3840];

const TARGET_SPECS: TargetSpec[] = [
  { id: "ig-square", label: "Instagram square", width: 1080, height: 1080, group: "social", hint: "Classic feed square." },
  { id: "ig-portrait", label: "Instagram portrait", width: 1080, height: 1350, group: "social", hint: "4:5 feed post with extra height." },
  { id: "story", label: "Story / Reel", width: 1080, height: 1920, group: "social", hint: "Vertical story, reel, short, or TikTok." },
  { id: "x-post", label: "X / link image", width: 1200, height: 675, group: "social", hint: "Wide social image and article preview." },
  { id: "youtube-thumb", label: "YouTube thumbnail", width: 1280, height: 720, group: "video", hint: "16:9 thumbnail export." },
  { id: "full-hd", label: "Full HD", width: 1920, height: 1080, group: "video", hint: "Widescreen video frame." },
  { id: "vertical-hd", label: "Vertical HD", width: 1080, height: 1920, group: "video", hint: "Portrait video frame." },
  { id: "og", label: "Open Graph", width: 1200, height: 630, group: "web", hint: "Common share card / OG image." },
  { id: "hero", label: "Hero banner", width: 1920, height: 720, group: "web", hint: "Wide website hero area." },
  { id: "app-card", label: "App card", width: 640, height: 420, group: "web", hint: "Dashboard or product card preview." },
  { id: "a4", label: "A4 landscape", width: 3508, height: 2480, group: "print", hint: "300 DPI A4 landscape." },
  { id: "poster", label: "Poster portrait", width: 2000, height: 3000, group: "print", hint: "2:3 poster crop." },
];

function toInput(value: number): string {
  return Number.isFinite(value) ? String(roundDimension(value)) : "";
}

function parsePositive(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : Number.NaN;
}

function labelCase(value: string): string {
  return value.slice(0, 1).toUpperCase() + value.slice(1).replaceAll("-", " ");
}

function compactNumber(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return Number.isInteger(value) ? String(value) : String(roundDimension(value));
}

function ratioLabel(width: number, height: number): string {
  const ratio = simplifyRatio(width, height);
  return ratio?.label ?? "—";
}

function pixelCount(width: number, height: number): string {
  if (!Number.isFinite(width) || !Number.isFinite(height)) return "—";
  const total = width * height;
  if (total >= 1_000_000) return `${roundDimension(total / 1_000_000)} MP`;
  return `${Math.round(total).toLocaleString()} px`;
}

function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return `${roundDimension(value)}%`;
}

function calcCropLoss(width: number, height: number, cropWidth?: number, cropHeight?: number): number {
  if (!cropWidth || !cropHeight || width <= 0 || height <= 0) return 0;
  const original = width * height;
  const cropped = cropWidth * cropHeight;
  return Math.max(0, Math.min(100, ((original - cropped) / original) * 100));
}

function statusClasses(severity: CheckSeverity): string {
  if (severity === "good") return "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200";
  if (severity === "warn") return "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-200";
  return "border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] text-[var(--color-text-secondary)]";
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
  const [previewMode, setPreviewMode] = useState<PreviewMode>("shape");
  const [overlayMode, setOverlayMode] = useState<OverlayMode>("safe");
  const [activeExport, setActiveExport] = useState<ExportTab>("css");
  const [targetFilter, setTargetFilter] = useState<TargetSpec["group"] | "all">("all");
  const [className, setClassName] = useState("ratio-card");
  const [objectFit, setObjectFit] = useState<"cover" | "contain">("cover");

  const width = parsePositive(rawWidth);
  const height = parsePositive(rawHeight);
  const boundWidth = parsePositive(maxWidth);
  const boundHeight = parsePositive(maxHeight);
  const longEdgeValue = parsePositive(longEdge);

  const valid = Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0;
  const simplified = useMemo(() => simplifyRatio(width, height), [width, height]);
  const activePreset = RATIO_PRESETS.find((preset) => preset.w === ratioW && preset.h === ratioH);
  const nearest = useMemo(() => closestPreset(width, height), [width, height]);
  const fit = useMemo(() => fitWithinBounds(width, height, boundWidth, boundHeight, fitMode), [width, height, boundWidth, boundHeight, fitMode]);
  const containFit = useMemo(() => fitWithinBounds(width, height, boundWidth, boundHeight, "contain"), [width, height, boundWidth, boundHeight]);
  const coverFit = useMemo(() => fitWithinBounds(width, height, boundWidth, boundHeight, "cover"), [width, height, boundWidth, boundHeight]);
  const crop = useMemo(() => cropToRatio(width, height, ratioW, ratioH), [width, height, ratioW, ratioH]);
  const longEdgeResult = useMemo(() => dimensionsFromRatioAndLongEdge(ratioW, ratioH, longEdgeValue), [ratioW, ratioH, longEdgeValue]);
  const cropLoss = useMemo(
    () => (crop ? calcCropLoss(width, height, crop.cropWidth, crop.cropHeight) : 0),
    [crop, width, height],
  );
  const paddingFallback = paddingTopPercent(ratioW, ratioH);
  const cssSnippet = cssAspectRatio(ratioW, ratioH);
  const safeClassName = className.trim() || "ratio-card";

  const filteredTargets = TARGET_SPECS.filter((target) => targetFilter === "all" || target.group === targetFilter);

  function applyRatio(nextW: number, nextH: number) {
    setRatioW(nextW);
    setRatioH(nextH);
    const nextHeight = heightFromWidth(nextW, nextH, parsePositive(rawWidth));
    if (Number.isFinite(nextHeight)) setRawHeight(toInput(nextHeight));
  }

  function applyDimensions(nextWidth: number, nextHeight: number) {
    setRawWidth(toInput(nextWidth));
    setRawHeight(toInput(nextHeight));
    const nextRatio = simplifyRatio(nextWidth, nextHeight);
    if (nextRatio) {
      setRatioW(nextRatio.w);
      setRatioH(nextRatio.h);
    }
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
    if (next) applyDimensions(next.width, next.height);
  }

  function flipRatio() {
    applyRatio(ratioH, ratioW);
  }

  const scaleText = SCALE_OPTIONS.map((scale) => {
    const scaled = scaledDimensions(width, height, scale);
    return scaled ? `${scale}%: ${formatDimensionPair(scaled.width, scaled.height)}` : "";
  }).filter(Boolean).join("\n");

  const cssExport = `.${safeClassName} {
  aspect-ratio: ${compactNumber(ratioW)} / ${compactNumber(ratioH)};
  width: 100%;
  overflow: hidden;
}

.${safeClassName} > img,
.${safeClassName} > video {
  width: 100%;
  height: 100%;
  object-fit: ${objectFit};
}

/* Legacy fallback */
.${safeClassName}::before {
  content: "";
  display: block;
  padding-top: ${formatPercent(paddingFallback)};
}`;

  const htmlExport = `<div class="${safeClassName}">
  <img src="image.jpg" alt="" loading="lazy" />
</div>`;

  const reactExport = `type RatioCardProps = {
  src: string;
  alt: string;
};

export function RatioCard({ src, alt }: RatioCardProps) {
  return (
    <figure className="${safeClassName}">
      <img src={src} alt={alt} loading="lazy" />
    </figure>
  );
}`;

  const tokenExport = JSON.stringify(
    {
      name: safeClassName,
      ratio: `${compactNumber(ratioW)}:${compactNumber(ratioH)}`,
      aspectRatio: `${compactNumber(ratioW)} / ${compactNumber(ratioH)}`,
      dimensions: valid ? { width: roundDimension(width), height: roundDimension(height), pixels: Math.round(width * height) } : null,
      css: cssSnippet,
      paddingTopFallback: Number.isFinite(paddingFallback) ? `${paddingFallback}%` : null,
      objectFit,
      exports: {
        containBounds: containFit ? { width: containFit.width, height: containFit.height } : null,
        coverBounds: coverFit ? { width: coverFit.width, height: coverFit.height } : null,
        crop: crop ? { width: crop.cropWidth, height: crop.cropHeight, offsetX: crop.cropX, offsetY: crop.cropY, lossPercent: roundDimension(cropLoss) } : null,
      },
    },
    null,
    2,
  );

  const exportMap: Record<ExportTab, string> = {
    css: cssExport,
    html: htmlExport,
    react: reactExport,
    tokens: tokenExport,
  };

  const summary = valid
    ? [
        `${formatDimensionPair(width, height)} — ${simplified?.label ?? `${ratioW}:${ratioH}`}`,
        `Closest preset: ${nearest?.label ?? "—"}`,
        `Pixels: ${pixelCount(width, height)}`,
        `CSS: ${cssSnippet}`,
        Number.isFinite(paddingFallback) ? `Padding fallback: ${paddingFallback}%` : "",
      ].filter(Boolean).join("\n")
    : "";

  const checks = useMemo<ProductionCheck[]>(() => {
    const list: ProductionCheck[] = [];
    if (!valid || !simplified) {
      return [{ id: "invalid", severity: "warn", title: "Missing dimensions", message: "Enter positive width and height values to generate outputs." }];
    }

    list.push({ id: "ratio", severity: "good", title: "Ratio solved", message: `${formatDimensionPair(width, height)} simplifies to ${simplified.label}.` });

    if (Math.abs(width - Math.round(width)) > 0.01 || Math.abs(height - Math.round(height)) > 0.01) {
      list.push({ id: "decimal", severity: "warn", title: "Decimal pixels", message: "Some platforms prefer whole-pixel exports. Round before final delivery." });
    }

    if (width * height > 16_000_000) {
      list.push({ id: "large", severity: "warn", title: "Large canvas", message: "This is a large pixel count. Confirm compression and upload limits before export." });
    } else {
      list.push({ id: "size", severity: "good", title: "Reasonable canvas", message: `${pixelCount(width, height)} is safe for most web handoffs.` });
    }

    if (cropLoss > 12) {
      list.push({ id: "crop", severity: "warn", title: "Heavy crop", message: `Cover crop removes about ${formatPercent(cropLoss)} of the original area.` });
    } else {
      list.push({ id: "crop", severity: "info", title: "Crop check", message: `Centered cover crop loss is about ${formatPercent(cropLoss)}.` });
    }

    if (nearest) {
      const delta = Math.abs(nearest.w / nearest.h - width / height);
      list.push({ id: "preset", severity: delta < 0.01 ? "good" : "info", title: "Nearest preset", message: `${nearest.label} — ${nearest.hint}` });
    }

    return list;
  }, [cropLoss, height, nearest, simplified, valid, width]);

  return (
    <ToolLayoutVisualGenerator
      actionsPlacement="under-preview"
      previewSlot={
        <div className="flex min-h-full flex-col gap-4 p-4 sm:p-5">
          <div>
            <h2 className="text-sm font-bold tracking-[-0.01em] text-[var(--color-text-primary)]">Design-ready preview</h2>
            <p className="text-xs text-[var(--color-text-tertiary)]">Ratio, crop, fit, and delivery dimensions update live from the controls.</p>
          </div>

          {valid && simplified ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="Ratio" value={simplified.label} sub={`Decimal ${roundDimension(simplified.decimal)}`} />
                <MetricCard label="Canvas" value={`${compactNumber(width)} × ${compactNumber(height)}`} sub={pixelCount(width, height)} />
                <MetricCard label="Orientation" value={labelCase(simplified.orientation)} sub={nearest ? `Near ${nearest.label}` : "Custom ratio"} />
                <MetricCard label="Fallback" value={formatPercent(paddingFallback)} sub="padding-top" />
              </div>

              <div className="grid flex-1 gap-4 2xl:grid-cols-[minmax(0,1.15fr)_minmax(250px,0.85fr)]">
                <PreviewCard
                  width={width}
                  height={height}
                  ratio={simplified.decimal}
                  previewMode={previewMode}
                  overlayMode={overlayMode}
                  cropLoss={cropLoss}
                />

                <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-1">
                  <InfoPanel title="Closest preset" lines={[nearest ? `${nearest.label} — ${nearest.hint}` : "No close preset found"]} />
                  <InfoPanel title="Long edge result" lines={[longEdgeResult ? formatDimensionPair(longEdgeResult.width, longEdgeResult.height) : "Enter a valid long edge"]} />
                  <InfoPanel title={`${fitMode === "contain" ? "Fit inside" : "Cover"} bounds`} lines={[fit ? `${formatDimensionPair(fit.width, fit.height)} (${roundDimension(fit.scale * 100)}%)` : "Enter valid bounds"]} />
                  <InfoPanel title="Centered crop" lines={crop ? [`${formatDimensionPair(crop.cropWidth, crop.cropHeight)} crop area`, `Offset X ${crop.cropX}px / Y ${crop.cropY}px`, `${formatPercent(cropLoss)} area removed`] : ["Enter valid dimensions"]} />
                </div>
              </div>
            </>
          ) : (
            <div className="flex min-h-[360px] flex-1 items-center justify-center text-sm text-[var(--color-text-tertiary)]">Enter a width and height to see the ratio studio.</div>
          )}
        </div>
      }
      controlsSlot={
        <ToolControlPanel title="Aspect ratio studio" description="Solve creator dimensions, preview crops, fit inside bounds, and export production snippets without uploading files.">
          <ControlSection title="Quick targets">
            <div className="mb-3 flex flex-wrap gap-2">
              {(["all", "social", "video", "web", "print"] as const).map((group) => (
                <Button key={group} size="sm" variant={targetFilter === group ? "soft" : "secondary"} aria-pressed={targetFilter === group} onClick={() => setTargetFilter(group)}>
                  {labelCase(group)}
                </Button>
              ))}
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              {filteredTargets.slice(0, 8).map((target) => (
                <button
                  key={target.id}
                  type="button"
                  onClick={() => applyDimensions(target.width, target.height)}
                  className="rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3 text-left transition hover:border-[var(--color-primary-border)] hover:bg-[var(--color-primary-soft)]"
                  title={target.hint}
                >
                  <span className="block text-xs font-black text-[var(--color-text-primary)]">{target.label}</span>
                  <span className="mt-1 block truncate font-mono text-xs text-[var(--color-text-tertiary)]">{target.width} × {target.height} · {ratioLabel(target.width, target.height)}</span>
                </button>
              ))}
            </div>
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

          <ControlSection title="Resize and preview">
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
            <ControlGrid columns={2} className="mt-4">
              <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                Preview
                <Select className="mt-1" value={previewMode} onChange={(event) => setPreviewMode(event.target.value as PreviewMode)} aria-label="Preview mode">
                  <option value="shape">Shape card</option>
                  <option value="social">Social crop</option>
                  <option value="crop">Crop bounds</option>
                </Select>
              </label>
              <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                Overlay
                <Select className="mt-1" value={overlayMode} onChange={(event) => setOverlayMode(event.target.value as OverlayMode)} aria-label="Overlay mode">
                  <option value="clean">Clean</option>
                  <option value="safe">Safe zone</option>
                  <option value="grid">Grid</option>
                </Select>
              </label>
            </ControlGrid>
          </ControlSection>

          <ControlSection title="Export settings">
            <ControlGrid columns={2}>
              <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                CSS class
                <Input className="mt-1" value={className} onChange={(event) => setClassName(event.target.value)} aria-label="CSS class name" />
              </label>
              <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                Object fit
                <Select className="mt-1" value={objectFit} onChange={(event) => setObjectFit(event.target.value as "cover" | "contain")} aria-label="Object fit">
                  <option value="cover">cover</option>
                  <option value="contain">contain</option>
                </Select>
              </label>
            </ControlGrid>
          </ControlSection>

          {!valid ? <p className="mt-2 text-xs font-semibold text-[var(--color-danger)]">Enter positive width and height values.</p> : null}
        </ToolControlPanel>
      }
      actionsSlot={
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-[var(--color-text-tertiary)]">Current output: {valid && simplified ? `${simplified.label} · ${formatDimensionPair(width, height)}` : "Waiting for valid dimensions"}</span>
          <div className="flex flex-wrap gap-2">
            <CopyButton text={cssSnippet} size="sm" variant="secondary" disabled={!cssSnippet}>Copy ratio CSS</CopyButton>
            <CopyButton text={summary} size="sm" variant="secondary" disabled={!valid}>Copy report</CopyButton>
          </div>
        </div>
      }
      codeSlot={
        <div className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-black text-[var(--color-text-primary)]">Responsive scale ladder</h3>
                <CopyButton text={scaleText} size="sm" variant="secondary">Copy sizes</CopyButton>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {SCALE_OPTIONS.map((scale) => {
                  const scaled = scaledDimensions(width, height, scale);
                  return (
                    <div key={scale} className="min-w-0 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-overlay)] p-2 text-xs">
                      <div className="font-black text-[var(--color-text-primary)]">{scale}%</div>
                      <div className="mt-1 truncate font-mono text-[var(--color-text-secondary)]">{scaled ? `${scaled.width} × ${scaled.height}` : "—"}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4">
              <h3 className="text-sm font-black text-[var(--color-text-primary)]">Production checks</h3>
              <div className="mt-3 space-y-2">
                {checks.slice(0, 5).map((check) => (
                  <div key={check.id} className={`rounded-[var(--radius-sm)] border p-2 text-xs ${statusClasses(check.severity)}`}>
                    <div className="font-black">{check.title}</div>
                    <div className="mt-1 leading-5 opacity-85">{check.message}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-black text-[var(--color-text-primary)]">Production export</h3>
                <p className="text-xs text-[var(--color-text-tertiary)]">Copy modern CSS, markup, React, or design tokens.</p>
              </div>
              <CopyButton text={exportMap[activeExport]} size="sm" variant="secondary">Copy {activeExport.toUpperCase()}</CopyButton>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(["css", "html", "react", "tokens"] as ExportTab[]).map((tab) => (
                <Button key={tab} size="sm" variant={activeExport === tab ? "soft" : "secondary"} aria-pressed={activeExport === tab} onClick={() => setActiveExport(tab)}>
                  {labelCase(tab)}
                </Button>
              ))}
            </div>
            <pre className="mt-3 max-h-[280px] overflow-auto rounded-[var(--radius-sm)] bg-[var(--color-surface-subtle)] p-3 text-xs text-[var(--color-text-primary)]"><code>{exportMap[activeExport]}</code></pre>
          </div>
        </div>
      }
      presetsSlot={
        <WarningPanel
          messages={[
            { id: "workflow", severity: "info", title: "Designer workflow", message: "Pick a real target size, verify the crop, then copy CSS or tokens for implementation." },
            { id: "safe", severity: "info", title: "Safe-zone preview", message: "Use the safe overlay for story/reel content so text does not sit too close to cropped edges." },
            { id: "local", severity: "info", title: "Local calculation", message: "Everything is calculated in your browser — no images or dimensions are uploaded." },
          ]}
        />
      }
    />
  );
}

function MetricCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3 shadow-[inset_0_1px_0_var(--color-border-subtle)]">
      <div className="truncate font-mono text-xl font-black tracking-tight text-[var(--color-text-primary)]" title={value}>{value}</div>
      <div className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{label}</div>
      <div className="mt-1 truncate text-xs text-[var(--color-text-secondary)]" title={sub}>{sub}</div>
    </div>
  );
}

function InfoPanel({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3">
      <div className="text-xs font-black uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{title}</div>
      <div className="mt-2 space-y-1 text-sm font-semibold text-[var(--color-text-primary)]">
        {lines.filter(Boolean).map((line) => <p key={line} className="break-words">{line}</p>)}
      </div>
    </div>
  );
}

function PreviewCard({ width, height, ratio, previewMode, overlayMode, cropLoss }: { width: number; height: number; ratio: number; previewMode: PreviewMode; overlayMode: OverlayMode; cropLoss: number }) {
  const label = previewMode === "social" ? "Social preview" : previewMode === "crop" ? "Crop preview" : "Ratio shape";
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-black text-[var(--color-text-primary)]">{label}</h3>
          <p className="text-xs text-[var(--color-text-tertiary)]">{formatDimensionPair(width, height)} · {pixelCount(width, height)}</p>
        </div>
        <span className="rounded-[var(--radius-full)] bg-[var(--color-primary-soft)] px-2 py-1 text-xs font-black uppercase tracking-[0.08em] text-[var(--color-primary-text-strong)]">
          {formatPercent(cropLoss)} crop loss
        </span>
      </div>
      <div className="mt-4 flex min-h-[240px] items-center justify-center rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-default)] bg-[linear-gradient(135deg,var(--color-surface-subtle),var(--color-surface-overlay))] p-4">
        <div
          className="relative flex min-h-[110px] items-center justify-center overflow-hidden rounded-[var(--radius-sm)] border border-[var(--color-primary-border)] bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.28),transparent_32%),linear-gradient(135deg,var(--color-primary-soft),var(--color-surface-base))] text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_16px_50px_rgba(0,0,0,0.14)]"
          style={{ aspectRatio: `${ratio}`, width: "min(100%, 420px)", maxHeight: 240 }}
        >
          {overlayMode === "grid" ? <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.22)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.22)_1px,transparent_1px)] bg-[size:33.333%_33.333%]" /> : null}
          {overlayMode === "safe" ? <div className="absolute inset-[8%] rounded-[var(--radius-xs)] border border-dashed border-white/55" /> : null}
          {previewMode === "crop" ? <div className="absolute inset-y-0 left-1/2 w-[55%] -translate-x-1/2 border-x border-white/45 bg-white/5" /> : null}
          <div className="relative z-10 px-3">
            <div className="font-mono text-lg font-black text-[var(--color-text-primary)]">{compactNumber(width)} × {compactNumber(height)}</div>
            <div className="mt-1 text-xs font-black uppercase tracking-[0.1em] text-[var(--color-text-tertiary)]">{ratioLabel(width, height)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
