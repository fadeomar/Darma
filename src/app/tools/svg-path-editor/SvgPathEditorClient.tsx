"use client";

import type { PointerEvent, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bookmark,
  BookmarkCheck,
  Clipboard,
  Code2,
  Download,
  Eraser,
  Eye,
  FileInput,
  Grid3X3,
  Keyboard,
  Layers,
  Move,
  Palette,
  Redo2,
  RotateCcw,
  Scissors,
  Search,
  ScanSearch,
  Star,
  Undo2,
  Wand2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Point, SvgItem, SvgPath, SvgPoint } from "./lib/svg";
import { optimizePath } from "./lib/optimize-path";
import { reversePath } from "./lib/reverse-path";
import type { SvgCommandTypeAny } from "./lib/svg-command-types";

// ─── Constants ────────────────────────────────────────────────────────────────

type DragState = { kind: "target" | "control"; index: number } | null;
type Box = { x: number; y: number; width: number; height: number };
type ParseResult = { path: SvgPath | null; error: string };
type ButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  active?: boolean;
};
type SavedPath = { id: string; label: string; path: string; savedAt: number };
type TooltipState = { x: number; y: number; cx: number; cy: number } | null;
type PanState = { startX: number; startY: number; boxStart: Box } | null;

const DEFAULT_PATH =
  "M 90 220 C 120 80 260 80 290 220 S 460 360 490 220 L 490 360 L 90 360 Z";
const COMMAND_TYPES: SvgCommandTypeAny[] = [
  "M",
  "L",
  "H",
  "V",
  "C",
  "S",
  "Q",
  "T",
  "A",
  "Z",
];
const TOAST_DURATION = 1300;
const MAX_HISTORY = 100;
const LS_SAVED_KEY = "darma-svg-editor-saved";

// ─── Examples ─────────────────────────────────────────────────────────────────

type ExampleCategory =
  | "Shapes"
  | "Arrows"
  | "Icons"
  | "UI Elements"
  | "Decorative";

interface Example {
  label: string;
  category: ExampleCategory;
  path: string;
}

