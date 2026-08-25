import type { ReactNode } from "react";
import { Input, Select } from "@/components/ui";
import { ControlGrid, ControlSection, NumberField, SegmentedControl, SliderNumberField, ToolControlPanel } from "@/features/tools/components";
import type { PreviewObject, TransformGeneratorState, TransformMode, TransformOriginPreset } from "../types";
import { OriginPicker } from "./OriginPicker";
import { TransformOrderChips } from "./TransformOrderChips";

const modes: TransformMode[] = ["2d", "3d", "hover", "entrance", "card-tilt"];
const objects: PreviewObject[] = ["card", "image", "button", "modal", "badge", "panel"];
const shadows: TransformGeneratorState["style"]["shadow"][] = ["none", "soft", "medium", "strong"];
const timingFunctions: TransformGeneratorState["transition"]["timingFunction"][] = ["ease", "ease-in", "ease-out", "ease-in-out", "linear"];
const fillModes: TransformGeneratorState["animation"]["fillMode"][] = ["none", "both", "forwards"];

function ToggleRow({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (checked: boolean) => void; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-3 py-2 shadow-[var(--shadow-xs)]">
      <span className="min-w-0">
        <span className="block text-xs font-semibold text-[var(--color-text-primary)]">{label}</span>
        {hint ? <span className="mt-0.5 block text-xs leading-4 text-[var(--color-text-tertiary)]">{hint}</span> : null}
      </span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--color-primary)]" />
    </label>
  );
}

function Disclosure({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <details className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]">
      <summary className="cursor-pointer list-none px-3 py-2.5 marker:hidden">
        <span className="flex items-center justify-between gap-3">
          <span className="text-xs font-bold text-[var(--color-text-primary)]">{title}</span>
          {hint ? <span className="text-xs font-semibold text-[var(--color-text-tertiary)]">{hint}</span> : null}
        </span>
      </summary>
      <div className="space-y-3 border-t border-[var(--color-border-subtle)] p-3">{children}</div>
    </details>
  );
}

function modeLabel(value: TransformMode) {
  return value === "card-tilt" ? "Tilt" : value.toUpperCase();
}

