"use client";

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { BookOpen, Columns2, Download, Link2, Redo2, RotateCcw, ScanSearch, Search, Sparkles, Undo2, Upload, Wand2 } from "lucide-react";
import { Badge, Button, CopyButton, Field, Input, Select, Textarea } from "@/components/ui";
import { copyTextToClipboard } from "@/lib/copy-to-clipboard";
import { ToolLayoutVisualGenerator } from "@/features/tools/layouts";
import {
  CodeOutputPanel,
  ColorField,
  ControlGrid,
  PreviewToolbar,
  SegmentedControl,
  SliderNumberField,
  ToolControlPanel,
  WarningPanel,
  type CodeOutputTab,
  type WarningMessage,
} from "@/features/tools/components";
import { COLOR_WORKFLOW_ID, readColorWorkflowState, readableTextColor } from "@/features/tools/workflows/browserState";
import { useActiveWorkflowId } from "@/features/tools/workflows/useActiveWorkflow";
import { ButtonExamplesGallery } from "./ButtonExamplesGallery";
import { ButtonPreviewElement, type ButtonVisualState } from "./ButtonPreviewElement";
import { buttonPresets, defaultButtonConfig } from "./presets";
import {
  generateButtonCss,
  generateButtonHtml,
  generateButtonJsx,
  generateButtonReactStyle,
  generateButtonTailwind,
  generateButtonTokenJson,
  generateButtonVariables,
  getContrastRating,
  getContrastRatio,
  getReadableTextColorForBackgrounds,
  safeClassName,
} from "./generators";
import {
  generateButtonFamily,
  generateButtonFamilyCss,
  generateButtonFamilyHtml,
  generateButtonThemeCss,
  generateButtonThemeHtml,
  generateDarkModeConfig,
  mixHexColors,
  type ButtonFamilyMember,
} from "./systems";
import {
  decodeButtonStudioState,
  encodeButtonStudioState,
  getButtonLearningNotes,
  importButtonCss,
  sanitizeCustomCssOverrides,
} from "./studio-tools";
import type {
  ButtonBorderStyle,
  ButtonGeneratorConfig,
  ButtonHoverEffect,
  ButtonMotionEasing,
  ButtonPreset,
  ButtonShape,
  ButtonStyle,
  PreviewBackground,
  PreviewContext,
} from "./types";

const styles: Array<{ value: ButtonStyle; label: string }> = [
  { value: "solid", label: "Solid" },
  { value: "outline", label: "Outline" },
  { value: "ghost", label: "Ghost" },
  { value: "gradient", label: "Gradient" },
  { value: "glass", label: "Glass" },
  { value: "neumorphic", label: "Soft" },
  { value: "three-d", label: "3D" },
];

const shapes: Array<{ value: ButtonShape; label: string }> = [
  { value: "square", label: "Sharp" },
  { value: "rounded", label: "Rounded" },
  { value: "pill", label: "Pill" },
];

const hoverOptions: Array<{ value: ButtonHoverEffect; label: string }> = [
  { value: "lift", label: "Lift" },
  { value: "scale", label: "Scale" },
  { value: "glow", label: "Glow" },
  { value: "darken", label: "Darken" },
  { value: "slide", label: "Slide" },
  { value: "shine", label: "Shine" },
  { value: "fill", label: "Fill" },
  { value: "pulse", label: "Pulse" },
  { value: "bounce", label: "Bounce" },
  { value: "icon-shift", label: "Icon shift" },
  { value: "none", label: "None" },
];

const previewStates: ButtonVisualState[] = ["default", "hover", "active", "focus", "disabled", "loading"];
const backgroundOptions: Array<{ value: PreviewBackground; label: string }> = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "gradient", label: "Gradient" },
  { value: "custom", label: "Custom" },
];
const contextOptions: Array<{ value: PreviewContext; label: string }> = [
  { value: "canvas", label: "Canvas" },
  { value: "landing", label: "Landing" },
  { value: "form", label: "Form" },
  { value: "pricing", label: "Pricing" },
  { value: "checkout", label: "Checkout" },
];

const deviceOptions: Array<{ value: PreviewDevice; label: string }> = [
  { value: "desktop", label: "Desktop" },
  { value: "tablet", label: "Tablet" },
  { value: "mobile", label: "Mobile" },
];

const inputOptions: Array<{ value: PreviewInput; label: string }> = [
  { value: "mouse", label: "Mouse" },
  { value: "touch", label: "Touch" },
  { value: "keyboard", label: "Keyboard" },
];

const iconCatalog = [
  { symbol: "→", name: "Arrow right", keywords: "next continue forward" },
  { symbol: "←", name: "Arrow left", keywords: "back previous" },
  { symbol: "↗", name: "External", keywords: "open external launch" },
  { symbol: "↓", name: "Download", keywords: "download save" },
  { symbol: "↑", name: "Upload", keywords: "upload send" },
  { symbol: "+", name: "Plus", keywords: "add create new" },
  { symbol: "−", name: "Minus", keywords: "remove subtract" },
  { symbol: "✓", name: "Check", keywords: "success confirm done" },
  { symbol: "×", name: "Close", keywords: "close cancel delete" },
  { symbol: "▶", name: "Play", keywords: "play start media" },
  { symbol: "■", name: "Stop", keywords: "stop media" },
  { symbol: "★", name: "Star", keywords: "favorite featured rating" },
  { symbol: "♥", name: "Heart", keywords: "favorite like love" },
  { symbol: "↻", name: "Refresh", keywords: "refresh retry reload" },
  { symbol: "⌕", name: "Search", keywords: "search find" },
  { symbol: "⚙", name: "Settings", keywords: "settings configure gear" },
  { symbol: "✦", name: "Sparkle", keywords: "ai magic sparkle" },
  { symbol: "✉", name: "Mail", keywords: "email message contact" },
  { symbol: "⎘", name: "Copy", keywords: "copy duplicate clipboard" },
  { symbol: "⌁", name: "Link", keywords: "link chain url" },
] as const;

type MetricTone = "good" | "warning" | "danger" | "neutral";
type ProductionMetric = { label: string; value: string; detail: string; tone: MetricTone };

type SizePreset = "s" | "m" | "l" | "xl" | "custom";
type ShadowPreset = "none" | "soft" | "medium" | "floating" | "glow" | "custom";
type MotionPreview = "normal" | "reduced";
type PreviewDevice = "desktop" | "tablet" | "mobile";
type PreviewInput = "mouse" | "touch" | "keyboard";

function CheckboxRow({ label, checked, onChange }: { label: ReactNode; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex min-h-9 items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-strong)] px-3 py-2 text-sm text-[var(--color-text-primary)] shadow-[var(--shadow-xs)]">
      <span className="min-w-0 text-xs font-semibold leading-5">{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 shrink-0 accent-[var(--color-accent)]" />
    </label>
  );
}

function StudioSection({ title, description, defaultOpen = false, children }: { title: string; description?: string; defaultOpen?: boolean; children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <details
      className="group border-t border-[var(--color-border-subtle)] first:border-t-0"
      open={isOpen}
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-3 text-left [&::-webkit-details-marker]:hidden">
        <div className="min-w-0">
          <h3 className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">{title}</h3>
          {description ? <p className="mt-1 text-xs leading-4 text-[var(--color-text-tertiary)]">{description}</p> : null}
        </div>
        <span className="text-sm font-bold text-[var(--color-text-tertiary)] transition group-open:rotate-45">+</span>
      </summary>
      <div className="space-y-3 pb-4">{children}</div>
    </details>
  );
}

function toneClass(tone: MetricTone) {
  if (tone === "good") return "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100";
  if (tone === "warning") return "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100";
  if (tone === "danger") return "border-rose-200 bg-rose-50 text-rose-950 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100";
  return "border-[var(--color-border-default)] bg-[var(--color-surface-strong)] text-[var(--color-text-primary)]";
}

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function getPreviewSurface(background: PreviewBackground, customColor: string): CSSProperties {
  if (background === "dark") return { background: "linear-gradient(135deg, #020617, #0f172a 55%, #1e293b)" };
  if (background === "gradient") return { background: "radial-gradient(circle at 22% 18%, #22d3ee 0 14%, transparent 30%), linear-gradient(135deg, #0f172a, #4c1d95 50%, #0e7490)" };
  if (background === "custom") return { background: customColor };
  return { background: "radial-gradient(circle at top, #eef2ff, transparent 38%), linear-gradient(135deg, #ffffff, #f8fafc)" };
}

function previewSurfaceColor(background: PreviewBackground, customColor: string) {
  if (background === "dark") return "#0f172a";
  if (background === "gradient") return "#312e81";
  if (background === "custom") return customColor;
  return "#ffffff";
}