const EXAMPLES: Example[] = [
  // Shapes
  { label: "Triangle", category: "Shapes", path: "M 50 10 L 90 90 L 10 90 Z" },
  {
    label: "Diamond",
    category: "Shapes",
    path: "M 50 5 L 95 50 L 50 95 L 5 50 Z",
  },
  {
    label: "Pentagon",
    category: "Shapes",
    path: "M 50 5 L 98 35 L 79 91 L 21 91 L 2 35 Z",
  },
  {
    label: "Hexagon",
    category: "Shapes",
    path: "M 50 3 L 97 25 L 97 75 L 50 97 L 3 75 L 3 25 Z",
  },
  {
    label: "Star 5pt",
    category: "Shapes",
    path: "M 50 5 L 61 35 L 95 35 L 68 57 L 79 91 L 50 70 L 21 91 L 32 57 L 5 35 L 39 35 Z",
  },
  {
    label: "Rounded rect",
    category: "Shapes",
    path: "M 20 5 H 80 A 15 15 0 0 1 95 20 V 80 A 15 15 0 0 1 80 95 H 20 A 15 15 0 0 1 5 80 V 20 A 15 15 0 0 1 20 5 Z",
  },
  {
    label: "Crescent",
    category: "Shapes",
    path: "M 50 10 A 40 40 0 1 1 50 90 A 28 28 0 1 0 50 10 Z",
  },
  {
    label: "Cross",
    category: "Shapes",
    path: "M 35 5 H 65 V 35 H 95 V 65 H 65 V 95 H 35 V 65 H 5 V 35 H 35 Z",
  },
  // Arrows
  {
    label: "Arrow right",
    category: "Arrows",
    path: "M 10 40 H 60 L 60 20 L 90 50 L 60 80 L 60 60 H 10 Z",
  },
  {
    label: "Arrow left",
    category: "Arrows",
    path: "M 90 40 H 40 L 40 20 L 10 50 L 40 80 L 40 60 H 90 Z",
  },
  {
    label: "Arrow up",
    category: "Arrows",
    path: "M 40 90 V 40 H 20 L 50 10 L 80 40 H 60 V 90 Z",
  },
  {
    label: "Double arrow",
    category: "Arrows",
    path: "M 20 50 L 40 30 L 40 45 H 60 V 30 L 80 50 L 60 70 V 55 H 40 V 70 Z",
  },
  {
    label: "Chevron right",
    category: "Arrows",
    path: "M 30 10 L 70 50 L 30 90",
  },
  {
    label: "Chevron left",
    category: "Arrows",
    path: "M 70 10 L 30 50 L 70 90",
  },
  {
    label: "Curved arrow",
    category: "Arrows",
    path: "M 20 70 C 20 30 80 30 80 60 L 72 52 M 80 62 L 88 52",
  },
  // Icons
  {
    label: "Heart",
    category: "Icons",
    path: "M 50 85 C 15 60 5 35 5 28 C 5 15 15 8 25 8 C 35 8 43 14 50 22 C 57 14 65 8 75 8 C 85 8 95 15 95 28 C 95 35 85 60 50 85 Z",
  },
  {
    label: "Cloud",
    category: "Icons",
    path: "M 25 60 A 20 20 0 0 1 25 20 A 15 15 0 0 1 50 12 A 22 22 0 0 1 88 30 A 18 18 0 1 1 80 65 Z",
  },
  {
    label: "Lightning",
    category: "Icons",
    path: "M 60 5 L 25 55 H 48 L 40 95 L 75 45 H 52 Z",
  },
  {
    label: "Shield",
    category: "Icons",
    path: "M 50 5 L 90 20 V 55 C 90 75 70 90 50 95 C 30 90 10 75 10 55 V 20 Z",
  },
  {
    label: "Home",
    category: "Icons",
    path: "M 50 10 L 90 50 H 75 V 90 H 60 V 65 H 40 V 90 H 25 V 50 H 10 Z",
  },
  {
    label: "Location pin",
    category: "Icons",
    path: "M 50 5 A 30 30 0 0 1 80 35 C 80 60 50 90 50 90 C 50 90 20 60 20 35 A 30 30 0 0 1 50 5 Z M 50 25 A 10 10 0 1 0 50 45 A 10 10 0 0 0 50 25 Z",
  },
  {
    label: "Bell",
    category: "Icons",
    path: "M 50 5 C 50 5 45 5 45 10 C 30 13 20 25 20 40 V 65 H 10 V 72 H 90 V 65 H 80 V 40 C 80 25 70 13 55 10 C 55 5 50 5 50 5 Z M 42 72 A 8 8 0 0 0 58 72 Z",
  },
  {
    label: "Music note",
    category: "Icons",
    path: "M 55 10 V 60 A 15 15 0 1 1 45 55 V 28 L 75 20 V 38 L 55 44 Z",
  },
  // UI Elements
  {
    label: "Checkmark",
    category: "UI Elements",
    path: "M 15 50 L 38 73 L 85 27",
  },
  {
    label: "Close X",
    category: "UI Elements",
    path: "M 20 20 L 80 80 M 80 20 L 20 80",
  },
  {
    label: "Play button",
    category: "UI Elements",
    path: "M 50 5 A 45 45 0 1 0 50 95 A 45 45 0 0 0 50 5 Z M 38 30 L 72 50 L 38 70 Z",
  },
  {
    label: "Search",
    category: "UI Elements",
    path: "M 42 15 A 27 27 0 1 0 42 69 A 27 27 0 0 0 42 15 Z M 62 62 L 85 85",
  },
  {
    label: "Settings gear",
    category: "UI Elements",
    path: "M 50 35 A 15 15 0 1 0 50 65 A 15 15 0 0 0 50 35 Z M 50 10 L 55 22 L 65 18 L 70 28 L 82 28 L 82 38 L 90 45 L 82 52 L 82 62 L 70 62 L 65 72 L 55 68 L 50 80 L 45 68 L 35 72 L 30 62 L 18 62 L 18 52 L 10 45 L 18 38 L 18 28 L 30 28 L 35 18 L 45 22 Z",
  },
  {
    label: "Toggle on",
    category: "UI Elements",
    path: "M 30 30 H 70 A 20 20 0 0 1 70 70 H 30 A 20 20 0 0 1 30 30 Z M 70 35 A 15 15 0 1 0 70 65 A 15 15 0 0 0 70 35 Z",
  },
  {
    label: "Bookmark",
    category: "UI Elements",
    path: "M 20 10 H 80 V 95 L 50 75 L 20 95 Z",
  },
  // Decorative
  {
    label: "Wave",
    category: "Decorative",
    path: "M 0 50 C 15 20 35 20 50 50 S 85 80 100 50",
  },
  {
    label: "Infinity",
    category: "Decorative",
    path: "M 50 50 C 50 30 20 10 5 30 C -10 50 20 70 50 50 C 80 30 110 50 95 70 C 80 90 50 70 50 50 Z",
  },
  {
    label: "Spiral",
    category: "Decorative",
    path: "M 50 50 C 50 35 65 30 70 40 C 75 50 65 62 50 62 C 35 62 22 48 25 33 C 28 18 45 10 60 15",
  },
  {
    label: "Leaf",
    category: "Decorative",
    path: "M 50 90 C 10 70 10 20 50 10 C 90 20 90 70 50 90 Z M 50 90 L 50 10",
  },
  {
    label: "Flame",
    category: "Decorative",
    path: "M 50 90 C 20 75 15 50 30 35 C 28 50 38 55 40 45 C 42 30 55 20 50 5 C 70 20 75 45 65 55 C 68 45 72 48 70 60 C 80 45 78 25 65 15 C 80 25 90 50 80 70 C 75 80 65 88 50 90 Z",
  },
  {
    label: "Ribbon",
    category: "Decorative",
    path: "M 10 30 Q 30 50 10 70 L 50 50 L 90 30 Q 70 50 90 70 L 50 50 Z",
  },
  {
    label: "Flower",
    category: "Decorative",
    path: "M 50 50 C 50 20 70 5 80 20 C 90 35 75 50 50 50 C 75 50 90 65 80 80 C 70 95 50 80 50 50 C 50 80 30 95 20 80 C 10 65 25 50 50 50 C 25 50 10 35 20 20 C 30 5 50 20 50 50 Z",
  },
  {
    label: "Swirl",
    category: "Decorative",
    path: "M 80 20 C 95 35 95 65 80 80 C 65 95 35 95 20 80 C 5 65 5 35 20 20 C 35 5 60 8 70 25 C 80 42 72 62 55 65 C 38 68 28 52 38 40",
  },
];