export function TransformControls({ state, onPatch }: { state: TransformGeneratorState; onPatch: (patch: Partial<TransformGeneratorState>) => void }) {
  const show3dControls = state.mode === "3d" || state.mode === "card-tilt";
  const showHoverControls = state.mode === "hover" || state.mode === "card-tilt";
  const showAnimationControls = state.mode === "entrance";
  const motionIsPrimary = showHoverControls || showAnimationControls;

  const motionControls = (
    <>
      <ControlGrid columns={2}>
        <SliderNumberField label="Duration" value={state.transition.duration} min={0} max={1200} unit="ms" onChange={(duration) => onPatch({ transition: { ...state.transition, duration } })} />
        <SliderNumberField label="Delay" value={state.transition.delay} min={0} max={800} unit="ms" onChange={(delay) => onPatch({ transition: { ...state.transition, delay } })} />
        <label className="space-y-1 text-xs font-semibold text-[var(--color-text-soft)]">
          <span>Easing</span>
          <Select size="sm" value={state.transition.timingFunction} onChange={(event) => onPatch({ transition: { ...state.transition, timingFunction: event.target.value as TransformGeneratorState["transition"]["timingFunction"] } })}>{timingFunctions.map((item) => <option key={item} value={item}>{item}</option>)}</Select>
        </label>
        <label className="space-y-1 text-xs font-semibold text-[var(--color-text-soft)]">
          <span>Fill mode</span>
          <Select size="sm" value={state.animation.fillMode} disabled={!showAnimationControls} onChange={(event) => onPatch({ animation: { ...state.animation, fillMode: event.target.value as TransformGeneratorState["animation"]["fillMode"] } })}>{fillModes.map((item) => <option key={item} value={item}>{item}</option>)}</Select>
        </label>
      </ControlGrid>
      <div className="grid gap-2 sm:grid-cols-2">
        <ToggleRow label="Transition" checked={state.transition.enabled} onChange={(enabled) => onPatch({ transition: { ...state.transition, enabled } })} />
        <ToggleRow label="Reduced motion" checked={state.exportOptions.includeReducedMotion} onChange={(includeReducedMotion) => onPatch({ exportOptions: { ...state.exportOptions, includeReducedMotion }, animation: { ...state.animation, includeReducedMotion } })} />
      </div>
    </>
  );

  return (
    <ToolControlPanel title="Transform settings" description="Start with the transform itself. Open motion, preview styling, and export details only when you need them.">
      <ControlSection title="Mode" compact>
        <SegmentedControl ariaLabel="Transform mode" value={state.mode} onChange={(mode) => onPatch({ mode })} fullWidth options={modes.map((value) => ({ value, label: modeLabel(value) }))} />
      </ControlSection>

      <ControlSection title="Transform" description="Move, rotate, scale, and skew the object while watching the live stage." compact>
        <ControlGrid columns={2}>
          <SliderNumberField label="Translate X" value={state.transform2d.translateX} min={-300} max={300} unit={state.transform2d.translateUnit} onChange={(translateX) => onPatch({ transform2d: { ...state.transform2d, translateX } })} />
          <SliderNumberField label="Translate Y" value={state.transform2d.translateY} min={-300} max={300} unit={state.transform2d.translateUnit} onChange={(translateY) => onPatch({ transform2d: { ...state.transform2d, translateY } })} />
          <SliderNumberField label="Rotate" value={state.transform2d.rotate} min={-360} max={360} unit="deg" onChange={(rotate) => onPatch({ transform2d: { ...state.transform2d, rotate } })} />
          <label className="space-y-1 text-xs font-semibold text-[var(--color-text-soft)]">
            <span>Translate unit</span>
            <Select size="sm" value={state.transform2d.translateUnit} onChange={(event) => onPatch({ transform2d: { ...state.transform2d, translateUnit: event.target.value as TransformGeneratorState["transform2d"]["translateUnit"] } })}>
              <option value="px">px</option>
              <option value="rem">rem</option>
              <option value="%">%</option>
            </Select>
          </label>
          <SliderNumberField label="Scale X" value={state.transform2d.scaleX} min={0.1} max={3} step={0.05} onChange={(scaleX) => onPatch({ transform2d: { ...state.transform2d, scaleX } })} />
          <SliderNumberField label="Scale Y" value={state.transform2d.scaleY} min={0.1} max={3} step={0.05} onChange={(scaleY) => onPatch({ transform2d: { ...state.transform2d, scaleY } })} />
          <SliderNumberField label="Skew X" value={state.transform2d.skewX} min={-60} max={60} unit="deg" onChange={(skewX) => onPatch({ transform2d: { ...state.transform2d, skewX } })} />
          <SliderNumberField label="Skew Y" value={state.transform2d.skewY} min={-60} max={60} unit="deg" onChange={(skewY) => onPatch({ transform2d: { ...state.transform2d, skewY } })} />
        </ControlGrid>
        <Disclosure title="Transform order" hint="Advanced">
          <p className="text-xs leading-5 text-[var(--color-text-tertiary)]">CSS transform functions are applied in sequence, so changing their order can change the final result.</p>
          <TransformOrderChips order={state.transform2d.order} onChange={(order) => onPatch({ transform2d: { ...state.transform2d, order } })} />
        </Disclosure>
      </ControlSection>

      <ControlSection title="Transform origin" description="Choose the pivot point used by rotation, scaling, and skew." compact>
        <OriginPicker
          value={state.origin.preset}
          onChange={(preset: TransformOriginPreset) => {
            if (preset === "custom") {
              onPatch({ origin: { ...state.origin, preset } });
              return;
            }
            const [vertical, horizontal] = preset.split(" ");
            onPatch({ origin: { ...state.origin, preset, x: horizontal ?? "center", y: vertical ?? "center" } });
          }}
        />
        {state.origin.preset === "custom" ? (
          <ControlGrid columns={3}>
            <Input size="sm" value={state.origin.x} onChange={(event) => onPatch({ origin: { ...state.origin, x: event.target.value } })} aria-label="Origin X" placeholder="50%" />
            <Input size="sm" value={state.origin.y} onChange={(event) => onPatch({ origin: { ...state.origin, y: event.target.value } })} aria-label="Origin Y" placeholder="50%" />
            <Input size="sm" value={state.origin.z} onChange={(event) => onPatch({ origin: { ...state.origin, z: event.target.value } })} aria-label="Origin Z" placeholder="0px" />
          </ControlGrid>
        ) : null}
      </ControlSection>

      {showHoverControls ? (
        <ControlSection title="Hover / active transform" description="Interactive target state for hover and card-tilt modes." compact>
          <ControlGrid columns={2}>
            <SliderNumberField label="Hover X" value={state.hover2d.translateX} min={-120} max={120} unit={state.hover2d.translateUnit} onChange={(translateX) => onPatch({ hover2d: { ...state.hover2d, translateX } })} />
            <SliderNumberField label="Hover Y" value={state.hover2d.translateY} min={-120} max={120} unit={state.hover2d.translateUnit} onChange={(translateY) => onPatch({ hover2d: { ...state.hover2d, translateY } })} />
            <SliderNumberField label="Hover scale X" value={state.hover2d.scaleX} min={0.7} max={1.35} step={0.01} onChange={(scaleX) => onPatch({ hover2d: { ...state.hover2d, scaleX } })} />
            <SliderNumberField label="Hover scale Y" value={state.hover2d.scaleY} min={0.7} max={1.35} step={0.01} onChange={(scaleY) => onPatch({ hover2d: { ...state.hover2d, scaleY } })} />
          </ControlGrid>
        </ControlSection>
      ) : null}

      {show3dControls ? (
        <ControlSection title="3D transform" description="Perspective, depth, and rotation for 3D cards." compact>
          <ControlGrid columns={2}>
            <SliderNumberField label="Perspective" value={state.transform3d.perspective} min={180} max={1800} unit="px" onChange={(perspective) => onPatch({ transform3d: { ...state.transform3d, perspective }, hover3d: { ...state.hover3d, perspective } })} />
            <SliderNumberField label="Translate Z" value={state.transform3d.translateZ} min={-160} max={180} unit="px" onChange={(translateZ) => onPatch({ transform3d: { ...state.transform3d, translateZ } })} />
            <SliderNumberField label="Rotate X" value={state.transform3d.rotateX} min={-85} max={85} unit="deg" onChange={(rotateX) => onPatch({ transform3d: { ...state.transform3d, rotateX } })} />
            <SliderNumberField label="Rotate Y" value={state.transform3d.rotateY} min={-85} max={85} unit="deg" onChange={(rotateY) => onPatch({ transform3d: { ...state.transform3d, rotateY } })} />
            <SliderNumberField label="Rotate Z" value={state.transform3d.rotateZ} min={-45} max={45} unit="deg" onChange={(rotateZ) => onPatch({ transform3d: { ...state.transform3d, rotateZ } })} />
            <label className="space-y-1 text-xs font-semibold text-[var(--color-text-soft)]">
              <span>Transform style</span>
              <Select size="sm" value={state.transform3d.transformStyle} onChange={(event) => onPatch({ transform3d: { ...state.transform3d, transformStyle: event.target.value as TransformGeneratorState["transform3d"]["transformStyle"] } })}>
                <option value="flat">flat</option>
                <option value="preserve-3d">preserve-3d</option>
              </Select>
            </label>
          </ControlGrid>
        </ControlSection>
      ) : null}

      {motionIsPrimary ? (
        <ControlSection title="Motion" description="Timing for hover and entrance transforms." compact>{motionControls}</ControlSection>
      ) : (
        <Disclosure title="Motion & accessibility" hint="Optional">{motionControls}</Disclosure>
      )}

      <Disclosure title="Preview object & appearance" hint="Optional">
        <ControlGrid columns={2}>
          <label className="space-y-1 text-xs font-semibold text-[var(--color-text-soft)]">
            <span>Object</span>
            <Select size="sm" value={state.style.previewObject} onChange={(event) => onPatch({ style: { ...state.style, previewObject: event.target.value as PreviewObject } })}>{objects.map((item) => <option key={item} value={item}>{item}</option>)}</Select>
          </label>
          <label className="space-y-1 text-xs font-semibold text-[var(--color-text-soft)]">
            <span>Shadow</span>
            <Select size="sm" value={state.style.shadow} onChange={(event) => onPatch({ style: { ...state.style, shadow: event.target.value as TransformGeneratorState["style"]["shadow"] } })}>{shadows.map((item) => <option key={item} value={item}>{item}</option>)}</Select>
          </label>
          <NumberField label="Width" value={state.style.width} min={80} max={640} unit="px" onChange={(width) => onPatch({ style: { ...state.style, width } })} />
          <NumberField label="Height" value={state.style.height} min={60} max={420} unit="px" onChange={(height) => onPatch({ style: { ...state.style, height } })} />
          <NumberField label="Radius" value={state.style.borderRadius} min={0} max={120} unit="px" onChange={(borderRadius) => onPatch({ style: { ...state.style, borderRadius } })} />
          <NumberField label="Padding" value={state.style.padding} min={0} max={80} unit="px" onChange={(padding) => onPatch({ style: { ...state.style, padding } })} />
        </ControlGrid>
        <label className="block space-y-1 text-xs font-semibold text-[var(--color-text-soft)]">
          <span>Background</span>
          <Input size="sm" value={state.style.background} onChange={(event) => onPatch({ style: { ...state.style, background: event.target.value } })} aria-label="Preview background" />
        </label>
        <label className="block space-y-1 text-xs font-semibold text-[var(--color-text-soft)]">
          <span>Text color</span>
          <Input size="sm" value={state.style.textColor} onChange={(event) => onPatch({ style: { ...state.style, textColor: event.target.value } })} aria-label="Preview text color" />
        </label>
      </Disclosure>

      <Disclosure title="Export options" hint="Developer">
        <ControlGrid columns={2}>
          <label className="space-y-1 text-xs font-semibold text-[var(--color-text-soft)]">
            <span>CSS class</span>
            <Input size="sm" value={state.exportOptions.className} onChange={(event) => onPatch({ exportOptions: { ...state.exportOptions, className: event.target.value } })} aria-label="CSS class name" />
          </label>
          <label className="space-y-1 text-xs font-semibold text-[var(--color-text-soft)]">
            <span>Component</span>
            <Input size="sm" value={state.exportOptions.componentName} onChange={(event) => onPatch({ exportOptions: { ...state.exportOptions, componentName: event.target.value } })} aria-label="React component name" />
          </label>
        </ControlGrid>
        <div className="grid gap-2 sm:grid-cols-2">
          <ToggleRow label="Comments" checked={state.exportOptions.includeComments} onChange={(includeComments) => onPatch({ exportOptions: { ...state.exportOptions, includeComments } })} />
          <ToggleRow label="Demo styles" checked={state.exportOptions.includeDemoStyles} onChange={(includeDemoStyles) => onPatch({ exportOptions: { ...state.exportOptions, includeDemoStyles } })} />
          <ToggleRow label="GPU hint" checked={state.exportOptions.useTransformGpuHint} onChange={(useTransformGpuHint) => onPatch({ exportOptions: { ...state.exportOptions, useTransformGpuHint } })} />
          <ToggleRow label="Box-shadow transition" checked={state.transition.includeBoxShadow} onChange={(includeBoxShadow) => onPatch({ transition: { ...state.transition, includeBoxShadow } })} />
        </div>
      </Disclosure>
    </ToolControlPanel>
  );
}
