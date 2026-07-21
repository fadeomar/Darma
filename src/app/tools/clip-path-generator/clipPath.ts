import type {
  ClipPathShapeFile,
  ClipPathState,
  ClipPathStats,
  ClipPathValidationMessage,
  ClipPoint,
  ParseShapeFileResult,
} from "./types";

export const MIN_POINTS = 3;
export const MAX_POINTS = 24;
export const MIN_COORDINATE = 0;
export const MAX_COORDINATE = 100;
export const DUPLICATE_POINT_TOLERANCE = 0.05;
export const SHORT_EDGE_TOLERANCE = 0.1;
export const AREA_TOLERANCE = 0.5;
export const GEOMETRY_EPSILON = 1e-9;
export const MAX_SHAPE_JSON_CHARS = 100_000;
export const SHAPE_FILE_VERSION = 1;

/** Clamp a coordinate into the valid 0–100 percentage range. */
export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(MAX_COORDINATE, Math.max(MIN_COORDINATE, value));
}

/** Round to at most `dp` decimals without trailing zeros (e.g. 33.333). */
export function roundCoord(value: number, dp = 2): number {
  const factor = 10 ** dp;
  return Math.round(value * factor) / factor;
}

export function normalizePoint(point: ClipPoint, dp = 2): ClipPoint {
  return { x: roundCoord(clampPercent(point.x), dp), y: roundCoord(clampPercent(point.y), dp) };
}

export function clonePoints(points: ClipPoint[]): ClipPoint[] {
  return points.map((point) => ({ ...point }));
}

export function pointsEqual(a: ClipPoint[], b: ClipPoint[], tolerance = GEOMETRY_EPSILON): boolean {
  if (a.length !== b.length) return false;
  return a.every(
    (point, index) =>
      Math.abs(point.x - b[index].x) <= tolerance && Math.abs(point.y - b[index].y) <= tolerance,
  );
}

/** Format a single point as `x% y%`. */
export function formatPoint(point: ClipPoint, dp = 2): string {
  const p = normalizePoint(point, dp);
  return `${p.x}% ${p.y}%`;
}

/** Build the raw `polygon(...)` value from a list of points. */
export function formatPolygon(points: ClipPoint[], dp = 2): string {
  const body = points.map((point) => formatPoint(point, dp)).join(", ");
  return `polygon(${body})`;
}

function normalizeClassName(value: string): string {
  const sanitized = value
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/^-+/, "");
  return sanitized || "clip-shape";
}

function normalizeComponentName(value: string): string {
  const safe = normalizeClassName(value)
    .replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase())
    .replace(/[^a-zA-Z0-9]/g, "");
  const cleaned = safe || "ClipShape";
  return `${cleaned.charAt(0).toUpperCase()}${cleaned.slice(1)}`;
}

export function createDefaultClipPathState(): ClipPathState {
  return {
    points: regularPolygon(6),
    previewShape: "solid",
    imageUrl: null,
    objectFit: "cover",
    showGhost: true,
    webkitFallback: true,
    className: "clip-shape",
  };
}

/* ------------------------------------------------------------------ */
/* Point operations                                                    */
/* ------------------------------------------------------------------ */

export function movePoint(points: ClipPoint[], index: number, next: ClipPoint): ClipPoint[] {
  if (index < 0 || index >= points.length) return points;
  const normalized = normalizePoint(next);
  if (points[index].x === normalized.x && points[index].y === normalized.y) return points;
  const copy = points.slice();
  copy[index] = normalized;
  return copy;
}

export function removePoint(points: ClipPoint[], index: number): ClipPoint[] {
  if (points.length <= MIN_POINTS || index < 0 || index >= points.length) return points;
  return points.filter((_, i) => i !== index);
}

/** Insert a vertex at the midpoint of the edge that starts at `edgeStartIndex`. */
export function insertPointOnEdge(points: ClipPoint[], edgeStartIndex: number): ClipPoint[] {
  if (points.length >= MAX_POINTS || edgeStartIndex < 0 || edgeStartIndex >= points.length) return points;
  const start = points[edgeStartIndex];
  const end = points[(edgeStartIndex + 1) % points.length];
  const mid = normalizePoint({ x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 });
  const copy = points.slice();
  copy.splice(edgeStartIndex + 1, 0, mid);
  return copy;
}

/** Add a point next to the last vertex (used by the "Add point" button). */
export function appendPoint(points: ClipPoint[]): ClipPoint[] {
  if (points.length === 0) return [{ x: 50, y: 50 }];
  return insertPointOnEdge(points, points.length - 1);
}