function contextSurfaceColor(context: PreviewContext, background: PreviewBackground, customColor: string) {
  if (context === "landing") return "#020617";
  if (context === "form" || context === "pricing" || context === "checkout") return "#ffffff";
  return previewSurfaceColor(background, customColor);
}

function getProductionMetrics(config: ButtonGeneratorConfig, ratio: number): ProductionMetric[] {
  const rating = getContrastRating(ratio);
  const clickArea = Math.round(config.paddingY * 2 + config.fontSize * config.lineHeight);
  const touchDetail = clickArea >= 44 ? "Comfortable" : clickArea >= 24 ? "Compact" : "Too small";
  const touchTone: MetricTone = clickArea >= 44 ? "good" : clickArea >= 24 ? "neutral" : "danger";
  const paintCost = config.shadowEnabled && config.shadowBlur > 36 || config.style === "glass" || config.style === "neumorphic" ? "Medium" : "Low";
  return [
    { label: "Contrast", value: `${ratio}:1`, detail: rating, tone: rating === "AAA" || rating === "AA" ? "good" : rating === "Large text" ? "warning" : "danger" },
    { label: "Touch height", value: `${clickArea}px`, detail: touchDetail, tone: touchTone },
    { label: "Paint", value: paintCost, detail: paintCost === "Low" ? "Efficient" : "Review effects", tone: paintCost === "Low" ? "good" : "warning" },
    { label: "Motion", value: config.includeReducedMotion ? "Guarded" : "Open", detail: config.includeReducedMotion ? "Reduced-motion ready" : "No fallback", tone: config.includeReducedMotion ? "good" : "warning" },
  ];
}

