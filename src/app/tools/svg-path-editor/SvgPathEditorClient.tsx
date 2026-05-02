"use client";

import type { PointerEvent, ReactNode } from "react";
import { useMemo, useRef, useState } from "react";
import {
  Clipboard,
  Code2,
  Download,
  Eraser,
  Eye,
  FileInput,
  Grid3X3,
  Move,
  Redo2,
  RotateCcw,
  Scissors,
  Undo2,
  Wand2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Point, SvgItem, SvgPath, SvgPoint } from "./lib/svg";
import { optimizePath } from "./lib/optimize-path";
import { reversePath } from "./lib/reverse-path";
import type { SvgCommandTypeAny } from "./lib/svg-command-types";

type DragState = { kind: "target" | "control"; index: number } | null;
type Box = { x: number; y: number; width: number; height: number };
type ParseResult = { path: SvgPath | null; error: string };
type ButtonProps = { children: ReactNode; onClick?: () => void; disabled?: boolean; title?: string };

const DEFAULT_PATH = "M 90 220 C 120 80 260 80 290 220 S 460 360 490 220 L 490 360 L 90 360 Z";
const COMMAND_TYPES: SvgCommandTypeAny[] = ["M", "L", "H", "V", "C", "S", "Q", "T", "A", "Z"];

const EXAMPLES = [
  { label: "Polygon", path: "M 10 10 L 100 10 L 100 100 Z" },
  { label: "Cubic curve", path: "M 20 80 C 40 10, 65 10, 95 80" },
  { label: "Quadratic curve", path: "M 10 80 Q 95 10 180 80" },
  { label: "Arc", path: "M 20 20 A 30 30 0 0 1 80 80" },
];

function parsePath(value: string): ParseResult {
  const trimmed = value.trim();
  if (!trimmed) {
    return { path: null, error: "Paste or import an SVG path to start editing." };
  }

  try {
    return { path: new SvgPath(trimmed), error: "" };
  } catch (error) {
    return { path: null, error: error instanceof Error ? error.message : "Invalid SVG path syntax." };
  }
}