const EXAMPLE_CATEGORIES: ExampleCategory[] = [
  "Shapes",
  "Arrows",
  "Icons",
  "UI Elements",
  "Decorative",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parsePath(value: string): ParseResult {
  const trimmed = value.trim();
  if (!trimmed)
    return {
      path: null,
      error: "Paste or import an SVG path to start editing.",
    };
  try {
    return { path: new SvgPath(trimmed), error: "" };
  } catch (error) {
    return {
      path: null,
      error:
        error instanceof Error ? error.message : "Invalid SVG path syntax.",
    };
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

function extractAllPaths(input: string): string[] {
  const direct = input.trim();
  if (!direct.includes("<")) return direct ? [direct] : [];
  const results: string[] = [];
  // Use dotAll-style match per path tag to handle multiline d attributes
  const pathTagRegex = /<path\b([\s\S]*?)(?:\/>|>)/gi;
  let tagMatch: RegExpExecArray | null;
  while ((tagMatch = pathTagRegex.exec(direct)) !== null) {
    const attrs = tagMatch[1];
    const dMatch = attrs.match(/\bd=(["'])([\s\S]*?)\1/i);
    const d = dMatch?.[2]?.trim().replace(/\s+/g, " ");
    if (d) results.push(d);
  }
  return results;
}

function computePathBounds(svg: SvgPath): Box | null {
  const points = svg.path.flatMap((item) => [
    ...item.absolutePoints,
    ...item.absoluteControlPoints,
  ]);
  if (!points.length) return null;
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  const pad = Math.max((maxX - minX) * 0.14, (maxY - minY) * 0.14, 24);
  return {
    x: minX - pad,
    y: minY - pad,
    width: maxX - minX + pad * 2,
    height: maxY - minY + pad * 2,
  };
}

function loadSaved(): SavedPath[] {
  try {
    const raw = localStorage.getItem(LS_SAVED_KEY);
    return raw ? (JSON.parse(raw) as SavedPath[]) : [];
  } catch {
    return [];
  }
}

function persistSaved(items: SavedPath[]) {
  try {
    localStorage.setItem(LS_SAVED_KEY, JSON.stringify(items));
  } catch {
    /* noop */
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Button({ children, onClick, disabled, title, active }: ButtonProps) {
  return (
    <button
      type="button"
      className={`svg-editor-button${active ? " is-active" : ""}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {children}
    </button>
  );
}

function NumberField({
  label,
  value,
  onChange,
  step = 1,
  hint,
}: {
  label: string;
  value: number;
  step?: number;
  hint?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="svg-editor-field" title={hint}>
      <span className="svg-editor-field-label">{label}</span>
      <input
        type="number"
        step={step}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(safeNumber(e.target.value))}
      />
    </label>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="svg-editor-field">
      <span className="svg-editor-field-label">{label}</span>
      <div className="svg-editor-color-wrap">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <span className="svg-editor-color-hex">{value}</span>
      </div>
    </label>
  );
}

function SectionTitle({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="svg-editor-section-title">
      <span className="svg-editor-section-icon">{icon}</span>
      {children}
    </div>
  );
}

function ExampleCard({
  example,
  onLoad,
}: {
  example: Example;
  onLoad: (path: string) => void;
}) {
  const preview = useMemo(() => {
    try {
      return new SvgPath(example.path).asString(2, false);
    } catch {
      return example.path;
    }
  }, [example.path]);
  return (
    <button
      type="button"
      className="svg-editor-example-card"
      onClick={() => onLoad(example.path)}
      title={`Load: ${example.label}`}
    >
      <div className="svg-editor-example-preview">
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <path
            d={preview}
            fill="none"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <span className="svg-editor-example-label">{example.label}</span>
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SvgPathEditorClient() {
  // Core
  const [rawPath, setRawPath] = useState(DEFAULT_PATH);
  const [history, setHistory] = useState([DEFAULT_PATH]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [box, setBox] = useState<Box>({ x: 0, y: 0, width: 580, height: 460 });
  const [selected, setSelected] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);

  // Transform
  const [scaleX, setScaleX] = useState(1);
  const [scaleY, setScaleY] = useState(1);
  const [moveX, setMoveX] = useState(0);
  const [moveY, setMoveY] = useState(0);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [rotateAngle, setRotateAngle] = useState(0);
  const [decimals, setDecimals] = useState(3);

  // Canvas
  const [minify, setMinify] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [snap, setSnap] = useState(false);
  const [strokeColor, setStrokeColor] = useState("#6366f1");
  const [fillColor, setFillColor] = useState("#6366f1");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [fillPreview, setFillPreview] = useState(false);

  // Interaction
  const [drag, setDrag] = useState<DragState>(null);
  const [pan, setPan] = useState<PanState>(null);
  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const [toast, setToast] = useState("");
  const [importRaw, setImportRaw] = useState("");
  const [importPaths, setImportPaths] = useState<string[]>([]);

  // UI
  const [activeTab, setActiveTab] = useState<"controls" | "examples" | "saved">(
    "controls",
  );
  const [exampleSearch, setExampleSearch] = useState("");
  const [exampleCategory, setExampleCategory] = useState<
    ExampleCategory | "All"
  >("All");
  const [savedPaths, setSavedPaths] = useState<SavedPath[]>(() => loadSaved());
  const [showShortcuts, setShowShortcuts] = useState(false);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const draftPathRef = useRef(rawPath);
  const toastTimerRef = useRef<number | null>(null);

  // ── Derived ────────────────────────────────────────────────────────────────

  const parsed = useMemo(() => parsePath(rawPath), [rawPath]);
  const svg = parsed.path;
  const error = parsed.error;
  const selectedIndex = svg
    ? Math.min(selected, Math.max(0, svg.path.length - 1))
    : 0;
  const targets = svg?.targetLocations() ?? [];
  const controls = svg?.controlLocations() ?? [];
  const selectedItem = svg?.path[selectedIndex] ?? null;
  const formattedPath = svg ? svg.asString(decimals, minify) : "";
  const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box.x} ${box.y} ${box.width} ${box.height}">\n  <path d="${formattedPath || rawPath}" fill="${fillPreview ? fillColor : "none"}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>\n</svg>`;

  const filteredExamples = useMemo(() => {
    const q = exampleSearch.toLowerCase();
    return EXAMPLES.filter((e) => {
      const matchCat =
        exampleCategory === "All" || e.category === exampleCategory;
      const matchQ =
        !q ||
        e.label.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [exampleSearch, exampleCategory]);

  const isSaved = savedPaths.some((s) => s.path === (formattedPath || rawPath));

  // ── Core mutations ─────────────────────────────────────────────────────────

  function commit(next: string, options?: { keepSelection?: boolean }) {
    const normalized = next.trim();
    draftPathRef.current = normalized;
    setRawPath(normalized);
    setHistory((current) => {
      const base = current.slice(0, historyIndex + 1);
      if (base[base.length - 1] === normalized) return current;
      const updated = [...base, normalized];
      if (updated.length > MAX_HISTORY) {
        updated.splice(0, updated.length - MAX_HISTORY);
        setHistoryIndex(MAX_HISTORY - 1);
      } else {
        setHistoryIndex(base.length);
      }
      return updated;
    });
    if (!options?.keepSelection) {
      try {
        const nextPath = new SvgPath(normalized);
        setSelected((current) =>
          Math.min(current, Math.max(0, nextPath.path.length - 1)),
        );
      } catch {
        setSelected(0);
      }
    }
  }

  function setDraftPath(next: string) {
    draftPathRef.current = next;
    setRawPath(next);
  }

  function run(
    change: (path: SvgPath) => void,
    options?: { keepSelection?: boolean },
  ) {
    if (!svg || error) return;
    try {
      const next = new SvgPath(rawPath);
      change(next);
      commit(next.asString(decimals, minify), {
        keepSelection: options?.keepSelection,
      });
    } catch (err) {
      console.error(err);
      showToast("Action failed");
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

  // ── Toast ──────────────────────────────────────────────────────────────────

  function showToast(msg: string) {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(msg);
    toastTimerRef.current = window.setTimeout(
      () => setToast(""),
      TOAST_DURATION,
    );
  }

  async function copy(label: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      showToast(label);
    } catch {
      showToast("Copy failed");
    }
  }

  function download() {
    const blob = new Blob([fullSvg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "darma-svg-path.svg";
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // ── Import ─────────────────────────────────────────────────────────────────

  function handleImportParse() {
    const paths = extractAllPaths(importRaw);
    if (!paths.length) {
      showToast("No path d attribute found");
      return;
    }
    if (paths.length === 1) {
      loadPath(paths[0]);
    } else {
      setImportPaths(paths);
    }
  }

  function loadPath(pathStr: string) {
    try {
      const parsed = new SvgPath(pathStr);
      commit(parsed.asString(decimals, minify));
      // Auto-fit viewBox to the loaded path
      const bounds = computePathBounds(parsed);
      if (bounds) setBox(bounds);
      showToast("Path loaded");
      setImportRaw("");
      setImportPaths([]);
    } catch {
      setDraftPath(pathStr);
      showToast("Imported path needs fixing");
    }
  }

  // ── Saved paths ────────────────────────────────────────────────────────────

  function toggleSave() {
    const key = formattedPath || rawPath;
    if (isSaved) {
      const next = savedPaths.filter((s) => s.path !== key);
      setSavedPaths(next);
      persistSaved(next);
      showToast("Removed from saved");
    } else {
      const entry: SavedPath = {
        id: `${Date.now()}`,
        label: `Path ${savedPaths.length + 1}`,
        path: key,
        savedAt: Date.now(),
      };
      const next = [entry, ...savedPaths];
      setSavedPaths(next);
      persistSaved(next);
      showToast("Saved!");
    }
  }

  function deleteSaved(id: string) {
    const next = savedPaths.filter((s) => s.id !== id);
    setSavedPaths(next);
    persistSaved(next);
  }

  function renameSaved(id: string, label: string) {
    const next = savedPaths.map((s) => (s.id === id ? { ...s, label } : s));
    setSavedPaths(next);
    persistSaved(next);
  }

  // ── Canvas ─────────────────────────────────────────────────────────────────

  function eventPoint(event: PointerEvent<SVGSVGElement>) {
    const el = svgRef.current;
    if (!el) return new Point(0, 0);
    const rect = el.getBoundingClientRect();
    const x = box.x + ((event.clientX - rect.left) / rect.width) * box.width;
    const y = box.y + ((event.clientY - rect.top) / rect.height) * box.height;
    return new Point(
      round(snap ? Math.round(x / 10) * 10 : x),
      round(snap ? Math.round(y / 10) * 10 : y),
    );
  }

  function onPointerDown(event: PointerEvent<SVGSVGElement>) {
    if (drag) return;
    if (event.button === 1 || event.buttons === 4) {
      event.preventDefault();
      setPan({
        startX: event.clientX,
        startY: event.clientY,
        boxStart: { ...box },
      });
      (event.currentTarget as SVGSVGElement).setPointerCapture(event.pointerId);
    }
  }

  function onPointerMove(event: PointerEvent<SVGSVGElement>) {
    if (pan) {
      const el = svgRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const dx =
        ((event.clientX - pan.startX) / rect.width) * pan.boxStart.width;
      const dy =
        ((event.clientY - pan.startY) / rect.height) * pan.boxStart.height;
      setBox({
        ...pan.boxStart,
        x: pan.boxStart.x - dx,
        y: pan.boxStart.y - dy,
      });
      return;
    }
    if (!drag || error) return;
    event.preventDefault();
    try {
      const next = new SvgPath(draftPathRef.current);
      const point =
        drag.kind === "target"
          ? next.targetLocations()[drag.index]
          : next.controlLocations()[drag.index];
      if (!point || !point.movable) return;
      next.setLocation(point as SvgPoint, eventPoint(event));
      const nextPath = next.asString(decimals, minify);
      draftPathRef.current = nextPath;
      setRawPath(nextPath);
    } catch (err) {
      console.error(err);
    }
  }

  function endDrag(event: PointerEvent<SVGSVGElement>) {
    if (pan) {
      setPan(null);
      try {
        (event.currentTarget as SVGSVGElement).releasePointerCapture(
          event.pointerId,
        );
      } catch {
        /* noop */
      }
      return;
    }
    if (!drag) return;
    const next = draftPathRef.current;
    setDrag(null);
    if (!error && next.trim()) commit(next, { keepSelection: true });
  }

  // amount > 1 = zoom out (expand viewBox), amount < 1 = zoom in (shrink viewBox)
  // anchorSvg is the SVG-space point to zoom toward (defaults to viewBox center)
  function zoom(amount: number, anchorSvg?: { x: number; y: number }) {
    setBox((current) => {
      const width = Math.max(50, current.width * amount);
      const height = Math.max(50, current.height * amount);
      // Zoom toward anchor point so it stays fixed on screen
      const ax = anchorSvg?.x ?? current.x + current.width / 2;
      const ay = anchorSvg?.y ?? current.y + current.height / 2;
      return {
        x: ax - (ax - current.x) * (width / current.width),
        y: ay - (ay - current.y) * (height / current.height),
        width,
        height,
      };
    });
  }

  function zoomAtClientPoint(amount: number, clientX: number, clientY: number) {
    const el = svgRef.current;
    if (!el) {
      zoom(amount);
      return;
    }
    const rect = el.getBoundingClientRect();
    const svgX = box.x + ((clientX - rect.left) / rect.width) * box.width;
    const svgY = box.y + ((clientY - rect.top) / rect.height) * box.height;
    zoom(amount, { x: svgX, y: svgY });
  }

  function fitToPath() {
    if (!svg) return;
    const bounds = computePathBounds(svg);
    if (bounds) setBox(bounds);
  }

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────

  const handleKeyDown = useCallback(
    (e: globalThis.KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        undo();
        return;
      }
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "y" || (e.shiftKey && e.key === "Z"))
      ) {
        e.preventDefault();
        redo();
        return;
      }
      if (e.key === "Escape") {
        setSelected(0);
        setHovered(null);
        return;
      }
      if (
        ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key) &&
        svg &&
        !error
      ) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const dx =
          e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy =
          e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        run(
          (path) => {
            const loc = path.targetLocations()[selectedIndex];
            if (!loc || !loc.movable) return;
            path.setLocation(
              loc as SvgPoint,
              new Point(loc.x + dx, loc.y + dy),
            );
          },
          { keepSelection: true },
        );
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [svg, error, selectedIndex, historyIndex, history],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // ── Wheel zoom ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      // deltaY > 0 = scroll down = zoom out; < 0 = zoom in
      const factor = e.deltaY > 0 ? 1.1 : 0.9;
      const rect = el!.getBoundingClientRect();
      setBox((current) => {
        const width = Math.max(50, current.width * factor);
        const height = Math.max(50, current.height * factor);
        const svgX =
          current.x + ((e.clientX - rect.left) / rect.width) * current.width;
        const svgY =
          current.y + ((e.clientY - rect.top) / rect.height) * current.height;
        return {
          x: svgX - (svgX - current.x) * (width / current.width),
          y: svgY - (svgY - current.y) * (height / current.height),
          width,
          height,
        };
      });
    }
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
    // re-attach whenever svgRef settles (only once in practice)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Grid ───────────────────────────────────────────────────────────────────

  const grid = useMemo(() => {
    if (!showGrid) return [];
    const lines = [];
    const step = 20;
    for (
      let x = Math.floor(box.x / step) * step;
      x <= box.x + box.width;
      x += step
    )
      lines.push(
        <line key={`x${x}`} x1={x} y1={box.y} x2={x} y2={box.y + box.height} />,
      );
    for (
      let y = Math.floor(box.y / step) * step;
      y <= box.y + box.height;
      y += step
    )
      lines.push(
        <line key={`y${y}`} x1={box.x} y1={y} x2={box.x + box.width} y2={y} />,
      );
    return lines;
  }, [showGrid, box]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <main className="svg-editor-page">
      {toast ? <div className="svg-editor-toast">{toast}</div> : null}

      {/* Shortcuts modal */}
      {showShortcuts && (
        <div
          className="svg-editor-modal-backdrop"
          onClick={() => setShowShortcuts(false)}
        >
          <div
            className="svg-editor-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="svg-editor-modal-header">
              <strong>Keyboard shortcuts</strong>
              <button
                type="button"
                className="svg-editor-modal-close"
                onClick={() => setShowShortcuts(false)}
              >
                ✕
              </button>
            </div>
            <div className="svg-editor-shortcuts-grid">
              {(
                [
                  ["Ctrl + Z", "Undo"],
                  ["Ctrl + Y", "Redo"],
                  ["↑ ↓ ← →", "Nudge selected point 1px"],
                  ["Shift + Arrow", "Nudge selected point 10px"],
                  ["Escape", "Deselect point"],
                  ["Middle mouse drag", "Pan canvas"],
                ] as [string, string][]
              ).map(([key, desc]) => (
                <div key={key} className="svg-editor-shortcut-row">
                  <kbd>{key}</kbd>
                  <span>{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Top bar */}
      <section
        className="svg-editor-topbar"
        aria-label="SVG editor quick actions"
      >
        <div>
          <p className="svg-editor-kicker">Vector workbench</p>
          <h2>Interactive SVG path studio</h2>
          <p>
            Drag points, inspect commands, transform path data, and export clean
            browser-ready SVG.
          </p>
        </div>
        <div className="svg-editor-hero-actions">
          <Button
            onClick={undo}
            disabled={historyIndex <= 0}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={15} /> Undo
          </Button>
          <Button
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 size={15} /> Redo
          </Button>
          <Button
            onClick={toggleSave}
            active={isSaved}
            title={isSaved ? "Remove from saved" : "Save current path"}
          >
            {isSaved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
            {isSaved ? "Saved" : "Save"}
          </Button>
          <Button
            onClick={() => copy("Path copied", formattedPath)}
            disabled={Boolean(error)}
          >
            <Clipboard size={15} /> Copy path
          </Button>
          <Button
            onClick={() => copy("SVG copied", fullSvg)}
            disabled={Boolean(error)}
          >
            <Code2 size={15} /> Copy SVG
          </Button>
          <Button onClick={download} disabled={Boolean(error)}>
            <Download size={15} /> Download
          </Button>
          <Button
            onClick={() => setShowShortcuts(true)}
            title="Keyboard shortcuts"
          >
            <Keyboard size={15} />
          </Button>
        </div>
      </section>

      {/* Workbench */}
      <section className="svg-editor-workbench">
        {/* ── Left panel ── */}
        <aside className="svg-editor-panel svg-editor-left-panel">
          <div className="svg-editor-tabs">
            <button
              type="button"
              className={activeTab === "controls" ? "is-active" : ""}
              onClick={() => setActiveTab("controls")}
            >
              Controls
            </button>
            <button
              type="button"
              className={activeTab === "examples" ? "is-active" : ""}
              onClick={() => setActiveTab("examples")}
            >
              <Star size={12} /> Examples
            </button>
            <button
              type="button"
              className={activeTab === "saved" ? "is-active" : ""}
              onClick={() => setActiveTab("saved")}
            >
              <Bookmark size={12} /> Saved
              {savedPaths.length > 0 && (
                <span className="svg-editor-tab-badge">
                  {savedPaths.length}
                </span>
              )}
            </button>
          </div>

          {/* Controls tab */}
          {activeTab === "controls" && (
            <>
              <div className="svg-editor-section">
                <SectionTitle icon={<Code2 size={14} />}>
                  Path input
                </SectionTitle>
                <textarea
                  className={error && rawPath ? "has-error" : ""}
                  value={rawPath}
                  onChange={(e) => setDraftPath(e.target.value)}
                  onBlur={() => {
                    const p = parsePath(rawPath).path;
                    if (p) commit(p.asString(decimals, minify));
                  }}
                  spellCheck={false}
                />
                {error && rawPath ? (
                  <p className="svg-editor-error">{error}</p>
                ) : (
                  <p className="svg-editor-help">
                    ✓ Valid · {svg?.path.length ?? 0} commands
                  </p>
                )}
              </div>

              <div className="svg-editor-section">
                <SectionTitle icon={<FileInput size={14} />}>
                  Import SVG
                </SectionTitle>
                <textarea
                  className="svg-editor-import"
                  placeholder={'Paste a full <svg> or <path d="..."> here'}
                  value={importRaw}
                  onChange={(e) => setImportRaw(e.target.value)}
                  spellCheck={false}
                />
                <div className="svg-editor-row-gap">
                  <Button
                    onClick={handleImportParse}
                    disabled={!importRaw.trim()}
                  >
                    <FileInput size={14} /> Import
                  </Button>
                  <Button
                    onClick={() => {
                      setImportRaw("");
                      setImportPaths([]);
                    }}
                    disabled={!importRaw.trim()}
                  >
                    <Eraser size={14} /> Clear
                  </Button>
                </div>
                {importPaths.length > 1 && (
                  <div className="svg-editor-multi-path">
                    <p className="svg-editor-help">
                      {importPaths.length} paths found — pick one:
                    </p>
                    {importPaths.map((p, i) => (
                      <button
                        key={i}
                        type="button"
                        className="svg-editor-multi-path-row"
                        onClick={() => loadPath(p)}
                      >
                        <span>Path {i + 1}</span>
                        <small>
                          {p.slice(0, 42)}
                          {p.length > 42 ? "…" : ""}
                        </small>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="svg-editor-section">
                <SectionTitle icon={<Eye size={14} />}>ViewBox</SectionTitle>
                <div className="svg-editor-grid-two">
                  <NumberField
                    label="X"
                    value={box.x}
                    onChange={(v) => setBox((c) => ({ ...c, x: v }))}
                  />
                  <NumberField
                    label="Y"
                    value={box.y}
                    onChange={(v) => setBox((c) => ({ ...c, y: v }))}
                  />
                  <NumberField
                    label="W"
                    value={box.width}
                    onChange={(v) =>
                      setBox((c) => ({ ...c, width: Math.max(10, v) }))
                    }
                  />
                  <NumberField
                    label="H"
                    value={box.height}
                    onChange={(v) =>
                      setBox((c) => ({ ...c, height: Math.max(10, v) }))
                    }
                  />
                </div>
                <Button onClick={fitToPath} disabled={Boolean(error)}>
                  <ScanSearch size={14} /> Fit to path
                </Button>
              </div>

              <div className="svg-editor-section">
                <SectionTitle icon={<Move size={14} />}>Transform</SectionTitle>
                <div className="svg-editor-transform-group">
                  <p className="svg-editor-group-label">Scale</p>
                  <div className="svg-editor-grid-two">
                    <NumberField
                      label="X"
                      value={scaleX}
                      step={0.1}
                      onChange={setScaleX}
                    />
                    <NumberField
                      label="Y"
                      value={scaleY}
                      step={0.1}
                      onChange={setScaleY}
                    />
                  </div>
                  <Button
                    onClick={() => run((path) => path.scale(scaleX, scaleY))}
                    disabled={Boolean(error)}
                  >
                    Apply scale
                  </Button>
                </div>
                <div className="svg-editor-transform-group">
                  <p className="svg-editor-group-label">Translate</p>
                  <div className="svg-editor-grid-two">
                    <NumberField label="X" value={moveX} onChange={setMoveX} />
                    <NumberField label="Y" value={moveY} onChange={setMoveY} />
                  </div>
                  <Button
                    onClick={() => run((path) => path.translate(moveX, moveY))}
                    disabled={Boolean(error)}
                  >
                    Apply move
                  </Button>
                </div>
                <div className="svg-editor-transform-group">
                  <p className="svg-editor-group-label">Rotate</p>
                  <div className="svg-editor-grid-three">
                    <NumberField
                      label="Origin X"
                      value={rotateX}
                      onChange={setRotateX}
                    />
                    <NumberField
                      label="Origin Y"
                      value={rotateY}
                      onChange={setRotateY}
                    />
                    <NumberField
                      label="Angle °"
                      value={rotateAngle}
                      onChange={setRotateAngle}
                    />
                  </div>
                  <Button
                    onClick={() =>
                      run((path) => path.rotate(rotateX, rotateY, rotateAngle))
                    }
                    disabled={Boolean(error)}
                  >
                    Apply rotate
                  </Button>
                </div>
                <div className="svg-editor-transform-group">
                  <p className="svg-editor-group-label">Output precision</p>
                  <NumberField
                    label="Decimals (0–6)"
                    value={decimals}
                    onChange={(v) =>
                      setDecimals(Math.max(0, Math.min(6, Math.round(v))))
                    }
                  />
                  <Button
                    onClick={() => {
                      if (svg && !error) commit(svg.asString(decimals, minify));
                    }}
                    disabled={Boolean(error)}
                  >
                    Round output
                  </Button>
                </div>
              </div>

              <div className="svg-editor-section">
                <SectionTitle icon={<Wand2 size={14} />}>
                  Path actions
                </SectionTitle>
                <div className="svg-editor-button-grid">
                  <Button
                    onClick={() => run((path) => path.setRelative(false))}
                    disabled={Boolean(error)}
                  >
                    Absolute
                  </Button>
                  <Button
                    onClick={() => run((path) => path.setRelative(true))}
                    disabled={Boolean(error)}
                  >
                    Relative
                  </Button>
                  <Button
                    onClick={() =>
                      run((path) =>
                        optimizePath(path, {
                          removeUselessCommands: true,
                          removeOrphanDots: true,
                          useShorthands: true,
                          useHorizontalAndVerticalLines: true,
                          useRelativeAbsolute: true,
                          useClosePath: true,
                        }),
                      )
                    }
                    disabled={Boolean(error)}
                  >
                    Optimize
                  </Button>
                  <Button
                    onClick={() => run((path) => reversePath(path))}
                    disabled={Boolean(error)}
                  >
                    Reverse
                  </Button>
                  <Button onClick={() => commit(DEFAULT_PATH)}>
                    <RotateCcw size={13} /> Reset
                  </Button>
                  <Button onClick={() => setDraftPath("")}>
                    <Eraser size={13} /> Clear
                  </Button>
                </div>
                <div className="svg-editor-toggles">
                  <label className="svg-editor-toggle">
                    <input
                      type="checkbox"
                      checked={minify}
                      onChange={(e) => setMinify(e.target.checked)}
                    />
                    <span>Minify output</span>
                  </label>
                  <label className="svg-editor-toggle">
                    <input
                      type="checkbox"
                      checked={fillPreview}
                      onChange={(e) => setFillPreview(e.target.checked)}
                    />
                    <span>Fill preview</span>
                  </label>
                </div>
              </div>

              <div className="svg-editor-section">
                <SectionTitle icon={<Palette size={14} />}>
                  Canvas style
                </SectionTitle>
                <div className="svg-editor-grid-two">
                  <ColorField
                    label="Stroke"
                    value={strokeColor}
                    onChange={setStrokeColor}
                  />
                  <ColorField
                    label="Fill"
                    value={fillColor}
                    onChange={setFillColor}
                  />
                </div>
                <NumberField
                  label="Stroke width"
                  value={strokeWidth}
                  step={0.5}
                  onChange={(v) => setStrokeWidth(Math.max(0.5, v))}
                />
              </div>
            </>
          )}

          {/* Examples tab */}
          {activeTab === "examples" && (
            <div className="svg-editor-examples-panel">
              <div className="svg-editor-search-wrap">
                <Search size={14} />
                <input
                  type="text"
                  placeholder="Search examples…"
                  value={exampleSearch}
                  onChange={(e) => setExampleSearch(e.target.value)}
                />
              </div>
              <div className="svg-editor-cat-pills">
                {(["All", ...EXAMPLE_CATEGORIES] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={exampleCategory === cat ? "is-active" : ""}
                    onClick={() => setExampleCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              {filteredExamples.length === 0 ? (
                <p
                  className="svg-editor-help"
                  style={{ padding: "var(--space-4) var(--space-3)" }}
                >
                  No examples match.
                </p>
              ) : (
                <div className="svg-editor-examples-grid">
                  {filteredExamples.map((ex) => (
                    <ExampleCard
                      key={ex.label}
                      example={ex}
                      onLoad={(path) => {
                        commit(path);
                        // Auto-fit viewBox so the example is always centered and fully visible
                        try {
                          const bounds = computePathBounds(new SvgPath(path));
                          if (bounds) setBox(bounds);
                        } catch {
                          /* noop */
                        }
                        showToast(`Loaded: ${ex.label}`);
                        setActiveTab("controls");
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Saved tab */}
          {activeTab === "saved" && (
            <div className="svg-editor-saved-panel">
              {savedPaths.length === 0 ? (
                <div className="svg-editor-saved-empty">
                  <Bookmark size={36} strokeWidth={1.2} />
                  <p>No saved paths yet.</p>
                  <p className="svg-editor-help">
                    Hit <strong>Save</strong> in the toolbar to bookmark the
                    current path.
                  </p>
                </div>
              ) : (
                savedPaths.map((s) => (
                  <div key={s.id} className="svg-editor-saved-card">
                    <div
                      className="svg-editor-saved-preview"
                      onClick={() => {
                        loadPath(s.path);
                        setActiveTab("controls");
                      }}
                    >
                      <svg
                        viewBox="0 0 100 100"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d={s.path}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <div className="svg-editor-saved-meta">
                      <input
                        className="svg-editor-saved-name"
                        value={s.label}
                        onChange={(e) => renameSaved(s.id, e.target.value)}
                      />
                      <p className="svg-editor-saved-path">
                        {s.path.slice(0, 50)}
                        {s.path.length > 50 ? "…" : ""}
                      </p>
                      <div className="svg-editor-saved-actions">
                        <button
                          type="button"
                          onClick={() => {
                            loadPath(s.path);
                            setActiveTab("controls");
                          }}
                        >
                          Load
                        </button>
                        <button
                          type="button"
                          onClick={() => copy("Copied", s.path)}
                        >
                          Copy
                        </button>
                        <button
                          type="button"
                          className="is-danger"
                          onClick={() => deleteSaved(s.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </aside>

        {/* ── Canvas ── */}
        <section className="svg-editor-canvas-card">
          <div className="svg-editor-canvas-toolbar">
            <div className="svg-editor-canvas-title">Canvas</div>
            <div className="svg-editor-canvas-actions">
              <Button onClick={() => zoom(0.77)} title="Zoom in (or scroll up)">
                <ZoomIn size={15} />
              </Button>
              <Button
                onClick={() => zoom(1.3)}
                title="Zoom out (or scroll down)"
              >
                <ZoomOut size={15} />
              </Button>
              <Button
                onClick={fitToPath}
                title="Fit to path"
                disabled={Boolean(error)}
              >
                <ScanSearch size={15} />
              </Button>
              <Button
                onClick={() => setBox({ x: 0, y: 0, width: 580, height: 460 })}
              >
                Reset
              </Button>
              <Button onClick={() => setShowGrid((v) => !v)} active={showGrid}>
                <Grid3X3 size={15} />
              </Button>
              <label className="svg-editor-toggle svg-editor-toggle--inline">
                <input
                  type="checkbox"
                  checked={snap}
                  onChange={(e) => setSnap(e.target.checked)}
                />
                <span>Snap</span>
              </label>
            </div>
          </div>
          <div className="svg-editor-canvas-wrap">
            {tooltip && (
              <div
                className="svg-editor-point-tooltip"
                style={{ left: tooltip.x, top: tooltip.y }}
              >
                {round(tooltip.cx, 2)}, {round(tooltip.cy, 2)}
              </div>
            )}
            <div className="svg-editor-canvas-hint">
              Scroll to zoom · Middle-drag to pan
            </div>
            <svg
              ref={svgRef}
              className={`svg-editor-canvas${pan ? " is-panning" : ""}`}
              viewBox={`${box.x} ${box.y} ${box.width} ${box.height}`}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerLeave={endDrag}
            >
              <g className="svg-editor-grid-lines">{grid}</g>
              {!error && svg ? (
                <>
                  <path
                    d={formattedPath}
                    fill={fillPreview ? fillColor : "none"}
                    fillOpacity={fillPreview ? 0.2 : 0}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="svg-editor-main-path"
                  />
                  {hovered !== null && svg.path[hovered] ? (
                    <path
                      d={svg.path[hovered].asStandaloneString()}
                      className="svg-editor-hover-path"
                    />
                  ) : null}
                  {selectedItem ? (
                    <path
                      d={selectedItem.asStandaloneString()}
                      className="svg-editor-selected-path"
                    />
                  ) : null}
                  {controls.map((control, index) => (
                    <g key={`c-${index}`}>
                      {control.relations.map((relation, ri) => (
                        <line
                          key={ri}
                          x1={control.x}
                          y1={control.y}
                          x2={relation.x}
                          y2={relation.y}
                          className="svg-editor-handle"
                        />
                      ))}
                      <circle
                        cx={control.x}
                        cy={control.y}
                        r={5}
                        className="svg-editor-control-point"
                        onPointerEnter={(e) => {
                          const rect = svgRef.current?.getBoundingClientRect();
                          if (rect)
                            setTooltip({
                              x: e.clientX - rect.left + 12,
                              y: e.clientY - rect.top - 32,
                              cx: control.x,
                              cy: control.y,
                            });
                        }}
                        onPointerLeave={() => setTooltip(null)}
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          setDrag({ kind: "control", index });
                          e.currentTarget.setPointerCapture(e.pointerId);
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
                      className={
                        index === selectedIndex
                          ? "svg-editor-target-point is-selected"
                          : "svg-editor-target-point"
                      }
                      onPointerEnter={(e) => {
                        setHovered(index);
                        const rect = svgRef.current?.getBoundingClientRect();
                        if (rect)
                          setTooltip({
                            x: e.clientX - rect.left + 12,
                            y: e.clientY - rect.top - 32,
                            cx: target.x,
                            cy: target.y,
                          });
                      }}
                      onPointerLeave={() => {
                        setHovered(null);
                        setTooltip(null);
                      }}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        setSelected(index);
                        setDrag({ kind: "target", index });
                        e.currentTarget.setPointerCapture(e.pointerId);
                      }}
                    />
                  ))}
                </>
              ) : (
                <text
                  x={box.x + 24}
                  y={box.y + 48}
                  className="svg-editor-invalid-text"
                >
                  Fix path syntax to preview.
                </text>
              )}
            </svg>
          </div>
        </section>

        {/* ── Right panel ── */}
        <aside className="svg-editor-panel svg-editor-right-panel">
          <div className="svg-editor-section">
            <SectionTitle icon={<Scissors size={14} />}>
              Selected command
            </SectionTitle>
            {selectedItem ? (
              <>
                <div className="svg-editor-command-summary">
                  <strong>{selectedItem.getType()}</strong>
                  <span>
                    #{selectedIndex + 1} ·{" "}
                    {round(selectedItem.targetLocation().x)},{" "}
                    {round(selectedItem.targetLocation().y)}
                  </span>
                </div>
                <div className="svg-editor-grid-two">
                  {selectedItem.values.map((value, index) => (
                    <div key={`${selectedIndex}-${index}`}>
                      <NumberField
                        label={`v${index + 1}`}
                        value={round(value, 4)}
                        step={0.1}
                        onChange={(next) =>
                          run(
                            (path) => {
                              path.path[selectedIndex].values[index] = next;
                              path.refreshAbsolutePositions();
                            },
                            { keepSelection: true },
                          )
                        }
                      />
                    </div>
                  ))}
                </div>
                <div className="svg-editor-command-actions">
                  <select
                    value={selectedItem.getType(true)}
                    onChange={(e) =>
                      run(
                        (path) =>
                          path.changeType(
                            path.path[selectedIndex],
                            e.target.value as SvgCommandTypeAny,
                          ),
                        { keepSelection: true },
                      )
                    }
                    disabled={selectedIndex === 0}
                  >
                    {COMMAND_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <Button
                    onClick={() =>
                      run(
                        (path) =>
                          path.path[selectedIndex].setRelative(
                            !path.path[selectedIndex].relative,
                          ),
                        { keepSelection: true },
                      )
                    }
                    disabled={selectedIndex === 0}
                  >
                    Rel/Abs
                  </Button>
                  <Button
                    onClick={() => {
                      const p = selectedItem.targetLocation();
                      run((path) =>
                        path.insert(
                          SvgItem.Make(["L", String(p.x + 40), String(p.y)]),
                          path.path[selectedIndex],
                        ),
                      );
                      setSelected((v) => v + 1);
                    }}
                  >
                    Insert L
                  </Button>
                  <Button
                    onClick={() => {
                      run((path) => path.delete(path.path[selectedIndex]));
                      setSelected((v) => Math.max(0, v - 1));
                    }}
                    disabled={selectedIndex === 0}
                  >
                    Delete
                  </Button>
                </div>
              </>
            ) : (
              <p className="svg-editor-help">
                Click a point on the canvas or a command below to inspect it.
              </p>
            )}
          </div>

          <div className="svg-editor-section">
            <SectionTitle icon={<Layers size={14} />}>Commands</SectionTitle>
            <div className="svg-editor-command-list">
              {svg?.path.map((item, index) => (
                <button
                  key={`${index}-${item.getType()}-${item.values.join("-")}`}
                  type="button"
                  className={
                    index === selectedIndex
                      ? "svg-editor-command-row is-selected"
                      : "svg-editor-command-row"
                  }
                  onClick={() => setSelected(index)}
                  onMouseEnter={() => setHovered(index)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <span className="svg-editor-command-badge">
                    {item.getType()}
                  </span>
                  <small>
                    {item.values.map((v) => round(v)).join(" ") || "close"}
                  </small>
                </button>
              ))}
            </div>
          </div>

          <div className="svg-editor-section">
            <SectionTitle icon={<Download size={14} />}>Output</SectionTitle>
            <textarea
              className="svg-editor-output"
              readOnly
              value={error ? "" : formattedPath}
            />
            <div className="svg-editor-button-grid">
              <Button
                onClick={() => copy("Path copied", formattedPath)}
                disabled={Boolean(error)}
              >
                Copy path
              </Button>
              <Button
                onClick={() => copy("SVG copied", fullSvg)}
                disabled={Boolean(error)}
              >
                Copy SVG
              </Button>
            </div>
          </div>

          <div className="svg-editor-section svg-editor-license-note">
            <strong>Attribution</strong>
            <p>
              SVG engine adapted from Yqnn/svg-path-editor under Apache-2.0.
              License and notice files are preserved.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}
