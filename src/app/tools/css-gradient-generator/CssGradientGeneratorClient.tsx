"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import {
  ChevronDown,
  Code2,
  Copy,
  Eye,
  EyeOff,
  GripVertical,
  Plus,
  Shuffle,
  SlidersHorizontal,
  Trash2,
  Upload,
  Wand2,
  X,
} from "lucide-react";
import {
  COLOR_SPACES,
  DEFAULT_GRADIENT,
  GRADIENT_POSITIONS,
  GRADIENT_PRESETS,
  HUE_INTERPOLATIONS,
  LINEAR_DIRECTIONS,
  RADIAL_SIZES,
  addLayer,
  angleToDirection,
  buildBackgroundCss,
  buildCssSnippet,
  buildLayerGradientStrings,
  buildTailwindArbitraryClass,
  clamp,
  colorToHex,
  contrastTextColor,
  createHint,
  createRandomGradient,
  createStop,
  deleteLayer,
  directionToDeg,
  duplicateStopItem,
  getActiveLayer,
  importCssGradients,
  isCylindricalSpace,
  moveLayer,
  namedPositionToPercent,
  randomLayerColor,
  removeStopItem,
  reverseStops,
  updateActiveLayer,
  updateStops,
  validateGradient,
  type GradientHint,
  type GradientLayer,
  type GradientState,
  type GradientStop,
  type GradientStopItem,
  type GradientType,
} from "./gradient";

function cloneState(state: GradientState): GradientState {
  return {
    ...state,
    layers: state.layers.map((layer) => ({
      ...layer,
      linear: { ...layer.linear },
      radial: { ...layer.radial, position: { ...layer.radial.position } },
      conic: { ...layer.conic, position: { ...layer.conic.position } },
      stops: layer.stops.map((stop) => ({ ...stop })),
    })),
  };
}

