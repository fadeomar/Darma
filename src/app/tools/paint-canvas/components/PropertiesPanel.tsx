import { clampBrush, MAX_BRUSH, MIN_BRUSH } from "../draw";
import { SWATCHES } from "../constants";
import { BRUSH_PRESETS, getBrushPreset } from "../editor/brushPresets";
import type { BrushPreset, PaintSettings } from "../types";
import { isPrivacyTool, isShapeTool } from "../types";

export default function PropertiesPanel({
  settings,
  onChange,
  onBrushPresetChange,
}: {
  settings: PaintSettings;
  onChange: <K extends keyof PaintSettings>(key: K, value: PaintSettings[K]) => void;
  onBrushPresetChange: (preset: BrushPreset) => void;
}) {
  if (isPrivacyTool(settings.tool)) {
    return (
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4">
        <div className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-text-tertiary)]">Privacy region</div>
        <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
          Drag over any visible area. Darma captures only that local canvas region, applies the effect in-browser, and keeps the result editable.
        </p>
      </section>
    );
  }

  const brushPreset = getBrushPreset(settings.brushPreset);

  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4">
      <div className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-text-tertiary)]">Properties</div>
      <div className="flex flex-col gap-4">
        {settings.tool === "brush" && (
          <div>
            <div className="mb-2 text-xs font-bold text-[var(--color-text-secondary)]">Brush feel</div>
            <div className="grid grid-cols-2 gap-2">
              {BRUSH_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  aria-pressed={settings.brushPreset === preset.id}
                  onClick={() => onBrushPresetChange(preset.id)}
                  className={`rounded-[var(--radius-md)] border px-2.5 py-2 text-left transition ${
                    settings.brushPreset === preset.id
                      ? "border-[var(--color-primary)] bg-[var(--color-surface-subtle)]"
                      : "border-[var(--color-border-subtle)] hover:border-[var(--color-border-default)]"
                  }`}
                >
                  <span className="block text-xs font-bold text-[var(--color-text-primary)]">{preset.label}</span>
                  <span className="mt-0.5 block text-xs leading-4 text-[var(--color-text-tertiary)]">{preset.hint}</span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs leading-4 text-[var(--color-text-tertiary)]">{brushPreset.hint}. The stroke remains an editable local object.</p>
          </div>
        )}

        <div>
          <div className="mb-2 text-xs font-bold text-[var(--color-text-secondary)]">Color</div>
          <div className="flex flex-wrap gap-2">
            {SWATCHES.map((swatch) => (
              <button
                key={swatch}
                type="button"
                aria-label={`Color ${swatch}`}
                onClick={() => onChange("color", swatch)}
                className={`h-7 w-7 rounded-full border shadow-[var(--shadow-xs)] ${
                  settings.color === swatch ? "ring-2 ring-[var(--color-primary)] ring-offset-2" : "border-[var(--color-border-subtle)]"
                }`}
                style={{ backgroundColor: swatch }}
              />
            ))}
            <input
              type="color"
              aria-label="Custom color"
              value={settings.color}
              onChange={(event) => onChange("color", event.target.value)}
              className="h-7 w-8 cursor-pointer rounded border border-[var(--color-border-subtle)] bg-transparent"
            />
          </div>
        </div>

        <label className="block">
          <span className="mb-2 flex items-center justify-between text-xs font-bold text-[var(--color-text-secondary)]">
            {settings.tool === "highlight" ? "Highlight size" : "Stroke size"}{" "}
            <span className="font-mono text-[var(--color-text-tertiary)]">{settings.size}px</span>
          </span>
          <input
            type="range"
            className="w-full accent-[var(--color-primary)]"
            min={MIN_BRUSH}
            max={MAX_BRUSH}
            value={settings.size}
            onChange={(event) => onChange("size", clampBrush(Number(event.target.value)))}
          />
        </label>

        {settings.tool === "brush" && (
          <>
            <label className="block">
              <span className="mb-2 flex items-center justify-between text-xs font-bold text-[var(--color-text-secondary)]">
                Stabilizer <span className="font-mono text-[var(--color-text-tertiary)]">{Math.round(settings.stabilizer * 100)}%</span>
              </span>
              <input
                type="range"
                className="w-full accent-[var(--color-primary)]"
                min={0}
                max={100}
                step={5}
                value={Math.round(settings.stabilizer * 100)}
                onChange={(event) => onChange("stabilizer", Number(event.target.value) / 100)}
              />
              <span className="mt-1 block text-xs leading-4 text-[var(--color-text-tertiary)]">Higher values smooth hand jitter and streamline incoming points.</span>
            </label>

            <label className="flex items-start justify-between gap-3 text-sm text-[var(--color-text-secondary)]">
              <span>
                <span className="block font-medium text-[var(--color-text-primary)]">Dynamic width</span>
                <span className="mt-0.5 block text-xs leading-4 text-[var(--color-text-tertiary)]">Uses real stylus pressure when available; mouse and touch use movement-based pressure.</span>
              </span>
              <input type="checkbox" checked={settings.dynamicWidth} onChange={(event) => onChange("dynamicWidth", event.target.checked)} />
            </label>
          </>
        )}

        {isShapeTool(settings.tool) && !["line", "arrow"].includes(settings.tool) && (
          <label className="flex items-center justify-between gap-3 text-sm text-[var(--color-text-secondary)]">
            <span>Fill shape</span>
            <input type="checkbox" checked={settings.fill} onChange={(event) => onChange("fill", event.target.checked)} />
          </label>
        )}

        <label className="block">
          <span className="mb-2 flex items-center justify-between text-xs font-bold text-[var(--color-text-secondary)]">
            Opacity <span className="font-mono text-[var(--color-text-tertiary)]">{Math.round(settings.opacity * 100)}%</span>
          </span>
          <input
            type="range"
            className="w-full accent-[var(--color-primary)]"
            min={10}
            max={100}
            step={5}
            value={Math.round(settings.opacity * 100)}
            onChange={(event) => onChange("opacity", Number(event.target.value) / 100)}
          />
        </label>
      </div>
    </section>
  );
}