function round(value: number, decimals = 2) {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function safeNumber(value: string, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function extractFirstPathData(input: string) {
  const direct = input.trim();
  if (!direct.includes("<")) return direct;

  const match = direct.match(/<path\b[^>]*\sd=(['"])(.*?)\1/i);
  return match?.[2]?.trim() ?? "";
}

function Button({ children, onClick, disabled, title }: ButtonProps) {
  return (
    <button type="button" className="svg-editor-button" onClick={onClick} disabled={disabled} title={title}>
      {children}
    </button>
  );
}

function NumberField({
  label,
  value,
  onChange,
  step = 1,
}: {
  label: string;
  value: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="svg-editor-field">
      <span>{label}</span>
      <input type="number" step={step} value={Number.isFinite(value) ? value : 0} onChange={(event) => onChange(safeNumber(event.target.value))} />
    </label>
  );
}

export default function SvgPathEditorClient() {
  const [rawPath, setRawPath] = useState(DEFAULT_PATH);
  const [history, setHistory] = useState([DEFAULT_PATH]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [box, setBox] = useState<Box>({ x: 0, y: 0, width: 580, height: 460 });
  const [selected, setSelected] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);
  const [scaleX, setScaleX] = useState(1);
  const [scaleY, setScaleY] = useState(1);
  const [moveX, setMoveX] = useState(0);
  const [moveY, setMoveY] = useState(0);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [rotateAngle, setRotateAngle] = useState(0);
  const [decimals, setDecimals] = useState(3);
  const [minify, setMinify] = useState(false);
  const [fillPreview, setFillPreview] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [snap, setSnap] = useState(false);
  const [drag, setDrag] = useState<DragState>(null);
  const [toast, setToast] = useState("");
  const svgRef = useRef<SVGSVGElement | null>(null);
  const draftPathRef = useRef(rawPath);

  const parsed = useMemo(() => parsePath(rawPath), [rawPath]);
  const svg = parsed.path;
  const error = parsed.error;
  const selectedIndex = svg ? Math.min(selected, Math.max(0, svg.path.length - 1)) : 0;
  const targets = svg?.targetLocations() ?? [];
  const controls = svg?.controlLocations() ?? [];
  const selectedItem = svg?.path[selectedIndex] ?? null;
  const formattedPath = svg ? svg.asString(decimals, minify) : "";
  const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box.x} ${box.y} ${box.width} ${box.height}">\n  <path d="${formattedPath || rawPath}" fill="${fillPreview ? "currentColor" : "none"}" stroke="currentColor" stroke-width="4"/>\n</svg>`;

  function commit(next: string, options?: { reformat?: boolean; keepSelection?: boolean }) {
    const normalized = options?.reformat ? new SvgPath(next).asString(decimals, minify) : next.trim();
    draftPathRef.current = normalized;
    setRawPath(normalized);
    setHistory((current) => {
      const base = current.slice(0, historyIndex + 1);
      if (base[base.length - 1] === normalized) return current;
      setHistoryIndex(base.length);
      return [...base, normalized];
    });

    if (!options?.keepSelection) {
      try {
        const nextPath = new SvgPath(normalized);
        setSelected((current) => Math.min(current, Math.max(0, nextPath.path.length - 1)));
      } catch {
        setSelected(0);
      }
    }
  }

  function setDraft(next: string) {
    draftPathRef.current = next;
    setRawPath(next);
  }

  function run(change: (path: SvgPath) => void, options?: { keepSelection?: boolean }) {
    if (!svg || error) return;
    try {
      const next = new SvgPath(rawPath);
      change(next);
      commit(next.asString(decimals, minify), { keepSelection: options?.keepSelection });
    } catch (err) {
      console.error(err);
      setToast("Action failed");
      window.setTimeout(() => setToast(""), 1300);
    }
  }

  function undo() {
    if (historyIndex <= 0) return;
    const next = historyIndex - 1;
    setHistoryIndex(next);
    draftPathRef.current = history[next];
    setRawPath(history[next]);
  }

  function redo() {
    if (historyIndex >= history.length - 1) return;
    const next = historyIndex + 1;
    setHistoryIndex(next);
    draftPathRef.current = history[next];
    setRawPath(history[next]);
  }

  async function copy(label: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setToast(label);
    } catch {
      setToast("Copy failed");
    }
    window.setTimeout(() => setToast(""), 1300);
  }

  function download() {
    const blob = new Blob([fullSvg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "darma-svg-path.svg";
    a.click();
    URL.revokeObjectURL(url);
  }

  function importSvg(input: string) {
    const imported = extractFirstPathData(input);
    if (!imported) {
      setToast("No path d attribute found");
      window.setTimeout(() => setToast(""), 1300);
      return;
    }
    try {
      commit(new SvgPath(imported).asString(decimals, minify));
      setToast("SVG path imported");
    } catch {
      setDraft(imported);
      setToast("Imported path needs fixing");
    }
    window.setTimeout(() => setToast(""), 1300);
  }

  function eventPoint(event: PointerEvent<SVGSVGElement>) {
    const el = svgRef.current;
    if (!el) return new Point(0, 0);
    const rect = el.getBoundingClientRect();
    const x = box.x + ((event.clientX - rect.left) / rect.width) * box.width;
    const y = box.y + ((event.clientY - rect.top) / rect.height) * box.height;
    const snappedX = snap ? Math.round(x / 10) * 10 : x;
    const snappedY = snap ? Math.round(y / 10) * 10 : y;
    return new Point(round(snappedX), round(snappedY));
  }

  function onMove(event: PointerEvent<SVGSVGElement>) {
    if (!drag || error) return;
    event.preventDefault();
    try {
      const next = new SvgPath(draftPathRef.current);
      const point = drag.kind === "target" ? next.targetLocations()[drag.index] : next.controlLocations()[drag.index];
      if (!point || !point.movable) return;
      next.setLocation(point as SvgPoint, eventPoint(event));
      const nextPath = next.asString(decimals, minify);
      draftPathRef.current = nextPath;
      setRawPath(nextPath);
    } catch (err) {
      console.error(err);
    }
  }

  function endDrag() {
    if (!drag) return;
    const next = draftPathRef.current;
    setDrag(null);
    if (!error && next.trim()) {
      commit(next, { keepSelection: true });
    }
  }

  function zoom(amount: number) {
    setBox((current) => {
      const width = Math.max(50, current.width * amount);
      const height = Math.max(50, current.height * amount);
      return { x: current.x + (current.width - width) / 2, y: current.y + (current.height - height) / 2, width, height };
    });
  }

  const grid = [];
  if (showGrid) {
    const step = 20;
    for (let x = Math.floor(box.x / step) * step; x <= box.x + box.width; x += step) {
      grid.push(<line key={`x-${x}`} x1={x} y1={box.y} x2={x} y2={box.y + box.height} />);
    }
    for (let y = Math.floor(box.y / step) * step; y <= box.y + box.height; y += step) {
      grid.push(<line key={`y-${y}`} x1={box.x} y1={y} x2={box.x + box.width} y2={y} />);
    }
  }

  return (
    <main className="svg-editor-page">
      {toast ? <div className="svg-editor-toast">{toast}</div> : null}

      <section className="svg-editor-topbar" aria-label="SVG editor quick actions">
        <div>
          <p className="svg-editor-kicker">Vector workbench</p>
          <h2>Interactive SVG path studio</h2>
          <p>Drag points, inspect commands, transform path data, and export clean browser-ready SVG.</p>
        </div>
        <div className="svg-editor-hero-actions">
          <Button onClick={undo} disabled={historyIndex <= 0}><Undo2 size={16} /> Undo</Button>
          <Button onClick={redo} disabled={historyIndex >= history.length - 1}><Redo2 size={16} /> Redo</Button>
          <Button onClick={() => copy("Path copied", formattedPath)} disabled={Boolean(error)}><Clipboard size={16} /> Copy path</Button>
          <Button onClick={() => copy("SVG copied", fullSvg)} disabled={Boolean(error)}><Code2 size={16} /> Copy SVG</Button>
          <Button onClick={download} disabled={Boolean(error)}><Download size={16} /> Download</Button>
        </div>
      </section>

      <section className="svg-editor-workbench">
        <aside className="svg-editor-panel svg-editor-left-panel">
          <div className="svg-editor-section">
            <div className="svg-editor-section-title"><Code2 size={16} /> Path input</div>
            <textarea
              value={rawPath}
              onChange={(event) => setDraft(event.target.value)}
              onBlur={() => {
                const parsedPath = parsePath(rawPath).path;
                if (parsedPath) commit(parsedPath.asString(decimals, minify));
              }}
              spellCheck={false}
            />
            {error ? <p className="svg-editor-error">{error}</p> : <p className="svg-editor-help">Valid path. {svg?.path.length ?? 0} commands detected.</p>}
            <div className="svg-editor-example-row">
              {EXAMPLES.map((example) => (
                <button key={example.label} type="button" onClick={() => commit(example.path)}>{example.label}</button>
              ))}
            </div>
          </div>

          <div className="svg-editor-section">
            <div className="svg-editor-section-title"><FileInput size={16} /> Import SVG</div>
            <textarea
              className="svg-editor-import"
              placeholder={'Paste a full <svg> or <path d="..."> here, then click Import.'}
              onBlur={(event) => {
                if (event.currentTarget.value.trim()) {
                  importSvg(event.currentTarget.value);
                  event.currentTarget.value = "";
                }
              }}
              spellCheck={false}
            />
            <p className="svg-editor-help">This imports the first path d attribute. Multi-path SVG support can be added later.</p>
          </div>

          <div className="svg-editor-section">
            <div className="svg-editor-section-title"><Eye size={16} /> ViewBox</div>
            <div className="svg-editor-grid-two">
              <NumberField label="X" value={box.x} onChange={(value) => setBox((current) => ({ ...current, x: value }))} />
              <NumberField label="Y" value={box.y} onChange={(value) => setBox((current) => ({ ...current, y: value }))} />
              <NumberField label="Width" value={box.width} onChange={(value) => setBox((current) => ({ ...current, width: Math.max(10, value) }))} />
              <NumberField label="Height" value={box.height} onChange={(value) => setBox((current) => ({ ...current, height: Math.max(10, value) }))} />
            </div>
          </div>

          <div className="svg-editor-section">
            <div className="svg-editor-section-title"><Move size={16} /> Transform</div>
            <div className="svg-editor-grid-two">
              <NumberField label="Scale X" value={scaleX} step={0.1} onChange={setScaleX} />
              <NumberField label="Scale Y" value={scaleY} step={0.1} onChange={setScaleY} />
              <NumberField label="Move X" value={moveX} onChange={setMoveX} />
              <NumberField label="Move Y" value={moveY} onChange={setMoveY} />
              <NumberField label="Rotate X" value={rotateX} onChange={setRotateX} />
              <NumberField label="Rotate Y" value={rotateY} onChange={setRotateY} />
              <NumberField label="Angle" value={rotateAngle} onChange={setRotateAngle} />
              <NumberField label="Decimals" value={decimals} onChange={(value) => setDecimals(Math.max(0, Math.min(6, Math.round(value))))} />
            </div>
            <div className="svg-editor-button-grid">
              <Button onClick={() => run((path) => path.scale(scaleX, scaleY))} disabled={Boolean(error)}>Apply scale</Button>
              <Button onClick={() => run((path) => path.translate(moveX, moveY))} disabled={Boolean(error)}>Apply move</Button>
              <Button onClick={() => run((path) => path.rotate(rotateX, rotateY, rotateAngle))} disabled={Boolean(error)}>Rotate</Button>
              <Button onClick={() => run(() => undefined)} disabled={Boolean(error)}>Round output</Button>
            </div>
          </div>

          <div className="svg-editor-section">
            <div className="svg-editor-section-title"><Wand2 size={16} /> Path actions</div>
            <div className="svg-editor-button-grid">
              <Button onClick={() => run((path) => path.setRelative(false))} disabled={Boolean(error)}>Absolute</Button>
              <Button onClick={() => run((path) => path.setRelative(true))} disabled={Boolean(error)}>Relative</Button>
              <Button onClick={() => run((path) => optimizePath(path, { removeUselessCommands: true, removeOrphanDots: true, useShorthands: true, useHorizontalAndVerticalLines: true, useRelativeAbsolute: true, useClosePath: true }))} disabled={Boolean(error)}>Optimize</Button>
              <Button onClick={() => run((path) => reversePath(path))} disabled={Boolean(error)}>Reverse</Button>
              <Button onClick={() => commit(DEFAULT_PATH)}><RotateCcw size={16} /> Reset</Button>
              <Button onClick={() => setDraft("")}><Eraser size={16} /> Clear</Button>
            </div>
            <label className="svg-editor-check"><input type="checkbox" checked={minify} onChange={(event) => setMinify(event.target.checked)} /> Minify output</label>
            <label className="svg-editor-check"><input type="checkbox" checked={fillPreview} onChange={(event) => setFillPreview(event.target.checked)} /> Fill preview</label>
          </div>
        </aside>

        <section className="svg-editor-canvas-card">
          <div className="svg-editor-canvas-toolbar">
            <div className="svg-editor-canvas-title">Canvas</div>
            <div className="svg-editor-canvas-actions">
              <Button onClick={() => zoom(0.82)} title="Zoom in"><ZoomIn size={16} /></Button>
              <Button onClick={() => zoom(1.18)} title="Zoom out"><ZoomOut size={16} /></Button>
              <Button onClick={() => setBox({ x: 0, y: 0, width: 580, height: 460 })}>Fit</Button>
              <Button onClick={() => setShowGrid((value) => !value)}><Grid3X3 size={16} /> Grid</Button>
              <label className="svg-editor-check"><input type="checkbox" checked={snap} onChange={(event) => setSnap(event.target.checked)} /> Snap</label>
            </div>
          </div>
          <div className="svg-editor-canvas-wrap">
            <svg ref={svgRef} className="svg-editor-canvas" viewBox={`${box.x} ${box.y} ${box.width} ${box.height}`} onPointerMove={onMove} onPointerUp={endDrag} onPointerLeave={endDrag}>
              <g className="svg-editor-grid-lines">{grid}</g>
              {!error && svg ? (
                <>
                  <path d={formattedPath} className={fillPreview ? "svg-editor-main-path-filled" : "svg-editor-main-path"} />
                  {hovered !== null && svg.path[hovered] ? <path d={svg.path[hovered].asStandaloneString()} className="svg-editor-hover-path" /> : null}
                  {selectedItem ? <path d={selectedItem.asStandaloneString()} className="svg-editor-selected-path" /> : null}
                  {controls.map((control, index) => (
                    <g key={`c-${index}`}>
                      {control.relations.map((relation, relationIndex) => <line key={relationIndex} x1={control.x} y1={control.y} x2={relation.x} y2={relation.y} className="svg-editor-handle" />)}
                      <circle
                        cx={control.x}
                        cy={control.y}
                        r={5}
                        className="svg-editor-control-point"
                        onPointerDown={(event) => {
                          event.stopPropagation();
                          setDrag({ kind: "control", index });
                          event.currentTarget.setPointerCapture(event.pointerId);
                        }}
                      />
                    </g>
                  ))}
                  {targets.map((target, index) => (
                    <circle
                      key={`t-${index}`}
                      cx={target.x}
                      cy={target.y}
                      r={index === selectedIndex ? 7 : 5}
                      className={index === selectedIndex ? "svg-editor-target-point is-selected" : "svg-editor-target-point"}
                      onPointerEnter={() => setHovered(index)}
                      onPointerLeave={() => setHovered(null)}
                      onPointerDown={(event) => {
                        event.stopPropagation();
                        setSelected(index);
                        setDrag({ kind: "target", index });
                        event.currentTarget.setPointerCapture(event.pointerId);
                      }}
                    />
                  ))}
                </>
              ) : (
                <text x={box.x + 24} y={box.y + 48} className="svg-editor-invalid-text">Fix path syntax to preview.</text>
              )}
            </svg>
          </div>
        </section>

        <aside className="svg-editor-panel svg-editor-right-panel">
          <div className="svg-editor-section">
            <div className="svg-editor-section-title"><Scissors size={16} /> Selected command</div>
            {selectedItem ? (
              <>
                <div className="svg-editor-command-summary"><strong>{selectedItem.getType()}</strong><span>{selectedIndex + 1}. target {round(selectedItem.targetLocation().x)}, {round(selectedItem.targetLocation().y)}</span></div>
                <div className="svg-editor-grid-two">
                  {selectedItem.values.map((value, index) => (
                    <div key={`${selectedIndex}-${index}`}>
                      <NumberField
                        label={`Value ${index + 1}`}
                        value={round(value, 4)}
                        step={0.1}
                        onChange={(next) => run((path) => {
                          path.path[selectedIndex].values[index] = next;
                          path.refreshAbsolutePositions();
                        }, { keepSelection: true })}
                      />
                    </div>
                  ))}
                </div>
                <div className="svg-editor-command-actions">
                  <select value={selectedItem.getType(true)} onChange={(event) => run((path) => path.changeType(path.path[selectedIndex], event.target.value as SvgCommandTypeAny), { keepSelection: true })} disabled={selectedIndex === 0}>
                    {COMMAND_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                  </select>
                  <Button onClick={() => run((path) => path.path[selectedIndex].setRelative(!path.path[selectedIndex].relative), { keepSelection: true })} disabled={selectedIndex === 0}>Rel/abs</Button>
                  <Button onClick={() => {
                    const p = selectedItem.targetLocation();
                    run((path) => path.insert(SvgItem.Make(["L", String(p.x + 40), String(p.y)]), path.path[selectedIndex]));
                    setSelected((value) => value + 1);
                  }}>Insert L</Button>
                  <Button onClick={() => {
                    run((path) => path.delete(path.path[selectedIndex]));
                    setSelected((value) => Math.max(0, value - 1));
                  }} disabled={selectedIndex === 0}>Delete</Button>
                </div>
              </>
            ) : <p className="svg-editor-help">Select a command to edit values.</p>}
          </div>

          <div className="svg-editor-section">
            <div className="svg-editor-section-title"><Code2 size={16} /> Commands</div>
            <div className="svg-editor-command-list">
              {svg?.path.map((item, index) => (
                <button
                  key={`${index}-${item.getType()}-${item.values.join("-")}`}
                  type="button"
                  className={index === selectedIndex ? "svg-editor-command-row is-selected" : "svg-editor-command-row"}
                  onClick={() => setSelected(index)}
                  onMouseEnter={() => setHovered(index)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <span>{item.getType()}</span>
                  <small>{item.values.map((v) => round(v)).join(" ") || "close"}</small>
                </button>
              ))}
            </div>
          </div>

          <div className="svg-editor-section">
            <div className="svg-editor-section-title"><Download size={16} /> Output</div>
            <textarea className="svg-editor-output" readOnly value={error ? "" : formattedPath} />
            <div className="svg-editor-button-grid">
              <Button onClick={() => copy("Path copied", formattedPath)} disabled={Boolean(error)}>Copy path</Button>
              <Button onClick={() => copy("SVG copied", fullSvg)} disabled={Boolean(error)}>Copy SVG</Button>
            </div>
          </div>

          <div className="svg-editor-section svg-editor-license-note">
            <strong>Attribution</strong>
            <p>SVG engine adapted from Yqnn/svg-path-editor under Apache-2.0. License and notice files are preserved.</p>
          </div>
        </aside>
      </section>
    </main>
  );
}