function IconButton({
  label,
  children,
  onClick,
  disabled = false,
  danger = false,
}: {
  label: string;
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button type="button" className={`gs-icon-button ${danger ? "gs-danger" : ""}`} aria-label={label} title={label} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

function NumberInput({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "%",
  onChange,
}: {
  label: string;
  value: number | null;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  onChange: (value: number | null) => void;
}) {
  return (
    <label className="gs-field">
      <span>{label}</span>
      <span className="gs-number-input">
        <input
          type="number"
          value={value ?? ""}
          min={min}
          max={max}
          step={step}
          onChange={(event) => {
            const raw = event.target.value;
            if (raw === "") {
              onChange(null);
              return;
            }
            const next = Number(raw);
            if (Number.isNaN(next)) return;
            onChange(typeof min === "number" || typeof max === "number" ? clamp(next, min ?? -Infinity, max ?? Infinity) : next);
          }}
        />
        <b>{unit}</b>
      </span>
    </label>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "",
  onChange,
  icon,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
  icon?: ReactNode;
}) {
  return (
    <div className="gs-slider-set">
      {icon ? <span className="gs-slider-icon">{icon}</span> : null}
      <label className="gs-slider-label">
        <span>{label}</span>
        <input type="range" value={value} min={min} max={max} step={step} onChange={(event) => onChange(Number(event.target.value))} />
      </label>
      <span className="gs-slider-value">
        <input type="number" value={value} min={min} max={max} step={step} onChange={(event) => onChange(clamp(Number(event.target.value), min, max))} />
        <sup>{unit}</sup>
      </span>
    </div>
  );
}

function ColorTextField({ color, onChange }: { color: string; onChange: (value: string) => void }) {
  const pickerValue = colorToHex(color);
  return (
    <div className="gs-color-text-field">
      <input type="color" value={pickerValue} aria-label="Color picker" onChange={(event) => onChange(event.target.value)} />
      <input value={color} aria-label="CSS color value" onChange={(event) => onChange(event.target.value)} spellCheck={false} />
    </div>
  );
}

function StopSwatch({ stop }: { stop: GradientStop }) {
  const textColor = contrastTextColor(stop.color);
  return (
    <button className="gs-stop-swatch" type="button" title={stop.color} style={{ background: stop.color, color: textColor }}>
      C
    </button>
  );
}

function layerLabel(layer: GradientLayer, index: number) {
  return layer.name || `Layer ${index + 1}`;
}

function AngleGlyph({ angle }: { angle: number }) {
  return (
    <span className="gs-angle-glyph" style={{ transform: `rotate(${angle}deg)` }}>
      ◔
    </span>
  );
}

function TypeIcon({ type }: { type: GradientType }) {
  if (type === "radial") return <span className="gs-type-icon">◯</span>;
  if (type === "conic") return <span className="gs-type-icon">◔</span>;
  return <span className="gs-type-icon gs-linear-icon">▥</span>;
}

// Length of the CSS gradient line for a box of w×h at the given angle. Matches
// the CSS spec (|w·sin| + |h·cos|) so overlay handles line up with real stops.
function gradientLineLength(w: number, h: number, angle: number) {
  const a = (angle * Math.PI) / 180;
  return Math.abs(w * Math.sin(a)) + Math.abs(h * Math.cos(a));
}

// Project a pointer onto the rotated gradient axis and return its 0–100 percent.
function getPercentFromPointer(clientX: number, clientY: number, rect: DOMRect, angle: number) {
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const rot = ((angle - 90) * Math.PI) / 180;
  const ux = Math.cos(rot);
  const uy = Math.sin(rot);
  const px = clientX - cx;
  const py = clientY - cy;
  const lineLength = gradientLineLength(rect.width, rect.height, angle);
  const t = px * ux + py * uy;
  return Math.round(Math.max(0, Math.min(100, ((t + lineLength / 2) / lineLength) * 100)));
}

function PreviewOverlay({
  layer,
  patchActiveLayer,
  onAddStop,
}: {
  layer: GradientLayer;
  patchActiveLayer: (updater: (layer: GradientLayer) => GradientLayer) => void;
  onAddStop: (percent: number) => void;
}) {
  // Ref on the overlay box (inset:0 of the gradient rectangle) so pointer math
  // is relative to the actual preview box, not the whole center panel.
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const rotatingRef = useRef(false);
  const [boxSize, setBoxSize] = useState({ w: 0, h: 0 });
  const [ghost, setGhost] = useState<number | null>(null);

  // Track the real box size so handle positions follow live resizes.
  useEffect(() => {
    const el = overlayRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect();
      setBoxSize({ w: rect.width, h: rect.height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (layer.type === "linear") {
    const angle = layer.linear.angle;
    const rot = ((angle - 90) * Math.PI) / 180;
    const ux = Math.cos(rot);
    const uy = Math.sin(rot);
    const lineLength = gradientLineLength(boxSize.w, boxSize.h, angle);

    // Box-local pixel position of a percentage along the gradient axis.
    const pointAt = (percent: number) => ({
      x: boxSize.w / 2 + (percent / 100 - 0.5) * lineLength * ux,
      y: boxSize.h / 2 + (percent / 100 - 0.5) * lineLength * uy,
    });

    // ---- Center rotator: dragging the center circle rotates the angle. ----
    const rotateFromEvent = (event: ReactPointerEvent<HTMLDivElement>) => {
      const el = overlayRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);
      const next = Math.round((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360;
      patchActiveLayer((current) => ({
        ...current,
        linear: { ...current.linear, angle: next, namedAngle: angleToDirection(next) },
      }));
    };
    const rotatePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      rotatingRef.current = true;
      event.currentTarget.setPointerCapture?.(event.pointerId);
      rotateFromEvent(event);
    };
    const rotatePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!rotatingRef.current) return;
      rotateFromEvent(event);
    };
    const rotatePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
      rotatingRef.current = false;
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    };

    // ---- Add-stop track: hover shows a ghost, click inserts a stop. ----
    const percentFromEvent = (event: ReactPointerEvent<HTMLDivElement>) => {
      const el = overlayRef.current;
      if (!el) return null;
      return getPercentFromPointer(event.clientX, event.clientY, el.getBoundingClientRect(), angle);
    };
    const trackPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
      const percent = percentFromEvent(event);
      if (percent !== null) setGhost(percent);
    };
    const trackPointerLeave = () => setGhost(null);
    const trackPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      const percent = percentFromEvent(event);
      if (percent !== null) onAddStop(percent);
      setGhost(null);
    };

    const stopHandles: ReactNode[] = [];
    layer.stops.forEach((stop) => {
      if (stop.kind !== "stop") return;
      const p1 = stop.position1 ?? stop.auto ?? 0;
      const a = pointAt(p1);
      stopHandles.push(
        <span
          key={`${stop.id}-1`}
          className="gs-stop-handle"
          style={{ left: `${a.x}px`, top: `${a.y}px`, background: stop.color }}
        />,
      );
      if (stop.position2 != null && stop.position2 !== stop.position1) {
        const b = pointAt(stop.position2);
        stopHandles.push(
          <span
            key={`${stop.id}-2`}
            className="gs-stop-handle"
            style={{ left: `${b.x}px`, top: `${b.y}px`, background: stop.color }}
          />,
        );
      }
    });

    const ghostPoint = ghost != null ? pointAt(ghost) : null;

    return (
      <div ref={overlayRef} className="gs-overlay gs-linear-overlay">
        {/* Visual axis line + dashed extensions (rotates with the angle). */}
        <div
          className="gs-linear-line"
          style={{ width: `${lineLength}px`, transform: `translate(-50%, -50%) rotate(${angle - 90}deg)` }}
        />

        {/* Invisible track along the line: hover previews, click adds a stop. */}
        <div
          className="gs-linear-track"
          style={{ width: `${lineLength}px`, transform: `translate(-50%, -50%) rotate(${angle - 90}deg)` }}
          onPointerMove={trackPointerMove}
          onPointerLeave={trackPointerLeave}
          onPointerDown={trackPointerDown}
        />

        {/* Center angle indicator (visual only, does not rotate with the line). */}
        <div className="gs-angle-indicator" style={{ ["--gs-angle" as string]: `${angle}deg` }}>
          <span className="gs-angle-ring" />
          <span className="gs-angle-refline" />
          <span className="gs-angle-dot" />
        </div>

        {/* Center rotator hit circle: only this drags the angle. */}
        <div
          className="gs-linear-rotator"
          onPointerDown={rotatePointerDown}
          onPointerMove={rotatePointerMove}
          onPointerUp={rotatePointerUp}
          onPointerCancel={rotatePointerUp}
        />

        {ghostPoint ? (
          <span className="gs-stop-handle gs-stop-ghost" style={{ left: `${ghostPoint.x}px`, top: `${ghostPoint.y}px` }} />
        ) : null}

        {stopHandles}
      </div>
    );
  }

  const point = layer.type === "radial" ? layer.radial.position : layer.conic.position;
  const named = layer.type === "radial" ? layer.radial.namedPosition : layer.conic.namedPosition;
  const fallback = namedPositionToPercent(named);
  const x = point.x ?? fallback.x;
  const y = point.y ?? fallback.y;

  return (
    <div className="gs-overlay gs-position-overlay">
      <div className={`gs-position-target ${layer.type === "conic" ? "gs-conic-target" : ""}`} style={{ left: `${x}%`, top: `${y}%` }}>
        <span />
      </div>
    </div>
  );
}

export default function CssGradientGeneratorClient() {
  const [state, setState] = useState<GradientState>(() => cloneState(DEFAULT_GRADIENT));
  const [importValue, setImportValue] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [centerPane, setCenterPane] = useState<"preview" | "code">("preview");
  const [copied, setCopied] = useState<string | null>(null);

  const activeLayer = getActiveLayer(state);
  const validation = useMemo(() => validateGradient(state), [state]);
  const backgroundCss = useMemo(() => buildBackgroundCss(state), [state]);
  const previewBackground = state.modernPreview ? backgroundCss.modern : backgroundCss.classic;
  const cssSnippet = useMemo(() => (validation.ok ? buildCssSnippet(state) : ""), [state, validation.ok]);
  const tailwindClass = useMemo(() => (validation.ok ? buildTailwindArbitraryClass(state) : ""), [state, validation.ok]);
  const activeLayerStrings = useMemo(() => (activeLayer ? buildLayerGradientStrings(activeLayer) : { modern: "", classic: "" }), [activeLayer]);
  const visibleCount = state.layers.filter((layer) => layer.visible).length;

  function copyText(label: string, text: string) {
    if (!text) return;
    void navigator.clipboard?.writeText(text);
    setCopied(label);
    window.setTimeout(() => setCopied(null), 1200);
  }

  function patchActiveLayer(updater: (layer: GradientLayer) => GradientLayer) {
    setState((current) => updateActiveLayer(current, updater));
  }

  function patchStops(updater: (stops: GradientStopItem[]) => GradientStopItem[]) {
    patchActiveLayer((layer) => ({ ...layer, stops: updater(layer.stops) }));
  }

  function patchStop(index: number, patch: Partial<GradientStop>) {
    patchStops((stops) =>
      updateStops(
        stops.map((stop, stopIndex) =>
          stopIndex === index && stop.kind === "stop"
            ? {
                ...stop,
                ...patch,
                manual: patch.position1 !== undefined || patch.position2 !== undefined ? true : stop.manual,
              }
            : stop,
        ),
      ),
    );
  }

  function patchHint(index: number, patch: Partial<GradientHint>) {
    patchStops((stops) =>
      updateStops(
        stops.map((stop, stopIndex) =>
          stopIndex === index && stop.kind === "hint"
            ? {
                ...stop,
                ...patch,
                manual: patch.percentage !== undefined ? true : stop.manual,
              }
            : stop,
        ),
      ),
    );
  }

  function addColorStop() {
    patchStops((stops) => updateStops([...stops, createHint(), createStop(randomLayerColor(), 100, 100)]));
  }

  // Insert a color stop at a clicked percentage along the linear line, keeping
  // the array ordered by position with a transition hint between neighbours
  // (mirrors the original gradient.style splice-then-updateStops flow).
  function addStopAtPercent(percent: number) {
    patchStops((stops) => {
      const items = [...stops];
      const newStop: GradientStop = { ...createStop(randomLayerColor(), percent, percent), manual: true };
      let insertAt = -1;
      for (let index = 0; index < items.length; index += 1) {
        const item = items[index];
        if (item.kind !== "stop") continue;
        const pos = item.position1 ?? item.auto ?? 0;
        if (pos >= percent) {
          insertAt = index;
          break;
        }
      }
      if (insertAt === -1) return updateStops([...items, createHint(), newStop]);
      items.splice(insertAt, 0, newStop, createHint());
      return updateStops(items);
    });
  }

  function handleImport() {
    try {
      const imported = importCssGradients(importValue);
      setState(imported);
      setImportError(null);
      setShowImport(false);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Could not import this gradient.");
    }
  }

  function handleGlobalAction(action: string) {
    if (!action) return;
    if (action === "Start new") setState(cloneState(DEFAULT_GRADIENT));
    if (action === "Import gradient") setShowImport(true);
    if (action === "Copy modern CSS") copyText("modern", `background: ${backgroundCss.modern};`);
    if (action === "Copy classic CSS") copyText("classic", `background: ${backgroundCss.classic};`);
    if (action === "Random gradient") setState(createRandomGradient());
  }

  if (!activeLayer) return null;

  return (
    <div className="gs-shell" style={{ background: validation.ok ? previewBackground : undefined }}>
      <div className="gs-builder">
        <aside className="gs-left-panel">
          <header className="gs-brand">
            <div className="gs-gradient-logo" style={{ background: previewBackground }} />
            <h1>
              HDR G<b>rad</b>ients
            </h1>
          </header>

          <section className="gs-left-scroll">
            <div className="gs-layer-menu">
              <div className="gs-type-row" aria-label="Gradient type">
                {(["linear", "radial", "conic"] as GradientType[]).map((type) => (
                  <button key={type} className={activeLayer.type === type ? "active" : ""} type="button" title={`${type} gradient`} onClick={() => patchActiveLayer((layer) => ({ ...layer, type }))}>
                    <TypeIcon type={type} />
                  </button>
                ))}
              </div>
              <button className="gs-round-button" type="button" onClick={() => setState((current) => addLayer(current, "new"))} title="New layer">
                <Plus size={24} />
              </button>
            </div>

            <div className="gs-layer-list">
              {state.layers.map((layer, index) => {
                const layerStrings = buildLayerGradientStrings(layer);
                const selected = layer.id === state.activeLayerId;
                return (
                  <article key={layer.id} className={`gs-layer ${selected ? "active" : ""}`}>
                    <button type="button" className="gs-layer-head" onClick={() => setState((current) => ({ ...current, activeLayerId: layer.id }))}>
                      <span className="gs-layer-thumb" style={{ background: layerStrings.modern }} />
                      <span className="gs-layer-title">
                        <b>{layerLabel(layer, index)}</b>
                        <small>{`${layer.type} · ${layer.space}`}</small>
                      </span>
                    </button>
                    <div className="gs-layer-actions">
                      <IconButton label={layer.visible ? "Hide layer" : "Show layer"} onClick={() => setState((current) => ({ ...current, layers: current.layers.map((item) => (item.id === layer.id ? { ...item, visible: !item.visible } : item)) }))}>
                        {layer.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                      </IconButton>
                      <IconButton label="Move layer up" disabled={index === 0} onClick={() => setState((current) => moveLayer(current, index, index - 1))}>
                        ↑
                      </IconButton>
                      <IconButton label="Move layer down" disabled={index === state.layers.length - 1} onClick={() => setState((current) => moveLayer(current, index, index + 1))}>
                        ↓
                      </IconButton>
                      <IconButton label="Delete layer" danger disabled={state.layers.length <= 1} onClick={() => setState((current) => deleteLayer(current, layer.id))}>
                        <Trash2 size={15} />
                      </IconButton>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="gs-active-layer-controls">
              <LayerGeometryControls activeLayer={activeLayer} patchActiveLayer={patchActiveLayer} />
            </div>
          </section>

          <footer className="gs-presets">
            <p>HD EXAMPLES</p>
            <div>
              {GRADIENT_PRESETS.map((preset) => (
                <button key={preset.label} type="button" title={preset.label} style={{ background: buildBackgroundCss(preset.state).modern }} onClick={() => setState(cloneState(preset.state))} />
              ))}
            </div>
          </footer>
        </aside>

        <main className="gs-center-panel">
          <section className={centerPane === "preview" ? "gs-preview-panel is-active" : "gs-preview-panel"}>
            <div className="gs-panel-actions">
              <button type="button" onClick={() => setCenterPane("code")} title="Get the CSS code" aria-label="Get the CSS code">
                <Code2 size={23} />
              </button>
            </div>
            <div className="gs-preview-stage">
              {/* The resizer defines the preview box. Checkerboard lives on this
                  same element (CSS) and the gradient on an inset:0 child, so both
                  share exact x/y/size — no offset. HDR label is a child too. */}
              <div className="gs-resizer">
                <div className="gs-resizer-fill" style={{ background: previewBackground }} />
                <label className="gs-hd-switch" title="Toggle between SDR and HDR CSS gradients">
                  <span>{state.modernPreview ? "HDR" : "SDR"}</span>
                  <input type="checkbox" checked={state.modernPreview} onChange={(event) => setState((current) => ({ ...current, modernPreview: event.target.checked }))} />
                </label>
                <PreviewOverlay layer={activeLayer} patchActiveLayer={patchActiveLayer} onAddStop={addStopAtPercent} />
              </div>
            </div>
          </section>

          <section className={centerPane === "code" ? "gs-code-panel is-active" : "gs-code-panel"}>
            <div className="gs-panel-actions gs-back-action">
              <button type="button" onClick={() => setCenterPane("preview")} title="Back to editor" aria-label="Back to editor">
                ←
              </button>
            </div>
            <div className="gs-code-card">
              <h2>Gradient CSS</h2>
              <CodeBlock label="Modern CSS" code={`background: ${backgroundCss.modern};`} onCopy={() => copyText("modern", `background: ${backgroundCss.modern};`)} />
              <CodeBlock label="Classic CSS" code={`background: ${backgroundCss.classic};`} onCopy={() => copyText("classic", `background: ${backgroundCss.classic};`)} />
              <CodeBlock label="CSS class" code={cssSnippet} onCopy={() => copyText("class", cssSnippet)} />
              <CodeBlock label="Tailwind" code={tailwindClass} onCopy={() => copyText("tailwind", tailwindClass)} />
            </div>
          </section>
        </main>

        <aside className="gs-right-panel">
          <div className="gs-menu-bar">
            <button className="gs-global-action-shell" type="button">
              <SlidersHorizontal size={21} />
              <select aria-label="Global Actions" defaultValue="" onChange={(event) => { handleGlobalAction(event.target.value); event.target.value = ""; }}>
                <option value="" disabled>
                  Global Actions
                </option>
                <option>Start new</option>
                <option>Import gradient</option>
                <option>Copy modern CSS</option>
                <option>Copy classic CSS</option>
                <option>Random gradient</option>
              </select>
              <ChevronDown size={15} />
            </button>
          </div>

          <section className="gs-control-set gs-color-space">
            <div className="gs-label-select-combo">
              <label>
                <span className="gs-info-icon">i</span>
                Color Space
              </label>
              <select value={activeLayer.space} onChange={(event) => patchActiveLayer((layer) => ({ ...layer, space: event.target.value }))}>
                {COLOR_SPACES.map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.options.map((space) => (
                      <option key={space} value={space}>
                        {space}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </section>

          {isCylindricalSpace(activeLayer.space) ? (
            <section className="gs-control-set">
              <div className="gs-label-select-combo">
                <label>Hue path</label>
                <select value={activeLayer.interpolation} onChange={(event) => patchActiveLayer((layer) => ({ ...layer, interpolation: event.target.value as GradientLayer["interpolation"] }))}>
                  {HUE_INTERPOLATIONS.map((interpolation) => (
                    <option key={interpolation} value={interpolation}>
                      {interpolation} hue
                    </option>
                  ))}
                </select>
              </div>
            </section>
          ) : null}

          <section className="gs-gradient-stops">
            {activeLayer.stops.map((stop, index) =>
              stop.kind === "stop" ? (
                <fieldset key={stop.id} className="gs-stop-card" draggable>
                  <legend>
                    <GripVertical size={18} />
                    <StopSwatch stop={stop} />
                    <span>
                      <b>COLOR</b>
                      <small>STOP {activeLayer.stops.slice(0, index + 1).filter((item) => item.kind === "stop").length}</small>
                    </span>
                    <div className="gs-stop-actions">
                      <IconButton label="Copy CSS color" onClick={() => copyText("color", stop.color)}>
                        <Copy size={16} />
                      </IconButton>
                      <IconButton label="Random color" onClick={() => patchStop(index, { color: randomLayerColor() })}>
                        <Wand2 size={16} />
                      </IconButton>
                    </div>
                  </legend>

                  <ColorTextField color={stop.color} onChange={(color) => patchStop(index, { color })} />

                  <div className="gs-stop-sliders">
                    <SliderField label="" value={stop.position1 ?? 0} min={0} max={100} unit="%" onChange={(position1) => patchStop(index, { position1 })} />
                    <SliderField label="" value={stop.position2 ?? stop.position1 ?? 0} min={0} max={100} unit="%" onChange={(position2) => patchStop(index, { position2 })} />
                  </div>

                  <div className="gs-stop-footer">
                    <button type="button" onClick={() => patchStops((stops) => duplicateStopItem(stops, index))}>
                      Duplicate
                    </button>
                    <button type="button" onClick={() => patchStop(index, { position1: null, position2: null })}>
                      Auto position
                    </button>
                    <button type="button" className="danger" disabled={activeLayer.stops.filter((item) => item.kind === "stop").length <= 1} onClick={() => patchStops((stops) => removeStopItem(stops, index))}>
                      Remove
                    </button>
                  </div>
                </fieldset>
              ) : (
                <fieldset key={stop.id} className="gs-hint-card">
                  <legend>
                    <span>
                      <b>TRANSITION HINT</b>
                      <small>Controls where the visual midpoint lands.</small>
                    </span>
                    <button type="button" onClick={() => patchStops((stops) => removeStopItem(stops, index))}>
                      Remove hint
                    </button>
                  </legend>
                  <SliderField label="Hint" value={stop.percentage ?? 50} min={0} max={100} unit="%" onChange={(percentage) => patchHint(index, { percentage })} />
                  <button className="gs-auto-button" type="button" onClick={() => patchHint(index, { percentage: null })}>
                    Auto hint
                  </button>
                </fieldset>
              ),
            )}
          </section>

          <footer className="gs-right-footer">
            <button className="gs-add-color" type="button" onClick={addColorStop}>
              Add a random color
              <Shuffle size={21} />
            </button>
          </footer>
        </aside>
      </div>

      {showImport ? (
        <div className="gs-dialog-backdrop" role="presentation" onClick={() => setShowImport(false)}>
          <dialog className="gs-import-dialog" open onClick={(event) => event.stopPropagation()}>
            <button className="gs-dialog-close" type="button" onClick={() => setShowImport(false)} aria-label="Close import dialog">
              <X size={18} />
            </button>
            <h2>Import CSS gradient</h2>
            <p>Paste a linear, radial, conic, or multi-background gradient. It will be converted into editable layers.</p>
            <textarea value={importValue} onChange={(event) => setImportValue(event.target.value)} placeholder="linear-gradient(to right in oklab, oklch(70% .5 340), oklch(90% .5 200))" />
            {importError ? <p className="gs-import-error">{importError}</p> : null}
            <div className="gs-dialog-actions">
              <button type="button" onClick={() => setShowImport(false)}>
                Cancel
              </button>
              <button type="button" onClick={handleImport} disabled={!importValue.trim()}>
                <Upload size={16} /> Import gradient
              </button>
            </div>
          </dialog>
        </div>
      ) : null}

      {copied ? <div className="gs-toast">Copied {copied} CSS</div> : null}
      {!validation.ok ? <div className="gs-error-toast">{validation.errors[0]}</div> : null}

      <style jsx global>{`
        .gs-shell {
          --gs-surface-1: #f6f7f8;
          --gs-surface-2: #eef0f2;
          --gs-surface-3: #ffffff;
          --gs-surface-4: #c9ced4;
          --gs-text-1: #0e1116;
          --gs-text-2: #565d66;
          --gs-text-3: #8a929d;
          --gs-line: rgba(15, 23, 42, 0.12);
          --gs-shadow: 0 18px 55px rgba(15, 23, 42, 0.18);
          --gs-radius: 22px;
          isolation: isolate;
          padding: 18px;
          min-height: calc(100dvh - 74px);
          color: var(--gs-text-1);
          overflow: hidden;
        }

        :root[data-mode="dark"] .gs-shell {
          --gs-surface-1: #15181d;
          --gs-surface-2: #0f1216;
          --gs-surface-3: #1f242b;
          --gs-surface-4: #373f4a;
          --gs-text-1: #f8fafc;
          --gs-text-2: #c7ced7;
          --gs-text-3: #8b96a4;
          --gs-line: rgba(255, 255, 255, 0.12);
          --gs-shadow: 0 18px 55px rgba(0, 0, 0, 0.35);
        }

        .gs-builder {
          display: grid;
          grid-template-columns: minmax(300px, 360px) minmax(520px, 1fr) minmax(310px, 360px);
          grid-template-rows: minmax(720px, calc(100dvh - 110px));
          overflow: hidden;
          max-width: 1880px;
          margin: 0 auto;
          border-radius: var(--gs-radius);
          background: var(--gs-surface-1);
          box-shadow: var(--gs-shadow);
        }

        .gs-left-panel,
        .gs-right-panel {
          min-width: 0;
          background: var(--gs-surface-1);
          overflow: hidden;
          display: grid;
        }

        .gs-left-panel {
          grid-template-rows: 210px 1fr 140px;
          border-right: 1px solid var(--gs-line);
        }

        .gs-right-panel {
          grid-template-rows: auto auto auto 1fr auto;
          border-left: 1px solid var(--gs-line);
        }

        .gs-brand {
          display: grid;
          place-items: center;
          align-content: center;
          gap: 20px;
          background: var(--gs-surface-3);
          border-bottom: 1px solid var(--gs-line);
        }

        .gs-gradient-logo {
          width: 118px;
          aspect-ratio: 1;
          border-radius: 50%;
          mask: linear-gradient(to bottom, #000 0 50%, #0000 50% 55%, #000 55% 62%, #0000 62% 66%, #000 66% 72%, #0000 72% 76%, #000 76% 81%, #0000 81% 85%, #000 85% 89%, #0000 89% 92%, #000 92% 95%, #0000 95% 97%, #000 97% 100%);
          -webkit-mask: linear-gradient(to bottom, #000 0 50%, #0000 50% 55%, #000 55% 62%, #0000 62% 66%, #000 66% 72%, #0000 72% 76%, #000 76% 81%, #0000 81% 85%, #000 85% 89%, #0000 89% 92%, #000 92% 95%, #0000 95% 97%, #000 97% 100%);
          box-shadow: inset 0 0 24px rgba(255, 255, 255, 0.3);
        }

        .gs-brand h1 {
          margin: 0;
          font-size: 22px;
          line-height: 1;
          font-weight: 950;
          letter-spacing: -0.04em;
        }

        .gs-left-scroll,
        .gs-gradient-stops {
          overflow-y: auto;
          overscroll-behavior: contain;
          scrollbar-width: thin;
        }

        .gs-layer-menu {
          min-height: 72px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px 22px;
          border-bottom: 1px solid var(--gs-line);
          background: var(--gs-surface-2);
        }

        .gs-type-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .gs-type-row button,
        .gs-round-button,
        .gs-panel-actions button,
        .gs-icon-button {
          appearance: none;
          border: 1px solid transparent;
          background: transparent;
          color: var(--gs-text-2);
          cursor: pointer;
          display: inline-grid;
          place-items: center;
          transition: transform 0.16s ease, background 0.16s ease, color 0.16s ease, border-color 0.16s ease;
        }

        .gs-type-row button {
          width: 44px;
          height: 44px;
          border-radius: 999px;
          font-size: 22px;
        }

        .gs-type-row button.active,
        .gs-type-row button:hover,
        .gs-round-button:hover,
        .gs-panel-actions button:hover,
        .gs-icon-button:hover {
          background: var(--gs-surface-3);
          color: var(--gs-text-1);
          border-color: var(--gs-line);
          box-shadow: 0 6px 16px rgba(15, 23, 42, 0.08);
        }

        .gs-linear-icon {
          display: inline-block;
          transform: rotate(90deg);
        }

        .gs-round-button,
        .gs-panel-actions button {
          width: 52px;
          height: 52px;
          border-radius: 999px;
          background: var(--gs-surface-3);
          box-shadow: 0 8px 20px rgba(15, 23, 42, 0.10);
        }

        .gs-layer-list {
          display: grid;
          gap: 8px;
          padding: 10px 0;
        }

        .gs-layer {
          border-top: 1px solid transparent;
          border-bottom: 1px solid transparent;
        }

        .gs-layer.active {
          background: color-mix(in srgb, var(--gs-surface-3) 78%, transparent);
          border-color: var(--gs-line);
        }

        .gs-layer-head {
          appearance: none;
          display: grid;
          width: 100%;
          grid-template-columns: 50px 1fr;
          align-items: center;
          gap: 12px;
          padding: 12px 18px;
          border: 0;
          background: transparent;
          color: inherit;
          cursor: pointer;
          text-align: left;
        }

        .gs-layer-thumb {
          width: 50px;
          aspect-ratio: 1;
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.5), inset 0 0 18px rgba(0, 0, 0, 0.18);
          border-radius: 4px;
        }

        .gs-layer-title b,
        .gs-layer-title small {
          display: block;
        }

        .gs-layer-title b {
          font-size: 13px;
        }

        .gs-layer-title small {
          margin-top: 3px;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--gs-text-3);
        }

        .gs-layer-actions {
          display: flex;
          gap: 6px;
          padding: 0 18px 12px 80px;
        }

        .gs-icon-button {
          width: 30px;
          height: 30px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 900;
        }

        .gs-icon-button:disabled,
        button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .gs-icon-button.gs-danger:hover,
        .gs-stop-footer .danger:hover {
          color: #b42318;
          border-color: rgba(180, 35, 24, 0.24);
          background: #fff1f0;
        }

        .gs-active-layer-controls {
          border-top: 1px solid var(--gs-line);
        }

        .gs-control-set,
        .gs-layer-geometry,
        .gs-hint-card,
        .gs-stop-card {
          border: 0;
          border-bottom: 1px solid var(--gs-line);
          margin: 0;
          padding: 18px 22px;
        }

        .gs-layer-geometry {
          display: grid;
          gap: 18px;
        }

        .gs-label-select-combo {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
        }

        .gs-angle-control-row {
          grid-template-columns: auto 1fr auto;
        }

        .gs-angle-dots {
          width: 34px;
          height: 34px;
          flex: 0 0 auto;
          opacity: 0.82;
          background-image: radial-gradient(circle, var(--gs-text-3) 2.8px, transparent 3px);
          background-size: 11px 11px;
          background-position: center;
        }

        .gs-label-select-combo label,
        .gs-field span,
        .gs-slider-label > span,
        .gs-stop-card legend b,
        .gs-hint-card legend b,
        .gs-presets p {
          color: var(--gs-text-2);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .gs-label-select-combo label {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          color: var(--gs-text-1);
          font-size: 15px;
          letter-spacing: -0.02em;
          text-transform: none;
        }

        .gs-info-icon {
          display: inline-grid;
          place-items: center;
          width: 22px;
          height: 22px;
          border: 2px solid currentColor;
          border-radius: 999px;
          font-family: ui-serif, Georgia, serif;
          font-size: 14px;
          font-style: italic;
          font-weight: 900;
        }

        .gs-builder select,
        .gs-builder input,
        .gs-builder textarea,
        .gs-builder button {
          font: inherit;
        }

        .gs-builder select,
        .gs-color-text-field,
        .gs-number-input input,
        .gs-dialog-backdrop textarea {
          border: 1px solid var(--gs-line);
          border-radius: 9px;
          background: var(--gs-surface-3);
          color: var(--gs-text-1);
          box-shadow: 0 8px 18px rgba(15, 23, 42, 0.06);
        }

        .gs-builder select {
          max-width: 166px;
          padding: 10px 34px 10px 14px;
          appearance: none;
          background-image: linear-gradient(45deg, transparent 50%, var(--gs-text-2) 50%), linear-gradient(135deg, var(--gs-text-2) 50%, transparent 50%);
          background-position: calc(100% - 17px) 50%, calc(100% - 12px) 50%;
          background-size: 5px 5px, 5px 5px;
          background-repeat: no-repeat;
          font-weight: 700;
        }

        .gs-slider-set {
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          gap: 12px;
        }

        .gs-slider-label {
          display: grid;
          gap: 4px;
        }

        .gs-slider-icon {
          font-size: 30px;
          color: var(--gs-text-2);
        }

        .gs-angle-glyph {
          display: inline-block;
        }

        .gs-slider-set input[type="range"] {
          width: 100%;
          accent-color: var(--gs-text-2);
        }

        .gs-slider-value {
          display: inline-flex;
          align-items: baseline;
          gap: 2px;
          color: var(--gs-text-1);
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-weight: 900;
        }

        .gs-slider-value input {
          width: 48px;
          border: 0;
          background: transparent;
          text-align: right;
          font-family: inherit;
          font-weight: inherit;
          color: inherit;
        }

        .gs-grid-two {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .gs-field {
          display: grid;
          gap: 7px;
        }

        .gs-number-input {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .gs-number-input input {
          width: 100%;
          min-width: 0;
          padding: 9px 10px;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-weight: 800;
        }

        .gs-number-input b {
          color: var(--gs-text-3);
          font-size: 11px;
        }

        .gs-presets {
          border-top: 1px solid var(--gs-line);
          padding: 16px 22px 20px;
          background: var(--gs-surface-1);
          overflow: hidden;
        }

        .gs-presets div {
          display: flex;
          gap: 14px;
          overflow-x: auto;
          padding: 10px 0 4px;
          scrollbar-width: thin;
        }

        .gs-presets button {
          width: 44px;
          height: 44px;
          flex: 0 0 auto;
          border: 0;
          border-radius: 999px;
          box-shadow: 0 3px 8px rgba(15, 23, 42, 0.2), inset 0 0 0 1px rgba(255, 255, 255, 0.35);
          cursor: pointer;
        }

        .gs-center-panel {
          position: relative;
          min-width: 0;
          display: grid;
          overflow: hidden;
          background: #cfd5dc;
        }

        :root[data-mode="dark"] .gs-center-panel {
          background: #2a3038;
        }

        .gs-preview-panel,
        .gs-code-panel {
          grid-area: 1 / 1;
          position: relative;
          display: grid;
          place-content: center;
          min-width: 0;
          min-height: 0;
          opacity: 0;
          transform: translateX(4%);
          pointer-events: none;
          transition: opacity 0.24s ease, transform 0.24s ease;
        }

        .gs-preview-panel.is-active,
        .gs-code-panel.is-active {
          opacity: 1;
          transform: translateX(0);
          pointer-events: auto;
        }

        .gs-code-panel {
          background: var(--gs-surface-2);
        }

        .gs-panel-actions {
          position: absolute;
          top: 22px;
          right: 22px;
          z-index: 4;
        }

        .gs-back-action {
          left: 22px;
          right: auto;
        }

        .gs-preview-stage {
          position: relative;
          display: grid;
          place-items: center;
          width: min(92%, 1040px);
          min-height: min(76dvh, 690px);
        }

        .gs-hd-switch {
          position: absolute;
          left: 10px;
          top: 10px;
          z-index: 5;
          display: inline-grid;
          place-items: center;
          gap: 4px;
          cursor: pointer;
        }

        .gs-hd-switch span {
          display: inline-grid;
          place-items: center;
          min-width: 36px;
          height: 25px;
          border-radius: 7px;
          background: #101828;
          color: white;
          font-size: 11px;
          font-weight: 950;
          letter-spacing: -0.04em;
        }

        .gs-hd-switch input {
          position: absolute;
          opacity: 0;
        }

        .gs-resizer {
          position: relative;
          /* Large landscape preview like the original, constrained by the panel. */
          width: min(78vw, 760px);
          height: min(70vh, 620px);
          min-width: 320px;
          min-height: 300px;
          max-width: calc(100% - 48px);
          max-height: calc(100% - 64px);
          resize: both;
          overflow: visible;
          box-shadow: 0 34px 58px rgba(15, 23, 42, 0.24);
          /* Checkerboard lives on the same box as the gradient fill, so the two
             are pixel-aligned (origin at the box top-left). */
          background-color: #ffffff;
          background-image:
            linear-gradient(45deg, rgba(148,163,184,0.34) 25%, transparent 25%),
            linear-gradient(-45deg, rgba(148,163,184,0.34) 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, rgba(148,163,184,0.34) 75%),
            linear-gradient(-45deg, transparent 75%, rgba(148,163,184,0.34) 75%);
          background-size: 24px 24px;
          background-position: 0 0, 0 12px, 12px -12px, -12px 0;
        }

        /* Gradient paints on top of the checkerboard; transparent stops reveal it. */
        .gs-resizer-fill {
          position: absolute;
          inset: 0;
          z-index: 0;
        }

        .gs-overlay {
          pointer-events: none;
          position: absolute;
          inset: 0;
          z-index: 1;
        }

        .gs-linear-line {
          position: absolute;
          left: 50%;
          top: 50%;
          height: 2px;
          background: rgba(255, 255, 255, 0.9);
          box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.12);
          transform-origin: center;
          pointer-events: none;
        }

        .gs-linear-line::before,
        .gs-linear-line::after {
          content: "";
          position: absolute;
          top: 50%;
          width: 52%;
          border-top: 2px dashed rgba(255, 255, 255, 0.6);
          transform: translateY(-50%);
        }

        .gs-linear-line::before { right: 100%; }
        .gs-linear-line::after { left: 100%; }

        /* Invisible hit strip along the line for hover-preview + click-to-add. */
        .gs-linear-track {
          position: absolute;
          left: 50%;
          top: 50%;
          height: 30px;
          transform-origin: center;
          pointer-events: auto;
          cursor: crosshair;
          touch-action: none;
          user-select: none;
          -webkit-user-select: none;
        }

        /* Real color-stop handles (and the ghost preview) positioned in px. */
        .gs-stop-handle {
          position: absolute;
          width: 24px;
          height: 24px;
          transform: translate(-50%, -50%);
          border-radius: 999px;
          border: 3px solid #ffffff;
          box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.35), 0 6px 16px rgba(15, 23, 42, 0.32);
          pointer-events: none;
          z-index: 3;
        }

        .gs-stop-ghost {
          border-style: dashed;
          border-color: rgba(255, 255, 255, 0.92);
          background: rgba(255, 255, 255, 0.32) !important;
          opacity: 0.85;
          z-index: 2;
        }

        /* Center angle indicator — a ring arc filled to the current angle plus a
           reference line and dot. Purely visual; it never rotates as a whole. */
        .gs-angle-indicator {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 78px;
          height: 78px;
          transform: translate(-50%, -50%);
          pointer-events: none;
          z-index: 3;
        }

        .gs-angle-ring {
          position: absolute;
          inset: 0;
          border-radius: 999px;
          background: conic-gradient(rgba(255,255,255,0.78) 0 var(--gs-angle), rgba(255,255,255,0.12) var(--gs-angle) 360deg);
          -webkit-mask: radial-gradient(closest-side, transparent 66%, #000 68%);
          mask: radial-gradient(closest-side, transparent 66%, #000 68%);
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.25);
        }

        .gs-angle-refline {
          position: absolute;
          left: 50%;
          top: 3px;
          width: 2px;
          height: calc(50% - 3px);
          transform: translateX(-50%);
          background: rgba(255, 255, 255, 0.55);
        }

        .gs-angle-dot {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 12px;
          height: 12px;
          transform: translate(-50%, -50%);
          border-radius: 999px;
          background: #ffffff;
          box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.28), 0 4px 10px rgba(15, 23, 42, 0.3);
        }

        /* Only this center circle drags the angle. */
        .gs-linear-rotator {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 78px;
          height: 78px;
          transform: translate(-50%, -50%);
          border-radius: 999px;
          pointer-events: auto;
          cursor: grab;
          touch-action: none;
          user-select: none;
          -webkit-user-select: none;
          z-index: 4;
        }

        .gs-linear-rotator:active {
          cursor: grabbing;
        }

        .gs-position-target {
          position: absolute;
          transform: translate(-50%, -50%);
        }

        .gs-position-target::before,
        .gs-position-target::after {
          content: "";
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          border: 2px solid rgba(255, 255, 255, 0.76);
          border-radius: 999px;
        }

        .gs-position-target::before { width: 180px; height: 180px; }
        .gs-position-target::after { width: 82px; height: 82px; }
        .gs-position-target span {
          position: relative;
          display: block;
          width: 24px;
          height: 24px;
          border-radius: 999px;
          background: white;
          border: 5px solid #ffffff;
          color: #fff;
          box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.85), 0 7px 18px rgba(15, 23, 42, 0.22);
        }
        .gs-conic-target::before { border-top-color: rgba(255,255,255,0.22); border-left-color: rgba(255,255,255,0.22); }

        .gs-code-card {
          width: min(860px, 88%);
          max-height: 82%;
          overflow: auto;
          padding: 28px;
          border-radius: 22px;
          background: var(--gs-surface-3);
          box-shadow: var(--gs-shadow);
        }

        .gs-code-card h2 {
          margin: 0 0 18px;
          font-size: 24px;
          font-weight: 950;
          letter-spacing: -0.04em;
        }

        .gs-code-block {
          display: grid;
          gap: 8px;
          margin-top: 14px;
        }

        .gs-code-block header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .gs-code-block header b {
          font-size: 12px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--gs-text-2);
        }

        .gs-code-block pre {
          margin: 0;
          max-height: 170px;
          overflow: auto;
          padding: 15px;
          border-radius: 14px;
          background: #101828;
          color: #e7f0ff;
          font-size: 12px;
          line-height: 1.65;
          white-space: pre-wrap;
        }

        .gs-code-block button,
        .gs-stop-footer button,
        .gs-auto-button,
        .gs-dialog-actions button {
          border: 1px solid var(--gs-line);
          border-radius: 10px;
          background: var(--gs-surface-3);
          color: var(--gs-text-1);
          padding: 8px 12px;
          font-size: 13px;
          font-weight: 750;
          cursor: pointer;
        }

        .gs-menu-bar {
          position: sticky;
          top: 0;
          z-index: 6;
          display: flex;
          justify-content: flex-end;
          padding: 18px 20px 12px;
          background: color-mix(in srgb, var(--gs-surface-1) 96%, transparent);
          backdrop-filter: blur(12px);
        }

        .gs-global-action-shell {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          border: 0;
          background: transparent;
          color: var(--gs-text-2);
        }

        .gs-global-action-shell select {
          position: absolute;
          inset: 0;
          opacity: 0;
          width: 100%;
          cursor: pointer;
        }

        .gs-gradient-stops {
          padding-bottom: 22px;
        }

        .gs-stop-card,
        .gs-hint-card {
          display: grid;
          gap: 15px;
          background: var(--gs-surface-1);
        }

        .gs-stop-card legend,
        .gs-hint-card legend {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .gs-stop-card legend > span,
        .gs-hint-card legend > span {
          display: grid;
          gap: 3px;
          min-width: 0;
        }

        .gs-stop-card legend small,
        .gs-hint-card legend small {
          color: var(--gs-text-2);
          font-size: 12px;
          line-height: 1.4;
        }

        .gs-stop-swatch {
          width: 38px;
          height: 38px;
          border: 0;
          border-radius: 8px;
          font-size: 10px;
          font-weight: 950;
          box-shadow: inset 0 0 0 1px rgba(0,0,0,.15), 0 7px 14px rgba(15,23,42,.12);
        }

        .gs-stop-actions {
          display: flex;
          align-items: center;
          gap: 5px;
          margin-left: auto;
        }

        .gs-color-text-field {
          display: grid;
          grid-template-columns: 46px 1fr;
          gap: 8px;
          padding: 8px;
        }

        .gs-color-text-field input[type="color"] {
          width: 38px;
          height: 34px;
          padding: 2px;
          border: 1px solid var(--gs-line);
          border-radius: 4px;
          background: transparent;
        }

        .gs-color-text-field input:not([type="color"]) {
          min-width: 0;
          border: 0;
          background: transparent;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 12px;
          color: var(--gs-text-1);
        }

        .gs-stop-sliders {
          display: grid;
          gap: 12px;
        }

        .gs-stop-footer {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
          flex-wrap: wrap;
        }

        .gs-stop-footer .danger {
          color: #b42318;
        }

        .gs-hint-card {
          background: color-mix(in srgb, var(--gs-surface-2) 76%, var(--gs-surface-3));
        }

        .gs-hint-card .gs-auto-button {
          justify-self: end;
          min-width: 130px;
        }

        .gs-right-footer {
          padding: 16px 22px 28px;
          background: linear-gradient(to top, var(--gs-surface-1) 70%, transparent);
        }

        .gs-add-color {
          width: 100%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          border: 1px solid var(--gs-line);
          border-radius: 10px;
          background: var(--gs-surface-3);
          color: var(--gs-text-1);
          padding: 14px 16px;
          font-size: 17px;
          font-weight: 950;
          letter-spacing: -0.04em;
          box-shadow: 0 8px 18px rgba(15, 23, 42, 0.10);
          cursor: pointer;
        }

        .gs-dialog-backdrop {
          position: fixed;
          inset: 0;
          z-index: 80;
          display: grid;
          place-items: center;
          background: rgba(15, 23, 42, 0.58);
          backdrop-filter: blur(12px);
        }

        .gs-import-dialog {
          position: relative;
          width: min(680px, calc(100vw - 32px));
          border: 0;
          border-radius: 22px;
          background: var(--gs-surface-3);
          color: var(--gs-text-1);
          padding: 28px;
          box-shadow: var(--gs-shadow);
        }

        .gs-dialog-close {
          position: absolute;
          top: 14px;
          right: 14px;
          border: 0;
          background: transparent;
          color: var(--gs-text-2);
          cursor: pointer;
        }

        .gs-import-dialog h2 { margin: 0; font-size: 24px; font-weight: 950; letter-spacing: -0.04em; }
        .gs-import-dialog p { color: var(--gs-text-2); line-height: 1.65; }
        .gs-import-dialog textarea { width: 100%; min-height: 150px; padding: 14px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
        .gs-import-error { color: #b42318 !important; font-weight: 800; }
        .gs-dialog-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 14px; }
        .gs-dialog-actions button:last-child { display: inline-flex; gap: 8px; align-items: center; background: #101828; color: white; }

        .gs-toast,
        .gs-error-toast {
          position: fixed;
          right: 22px;
          bottom: 22px;
          z-index: 90;
          border-radius: 999px;
          padding: 11px 16px;
          background: #101828;
          color: white;
          font-size: 13px;
          font-weight: 850;
          box-shadow: var(--gs-shadow);
        }

        .gs-error-toast { background: #b42318; }

        @media (max-width: 1240px) {
          .gs-shell { overflow: auto; }
          .gs-builder {
            grid-template-columns: minmax(280px, 340px) minmax(480px, 1fr);
            grid-template-rows: minmax(660px, calc(100dvh - 110px)) minmax(520px, auto);
          }
          .gs-right-panel {
            grid-column: 1 / -1;
            border-left: 0;
            border-top: 1px solid var(--gs-line);
            max-height: 660px;
          }
        }

        @media (max-width: 820px) {
          .gs-shell { padding: 10px; overflow: auto; }
          .gs-builder { display: block; min-height: auto; overflow: visible; }
          .gs-left-panel, .gs-right-panel, .gs-center-panel { min-height: auto; border: 0; }
          .gs-left-panel { grid-template-rows: 180px auto 120px; }
          .gs-center-panel { min-height: 520px; }
          .gs-preview-stage { min-height: 460px; }
          .gs-resizer { width: 86%; height: 360px; max-width: calc(100% - 24px); }
        }
      `}</style>
    </div>
  );
}

function LayerGeometryControls({
  activeLayer,
  patchActiveLayer,
}: {
  activeLayer: GradientLayer;
  patchActiveLayer: (updater: (layer: GradientLayer) => GradientLayer) => void;
}) {
  return (
    <section className="gs-layer-geometry">
      {activeLayer.type === "linear" ? (
        <>
          <div className="gs-label-select-combo gs-angle-control-row">
            <label>Angle</label>
            <span className="gs-angle-dots" aria-hidden="true" />
            <select
              value={activeLayer.linear.namedAngle}
              onChange={(event) => {
                const namedAngle = event.target.value;
                const angle = namedAngle === "--" ? activeLayer.linear.angle : directionToDeg(namedAngle);
                patchActiveLayer((layer) => ({ ...layer, linear: { ...layer.linear, namedAngle, angle } }));
              }}
            >
              <option value="--">--</option>
              {LINEAR_DIRECTIONS.map((direction) => (
                <option key={direction} value={direction}>
                  {direction}
                </option>
              ))}
            </select>
          </div>
          <SliderField
            label=""
            value={activeLayer.linear.angle}
            min={0}
            max={360}
            unit="°"
            icon={<AngleGlyph angle={activeLayer.linear.angle} />}
            onChange={(angle) => patchActiveLayer((layer) => ({ ...layer, linear: { namedAngle: angleToDirection(angle), angle } }))}
          />
        </>
      ) : null}

      {activeLayer.type === "radial" ? (
        <>
          <div className="gs-label-select-combo">
            <label>Size</label>
            <select value={activeLayer.radial.size} onChange={(event) => patchActiveLayer((layer) => ({ ...layer, radial: { ...layer.radial, size: event.target.value } }))}>
              {RADIAL_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
          <div className="gs-label-select-combo">
            <label>Shape</label>
            <select value={activeLayer.radial.shape} onChange={(event) => patchActiveLayer((layer) => ({ ...layer, radial: { ...layer.radial, shape: event.target.value as GradientLayer["radial"]["shape"] } }))}>
              <option value="circle">circle</option>
              <option value="ellipse">ellipse</option>
            </select>
          </div>
          <div className="gs-label-select-combo">
            <label>Position</label>
            <select
              value={activeLayer.radial.namedPosition}
              onChange={(event) => {
                const namedPosition = event.target.value;
                const position = namedPosition === "--" ? activeLayer.radial.position : { x: null, y: null };
                patchActiveLayer((layer) => ({ ...layer, radial: { ...layer.radial, namedPosition, position } }));
              }}
            >
              <option value="--">custom x/y</option>
              {GRADIENT_POSITIONS.map((position) => (
                <option key={position} value={position}>
                  {position}
                </option>
              ))}
            </select>
          </div>
          <div className="gs-grid-two">
            <NumberInput label="X" value={activeLayer.radial.position.x ?? namedPositionToPercent(activeLayer.radial.namedPosition).x} min={-100} max={200} onChange={(x) => patchActiveLayer((layer) => ({ ...layer, radial: { ...layer.radial, namedPosition: "--", position: { ...layer.radial.position, x } } }))} />
            <NumberInput label="Y" value={activeLayer.radial.position.y ?? namedPositionToPercent(activeLayer.radial.namedPosition).y} min={-100} max={200} onChange={(y) => patchActiveLayer((layer) => ({ ...layer, radial: { ...layer.radial, namedPosition: "--", position: { ...layer.radial.position, y } } }))} />
          </div>
        </>
      ) : null}

      {activeLayer.type === "conic" ? (
        <>
          <SliderField label="Angle" value={activeLayer.conic.angle} min={0} max={360} unit="°" icon={<AngleGlyph angle={activeLayer.conic.angle} />} onChange={(angle) => patchActiveLayer((layer) => ({ ...layer, conic: { ...layer.conic, angle } }))} />
          <div className="gs-label-select-combo">
            <label>Position</label>
            <select
              value={activeLayer.conic.namedPosition}
              onChange={(event) => {
                const namedPosition = event.target.value;
                const position = namedPosition === "--" ? activeLayer.conic.position : { x: null, y: null };
                patchActiveLayer((layer) => ({ ...layer, conic: { ...layer.conic, namedPosition, position } }));
              }}
            >
              <option value="--">custom x/y</option>
              {GRADIENT_POSITIONS.map((position) => (
                <option key={position} value={position}>
                  {position}
                </option>
              ))}
            </select>
          </div>
          <div className="gs-grid-two">
            <NumberInput label="X" value={activeLayer.conic.position.x ?? namedPositionToPercent(activeLayer.conic.namedPosition).x} min={-100} max={200} onChange={(x) => patchActiveLayer((layer) => ({ ...layer, conic: { ...layer.conic, namedPosition: "--", position: { ...layer.conic.position, x } } }))} />
            <NumberInput label="Y" value={activeLayer.conic.position.y ?? namedPositionToPercent(activeLayer.conic.namedPosition).y} min={-100} max={200} onChange={(y) => patchActiveLayer((layer) => ({ ...layer, conic: { ...layer.conic, namedPosition: "--", position: { ...layer.conic.position, y } } }))} />
          </div>
        </>
      ) : null}
    </section>
  );
}

function CodeBlock({ label, code, onCopy }: { label: string; code: string; onCopy: () => void }) {
  return (
    <section className="gs-code-block">
      <header>
        <b>{label}</b>
        <button type="button" onClick={onCopy}>
          Copy
        </button>
      </header>
      <pre>{code}</pre>
    </section>
  );
}