function ContextPreview({ context, config, state }: { context: PreviewContext; config: ButtonGeneratorConfig; state: ButtonVisualState }) {
  if (context === "canvas") return <ButtonPreviewElement config={config} state={state} />;

  if (context === "landing") {
    return (
      <div className="w-full max-w-xl rounded-3xl border border-white/15 bg-slate-950/90 p-7 text-left text-white shadow-2xl backdrop-blur sm:p-9">
        <div className="text-xs font-bold uppercase tracking-[0.14em] text-cyan-300">Darma Studio</div>
        <h3 className="mt-3 max-w-md text-3xl font-black tracking-[-0.05em]">Build interfaces people want to use.</h3>
        <p className="mt-3 max-w-lg text-sm leading-6 text-slate-300">Test the button where users actually see it, not only on an empty canvas.</p>
        <div className="mt-6"><ButtonPreviewElement config={config} state={state} /></div>
      </div>
    );
  }

  if (context === "form") {
    return (
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-xl">
        <h3 className="text-lg font-black tracking-[-0.03em] text-slate-950">Welcome back</h3>
        <div className="mt-5 space-y-3">
          <div><div className="mb-1.5 text-xs font-bold text-slate-600">Email</div><div className="h-10 rounded-lg border border-slate-200 bg-slate-50" /></div>
          <div><div className="mb-1.5 text-xs font-bold text-slate-600">Password</div><div className="h-10 rounded-lg border border-slate-200 bg-slate-50" /></div>
        </div>
        <div className="mt-5"><ButtonPreviewElement config={config} state={state} className="w-full" /></div>
      </div>
    );
  }

  if (context === "pricing") {
    return (
      <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-xl">
        <div className="text-xs font-black uppercase tracking-[0.12em] text-indigo-600">Professional</div>
        <div className="mt-2 text-4xl font-black tracking-[-0.06em] text-slate-950">$29<span className="text-sm font-semibold text-slate-500"> / month</span></div>
        <ul className="mt-5 space-y-2 text-sm text-slate-600"><li>✓ Unlimited projects</li><li>✓ Production exports</li><li>✓ Priority support</li></ul>
        <div className="mt-6"><ButtonPreviewElement config={config} state={state} className="w-full" /></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-xl">
      <div className="flex items-start justify-between gap-3"><div><div className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Checkout</div><h3 className="mt-1 text-xl font-black tracking-[-0.035em] text-slate-950">Upgrade your workspace</h3></div><span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-black uppercase text-emerald-700">Ready</span></div>
      <p className="mt-3 text-sm leading-6 text-slate-600">See spacing, hierarchy, and button weight inside a realistic product surface.</p>
      <div className="mt-5"><ButtonPreviewElement config={config} state={state} /></div>
    </div>
  );
}

function DevicePreviewFrame({
  device,
  surface,
  children,
}: {
  device: PreviewDevice;
  surface: CSSProperties;
  children: ReactNode;
}) {
  const width = device === "mobile" ? 390 : device === "tablet" ? 768 : "100%";
  const label = device === "mobile" ? "390px mobile" : device === "tablet" ? "768px tablet" : "Responsive desktop";
  const framed = device !== "desktop";

  return (
    <div className="flex w-full items-center justify-center p-4 sm:p-6">
      <div
        className={framed ? "w-full overflow-hidden rounded-[24px] border border-black/15 bg-white shadow-2xl" : "w-full overflow-hidden rounded-[var(--radius-md)]"}
        style={{ width, maxWidth: "100%" }}
      >
        {framed ? (
          <div className="flex h-9 items-center justify-between border-b border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-500">
            <div className="flex gap-1.5" aria-hidden="true"><span className="h-2 w-2 rounded-full bg-slate-300" /><span className="h-2 w-2 rounded-full bg-slate-300" /><span className="h-2 w-2 rounded-full bg-slate-300" /></div>
            <span>{label}</span>
          </div>
        ) : null}
        <div className={device === "mobile" ? "flex min-h-[430px] items-center justify-center p-5" : device === "tablet" ? "flex min-h-[430px] items-center justify-center p-7" : "flex min-h-[390px] items-center justify-center p-6 sm:min-h-[460px] sm:p-10"} style={surface}>
          {children}
        </div>
      </div>
    </div>
  );
}

function interactionCopy(input: PreviewInput) {
  if (input === "touch") return "Touch simulation forces the pressed state so you can judge tap feedback without hover.";
  if (input === "keyboard") return "Keyboard simulation forces :focus-visible and keeps the generated focus ring in view.";
  return "Mouse simulation forces hover while the live button still responds to real pointer interaction.";
}

export default function ButtonsCssGeneratorClient() {
  const workflowId = useActiveWorkflowId();
  const [config, setConfig] = useState<ButtonGeneratorConfig>(defaultButtonConfig);
  const [selectedPresetId, setSelectedPresetId] = useState<string>("primary-lift");
  const [previewState, setPreviewState] = useState<ButtonVisualState>("default");
  const [previewBackground, setPreviewBackground] = useState<PreviewBackground>("light");
  const [customPreviewBackground, setCustomPreviewBackground] = useState("#f8fafc");
  const [previewContext, setPreviewContext] = useState<PreviewContext>("canvas");
  const [sizePreset, setSizePreset] = useState<SizePreset>("m");
  const [shadowPreset, setShadowPreset] = useState<ShadowPreset>("medium");
  const [motionPreview, setMotionPreview] = useState<MotionPreview>("normal");
  const [undoStack, setUndoStack] = useState<ButtonGeneratorConfig[]>([]);
  const [redoStack, setRedoStack] = useState<ButtonGeneratorConfig[]>([]);
  const [compareBaseline, setCompareBaseline] = useState<ButtonGeneratorConfig | null>(null);
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>("desktop");
  const [previewInput, setPreviewInput] = useState<PreviewInput>("mouse");
  const [familyEnabled, setFamilyEnabled] = useState(false);
  const [themePairEnabled, setThemePairEnabled] = useState(false);
  const [learnMode, setLearnMode] = useState(false);
  const [inspectMode, setInspectMode] = useState(false);
  const [cssImportSource, setCssImportSource] = useState("");
  const [cssImportFeedback, setCssImportFeedback] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [iconQuery, setIconQuery] = useState("");

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("button");
    if (!token) return;
    const shared = decodeButtonStudioState(token);
    if (!shared) {
      setShareStatus("This shared button link could not be read.");
      return;
    }
    setConfig({ ...defaultButtonConfig, ...shared.config, customCss: sanitizeCustomCssOverrides(shared.config.customCss ?? "") });
    setPreviewBackground(shared.previewBackground);
    setCustomPreviewBackground(shared.customPreviewBackground);
    setPreviewContext(shared.previewContext);
    setPreviewDevice(shared.previewDevice);
    setPreviewInput(shared.previewInput);
    setMotionPreview(shared.motionPreview);
    setSelectedPresetId("");
    setSizePreset("custom");
    setShadowPreset("custom");
    setShareStatus("Shared configuration loaded.");
  }, []);

  useEffect(() => {
    if (workflowId !== COLOR_WORKFLOW_ID) return;
    const stored = readColorWorkflowState();
    if (!stored) return;
    const palette = stored.palette ?? [];
    const primary = palette[Math.floor(palette.length / 2)] ?? stored.primary;
    const secondary = palette.at(-1) ?? stored.secondary ?? primary;
    setConfig((current) => ({
      ...current,
      style: primary !== secondary ? "gradient" : current.style,
      background: primary,
      background2: secondary,
      borderColor: primary,
      textColor: readableTextColor(primary),
    }));
  }, [workflowId]);

  const responsivePreviewConfig = previewDevice === "mobile" && config.mobileFullWidth && !config.fullWidth ? { ...config, fullWidth: true } : config;
  const forcedPreviewConfig = previewState === "disabled" ? { ...responsivePreviewConfig, disabled: true } : responsivePreviewConfig;
  const comparePreviewConfig = useMemo(() => {
    if (!compareBaseline) return null;
    const responsiveBase = previewDevice === "mobile" && compareBaseline.mobileFullWidth && !compareBaseline.fullWidth ? { ...compareBaseline, fullWidth: true } : compareBaseline;
    const base = previewState === "disabled" ? { ...responsiveBase, disabled: true } : responsiveBase;
    return { ...base, className: `${safeClassName(compareBaseline.className)}-compare-a` };
  }, [compareBaseline, previewDevice, previewState]);

  const css = useMemo(() => generateButtonCss(config), [config]);
  const previewCss = useMemo(() => generateButtonCss(forcedPreviewConfig), [forcedPreviewConfig]);
  const compareCss = useMemo(() => comparePreviewConfig ? generateButtonCss(comparePreviewConfig) : "", [comparePreviewConfig]);
  const html = useMemo(() => generateButtonHtml(config), [config]);
  const jsx = useMemo(() => generateButtonJsx(config), [config]);
  const tailwind = useMemo(() => generateButtonTailwind(config), [config]);
  const variables = useMemo(() => generateButtonVariables(config), [config]);
  const reactStyle = useMemo(() => generateButtonReactStyle(config), [config]);
  const tokenJson = useMemo(() => generateButtonTokenJson(config), [config]);
  const buttonFamily = useMemo(() => generateButtonFamily(config), [config]);
  const familyCss = useMemo(() => generateButtonFamilyCss(config), [config]);
  const familyHtml = useMemo(() => generateButtonFamilyHtml(config), [config]);
  const darkModeConfig = useMemo(() => generateDarkModeConfig(config), [config]);
  const themeCss = useMemo(() => generateButtonThemeCss(config), [config]);
  const themeHtml = useMemo(() => generateButtonThemeHtml(config), [config]);
  const themeLightPreviewConfig = useMemo(
    () => ({ ...config, className: `${safeClassName(config.className)}-theme-light-preview` }),
    [config],
  );
  const themeDarkPreviewConfig = useMemo(
    () => ({ ...darkModeConfig, className: `${safeClassName(config.className)}-theme-dark-preview` }),
    [config.className, darkModeConfig],
  );
  const themePreviewCss = useMemo(
    () => `${generateButtonCss(themeLightPreviewConfig)}\n\n${generateButtonCss(themeDarkPreviewConfig)}`,
    [themeDarkPreviewConfig, themeLightPreviewConfig],
  );

  const reducedMotionSimulationCss = useMemo(() => {
    const names = [safeClassName(config.className)];
    if (comparePreviewConfig) names.push(safeClassName(comparePreviewConfig.className));
    if (familyEnabled) names.push(...buttonFamily.map((member) => safeClassName(member.config.className)));
    if (themePairEnabled) names.push(safeClassName(themeLightPreviewConfig.className), safeClassName(themeDarkPreviewConfig.className));
    return [...new Set(names)].map((name) => `.button-studio-reduced .${name},
.button-studio-reduced .${name}::after,
.button-studio-reduced .${name}__icon {
  transition: none !important;
  animation: none !important;
  transform: none !important;
}
.button-studio-reduced .${name}__spinner { animation: none !important; }`).join("\n");
  }, [buttonFamily, comparePreviewConfig, config.className, familyEnabled, themeDarkPreviewConfig.className, themeLightPreviewConfig.className, themePairEnabled]);

  const surfaceColor = contextSurfaceColor(previewContext, previewBackground, customPreviewBackground);
  const contrastBackgrounds = useMemo(() => {
    if (config.style === "gradient") return [config.background, config.background2];
    if (config.style === "outline" || config.style === "ghost") return [surfaceColor];
    if (config.style === "glass") return [mixHexColors(surfaceColor, config.background, 0.28)];
    return [config.background];
  }, [config.background, config.background2, config.style, surfaceColor]);
  const contrastRatio = useMemo(
    () => Math.min(...contrastBackgrounds.map((background) => getContrastRatio(config.textColor, background))),
    [config.textColor, contrastBackgrounds],
  );
  const focusContrastRatio = useMemo(
    () => config.includeFocusRing ? getContrastRatio(config.focusRingColor, surfaceColor) : null,
    [config.focusRingColor, config.includeFocusRing, surfaceColor],
  );
  const hoverContrastRatio = useMemo(() => config.customizeHoverState ? getContrastRatio(config.hoverTextColor, config.hoverBackground) : null, [config.customizeHoverState, config.hoverBackground, config.hoverTextColor]);
  const productionMetrics = useMemo(() => getProductionMetrics(config, contrastRatio), [config, contrastRatio]);
  const selectedPreset = useMemo(() => buttonPresets.find((preset) => preset.id === selectedPresetId), [selectedPresetId]);
  const presetModified = selectedPreset ? JSON.stringify(selectedPreset.config) !== JSON.stringify(config) : false;
  const learningNotes = useMemo(() => getButtonLearningNotes(config), [config]);
  const filteredIcons = useMemo(() => {
    const query = iconQuery.trim().toLowerCase();
    if (!query) return iconCatalog;
    return iconCatalog.filter((icon) => `${icon.name} ${icon.keywords} ${icon.symbol}`.toLowerCase().includes(query));
  }, [iconQuery]);
  const inspectionMetrics = useMemo(() => {
    const estimatedHeight = Math.round(config.paddingY * 2 + config.fontSize * config.lineHeight);
    const radius = config.shape === "pill" ? "pill" : `${config.shape === "square" ? 0 : config.radius}px`;
    return [
      ["Selector", `.${safeClassName(config.className)}`],
      ["Estimated height", `${estimatedHeight}px`],
      ["Padding", `${config.paddingY}px / ${config.paddingX}px`],
      ["Radius", radius],
      ["Typography", `${config.fontSize}px / ${config.fontWeight}`],
      ["Contrast", `${contrastRatio.toFixed(2)}:1`],
      ["State", previewState],
      ["Viewport", previewDevice],
      ["Responsive width", config.fullWidth ? "All widths" : config.mobileFullWidth ? "Full width ≤640px" : "Content width"],
    ] as const;
  }, [config, contrastRatio, previewDevice, previewState]);

  const tabs = useMemo<CodeOutputTab[]>(() => {
    const outputTabs: CodeOutputTab[] = [
      { id: "css", label: "CSS", language: "css", filename: "button.css", code: css },
      { id: "vars", label: "CSS vars", language: "css", filename: "button.variables.css", code: variables },
      { id: "html", label: "HTML", language: "html", filename: "button.html", code: html },
      { id: "jsx", label: "React JSX", language: "tsx", filename: "GeneratedButton.tsx", code: jsx },
      { id: "style", label: "React style", language: "tsx", filename: "button-style.ts", code: reactStyle },
      { id: "tailwind", label: "Tailwind", language: "txt", filename: "button-tailwind.txt", code: tailwind },
      { id: "tokens", label: "Tokens", language: "json", filename: "button.tokens.json", code: tokenJson },
    ];
    if (familyEnabled) {
      outputTabs.push(
        { id: "family-css", label: "Family CSS", language: "css", filename: "button-family.css", code: familyCss },
        { id: "family-html", label: "Family HTML", language: "html", filename: "button-family.html", code: familyHtml },
      );
    }
    if (themePairEnabled) {
      outputTabs.push(
        { id: "theme-css", label: "Theme CSS", language: "css", filename: "button-theme.css", code: themeCss },
        { id: "theme-html", label: "Theme HTML", language: "html", filename: "button-theme.html", code: themeHtml },
      );
    }
    return outputTabs;
  }, [css, familyCss, familyEnabled, familyHtml, html, jsx, reactStyle, tailwind, themeCss, themeHtml, themePairEnabled, tokenJson, variables]);

  const warnings = useMemo<WarningMessage[]>(() => {
    const messages: WarningMessage[] = [];
    if (contrastRatio < 4.5 && config.contentMode !== "icon-only") messages.push({ id: "contrast", severity: "danger", title: "Contrast needs review", message: "Text contrast is below AA for normal-size labels on the selected preview surface." });
    if (hoverContrastRatio !== null && hoverContrastRatio < 4.5 && config.contentMode !== "icon-only") messages.push({ id: "hover-contrast", severity: "warning", title: "Hover contrast needs review", message: "Your custom hover colors fall below AA for normal-size labels." });
    if (focusContrastRatio !== null && focusContrastRatio < 3) messages.push({ id: "focus-contrast", severity: "warning", title: "Focus ring may disappear", message: "The focus ring is below 3:1 contrast against the selected preview surface. Pick a stronger ring color or test another surface." });
    if (config.contentMode === "icon-only" && !config.text.trim()) messages.push({ id: "icon-label", severity: "danger", title: "Icon-only button needs a label", message: "Enter a descriptive accessible label. The label is used by screen readers even though it is visually hidden." });
    if (config.shadowEnabled && config.shadowBlur > 42) messages.push({ id: "shadow", severity: "warning", title: "Heavy shadow", message: "Large blur values can look muddy and cost more on dense screens." });
    if (config.paddingY * 2 + config.fontSize * config.lineHeight < 44) messages.push({ id: "tap", severity: "warning", title: "Compact touch height", message: "This button is below the studio’s 44px comfort target. It can still be intentional for dense interfaces, but test spacing and touch use carefully." });
    if (config.style === "glass") messages.push({ id: "glass", severity: "info", title: "Glass fallback", message: "Use the generated readable fallback when backdrop-filter is unavailable." });
    if (!config.includeReducedMotion && config.hoverEffect !== "none") messages.push({ id: "motion", severity: "warning", title: "Reduced motion disabled", message: "Enable the reduced-motion guard for a safer animation fallback." });
    if (config.customCss.trim()) messages.push({ id: "custom-css", severity: "info", title: "Custom CSS override", message: "Scoped custom declarations are appended to the CSS output. Tailwind and React-style exports may not reproduce every custom declaration." });
    if (config.mobileFullWidth && !config.fullWidth) messages.push({ id: "responsive-width", severity: "info", title: "Responsive width enabled", message: "CSS and Tailwind include the mobile full-width rule. React inline styles need the companion media query shown in the React style export." });
    return messages;
  }, [config, contrastRatio, focusContrastRatio, hoverContrastRatio]);

  function commitConfig(next: ButtonGeneratorConfig) {
    if (JSON.stringify(next) === JSON.stringify(config)) return;
    setUndoStack((stack) => [...stack, { ...config }].slice(-40));
    setRedoStack([]);
    setConfig(next);
  }

  function patch(patchConfig: Partial<ButtonGeneratorConfig>) {
    commitConfig({ ...config, ...patchConfig });
  }

  function undo() {
    const previous = undoStack[undoStack.length - 1];
    if (!previous) return;
    setRedoStack((stack) => [{ ...config }, ...stack].slice(0, 40));
    setUndoStack((stack) => stack.slice(0, -1));
    setConfig({ ...previous });
    setSizePreset("custom");
    setShadowPreset("custom");
  }

  function redo() {
    const next = redoStack[0];
    if (!next) return;
    setUndoStack((stack) => [...stack, { ...config }].slice(-40));
    setRedoStack((stack) => stack.slice(1));
    setConfig({ ...next });
    setSizePreset("custom");
    setShadowPreset("custom");
  }

  function toggleCompare() {
    setCompareBaseline((baseline) => baseline ? null : { ...config });
  }

  function applyCompareBaseline() {
    if (!compareBaseline) return;
    commitConfig({ ...compareBaseline });
    setCompareBaseline(null);
  }

  function applyPreset(preset: ButtonPreset) {
    commitConfig({ ...preset.config });
    setSelectedPresetId(preset.id);
    setPreviewBackground(preset.recommendedBackground ?? "light");
    setPreviewState("default");
    setSizePreset("custom");
    setShadowPreset("custom");
    requestAnimationFrame(() => {
      const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
      document.getElementById("button-studio")?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    });
  }

  function reset() {
    commitConfig({ ...defaultButtonConfig });
    setSelectedPresetId("primary-lift");
    setPreviewState("default");
    setPreviewBackground("light");
    setMotionPreview("normal");
    setCompareBaseline(null);
    setPreviewDevice("desktop");
    setPreviewInput("mouse");
    setFamilyEnabled(false);
    setThemePairEnabled(false);
    setLearnMode(false);
    setInspectMode(false);
    setCssImportSource("");
    setCssImportFeedback(null);
    setShareStatus(null);
    setIconQuery("");
    setSizePreset("m");
    setShadowPreset("medium");
  }

  function applyReadableText() {
    patch({ textColor: getReadableTextColorForBackgrounds(contrastBackgrounds) });
  }

  function applySize(value: SizePreset) {
    setSizePreset(value);
    const sizes: Record<Exclude<SizePreset, "custom">, Partial<ButtonGeneratorConfig>> = {
      s: { fontSize: 13, paddingX: 14, paddingY: 8 },
      m: { fontSize: 16, paddingX: 22, paddingY: 12 },
      l: { fontSize: 17, paddingX: 26, paddingY: 14 },
      xl: { fontSize: 18, paddingX: 30, paddingY: 16 },
    };
    if (value !== "custom") patch(sizes[value]);
  }

  function applyShadow(value: ShadowPreset) {
    setShadowPreset(value);
    const presets: Record<Exclude<ShadowPreset, "custom">, Partial<ButtonGeneratorConfig>> = {
      none: { shadowEnabled: false },
      soft: { shadowEnabled: true, shadowX: 0, shadowY: 4, shadowBlur: 12, shadowSpread: 0, shadowOpacity: 0.14, shadowInset: false },
      medium: { shadowEnabled: true, shadowX: 0, shadowY: 8, shadowBlur: 18, shadowSpread: 0, shadowOpacity: 0.24, shadowInset: false },
      floating: { shadowEnabled: true, shadowX: 0, shadowY: 12, shadowBlur: 30, shadowSpread: -4, shadowOpacity: 0.28, shadowInset: false },
      glow: { shadowEnabled: true, shadowX: 0, shadowY: 0, shadowBlur: 28, shadowSpread: 0, shadowOpacity: 0.42, shadowColor: config.background, shadowInset: false },
    };
    if (value !== "custom") patch(presets[value]);
  }

  function copyDefaultToHover() {
    patch({
      customizeHoverState: true,
      hoverBackground: config.background,
      hoverTextColor: config.textColor,
      hoverBorderColor: config.borderEnabled || config.style === "outline" ? config.borderColor : config.background,
      hoverTranslateY: 0,
      hoverScale: 1,
      hoverShadowY: config.shadowY,
      hoverShadowBlur: config.shadowBlur,
    });
  }

  function copyDefaultToActive() {
    patch({
      customizeActiveState: true,
      activeBackground: config.background,
      activeTextColor: config.textColor,
      activeBorderColor: config.borderEnabled || config.style === "outline" ? config.borderColor : config.background,
      activeTranslateY: 1,
      activeScale: 0.99,
    });
  }

  function inspireMe() {
    applyPreset(buttonPresets[Math.floor(Math.random() * buttonPresets.length)]);
  }

  function changePreviewInput(input: PreviewInput) {
    setPreviewInput(input);
    setPreviewState(input === "keyboard" ? "focus" : input === "touch" ? "active" : "hover");
  }

  function applyFamilyMember(member: ButtonFamilyMember) {
    commitConfig({
      ...member.config,
      className: config.className,
      text: config.text,
      contentMode: config.contentMode,
      iconPosition: config.iconPosition,
      iconSymbol: config.iconSymbol,
      loading: config.loading,
    });
    setSelectedPresetId("");
    setSizePreset("custom");
    setShadowPreset("custom");
  }

  function useDarkVariant() {
    commitConfig({ ...darkModeConfig, className: config.className });
    setSelectedPresetId("");
    setPreviewBackground("dark");
    setSizePreset("custom");
    setShadowPreset("custom");
  }

  function applyImportedCss() {
    if (!cssImportSource.trim()) {
      setCssImportFeedback("Paste a CSS button rule first.");
      return;
    }
    const result = importButtonCss(cssImportSource, config);
    if (result.matchedProperties < 1) {
      setCssImportFeedback(result.warnings.join(" ") || "No supported button declarations were detected.");
      return;
    }
    commitConfig({ ...result.config, customCss: sanitizeCustomCssOverrides(result.config.customCss) });
    setSelectedPresetId("");
    setSizePreset("custom");
    setShadowPreset("custom");
    const selector = result.selector ? ` from ${result.selector}` : "";
    const warningCopy = result.warnings.length ? ` ${result.warnings.join(" ")}` : "";
    setCssImportFeedback(`Imported ${result.matchedProperties} mapped value${result.matchedProperties === 1 ? "" : "s"}${selector}.${warningCopy}`);
  }

  async function copyShareLink() {
    const token = encodeButtonStudioState({
      version: 2,
      config: { ...config, customCss: sanitizeCustomCssOverrides(config.customCss) },
      previewBackground,
      customPreviewBackground,
      previewContext,
      previewDevice,
      previewInput,
      motionPreview,
    });
    const url = new URL(window.location.href);
    url.searchParams.set("button", token);
    url.hash = "button-studio";
    window.history.replaceState(null, "", url.toString());
    const copied = await copyTextToClipboard(url.toString());
    setShareStatus(copied ? "Share link copied." : "Share URL is ready in the address bar. Copy it manually if clipboard access is blocked.");
  }

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const editable = target?.isContentEditable || target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.tagName === "SELECT";
      if (editable || !(event.ctrlKey || event.metaKey)) return;
      const key = event.key.toLowerCase();
      if (key === "z" && !event.shiftKey) {
        const previous = undoStack[undoStack.length - 1];
        if (!previous) return;
        event.preventDefault();
        setRedoStack((stack) => [{ ...config }, ...stack].slice(0, 40));
        setUndoStack((stack) => stack.slice(0, -1));
        setConfig({ ...previous });
        setSizePreset("custom");
        setShadowPreset("custom");
        return;
      }
      if ((key === "z" && event.shiftKey) || key === "y") {
        const next = redoStack[0];
        if (!next) return;
        event.preventDefault();
        setUndoStack((stack) => [...stack, { ...config }].slice(-40));
        setRedoStack((stack) => stack.slice(1));
        setConfig({ ...next });
        setSizePreset("custom");
        setShadowPreset("custom");
      }
    }
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [config, redoStack, undoStack]);

  const previewSlot = (
    <div className="space-y-4">
      <style>{previewCss}</style>
      {compareCss ? <style>{compareCss}</style> : null}
      {familyEnabled ? <style>{familyCss}</style> : null}
      {themePairEnabled ? <style>{themePreviewCss}</style> : null}
      {motionPreview === "reduced" ? <style>{reducedMotionSimulationCss}</style> : null}
      <PreviewToolbar
        title="Button preview"
        description={selectedPreset ? `${selectedPreset.name}${presetModified ? " · Modified" : ""}. Test states, motion, and real UI contexts before you copy the code.` : "Test states, motion, and real UI contexts before you copy the code."}
        actions={
          <div className="flex flex-wrap items-end gap-2">
            <Field label="Context" density="compact"><Select size="sm" value={previewContext} onChange={(event) => setPreviewContext(event.target.value as PreviewContext)}>{contextOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</Select></Field>
            <Button variant={learnMode ? "primary" : "secondary"} size="sm" onClick={() => setLearnMode((value) => !value)} leftIcon={<BookOpen className="h-3.5 w-3.5" />}>Learn</Button>
            <Button variant={inspectMode ? "primary" : "secondary"} size="sm" onClick={() => setInspectMode((value) => !value)} leftIcon={<ScanSearch className="h-3.5 w-3.5" />}>Inspect</Button>
            <Button variant={compareBaseline ? "primary" : "secondary"} size="sm" onClick={toggleCompare} leftIcon={<Columns2 className="h-3.5 w-3.5" />}>{compareBaseline ? "Exit compare" : "Compare"}</Button>
          </div>
        }
      >
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
            <SegmentedControl ariaLabel="Preview state" value={previewState} onChange={(state) => setPreviewState(state)} options={previewStates.map((state) => ({ value: state, label: state }))} />
            <SegmentedControl ariaLabel="Preview background" value={previewBackground} onChange={(background) => setPreviewBackground(background)} options={backgroundOptions} />
          </div>
          <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-black uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Device</span>
              <SegmentedControl ariaLabel="Preview device" value={previewDevice} onChange={(device) => setPreviewDevice(device)} options={deviceOptions} />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-black uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Input</span>
              <SegmentedControl ariaLabel="Input simulation" value={previewInput} onChange={changePreviewInput} options={inputOptions} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-black uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Motion</span>
            <SegmentedControl ariaLabel="Motion simulation" value={motionPreview} onChange={(motion) => setMotionPreview(motion)} options={[{ value: "normal", label: "Normal" }, { value: "reduced", label: "Reduced" }]} />
          </div>
          <p className="text-xs leading-5 text-[var(--color-text-tertiary)]">{interactionCopy(previewInput)}</p>
        </div>
      </PreviewToolbar>

      {previewBackground === "custom" ? (
        <div className="px-4"><ColorField label="Custom canvas" value={customPreviewBackground} onChange={setCustomPreviewBackground} /></div>
      ) : null}

      <div className={motionPreview === "reduced" ? "button-studio-reduced" : ""}>
        <div className="mx-4 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] shadow-[var(--shadow-sm)] sm:mx-5">
          {comparePreviewConfig ? (
            <div className="grid gap-px bg-[var(--color-border-default)] lg:grid-cols-2">
              <div className="relative bg-[var(--color-surface-strong)]">
                <span className="absolute left-3 top-3 z-10 rounded-full border border-black/10 bg-white/90 px-2.5 py-1 font-mono text-xs font-black uppercase tracking-[0.08em] text-slate-700 shadow-sm">A · Baseline</span>
                <DevicePreviewFrame device={previewDevice} surface={getPreviewSurface(previewBackground, customPreviewBackground)}>
                  <ContextPreview context={previewContext} config={comparePreviewConfig} state={previewState} />
                </DevicePreviewFrame>
              </div>
              <div className="relative bg-[var(--color-surface-strong)]">
                <span className="absolute left-3 top-3 z-10 rounded-full border border-black/10 bg-white/90 px-2.5 py-1 font-mono text-xs font-black uppercase tracking-[0.08em] text-slate-700 shadow-sm">B · Current</span>
                <DevicePreviewFrame device={previewDevice} surface={getPreviewSurface(previewBackground, customPreviewBackground)}>
                  <ContextPreview context={previewContext} config={forcedPreviewConfig} state={previewState} />
                </DevicePreviewFrame>
              </div>
            </div>
          ) : (
            <DevicePreviewFrame device={previewDevice} surface={getPreviewSurface(previewBackground, customPreviewBackground)}>
              <ContextPreview context={previewContext} config={forcedPreviewConfig} state={previewState} />
            </DevicePreviewFrame>
          )}
        </div>

        {inspectMode ? (
          <div className="mx-4 mt-3 grid gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-strong)] p-3 sm:mx-5 sm:grid-cols-2 xl:grid-cols-4">
            {inspectionMetrics.map(([label, value]) => (
              <div key={label} className="rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] px-3 py-2">
                <div className="font-mono text-xs font-black uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{label}</div>
                <div className="mt-1 break-all text-xs font-black text-[var(--color-text-primary)]">{value}</div>
              </div>
            ))}
          </div>
        ) : null}

        {learnMode ? (
          <div className="mx-4 mt-3 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-strong)] p-3 sm:mx-5">
            <div className="mb-3"><div className="text-xs font-black text-[var(--color-text-primary)]">Learn what the controls generate</div><p className="mt-1 text-xs leading-5 text-[var(--color-text-tertiary)]">These snippets update live as you edit the button. They explain the CSS rather than replacing the full export below.</p></div>
            <div className="grid gap-2 md:grid-cols-2">
              {learningNotes.map((note) => (
                <div key={note.label} className="rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-3">
                  <div className="font-mono text-xs font-black uppercase tracking-[0.08em] text-[var(--color-primary-text-strong)]">{note.label}</div>
                  <code className="mt-2 block overflow-x-auto rounded bg-[var(--color-surface-inset)] px-2 py-1.5 text-xs text-[var(--color-text-primary)]">{note.css}</code>
                  <p className="mt-2 text-xs leading-5 text-[var(--color-text-tertiary)]">{note.explanation}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {comparePreviewConfig ? (
          <div className="mx-4 mt-3 flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-strong)] px-3 py-2 sm:mx-5">
            <p className="text-xs text-[var(--color-text-tertiary)]">A stays frozen while you edit B. Choose the baseline or keep your current version.</p>
            <div className="flex gap-2"><Button size="sm" variant="secondary" onClick={applyCompareBaseline}>Use A</Button><Button size="sm" onClick={() => setCompareBaseline(null)}>Keep B</Button></div>
          </div>
        ) : null}

        <div className="mx-4 mt-4 flex flex-wrap gap-2 sm:mx-5">
          {productionMetrics.map((metric) => (
            <div key={metric.label} title={metric.detail} className={`flex items-center gap-2 rounded-full border px-3 py-1.5 shadow-[var(--shadow-xs)] ${toneClass(metric.tone)}`}>
              <span className="font-mono text-xs font-black uppercase tracking-[0.08em] opacity-70">{metric.label}</span>
              <span className="text-xs font-black">{metric.value}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 rounded-full border border-[var(--color-border-default)] bg-[var(--color-surface-strong)] px-3 py-1.5 text-[var(--color-text-secondary)] shadow-[var(--shadow-xs)]">
            <span className="font-mono text-xs font-black uppercase tracking-[0.08em] opacity-70">Simulation</span>
            <span className="text-xs font-black">{motionPreview === "reduced" ? "Reduced motion" : "Normal motion"}</span>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[var(--color-border-default)] bg-[var(--color-surface-strong)] px-3 py-1.5 text-[var(--color-text-secondary)] shadow-[var(--shadow-xs)]">
            <span className="font-mono text-xs font-black uppercase tracking-[0.08em] opacity-70">Device</span>
            <span className="text-xs font-black">{previewDevice}</span>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[var(--color-border-default)] bg-[var(--color-surface-strong)] px-3 py-1.5 text-[var(--color-text-secondary)] shadow-[var(--shadow-xs)]">
            <span className="font-mono text-xs font-black uppercase tracking-[0.08em] opacity-70">Input</span>
            <span className="text-xs font-black">{previewInput}</span>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[var(--color-border-default)] bg-[var(--color-surface-strong)] px-3 py-1.5 text-[var(--color-text-secondary)] shadow-[var(--shadow-xs)]">
            <span className="font-mono text-xs font-black uppercase tracking-[0.08em] opacity-70">Output</span>
            <span className="text-xs font-black">CSS only</span>
          </div>
        </div>

        <details className="mx-4 mt-4 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-strong)] sm:mx-5">
          <summary className="cursor-pointer px-4 py-3 text-xs font-bold text-[var(--color-text-secondary)]">View all interaction states</summary>
          <div className="grid gap-2 border-t border-[var(--color-border-subtle)] p-3 sm:grid-cols-2 lg:grid-cols-3">
            {previewStates.map((state) => {
              const stateConfig = state === "disabled" ? { ...config, disabled: true } : config;
              return (
                <div key={state} className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-3">
                  <div className="mb-3 font-mono text-xs font-black uppercase tracking-[0.1em] text-[var(--color-text-tertiary)]">{state}</div>
                  <div className="flex min-h-16 items-center justify-center overflow-hidden rounded-[var(--radius-sm)] p-3" style={getPreviewSurface(previewBackground, customPreviewBackground)}><ButtonPreviewElement config={stateConfig} state={state} /></div>
                </div>
              );
            })}
          </div>
        </details>

        <section className="mx-4 mt-4 overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-strong)] sm:mx-5">
          <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="font-mono text-xs font-black uppercase tracking-[0.1em] text-[var(--color-primary-text-strong)]">Design system lab</div>
              <h3 className="mt-1 text-sm font-black text-[var(--color-text-primary)]">Turn one button into a reusable system</h3>
              <p className="mt-1 text-xs leading-5 text-[var(--color-text-tertiary)]">Generate semantic roles and an automatic dark-theme companion without changing the button you are editing.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant={familyEnabled ? "primary" : "secondary"} onClick={() => setFamilyEnabled((value) => !value)}>{familyEnabled ? "Hide family" : "Generate family"}</Button>
              <Button size="sm" variant={themePairEnabled ? "primary" : "secondary"} onClick={() => setThemePairEnabled((value) => !value)}>{themePairEnabled ? "Hide themes" : "Generate light / dark"}</Button>
            </div>
          </div>

          {familyEnabled ? (
            <div className="border-t border-[var(--color-border-subtle)] p-3 sm:p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div><div className="text-xs font-black text-[var(--color-text-primary)]">Button family</div><div className="mt-1 text-xs text-[var(--color-text-tertiary)]">Six semantic roles inherit your radius, sizing, typography, motion, and accessibility defaults.</div></div>
                <CopyButton text={familyCss}>Copy family CSS</CopyButton>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {buttonFamily.map((member) => (
                  <div key={member.role} className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)]">
                    <div className="flex min-h-24 items-center justify-center p-4" style={getPreviewSurface("light", "#ffffff")}><ButtonPreviewElement config={member.config} /></div>
                    <div className="border-t border-[var(--color-border-subtle)] p-3">
                      <div className="flex items-center justify-between gap-2"><span className="text-xs font-black text-[var(--color-text-primary)]">{member.label}</span><button type="button" onClick={() => applyFamilyMember(member)} className="text-xs font-bold text-[var(--color-primary-text-strong)] hover:underline">Use style</button></div>
                      <p className="mt-1 text-xs leading-4 text-[var(--color-text-tertiary)]">{member.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {themePairEnabled ? (
            <div className="border-t border-[var(--color-border-subtle)] p-3 sm:p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div><div className="text-xs font-black text-[var(--color-text-primary)]">Automatic theme pair</div><div className="mt-1 text-xs text-[var(--color-text-tertiary)]">The dark variant adjusts accent visibility, readable text, borders, shadows, and focus treatment for a dark surface.</div></div>
                <div className="flex gap-2"><Button size="sm" variant="secondary" onClick={useDarkVariant}>Use dark variant</Button><CopyButton text={themeCss}>Copy theme CSS</CopyButton></div>
              </div>
              <div className="grid overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] lg:grid-cols-2">
                <div className="flex min-h-44 flex-col items-center justify-center gap-3 bg-white p-6">
                  <span className="font-mono text-xs font-black uppercase tracking-[0.1em] text-slate-500">Light</span>
                  <ButtonPreviewElement config={themeLightPreviewConfig} />
                </div>
                <div className="flex min-h-44 flex-col items-center justify-center gap-3 bg-slate-950 p-6">
                  <span className="font-mono text-xs font-black uppercase tracking-[0.1em] text-slate-400">Dark</span>
                  <ButtonPreviewElement config={themeDarkPreviewConfig} />
                </div>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );

  const controlsSlot = (
    <ToolControlPanel
      title="Customize"
      description="Start with quick choices. Open advanced sections only when you need them."
      badge={<Badge variant="soft">{config.style}</Badge>}
      footer={<span>Live output · .{safeClassName(config.className)} · {config.contentMode} · Ctrl/⌘ Z undo · Shift+Ctrl/⌘ Z redo</span>}
    >
      <StudioSection title="Quick style" description="The fastest path to a production-ready button." defaultOpen>
        <Field label="Style" density="compact"><SegmentedControl fullWidth ariaLabel="Button style" value={config.style} onChange={(style) => patch({ style, borderEnabled: style === "outline" ? true : config.borderEnabled })} options={styles} /></Field>
        <Field label="Shape" density="compact"><SegmentedControl fullWidth ariaLabel="Button shape" value={config.shape} onChange={(shape) => patch({ shape })} options={shapes} /></Field>
        <Field label="Size" density="compact"><SegmentedControl fullWidth ariaLabel="Button size" value={sizePreset} onChange={applySize} options={[{ value: "s", label: "S" }, { value: "m", label: "M" }, { value: "l", label: "L" }, { value: "xl", label: "XL" }, { value: "custom", label: "Custom" }]} /></Field>
      </StudioSection>

      <StudioSection title="Content" description="Label, icon treatment, and loading state." defaultOpen>
        <Field label={config.contentMode === "icon-only" ? "Accessible label" : "Button label"} density="compact"><Input size="sm" maxLength={48} value={config.text} onChange={(event) => patch({ text: event.target.value })} placeholder={config.contentMode === "icon-only" ? "Describe the icon action" : "Button label"} /></Field>
        <Field label="Content" density="compact"><SegmentedControl fullWidth ariaLabel="Button content" value={config.contentMode} onChange={(contentMode) => patch({ contentMode })} options={[{ value: "text", label: "Text" }, { value: "text-icon", label: "Text + icon" }, { value: "icon-only", label: "Icon only" }]} /></Field>
        {config.contentMode !== "text" ? (
          <>
            <Field label="Icon" density="compact">
              <div className="space-y-2">
                <div className="relative"><Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-text-tertiary)]" /><Input size="sm" value={iconQuery} onChange={(event) => setIconQuery(event.target.value)} placeholder="Search icons…" className="pl-8" /></div>
                <div className="grid max-h-36 grid-cols-5 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-7">{filteredIcons.map((icon) => <button key={icon.name} type="button" title={icon.name} aria-label={icon.name} aria-pressed={config.iconSymbol === icon.symbol} onClick={() => patch({ iconSymbol: icon.symbol })} className={`min-h-9 rounded-[var(--radius-sm)] border text-sm font-bold transition ${config.iconSymbol === icon.symbol ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary-text-strong)]" : "border-[var(--color-border-default)] bg-[var(--color-surface-strong)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]"}`}>{icon.symbol}</button>)}</div>
                {!filteredIcons.length ? <p className="text-xs text-[var(--color-text-tertiary)]">No matching icons. You can still paste a custom symbol below.</p> : null}
                <Field label="Custom symbol" density="compact"><Input size="sm" maxLength={4} value={config.iconSymbol} onChange={(event) => patch({ iconSymbol: event.target.value })} /></Field>
              </div>
            </Field>
            <Field label="Icon position" density="compact"><SegmentedControl fullWidth ariaLabel="Icon position" value={config.iconPosition} onChange={(iconPosition) => patch({ iconPosition })} options={[{ value: "left", label: "Left" }, { value: "right", label: "Right" }]} /></Field>
          </>
        ) : null}
        <CheckboxRow label="Loading / busy state" checked={config.loading} onChange={(loading) => patch({ loading, hoverEffect: loading ? "none" : config.hoverEffect })} />
      </StudioSection>

      <StudioSection title="Appearance" description="Colors and gradient direction." defaultOpen>
        <ControlGrid columns={2}>
          <ColorField label={config.style === "outline" ? "Fill color" : "Background"} value={config.background} onChange={(background) => patch({ background, shadowColor: shadowPreset === "glow" ? background : config.shadowColor })} />
          {config.style === "gradient" ? <ColorField label="Second color" value={config.background2} onChange={(background2) => patch({ background2 })} /> : null}
          <ColorField label="Text" value={config.textColor} onChange={(textColor) => patch({ textColor })} />
        </ControlGrid>
        {config.style === "gradient" ? <SliderNumberField label="Gradient angle" value={config.gradientAngle} min={0} max={360} unit="°" onChange={(gradientAngle) => patch({ gradientAngle })} /> : null}
        <Button variant="secondary" size="sm" onClick={applyReadableText} leftIcon={<Wand2 className="h-3.5 w-3.5" />}>Auto readable text</Button>
      </StudioSection>

      <StudioSection title="Border" description="Enable only when the design needs a visible edge.">
        <CheckboxRow label="Visible border" checked={config.borderEnabled || config.style === "outline"} onChange={(borderEnabled) => patch({ borderEnabled })} />
        {config.borderEnabled || config.style === "outline" ? (
          <>
            <ControlGrid columns={2}>
              <SliderNumberField label="Width" value={config.borderWidth} min={1} max={6} unit="px" onChange={(borderWidth) => patch({ borderWidth })} />
              <Field label="Style" density="compact"><Select size="sm" value={config.borderStyle} onChange={(event) => patch({ borderStyle: event.target.value as ButtonBorderStyle })}><option value="solid">Solid</option><option value="dashed">Dashed</option><option value="dotted">Dotted</option><option value="double">Double</option></Select></Field>
            </ControlGrid>
            <ColorField label="Border color" value={config.borderColor} onChange={(borderColor) => patch({ borderColor })} />
          </>
        ) : null}
      </StudioSection>

      <StudioSection title="Shadow" description="Use presets first, then tune the CSS shadow precisely.">
        <Field label="Shadow preset" density="compact"><SegmentedControl fullWidth ariaLabel="Shadow preset" value={shadowPreset} onChange={applyShadow} options={[{ value: "none", label: "None" }, { value: "soft", label: "Soft" }, { value: "medium", label: "Medium" }, { value: "floating", label: "Float" }, { value: "glow", label: "Glow" }, { value: "custom", label: "Custom" }]} /></Field>
        {config.shadowEnabled ? (
          <>
            <ControlGrid columns={2}>
              <SliderNumberField label="X" value={config.shadowX} min={-24} max={24} unit="px" onChange={(shadowX) => { setShadowPreset("custom"); patch({ shadowX }); }} />
              <SliderNumberField label="Y" value={config.shadowY} min={-24} max={36} unit="px" onChange={(shadowY) => { setShadowPreset("custom"); patch({ shadowY }); }} />
              <SliderNumberField label="Blur" value={config.shadowBlur} min={0} max={64} unit="px" onChange={(shadowBlur) => { setShadowPreset("custom"); patch({ shadowBlur }); }} />
              <SliderNumberField label="Spread" value={config.shadowSpread} min={-16} max={24} unit="px" onChange={(shadowSpread) => { setShadowPreset("custom"); patch({ shadowSpread }); }} />
              <SliderNumberField label="Opacity" value={Math.round(config.shadowOpacity * 100)} min={0} max={100} unit="%" onChange={(value) => { setShadowPreset("custom"); patch({ shadowOpacity: value / 100 }); }} />
            </ControlGrid>
            <ColorField label="Shadow color" value={config.shadowColor} onChange={(shadowColor) => { setShadowPreset("custom"); patch({ shadowColor }); }} />
            <CheckboxRow label="Inset shadow" checked={config.shadowInset} onChange={(shadowInset) => { setShadowPreset("custom"); patch({ shadowInset }); }} />
          </>
        ) : null}
      </StudioSection>

      <StudioSection title="Typography & sizing" description="Fine-tune the custom size after using S/M/L presets.">
        <ControlGrid columns={2}>
          <SliderNumberField label="Font size" value={config.fontSize} min={12} max={28} unit="px" onChange={(fontSize) => { setSizePreset("custom"); patch({ fontSize }); }} />
          <SliderNumberField label="Weight" value={config.fontWeight} min={300} max={900} step={100} onChange={(fontWeight) => patch({ fontWeight })} />
          <SliderNumberField label="Padding X" value={config.paddingX} min={6} max={60} unit="px" onChange={(paddingX) => { setSizePreset("custom"); patch({ paddingX }); }} />
          <SliderNumberField label="Padding Y" value={config.paddingY} min={4} max={30} unit="px" onChange={(paddingY) => { setSizePreset("custom"); patch({ paddingY }); }} />
          {config.shape === "rounded" ? <SliderNumberField label="Radius" value={config.radius} min={2} max={48} unit="px" onChange={(radius) => patch({ radius })} /> : null}
          <SliderNumberField label="Min width" value={config.minWidth} min={0} max={280} step={8} unit="px" onChange={(minWidth) => patch({ minWidth })} />
          <SliderNumberField label="Line height" value={config.lineHeight} min={0.9} max={1.8} step={0.1} onChange={(lineHeight) => patch({ lineHeight })} />
          <SliderNumberField label="Letter spacing" value={config.letterSpacing} min={-1} max={3} step={0.1} unit="px" onChange={(letterSpacing) => patch({ letterSpacing })} />
        </ControlGrid>
        <ControlGrid columns={2}><CheckboxRow label="Full width" checked={config.fullWidth} onChange={(fullWidth) => patch({ fullWidth, mobileFullWidth: fullWidth ? false : config.mobileFullWidth })} /><CheckboxRow label="Full width on mobile" checked={config.mobileFullWidth} onChange={(mobileFullWidth) => patch({ mobileFullWidth, fullWidth: mobileFullWidth ? false : config.fullWidth })} /><CheckboxRow label="Uppercase" checked={config.uppercase} onChange={(uppercase) => patch({ uppercase })} /></ControlGrid>
      </StudioSection>

      <StudioSection title="States & motion" description="Design hover, press, focus, and motion without changing the default state." defaultOpen>
        <Field label="Hover preset" density="compact"><Select size="sm" value={config.hoverEffect} disabled={config.customizeHoverState} onChange={(event) => patch({ hoverEffect: event.target.value as ButtonHoverEffect })}>{hoverOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</Select></Field>
        <ControlGrid columns={2}>
          <SliderNumberField label="Duration" value={config.motionDuration} min={80} max={700} step={10} unit="ms" onChange={(motionDuration) => patch({ motionDuration })} />
          <Field label="Easing" density="compact"><Select size="sm" value={config.motionEasing} onChange={(event) => patch({ motionEasing: event.target.value as ButtonMotionEasing })}><option value="ease-out">Ease out</option><option value="ease">Ease</option><option value="ease-in-out">Ease in-out</option><option value="linear">Linear</option></Select></Field>
        </ControlGrid>

        <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-strong)] p-3">
          <div className="flex items-center justify-between gap-3"><div><div className="text-xs font-black text-[var(--color-text-primary)]">Custom hover state</div><div className="mt-1 text-xs leading-4 text-[var(--color-text-tertiary)]">Override preset motion with your own colors, lift, scale, and shadow.</div></div><input type="checkbox" checked={config.customizeHoverState} onChange={(event) => event.target.checked ? copyDefaultToHover() : patch({ customizeHoverState: false })} className="h-4 w-4 shrink-0 accent-[var(--color-accent)]" /></div>
          {config.customizeHoverState ? <div className="mt-3 space-y-3 border-t border-[var(--color-border-subtle)] pt-3">
            <ControlGrid columns={2}><ColorField label="Hover background" value={config.hoverBackground} onChange={(hoverBackground) => patch({ hoverBackground })} /><ColorField label="Hover text" value={config.hoverTextColor} onChange={(hoverTextColor) => patch({ hoverTextColor })} /><ColorField label="Hover border" value={config.hoverBorderColor} onChange={(hoverBorderColor) => patch({ hoverBorderColor })} /></ControlGrid>
            <ControlGrid columns={2}><SliderNumberField label="Lift Y" value={config.hoverTranslateY} min={-12} max={8} unit="px" onChange={(hoverTranslateY) => patch({ hoverTranslateY })} /><SliderNumberField label="Scale" value={config.hoverScale} min={0.9} max={1.12} step={0.01} onChange={(hoverScale) => patch({ hoverScale })} /><SliderNumberField label="Shadow Y" value={config.hoverShadowY} min={-8} max={36} unit="px" onChange={(hoverShadowY) => patch({ hoverShadowY })} /><SliderNumberField label="Shadow blur" value={config.hoverShadowBlur} min={0} max={72} unit="px" onChange={(hoverShadowBlur) => patch({ hoverShadowBlur })} /></ControlGrid>
            <Button variant="secondary" size="sm" onClick={copyDefaultToHover}>Copy default again</Button>
          </div> : null}
        </div>

        <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-strong)] p-3">
          <CheckboxRow label="Active press state" checked={config.activeEffect} onChange={(activeEffect) => patch({ activeEffect })} />
          {config.activeEffect ? <div className="mt-3 space-y-3"><CheckboxRow label="Customize active colors and motion" checked={config.customizeActiveState} onChange={(checked) => checked ? copyDefaultToActive() : patch({ customizeActiveState: false })} />{config.customizeActiveState ? <><ControlGrid columns={2}><ColorField label="Active background" value={config.activeBackground} onChange={(activeBackground) => patch({ activeBackground })} /><ColorField label="Active text" value={config.activeTextColor} onChange={(activeTextColor) => patch({ activeTextColor })} /><ColorField label="Active border" value={config.activeBorderColor} onChange={(activeBorderColor) => patch({ activeBorderColor })} /></ControlGrid><ControlGrid columns={2}><SliderNumberField label="Press Y" value={config.activeTranslateY} min={-4} max={8} unit="px" onChange={(activeTranslateY) => patch({ activeTranslateY })} /><SliderNumberField label="Scale" value={config.activeScale} min={0.9} max={1.06} step={0.01} onChange={(activeScale) => patch({ activeScale })} /></ControlGrid></> : null}</div> : null}
        </div>

        <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-strong)] p-3">
          <CheckboxRow label="Focus-visible ring" checked={config.includeFocusRing} onChange={(includeFocusRing) => patch({ includeFocusRing })} />
          {config.includeFocusRing ? <div className="mt-3 space-y-3"><ColorField label="Focus ring" value={config.focusRingColor} onChange={(focusRingColor) => patch({ focusRingColor })} /><ControlGrid columns={2}><SliderNumberField label="Ring width" value={config.focusRingWidth} min={1} max={8} unit="px" onChange={(focusRingWidth) => patch({ focusRingWidth })} /><SliderNumberField label="Ring offset" value={config.focusRingOffset} min={0} max={10} unit="px" onChange={(focusRingOffset) => patch({ focusRingOffset })} /></ControlGrid></div> : null}
        </div>

        <SliderNumberField label="Disabled opacity" value={Math.round(config.disabledOpacity * 100)} min={20} max={90} unit="%" onChange={(value) => patch({ disabledOpacity: value / 100 })} />
      </StudioSection>

      <StudioSection title="Accessibility & advanced" description="Production defaults, CSS import, and scoped overrides for power users.">
        <ControlGrid columns={2}><CheckboxRow label="Disabled" checked={config.disabled} onChange={(disabled) => patch({ disabled })} /><CheckboxRow label="Reduced-motion CSS" checked={config.includeReducedMotion} onChange={(includeReducedMotion) => patch({ includeReducedMotion })} /></ControlGrid>
        <Field label="CSS class" density="compact"><Input size="sm" maxLength={40} value={config.className} onChange={(event) => patch({ className: event.target.value })} /></Field>

        <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-strong)] p-3">
          <div className="flex items-start gap-2"><Upload className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary-text-strong)]" /><div><div className="text-xs font-black text-[var(--color-text-primary)]">Import existing CSS</div><p className="mt-1 text-xs leading-5 text-[var(--color-text-tertiary)]">Paste a normal button rule. Darma maps supported properties into editable controls and keeps unmatched base declarations as scoped custom CSS.</p></div></div>
          <div className="mt-3"><Textarea variant="editor" minRows={6} value={cssImportSource} onChange={(event) => setCssImportSource(event.target.value)} placeholder={".my-button {\n  background: #2563eb;\n  color: #fff;\n  padding: 12px 24px;\n}\n\n.my-button:hover { transform: translateY(-2px); }"} /></div>
          <div className="mt-2 flex flex-wrap items-center gap-2"><Button size="sm" onClick={applyImportedCss}>Import into studio</Button><Button size="sm" variant="secondary" onClick={() => { setCssImportSource(""); setCssImportFeedback(null); }}>Clear</Button></div>
          {cssImportFeedback ? <p role="status" aria-live="polite" className="mt-2 rounded-[var(--radius-sm)] bg-[var(--color-surface)] px-2.5 py-2 text-xs leading-5 text-[var(--color-text-secondary)]">{cssImportFeedback}</p> : null}
        </div>

        <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-strong)] p-3">
          <div className="text-xs font-black text-[var(--color-text-primary)]">Scoped custom CSS</div>
          <p className="mt-1 text-xs leading-5 text-[var(--color-text-tertiary)]">Declarations only. They are appended inside the generated button selector. Global rules, braces, URLs, and at-rules are stripped before preview/export.</p>
          <div className="mt-3"><Textarea variant="editor" minRows={5} value={config.customCss} onChange={(event) => patch({ customCss: sanitizeCustomCssOverrides(event.target.value) })} placeholder={"filter: saturate(1.08);\ntext-shadow: 0 1px 1px rgba(0,0,0,.12);"} /></div>
          {config.customCss ? <div className="mt-2 flex justify-end"><Button variant="secondary" size="sm" onClick={() => patch({ customCss: "" })}>Remove overrides</Button></div> : null}
        </div>
      </StudioSection>
    </ToolControlPanel>
  );

  return (
    <div className="space-y-6">
      <ButtonExamplesGallery selectedPresetId={selectedPresetId} onSelect={applyPreset} />

      <div id="button-studio" className="scroll-mt-24">
        <ToolLayoutVisualGenerator
          previewSlot={previewSlot}
          controlsSlot={controlsSlot}
          actionsPlacement="under-preview"
          actionsSlot={
            <div className="flex w-full flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={reset} leftIcon={<RotateCcw className="h-4 w-4" />}>Reset</Button><Button variant="secondary" onClick={undo} disabled={!undoStack.length} leftIcon={<Undo2 className="h-4 w-4" />}>Undo</Button><Button variant="secondary" onClick={redo} disabled={!redoStack.length} leftIcon={<Redo2 className="h-4 w-4" />}>Redo</Button><Button variant="secondary" onClick={inspireMe} leftIcon={<Sparkles className="h-4 w-4" />}>Inspire me</Button></div>
              <div className="flex flex-wrap items-center justify-end gap-2">{shareStatus ? <span role="status" aria-live="polite" className="max-w-56 text-right text-xs leading-4 text-[var(--color-text-tertiary)]">{shareStatus}</span> : null}<Button variant="secondary" onClick={copyShareLink} leftIcon={<Link2 className="h-4 w-4" />}>Share</Button><CopyButton text={css}>Copy CSS</CopyButton></div>
            </div>
          }
          codeSlot={
            <div className="space-y-4">
              <WarningPanel title="Production checks" messages={warnings} />
              <CodeOutputPanel
                title="Generated button code"
                description="The forced preview state never changes your export. CSS is the source of truth for every state and effect; HTML/JSX pair with it, while React-style and Tailwind tabs are starter representations for the supported subset."
                tabs={tabs}
                defaultTab="css"
                onDownload={(tab) => downloadText(tab.filename ?? `button-${tab.id}.txt`, tab.code)}
                actions={<Button variant="secondary" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />} onClick={() => downloadText("button.css", css)}>Download CSS</Button>}
              />
            </div>
          }
        />
      </div>
    </div>
  );
}