export function reversePoints(points: ClipPoint[]): ClipPoint[] {
  return points.slice().reverse();
}

export function mirrorHorizontal(points: ClipPoint[]): ClipPoint[] {
  return points.map((p) => normalizePoint({ x: 100 - p.x, y: p.y }));
}

export function mirrorVertical(points: ClipPoint[]): ClipPoint[] {
  return points.map((p) => normalizePoint({ x: p.x, y: 100 - p.y }));
}

/* ------------------------------------------------------------------ */
/* Shape generators                                                    */
/* ------------------------------------------------------------------ */

export function regularPolygon(sides: number, rotationDeg = 0): ClipPoint[] {
  const n = Math.max(MIN_POINTS, Math.min(MAX_POINTS, Math.round(sides)));
  const points: ClipPoint[] = [];
  const start = -Math.PI / 2 + (rotationDeg * Math.PI) / 180;
  for (let i = 0; i < n; i += 1) {
    const angle = start + (i * 2 * Math.PI) / n;
    points.push(normalizePoint({ x: 50 + 50 * Math.cos(angle), y: 50 + 50 * Math.sin(angle) }));
  }
  return points;
}

export function star(spikes = 5, innerRatio = 0.5): ClipPoint[] {
  const n = Math.max(3, Math.min(12, Math.round(spikes)));
  const inner = Math.min(0.9, Math.max(0.1, innerRatio));
  const points: ClipPoint[] = [];
  const start = -Math.PI / 2;
  for (let i = 0; i < n * 2; i += 1) {
    const radius = i % 2 === 0 ? 50 : 50 * inner;
    const angle = start + (i * Math.PI) / n;
    points.push(normalizePoint({ x: 50 + radius * Math.cos(angle), y: 50 + radius * Math.sin(angle) }));
  }
  return points;
}

/* ------------------------------------------------------------------ */
/* Geometry analysis                                                   */
/* ------------------------------------------------------------------ */

