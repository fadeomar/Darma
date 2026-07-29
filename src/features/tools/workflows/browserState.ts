export const COLOR_WORKFLOW_ID = "color-system-studio";
export const CODE_PREVIEW_HANDOFF_KEY = "darma:code-preview:handoff:v1";

const COLOR_STATE_KEY = "darma:workflow:color-system-studio:v1";
const PROGRESS_PREFIX = "darma:workflow-progress:v1:";

export type ColorWorkflowState = {
  primary: string;
  secondary?: string;
  palette?: string[];
  updatedAt: number;
};

export type WorkflowProgressState = {
  completedStepIds: string[];
  lastStepId?: string;
  updatedAt: number;
};

export type CodePreviewHandoff = {
  source: {
    html: string;
    css: string;
    js: string;
  };
  title?: string;
  elementId?: string;
  elementSlug?: string | null;
  createdAt: number;
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function normalizeHexColor(value: string | null | undefined): string | null {
  if (!value) return null;
  const raw = value.trim();
  const short = raw.match(/^#?([0-9a-f]{3})$/i);
  if (short) {
    const [r, g, b] = short[1].split("");
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  const full = raw.match(/^#?([0-9a-f]{6})$/i);
  return full ? `#${full[1].toUpperCase()}` : null;
}

export function readableTextColor(background: string): "#000000" | "#ffffff" {
  const normalized = normalizeHexColor(background) ?? "#000000";
  const value = normalized.slice(1);
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.56 ? "#000000" : "#ffffff";
}

export function readColorWorkflowState(): ColorWorkflowState | null {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(COLOR_STATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ColorWorkflowState>;
    const primary = normalizeHexColor(parsed.primary);
    if (!primary) return null;
    const palette = Array.isArray(parsed.palette)
      ? parsed.palette.map((item) => normalizeHexColor(item)).filter((item): item is string => Boolean(item)).slice(0, 12)
      : undefined;
    return {
      primary,
      secondary: normalizeHexColor(parsed.secondary) ?? palette?.[1],
      palette,
      updatedAt: typeof parsed.updatedAt === "number" ? parsed.updatedAt : Date.now(),
    };
  } catch {
    return null;
  }
}

export function writeColorWorkflowState(next: Omit<ColorWorkflowState, "updatedAt">) {
  if (!canUseStorage()) return;
  const primary = normalizeHexColor(next.primary);
  if (!primary) return;
  const palette = next.palette
    ?.map((item) => normalizeHexColor(item))
    .filter((item): item is string => Boolean(item))
    .slice(0, 12);
  const value: ColorWorkflowState = {
    primary,
    secondary: normalizeHexColor(next.secondary) ?? palette?.[1],
    palette,
    updatedAt: Date.now(),
  };
  try {
    window.localStorage.setItem(COLOR_STATE_KEY, JSON.stringify(value));
  } catch {
    // Storage can be blocked or full. The tools still work without handoff.
  }
}

export function readWorkflowProgress(workflowId: string): WorkflowProgressState {
  const empty: WorkflowProgressState = { completedStepIds: [], updatedAt: Date.now() };
  if (!canUseStorage()) return empty;
  try {
    const raw = window.localStorage.getItem(`${PROGRESS_PREFIX}${workflowId}`);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Partial<WorkflowProgressState>;
    return {
      completedStepIds: Array.isArray(parsed.completedStepIds)
        ? Array.from(new Set(parsed.completedStepIds.filter((item): item is string => typeof item === "string")))
        : [],
      lastStepId: typeof parsed.lastStepId === "string" ? parsed.lastStepId : undefined,
      updatedAt: typeof parsed.updatedAt === "number" ? parsed.updatedAt : Date.now(),
    };
  } catch {
    return empty;
  }
}

export function writeWorkflowProgress(workflowId: string, progress: WorkflowProgressState) {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(`${PROGRESS_PREFIX}${workflowId}`, JSON.stringify({ ...progress, updatedAt: Date.now() }));
  } catch {
    // Progress is an enhancement; navigation must remain usable without it.
  }
}

export function markWorkflowStepComplete(workflowId: string, stepId: string) {
  const current = readWorkflowProgress(workflowId);
  const completedStepIds = current.completedStepIds.includes(stepId)
    ? current.completedStepIds
    : [...current.completedStepIds, stepId];
  const next = { completedStepIds, lastStepId: stepId, updatedAt: Date.now() };
  writeWorkflowProgress(workflowId, next);
  return next;
}

export function clearWorkflowProgress(workflowId: string) {
  if (!canUseStorage()) return;
  try {
    window.localStorage.removeItem(`${PROGRESS_PREFIX}${workflowId}`);
  } catch {
    // Ignore storage failures.
  }
}

export function writeCodePreviewHandoff(payload: CodePreviewHandoff) {
  if (!canUseStorage()) return false;
  try {
    window.localStorage.setItem(CODE_PREVIEW_HANDOFF_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

export function consumeCodePreviewHandoff(maxAgeMs = 15 * 60 * 1000): CodePreviewHandoff | null {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(CODE_PREVIEW_HANDOFF_KEY);
    if (!raw) return null;
    window.localStorage.removeItem(CODE_PREVIEW_HANDOFF_KEY);
    const parsed = JSON.parse(raw) as Partial<CodePreviewHandoff>;
    if (!parsed.source || typeof parsed.createdAt !== "number" || Date.now() - parsed.createdAt > maxAgeMs) return null;
    const source = parsed.source as Partial<CodePreviewHandoff["source"]>;
    if (typeof source.html !== "string" || typeof source.css !== "string" || typeof source.js !== "string") return null;
    return {
      source: { html: source.html, css: source.css, js: source.js },
      title: typeof parsed.title === "string" ? parsed.title : undefined,
      elementId: typeof parsed.elementId === "string" ? parsed.elementId : undefined,
      elementSlug: typeof parsed.elementSlug === "string" || parsed.elementSlug === null ? parsed.elementSlug : undefined,
      createdAt: parsed.createdAt,
    };
  } catch {
    return null;
  }
}
