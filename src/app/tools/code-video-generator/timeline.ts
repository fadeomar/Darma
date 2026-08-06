export type CodeFileId = "html" | "css" | "js";
export type VideoFormat = "youtube" | "short";
export type StudioLayout = "split" | "alternate" | "code";
export type EditorTheme = "darma-dark" | "vs-dark" | "light";

export type CodeVideoProject = { title: string; html: string; css: string; js: string };
export type CodeVideoSettings = {
  format: VideoFormat;
  layout: StudioLayout;
  theme: EditorTheme;
  charsPerSecond: number;
  linePauseMs: number;
  sectionPauseMs: number;
  introMs: number;
  finalMs: number;
  humanVariation: boolean;
  showExplorer: boolean;
  showLineNumbers: boolean;
};
export type TimelineStepType = "reveal" | "switch-file" | "type" | "preview" | "hold";
export type TimelineStep = {
  id: string;
  type: TimelineStepType;
  label: string;
  durationMs: number;
  file?: CodeFileId;
  content?: string;
  sourceStart?: number;
  sourceEnd?: number;
  focus: "code" | "preview";
};
export type CodeVideoTimeline = {
  version: 1;
  createdAt: string;
  projectTitle: string;
  settings: CodeVideoSettings;
  steps: TimelineStep[];
  totalDurationMs: number;
};
export type PlaybackSnapshot = {
  project: CodeVideoProject;
  previewProject: CodeVideoProject;
  activeFile: CodeFileId;
  focus: "code" | "preview";
  currentStepIndex: number;
  currentStep: TimelineStep | null;
  elapsedInStepMs: number;
  progress: number;
  isComplete: boolean;
};

export const DEFAULT_CODE_VIDEO_SETTINGS: CodeVideoSettings = {
  format: "youtube",
  layout: "split",
  theme: "darma-dark",
  charsPerSecond: 72,
  linePauseMs: 115,
  sectionPauseMs: 700,
  introMs: 2400,
  finalMs: 3600,
  humanVariation: true,
  showExplorer: true,
  showLineNumbers: true,
};

const FILE_LABELS: Record<CodeFileId, string> = { html: "index.html", css: "style.css", js: "script.js" };
const MAX_CHARACTER_SCHEDULE_CACHE_ENTRIES = 32;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function normalizeSettings(settings: CodeVideoSettings): CodeVideoSettings {
  return {
    ...settings,
    charsPerSecond: clamp(Math.round(settings.charsPerSecond), 12, 240),
    linePauseMs: clamp(Math.round(settings.linePauseMs), 0, 1600),
    sectionPauseMs: clamp(Math.round(settings.sectionPauseMs), 0, 5000),
    introMs: clamp(Math.round(settings.introMs), 400, 15000),
    finalMs: clamp(Math.round(settings.finalMs), 800, 30000),
  };
}

function linePieces(source: string) {
  return source.match(/[^\n]*\n|[^\n]+$/g) ?? [];
}

function isChunkBoundary(language: CodeFileId, line: string, lineCount: number, charCount: number) {
  const trimmed = line.trim();
  if (!trimmed) return lineCount >= 3;
  if (lineCount >= 10 || charCount >= 900) return true;
  if (language === "html") {
    return lineCount >= 4 && (/^<\/[^>]+>/.test(trimmed) || /<\/(header|main|section|article|footer|nav|div)>$/i.test(trimmed));
  }
  if (language === "css") return lineCount >= 3 && trimmed.endsWith("}");
  return (lineCount >= 4 && (trimmed === "}" || trimmed === "};" || trimmed.endsWith(");"))) || lineCount >= 8;
}