export function hasFiniteCoordinates(points: ClipPoint[]): boolean {
  return points.every((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
}

export function hasInRangeCoordinates(points: ClipPoint[]): boolean {
  return points.every(
    (point) =>
      point.x >= MIN_COORDINATE &&
      point.x <= MAX_COORDINATE &&
      point.y >= MIN_COORDINATE &&
      point.y <= MAX_COORDINATE,
  );
}

function distanceSquared(a: ClipPoint, b: ClipPoint): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

export function findDuplicatePointPair(
  points: ClipPoint[],
  tolerance = DUPLICATE_POINT_TOLERANCE,
): [number, number] | null {
  const threshold = tolerance * tolerance;
  for (let i = 0; i < points.length; i += 1) {
    for (let j = i + 1; j < points.length; j += 1) {
      if (distanceSquared(points[i], points[j]) <= threshold) return [i, j];
    }
  }
  return null;
}

export function findShortEdge(points: ClipPoint[], tolerance = SHORT_EDGE_TOLERANCE): [number, number] | null {
  if (points.length < 2) return null;
  const threshold = tolerance * tolerance;
  for (let i = 0; i < points.length; i += 1) {
    const next = (i + 1) % points.length;
    if (distanceSquared(points[i], points[next]) <= threshold) return [i, next];
  }
  return null;
}

/** Signed area via the shoelace formula (percentage-space units). */
export function signedArea(points: ClipPoint[]): number {
  let sum = 0;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    sum += a.x * b.y - b.x * a.y;
  }
  return sum / 2;
}

function cross(a: ClipPoint, b: ClipPoint, c: ClipPoint): number {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function onSegment(a: ClipPoint, b: ClipPoint, point: ClipPoint): boolean {
  return (
    point.x >= Math.min(a.x, b.x) - GEOMETRY_EPSILON &&
    point.x <= Math.max(a.x, b.x) + GEOMETRY_EPSILON &&
    point.y >= Math.min(a.y, b.y) - GEOMETRY_EPSILON &&
    point.y <= Math.max(a.y, b.y) + GEOMETRY_EPSILON
  );
}

export function segmentsIntersect(a: ClipPoint, b: ClipPoint, c: ClipPoint, d: ClipPoint): boolean {
  const abC = cross(a, b, c);
  const abD = cross(a, b, d);
  const cdA = cross(c, d, a);
  const cdB = cross(c, d, b);

  const oppositeAB = (abC > GEOMETRY_EPSILON && abD < -GEOMETRY_EPSILON) || (abC < -GEOMETRY_EPSILON && abD > GEOMETRY_EPSILON);
  const oppositeCD = (cdA > GEOMETRY_EPSILON && cdB < -GEOMETRY_EPSILON) || (cdA < -GEOMETRY_EPSILON && cdB > GEOMETRY_EPSILON);
  if (oppositeAB && oppositeCD) return true;

  if (Math.abs(abC) <= GEOMETRY_EPSILON && onSegment(a, b, c)) return true;
  if (Math.abs(abD) <= GEOMETRY_EPSILON && onSegment(a, b, d)) return true;
  if (Math.abs(cdA) <= GEOMETRY_EPSILON && onSegment(c, d, a)) return true;
  if (Math.abs(cdB) <= GEOMETRY_EPSILON && onSegment(c, d, b)) return true;
  return false;
}

function edgesAreAdjacent(first: number, second: number, pointCount: number): boolean {
  return first === second || (first + 1) % pointCount === second || (second + 1) % pointCount === first;
}

export function findSelfIntersection(points: ClipPoint[]): [number, number] | null {
  const n = points.length;
  if (n < 4) return null;
  for (let first = 0; first < n; first += 1) {
    const firstEnd = (first + 1) % n;
    for (let second = first + 1; second < n; second += 1) {
      if (edgesAreAdjacent(first, second, n)) continue;
      const secondEnd = (second + 1) % n;
      if (segmentsIntersect(points[first], points[firstEnd], points[second], points[secondEnd])) {
        return [first, second];
      }
    }
  }
  return null;
}

export function isConvex(points: ClipPoint[]): boolean {
  if (points.length < 4) return true;
  let sign = 0;
  for (let i = 0; i < points.length; i += 1) {
    const value = cross(points[i], points[(i + 1) % points.length], points[(i + 2) % points.length]);
    if (Math.abs(value) <= GEOMETRY_EPSILON) continue;
    const currentSign = value > 0 ? 1 : -1;
    if (sign === 0) sign = currentSign;
    else if (currentSign !== sign) return false;
  }
  return true;
}

export function validatePolygon(points: ClipPoint[]): ClipPathValidationMessage[] {
  const messages: ClipPathValidationMessage[] = [];
  if (points.length < MIN_POINTS) {
    messages.push({ type: "error", message: `Add at least ${MIN_POINTS} points.`, field: "points" });
    return messages;
  }
  if (points.length > MAX_POINTS) {
    messages.push({ type: "error", message: `Use no more than ${MAX_POINTS} points.`, field: "points" });
  } else if (points.length === MAX_POINTS) {
    messages.push({ type: "warning", message: `The ${MAX_POINTS}-point limit has been reached.`, field: "points" });
  }

  const invalidIndex = points.findIndex((point) => !Number.isFinite(point.x) || !Number.isFinite(point.y));
  if (invalidIndex >= 0) {
    messages.push({ type: "error", message: `Point ${invalidIndex + 1} has invalid coordinates.`, field: "points" });
    return messages;
  }

  const outOfRangeIndex = points.findIndex(
    (point) => point.x < MIN_COORDINATE || point.x > MAX_COORDINATE || point.y < MIN_COORDINATE || point.y > MAX_COORDINATE,
  );
  if (outOfRangeIndex >= 0) {
    messages.push({ type: "error", message: `Point ${outOfRangeIndex + 1} must stay between 0% and 100%.`, field: "points" });
    return messages;
  }

  const duplicate = findDuplicatePointPair(points);
  if (duplicate) {
    messages.push({
      type: "error",
      message: `Points ${duplicate[0] + 1} and ${duplicate[1] + 1} overlap. Move or remove one.`,
      field: "points",
    });
  } else {
    const shortEdge = findShortEdge(points);
    if (shortEdge) {
      messages.push({
        type: "error",
        message: `Edge ${shortEdge[0] + 1}–${shortEdge[1] + 1} is too short.`,
        field: "points",
      });
    }
  }

  if (Math.abs(signedArea(points)) <= AREA_TOLERANCE) {
    messages.push({ type: "error", message: "The polygon area is too small. Spread the points apart.", field: "points" });
  }

  const intersection = findSelfIntersection(points);
  if (intersection) {
    const firstEnd = (intersection[0] + 1) % points.length;
    const secondEnd = (intersection[1] + 1) % points.length;
    messages.push({
      type: "error",
      message: `Edges ${intersection[0] + 1}–${firstEnd + 1} and ${intersection[1] + 1}–${secondEnd + 1} cross.`,
      field: "points",
    });
  }
  return messages;
}

export function getClipPathStats(points: ClipPoint[]): ClipPathStats {
  const validation = validatePolygon(points);
  const geometryUsable = points.length >= MIN_POINTS && hasFiniteCoordinates(points);
  return {
    pointCount: points.length,
    areaPercent: geometryUsable ? roundCoord(Math.abs(signedArea(points)) / 100, 1) : 0,
    isConvex: geometryUsable && isConvex(points),
    isValid: !validation.some((message) => message.type === "error"),
  };
}

/* ------------------------------------------------------------------ */
/* CSS generation                                                      */
/* ------------------------------------------------------------------ */

export function generateClipPathValue(state: ClipPathState): string {
  return formatPolygon(state.points);
}

export function generateClipPathCss(state: ClipPathState): string {
  const className = normalizeClassName(state.className);
  const value = formatPolygon(state.points);
  const lines = [`.${className} {`];
  if (state.webkitFallback) lines.push(`  -webkit-clip-path: ${value};`);
  lines.push(`  clip-path: ${value};`);
  lines.push("}");
  return lines.join("\n");
}

export function generateTailwindArbitrary(state: ClipPathState): string {
  const value = formatPolygon(state.points).replace(/\s+/g, "_");
  return `<div className="[clip-path:${value}]" />`;
}

export function generateReactStyle(state: ClipPathState): string {
  const componentName = normalizeComponentName(state.className);
  const value = formatPolygon(state.points);
  return [
    `export function ${componentName}() {`,
    "  return (",
    "    <div",
    "      style={{",
    `        WebkitClipPath: "${value}",`,
    `        clipPath: "${value}",`,
    "      }}",
    "    />",
    "  );",
    "}",
  ].join("\n");
}

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

export function validateClipPathState(state: ClipPathState): ClipPathValidationMessage[] {
  const messages = validatePolygon(state.points);
  if (state.previewShape === "image" && !state.imageUrl) {
    messages.push({
      type: "warning",
      message: "Load an image or switch to the solid preview.",
      field: "image",
    });
  }
  return messages;
}

/* ------------------------------------------------------------------ */
/* Serialization                                                       */
/* ------------------------------------------------------------------ */

export function serializeShape(state: ClipPathState): string {
  const file: ClipPathShapeFile = {
    kind: "darma.clip-path",
    version: SHAPE_FILE_VERSION,
    className: normalizeClassName(state.className),
    points: state.points.map((point) => normalizePoint(point)),
  };
  return JSON.stringify(file, null, 2);
}

function parseFailure(error: string): ParseShapeFileResult {
  return { ok: false, error };
}

export function parseShapeFile(raw: string): ParseShapeFileResult {
  if (raw.length > MAX_SHAPE_JSON_CHARS) return parseFailure("The JSON file is too large.");

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return parseFailure("The file does not contain valid JSON.");
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) return parseFailure("The JSON root must be an object.");
  const candidate = data as Record<string, unknown>;
  if (candidate.kind !== "darma.clip-path") return parseFailure("This is not a Darma clip-path file.");
  if (candidate.version !== SHAPE_FILE_VERSION) return parseFailure("This clip-path file version is not supported.");
  if (typeof candidate.className !== "string") return parseFailure("The file is missing a valid class name.");
  if (!Array.isArray(candidate.points)) return parseFailure("The file is missing a points array.");
  if (candidate.points.length < MIN_POINTS) return parseFailure(`The shape needs at least ${MIN_POINTS} points.`);
  if (candidate.points.length > MAX_POINTS) return parseFailure(`The shape cannot exceed ${MAX_POINTS} points.`);

  const points: ClipPoint[] = [];
  for (let index = 0; index < candidate.points.length; index += 1) {
    const point = candidate.points[index];
    if (!point || typeof point !== "object" || Array.isArray(point)) {
      return parseFailure(`Point ${index + 1} is malformed.`);
    }
    const { x, y } = point as Record<string, unknown>;
    if (typeof x !== "number" || typeof y !== "number" || !Number.isFinite(x) || !Number.isFinite(y)) {
      return parseFailure(`Point ${index + 1} must contain finite numeric coordinates.`);
    }
    if (x < MIN_COORDINATE || x > MAX_COORDINATE || y < MIN_COORDINATE || y > MAX_COORDINATE) {
      return parseFailure(`Point ${index + 1} must stay between 0 and 100.`);
    }
    points.push({ x: roundCoord(x), y: roundCoord(y) });
  }

  return { ok: true, className: candidate.className, points };
}
