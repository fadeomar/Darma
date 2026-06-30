import type { TaskPriority, TaskStatus } from "./types";

export type ParsedTaskDraft = {
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueAt?: string;
  tags: string[];
  completed?: boolean;
  estimateMinutes?: number;
  subtasks?: ParsedTaskDraft[];
};

export type QuickCaptureParseResult = Omit<ParsedTaskDraft, "subtasks"> & {
  raw: string;
};

export type BrainDumpParseOptions = {
  baseDate?: Date;
  defaultPriority?: TaskPriority;
  defaultStatus?: TaskStatus;
};

const PRIORITIES: TaskPriority[] = ["urgent", "high", "medium", "low"];
const STATUSES: TaskStatus[] = ["todo", "doing", "done", "blocked"];

function atMidday(date: Date): string {
  const copy = new Date(date);
  copy.setHours(12, 0, 0, 0);
  return copy.toISOString();
}

function addDays(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return atMidday(d);
}

function dueFromToken(token: string, baseDate: Date): string | undefined {
  const normalized = token.trim().toLowerCase();
  if (["today", "اليوم"].includes(normalized)) return addDays(baseDate, 0);
  if (["tomorrow", "tmr", "غدا", "غدًا", "بكرا", "بكرة"].includes(normalized)) return addDays(baseDate, 1);
  if (["next week", "الأسبوع القادم", "الاسبوع القادم"].includes(normalized)) return addDays(baseDate, 7);
  return undefined;
}

function cleanBulletPrefix(value: string): { title: string; completed?: boolean } {
  let title = value.trim();
  let completed: boolean | undefined;
  const checkbox = title.match(/^[-*•]?\s*\[(x|X| )\]\s+(.+)$/);
  if (checkbox) {
    completed = checkbox[1].toLowerCase() === "x";
    title = checkbox[2].trim();
  }
  title = title.replace(/^[-*•]\s+/, "").replace(/^\d+[.)]\s+/, "").trim();
  return { title, completed };
}

export function parseQuickCaptureInput(input: string, options: BrainDumpParseOptions = {}): QuickCaptureParseResult | null {
  const raw = input.trim();
  if (!raw) return null;

  const baseDate = options.baseDate ?? new Date();
  const tags = [...raw.matchAll(/#([\p{L}\p{N}_-]+)/gu)].map((m) => m[1]).filter(Boolean);

  let priority = options.defaultPriority ?? "none";
  for (const p of PRIORITIES) {
    if (new RegExp(`(^|\\s)!${p}(?=\\s|$)`, "i").test(raw)) {
      priority = p;
      break;
    }
  }
  if (priority === "none") {
    if (/(^|\s)(عاجل|ضروري|طارئ)(?=\s|$)/u.test(raw)) priority = "urgent";
    else if (/(^|\s)(مهم|important)(?=\s|$)/iu.test(raw)) priority = "high";
  }

  let status = options.defaultStatus ?? "todo";
  for (const s of STATUSES) {
    if (new RegExp(`(^|\\s)@${s}(?=\\s|$)`, "i").test(raw)) {
      status = s;
      break;
    }
  }

  let dueAt: string | undefined;
  const dateTokens = ["next week", "الأسبوع القادم", "الاسبوع القادم", "tomorrow", "today", "tmr", "اليوم", "غدًا", "غدا", "بكرا", "بكرة"];
  for (const token of dateTokens) {
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(^|\\s)${escaped}(?=\\s|$)`, "iu");
    if (re.test(raw)) {
      dueAt = dueFromToken(token, baseDate);
      break;
    }
  }

  const { title: bulletTitle, completed } = cleanBulletPrefix(raw);
  let title = bulletTitle
    .replace(/#[\p{L}\p{N}_-]+/gu, "")
    .replace(/!(urgent|high|medium|low)/gi, "")
    .replace(/@(todo|doing|done|blocked)/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  if (dueAt) {
    for (const token of dateTokens) {
      const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      title = title.replace(new RegExp(`(^|\\s)${escaped}(?=\\s|$)`, "iu"), " ").replace(/\s+/g, " ").trim();
    }
  }
  if (priority === "urgent") title = title.replace(/(^|\s)(عاجل|ضروري|طارئ)(?=\s|$)/gu, " ").replace(/\s+/g, " ").trim();
  if (priority === "high") title = title.replace(/(^|\s)(مهم|important)(?=\s|$)/giu, " ").replace(/\s+/g, " ").trim();

  if (!title) return null;

  return { raw, title, priority, status, dueAt, tags: [...new Set(tags)], completed };
}

function splitBrainDumpInput(input: string): string[] {
  const lines = input
    .split(/\r?\n/)
    .map((line) => line.replace(/\t/g, "  "))
    .filter((line) => line.trim().length > 0);

  if (lines.length > 1) return lines;

  const single = input.trim();
  // Split single-line brain dumps into actions, but avoid breaking short task titles.
  if (single.length > 40 && /[,;،]/u.test(single)) {
    return single.split(/[,;،]+/u).map((p) => p.trim()).filter(Boolean);
  }
  return single ? [single] : [];
}

function indentation(line: string): number {
  const match = line.match(/^\s*/);
  return match ? match[0].length : 0;
}

export function parseBrainDumpToTasks(input: string, options: BrainDumpParseOptions = {}): ParsedTaskDraft[] {
  const lines = splitBrainDumpInput(input);
  const rawLineCount = input.split(/\r?\n/).filter((line) => line.trim()).length;
  const globalParsed = rawLineCount <= 1 && lines.length > 1 ? parseQuickCaptureInput(input, options) : null;
  const baseOptions = { ...options };
  const roots: ParsedTaskDraft[] = [];
  const stack: { indent: number; draft: ParsedTaskDraft }[] = [];

  for (const line of lines) {
    const parsed = parseQuickCaptureInput(line, baseOptions);
    if (!parsed) continue;
    const draft: ParsedTaskDraft = {
      title: parsed.title,
      priority: parsed.priority === "none" ? globalParsed?.priority ?? "none" : parsed.priority,
      status: parsed.completed ? "done" : parsed.status,
      completed: parsed.completed,
      dueAt: parsed.dueAt ?? globalParsed?.dueAt,
      tags: parsed.tags.length ? parsed.tags : globalParsed?.tags ?? [],
    };
    const indent = indentation(line);

    while (stack.length && stack[stack.length - 1].indent >= indent) stack.pop();
    const parent = stack[stack.length - 1]?.draft;
    if (parent && indent > 0) {
      parent.subtasks = parent.subtasks ?? [];
      parent.subtasks.push(draft);
    } else {
      roots.push(draft);
    }
    stack.push({ indent, draft });
  }

  return roots;
}