export function splitIntoTeachingChunks(source: string, language: CodeFileId) {
  if (!source) return [];
  const pieces = linePieces(source.replace(/\r\n?/g, "\n"));
  const chunks: string[] = [];
  let current = "";
  let lineCount = 0;
  for (const piece of pieces) {
    current += piece;
    lineCount += 1;
    if (isChunkBoundary(language, piece, lineCount, current.length)) {
      chunks.push(current);
      current = "";
      lineCount = 0;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

function deterministicFactor(index: number, charCode: number) {
  const value = Math.sin((index + 1) * 12.9898 + charCode * 78.233) * 43758.5453;
  const fraction = value - Math.floor(value);
  return 0.82 + fraction * 0.36;
}

const characterScheduleCache = new Map<string, number[]>();
function scheduleCacheKey(content: string, settings: CodeVideoSettings) {
  return `${settings.charsPerSecond}|${settings.linePauseMs}|${settings.humanVariation ? 1 : 0}|${content}`;
}

function cacheCharacterSchedule(key: string, schedule: number[]) {
  if (characterScheduleCache.size >= MAX_CHARACTER_SCHEDULE_CACHE_ENTRIES) {
    const oldestKey = characterScheduleCache.keys().next().value;
    if (oldestKey !== undefined) characterScheduleCache.delete(oldestKey);
  }
  characterScheduleCache.set(key, schedule);
}

export function buildCharacterSchedule(content: string, inputSettings: CodeVideoSettings) {
  const settings = normalizeSettings(inputSettings);
  const key = scheduleCacheKey(content, settings);
  const cached = characterScheduleCache.get(key);
  if (cached) {
    characterScheduleCache.delete(key);
    characterScheduleCache.set(key, cached);
    return cached;
  }

  const baseMs = 1000 / settings.charsPerSecond;
  const schedule: number[] = [];
  let elapsed = 0;
  for (let index = 0; index < content.length; index += 1) {
    const character = content[index];
    const factor = settings.humanVariation ? deterministicFactor(index, character.charCodeAt(0)) : 1;
    elapsed += baseMs * factor;
    if (character === "\n") elapsed += settings.linePauseMs;
    else if (/[{};>]/.test(character)) elapsed += baseMs * 0.65;
    else if (/[,.]/.test(character)) elapsed += baseMs * 0.25;
    schedule.push(elapsed);
  }
  cacheCharacterSchedule(key, schedule);
  return schedule;
}

export function getTypingDuration(content: string, settings: CodeVideoSettings) {
  const schedule = buildCharacterSchedule(content, settings);
  return Math.max(120, Math.ceil(schedule.at(-1) ?? 0));
}

export function getTypedCharacterCount(content: string, elapsedMs: number, settings: CodeVideoSettings) {
  if (elapsedMs <= 0 || !content) return 0;
  const schedule = buildCharacterSchedule(content, settings);
  if (elapsedMs >= (schedule.at(-1) ?? 0)) return content.length;
  let low = 0;
  let high = schedule.length - 1;
  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    if (schedule[middle] <= elapsedMs) low = middle + 1;
    else high = middle - 1;
  }
  return low;
}

function switchStep(file: CodeFileId, order: number): TimelineStep {
  return { id: `switch-${file}-${order}`, type: "switch-file", file, label: `Open ${FILE_LABELS[file]}`, durationMs: 420, focus: "code" };
}

function firstAvailableFile(project: CodeVideoProject): CodeFileId {
  if (project.html.trim()) return "html";
  if (project.css.trim()) return "css";
  return "js";
}

export function buildCodeVideoTimeline(project: CodeVideoProject, inputSettings: CodeVideoSettings): CodeVideoTimeline {
  const settings = normalizeSettings(inputSettings);
  const codeOnly = settings.layout === "code";
  const steps: TimelineStep[] = [
    {
      id: "final-reveal-opening",
      type: "reveal",
      label: codeOnly ? "Show the finished source" : "Show the finished project",
      durationMs: settings.introMs,
      focus: codeOnly ? "code" : "preview",
    },
  ];
  const files: Array<{ file: CodeFileId; source: string }> = [
    { file: "html", source: project.html },
    { file: "css", source: project.css },
    { file: "js", source: project.js },
  ];

  for (const { file, source } of files) {
    if (!source.trim()) continue;
    steps.push(switchStep(file, steps.length));
    const chunks = splitIntoTeachingChunks(source, file);
    let sourceOffset = 0;
    chunks.forEach((content, chunkIndex) => {
      const sourceStart = sourceOffset;
      const sourceEnd = sourceStart + content.length;
      sourceOffset = sourceEnd;
      steps.push({
        id: `type-${file}-${chunkIndex}`,
        type: "type",
        file,
        content,
        sourceStart,
        sourceEnd,
        label: chunkIndex === 0 ? `Start ${FILE_LABELS[file]}` : `Continue ${FILE_LABELS[file]}`,
        durationMs: getTypingDuration(content, settings),
        focus: "code",
      });
      const isLastChunk = chunkIndex === chunks.length - 1;
      const shouldPreview = settings.layout === "alternate" && (isLastChunk || chunkIndex % 2 === 1);
      if (shouldPreview) {
        steps.push({ id: `preview-${file}-${chunkIndex}`, type: "preview", label: `Review the ${file.toUpperCase()} result`, durationMs: Math.max(500, settings.sectionPauseMs), focus: "preview" });
      } else if (!isLastChunk && settings.sectionPauseMs > 0) {
        steps.push({ id: `hold-${file}-${chunkIndex}`, type: "hold", label: "Pause on the completed section", durationMs: settings.sectionPauseMs, focus: "code" });
      }
    });
  }
  steps.push({
    id: "final-preview",
    type: "preview",
    label: codeOnly ? "Hold on the completed source" : "Show the completed project",
    durationMs: settings.finalMs,
    focus: codeOnly ? "code" : "preview",
  });
  return {
    version: 1,
    createdAt: new Date().toISOString(),
    projectTitle: project.title,
    settings,
    steps,
    totalDurationMs: steps.reduce((total, step) => total + step.durationMs, 0),
  };
}

function sourceLengthAfterStep(step: TimelineStep, currentLength: number) {
  if (step.type !== "type") return currentLength;
  if (typeof step.sourceEnd === "number") return step.sourceEnd;
  return currentLength + (step.content?.length ?? 0);
}

export function getPlaybackSnapshot(timeline: CodeVideoTimeline, sourceProject: CodeVideoProject, elapsedInputMs: number): PlaybackSnapshot {
  const elapsedMs = clamp(elapsedInputMs, 0, timeline.totalDurationMs);
  const typedLengths: Record<CodeFileId, number> = { html: 0, css: 0, js: 0 };
  let runnableJsLength = 0;
  let activeFile: CodeFileId = firstAvailableFile(sourceProject);
  let cursor = 0;
  let currentStepIndex = timeline.steps.length - 1;
  let currentStep: TimelineStep | null = timeline.steps.at(-1) ?? null;
  let elapsedInStepMs = currentStep?.durationMs ?? 0;
  let focus: "code" | "preview" = currentStep?.focus ?? "preview";

  for (let index = 0; index < timeline.steps.length; index += 1) {
    const step = timeline.steps[index];
    const stepEnd = cursor + step.durationMs;
    if (elapsedMs >= stepEnd) {
      if (step.type === "switch-file" && step.file) activeFile = step.file;
      if (step.type === "type" && step.file) {
        typedLengths[step.file] = sourceLengthAfterStep(step, typedLengths[step.file]);
        if (step.file === "js" && typedLengths.js >= sourceProject.js.length) runnableJsLength = sourceProject.js.length;
      }
      cursor = stepEnd;
      continue;
    }

    currentStepIndex = index;
    currentStep = step;
    elapsedInStepMs = elapsedMs - cursor;
    focus = step.focus;
    if (step.type === "switch-file" && step.file) activeFile = step.file;
    if (step.type === "type" && step.file && step.content) {
      activeFile = step.file;
      const sourceStart = step.sourceStart ?? typedLengths[step.file];
      const count = getTypedCharacterCount(step.content, elapsedInStepMs, timeline.settings);
      typedLengths[step.file] = sourceStart + count;
    }
    break;
  }

  const isOpeningReveal = currentStep?.type === "reveal";
  const showFinishedSource = isOpeningReveal && timeline.settings.layout === "code";
  const project: CodeVideoProject = showFinishedSource
    ? { ...sourceProject }
    : {
        title: sourceProject.title,
        html: sourceProject.html.slice(0, typedLengths.html),
        css: sourceProject.css.slice(0, typedLengths.css),
        js: sourceProject.js.slice(0, typedLengths.js),
      };

  let previewProject = isOpeningReveal
    ? sourceProject
    : { ...project, js: sourceProject.js.slice(0, runnableJsLength) };

  if (elapsedMs >= timeline.totalDurationMs) {
    currentStep = timeline.steps.at(-1) ?? null;
    currentStepIndex = Math.max(0, timeline.steps.length - 1);
    elapsedInStepMs = currentStep?.durationMs ?? 0;
    focus = currentStep?.focus ?? "preview";
    previewProject = sourceProject;
  }

  return {
    project,
    previewProject,
    activeFile,
    focus,
    currentStepIndex,
    currentStep,
    elapsedInStepMs,
    progress: timeline.totalDurationMs ? elapsedMs / timeline.totalDurationMs : 1,
    isComplete: elapsedMs >= timeline.totalDurationMs,
  };
}

export function formatClock(milliseconds: number, includeMilliseconds = false) {
  const safe = Math.max(0, Math.round(milliseconds));
  const minutes = Math.floor(safe / 60000);
  const seconds = Math.floor((safe % 60000) / 1000);
  const millis = safe % 1000;
  return includeMilliseconds
    ? `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(millis).padStart(3, "0")}`
    : `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function srtTime(milliseconds: number) {
  const safe = Math.max(0, Math.round(milliseconds));
  const hours = Math.floor(safe / 3600000);
  const minutes = Math.floor((safe % 3600000) / 60000);
  const seconds = Math.floor((safe % 60000) / 1000);
  const millis = safe % 1000;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")},${String(millis).padStart(3, "0")}`;
}

export function buildTimelineSrt(timeline: CodeVideoTimeline) {
  const cues: string[] = [];
  let cursor = 0;
  let cueIndex = 1;
  timeline.steps.forEach((step) => {
    const start = cursor;
    const end = cursor + step.durationMs;
    cursor = end;
    if (step.type === "hold" || step.durationMs < 250) return;
    cues.push(`${cueIndex}\n${srtTime(start)} --> ${srtTime(end)}\n${step.label}`);
    cueIndex += 1;
  });
  return `${cues.join("\n\n")}\n`;
}

export function buildVoiceoverNotes(timeline: CodeVideoTimeline) {
  const rows = [
    `# ${timeline.projectTitle} — voice-over notes`,
    "",
    `Estimated runtime: ${formatClock(timeline.totalDurationMs)}`,
    "",
    "These are production cues, not a mandatory word-for-word script.",
    "",
  ];
  let cursor = 0;
  timeline.steps.forEach((step) => {
    rows.push(`- ${formatClock(cursor)} — ${step.label}`);
    cursor += step.durationMs;
  });
  rows.push("");
  return rows.join("\n");
}
