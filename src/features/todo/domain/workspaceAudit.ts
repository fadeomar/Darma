import { TODO_EXPORT_TOOL, TODO_EXPORT_VERSION } from "./constants";
import { validateImportData } from "./schema";
import type { Task, TodoExportBundle } from "./types";

export type TodoAuditSeverity = "error" | "warning" | "info" | "pass";

export type TodoAuditCheck = {
  id: string;
  severity: TodoAuditSeverity;
  title: string;
  detail: string;
};

export type TodoWorkspaceSummary = {
  lists: number;
  tasks: number;
  openTasks: number;
  completedTasks: number;
  overdueTasks: number;
  archivedLists: number;
  completionRate: number;
  readinessScore: number;
  readinessLabel: "Blocked" | "Needs review" | "Ready";
};

export type TodoWorkspaceAudit = {
  summary: TodoWorkspaceSummary;
  checks: TodoAuditCheck[];
};

const severityRank: Record<TodoAuditSeverity, number> = {
  error: 0,
  warning: 1,
  info: 2,
  pass: 3,
};

function isOverdue(task: Task, now: Date): boolean {
  if (!task.dueAt || task.completed) return false;
  const due = Date.parse(task.dueAt);
  return Number.isFinite(due) && due < now.getTime();
}

function duplicateIds(values: { id: string }[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (seen.has(value.id)) duplicates.add(value.id);
    seen.add(value.id);
  }
  return [...duplicates];
}

export function analyzeTodoWorkspace(bundle: TodoExportBundle, now = new Date()): TodoWorkspaceAudit {
  const checks: TodoAuditCheck[] = [];
  const listIds = new Set(bundle.lists.map((list) => list.id));
  const taskIds = new Set(bundle.tasks.map((task) => task.id));
  const openTasks = bundle.tasks.filter((task) => !task.completed).length;
  const completedTasks = bundle.tasks.length - openTasks;
  const overdueTasks = bundle.tasks.filter((task) => isOverdue(task, now)).length;
  const archivedLists = bundle.lists.filter((list) => list.isArchived).length;

  const validation = validateImportData(bundle);
  if (!validation.ok) {
    checks.push({
      id: "schema",
      severity: "error",
      title: "Workspace relationships are not import-safe",
      detail: validation.error ?? "The backup does not match the Darma Tasks schema.",
    });
  } else {
    checks.push({
      id: "schema",
      severity: "pass",
      title: "Backup schema and relationships are valid",
      detail: `Version ${bundle.version} can be restored by this Darma Tasks build.`,
    });
  }

  const duplicateCount =
    duplicateIds(bundle.lists).length + duplicateIds(bundle.tasks).length + duplicateIds(bundle.columns).length;
  if (duplicateCount > 0) {
    checks.push({
      id: "duplicate-ids",
      severity: "error",
      title: "Duplicate record IDs detected",
      detail: `${duplicateCount} duplicate ID${duplicateCount === 1 ? "" : "s"} could overwrite records during import.`,
    });
  }

  const orphanTasks = bundle.tasks.filter((task) => !listIds.has(task.listId));
  const orphanParents = bundle.tasks.filter((task) => task.parentTaskId && !taskIds.has(task.parentTaskId));
  const orphanColumns = bundle.columns.filter((column) => !listIds.has(column.listId));
  const orphanCount = orphanTasks.length + orphanParents.length + orphanColumns.length;
  if (orphanCount > 0) {
    checks.push({
      id: "orphans",
      severity: "error",
      title: "Orphaned workspace records detected",
      detail: `${orphanCount} task, subtask, or board-column relationship points to a missing record.`,
    });
  }

  const stateMismatches = bundle.tasks.filter(
    (task) => task.completed !== (task.status === "done") || (task.completed && !task.completedAt),
  );
  if (stateMismatches.length > 0) {
    checks.push({
      id: "state-mismatch",
      severity: "warning",
      title: "Task completion fields disagree",
      detail: `${stateMismatches.length} task${stateMismatches.length === 1 ? " has" : "s have"} inconsistent status, completed, or completedAt fields.`,
    });
  } else if (bundle.tasks.length > 0) {
    checks.push({
      id: "state-mismatch",
      severity: "pass",
      title: "Task completion fields are consistent",
      detail: "Completed flags and Done statuses agree across the workspace.",
    });
  }

  const listsWithoutColumns = bundle.lists.filter(
    (list) => !bundle.columns.some((column) => column.listId === list.id),
  );
  if (listsWithoutColumns.length > 0) {
    checks.push({
      id: "columns",
      severity: "warning",
      title: "Some lists have no board columns",
      detail: `${listsWithoutColumns.length} list${listsWithoutColumns.length === 1 ? "" : "s"} will need default columns before Board view is complete.`,
    });
  }

  if (overdueTasks > 0) {
    checks.push({
      id: "overdue",
      severity: "warning",
      title: "Overdue work needs review",
      detail: `${overdueTasks} incomplete task${overdueTasks === 1 ? " is" : "s are"} past the saved due date.`,
    });
  } else {
    checks.push({
      id: "overdue",
      severity: "pass",
      title: "No incomplete task is overdue",
      detail: "Due-date review found no past-due open work.",
    });
  }

  if (bundle.tasks.length > 20_000) {
    checks.push({
      id: "workspace-size",
      severity: "warning",
      title: "Large workspace",
      detail: `${bundle.tasks.length.toLocaleString()} tasks may make browser-only filtering and backup generation slower.`,
    });
  } else {
    checks.push({
      id: "workspace-size",
      severity: "pass",
      title: "Workspace size is browser-friendly",
      detail: `${bundle.tasks.length.toLocaleString()} tasks are within the recommended local-workspace range.`,
    });
  }

  if (archivedLists > 0) {
    checks.push({
      id: "archived-lists",
      severity: "info",
      title: "Archived lists are included in complete backups",
      detail: `${archivedLists} archived list${archivedLists === 1 ? " is" : "s are"} preserved even though the main sidebar hides them.`,
    });
  }

  checks.push({
    id: "privacy",
    severity: "info",
    title: "Backups contain private task content",
    detail: "Store exported JSON and ZIP files securely; they may contain notes, tags, names, and due dates.",
  });

  checks.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
  const errors = checks.filter((check) => check.severity === "error").length;
  const warnings = checks.filter((check) => check.severity === "warning").length;
  const readinessScore = Math.max(0, 100 - errors * 30 - warnings * 8);
  const readinessLabel = errors > 0 ? "Blocked" : warnings > 0 ? "Needs review" : "Ready";

  return {
    summary: {
      lists: bundle.lists.length,
      tasks: bundle.tasks.length,
      openTasks,
      completedTasks,
      overdueTasks,
      archivedLists,
      completionRate: bundle.tasks.length ? Math.round((completedTasks / bundle.tasks.length) * 100) : 0,
      readinessScore,
      readinessLabel,
    },
    checks,
  };
}

function csvValue(value: unknown): string {
  let text = value == null ? "" : String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function buildTodoTasksCsv(bundle: TodoExportBundle): string {
  const listNames = new Map(bundle.lists.map((list) => [list.id, list.name]));
  const header = [
    "task_id",
    "list",
    "title",
    "status",
    "completed",
    "priority",
    "due_at",
    "parent_task_id",
    "tags",
    "updated_at",
  ];
  const rows = bundle.tasks.map((task) => [
    task.id,
    listNames.get(task.listId) ?? task.listId,
    task.title,
    task.status,
    task.completed,
    task.priority,
    task.dueAt ?? "",
    task.parentTaskId ?? "",
    task.tags.join("|"),
    task.updatedAt,
  ]);
  return [header, ...rows].map((row) => row.map(csvValue).join(",")).join("\n");
}

export function buildTodoAuditMarkdown(bundle: TodoExportBundle, audit = analyzeTodoWorkspace(bundle)): string {
  const { summary } = audit;
  const lines = [
    "# Darma Tasks workspace audit",
    "",
    `- Exported: ${bundle.exportedAt}`,
    `- Lists: ${summary.lists}`,
    `- Tasks: ${summary.tasks}`,
    `- Open: ${summary.openTasks}`,
    `- Completed: ${summary.completedTasks}`,
    `- Overdue: ${summary.overdueTasks}`,
    `- Readiness: ${summary.readinessLabel} (${summary.readinessScore}/100)`,
    "",
    "## Production checks",
    "",
  ];
  for (const check of audit.checks) {
    lines.push(`- **${check.severity.toUpperCase()} — ${check.title}:** ${check.detail}`);
  }
  lines.push("", "## Privacy", "", "This report and the accompanying backup were generated locally in the browser. Keep exported files secure.");
  return lines.join("\n");
}

type ZipEntry = { filename: string; content: string };

const zipEncoder = new TextEncoder();

function crc32(bytes: Uint8Array): number {
  let crc = -1;
  for (const byte of bytes) {
    crc ^= byte;
    for (let index = 0; index < 8; index += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ -1) >>> 0;
}

function writeUint16(view: DataView, offset: number, value: number) {
  view.setUint16(offset, value, true);
}

function writeUint32(view: DataView, offset: number, value: number) {
  view.setUint32(offset, value, true);
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

function createStoredZip(entries: ZipEntry[]): Uint8Array {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const filename = zipEncoder.encode(entry.filename.replace(/^\/+/, ""));
    const data = zipEncoder.encode(entry.content);
    const crc = crc32(data);
    const local = new Uint8Array(30 + filename.length);
    const localView = new DataView(local.buffer);
    writeUint32(localView, 0, 0x04034b50);
    writeUint16(localView, 4, 20);
    writeUint16(localView, 6, 0x0800);
    writeUint16(localView, 8, 0);
    writeUint32(localView, 14, crc);
    writeUint32(localView, 18, data.length);
    writeUint32(localView, 22, data.length);
    writeUint16(localView, 26, filename.length);
    local.set(filename, 30);
    localParts.push(local, data);

    const central = new Uint8Array(46 + filename.length);
    const centralView = new DataView(central.buffer);
    writeUint32(centralView, 0, 0x02014b50);
    writeUint16(centralView, 4, 20);
    writeUint16(centralView, 6, 20);
    writeUint16(centralView, 8, 0x0800);
    writeUint16(centralView, 10, 0);
    writeUint32(centralView, 16, crc);
    writeUint32(centralView, 20, data.length);
    writeUint32(centralView, 24, data.length);
    writeUint16(centralView, 28, filename.length);
    writeUint32(centralView, 42, offset);
    central.set(filename, 46);
    centralParts.push(central);
    offset += local.length + data.length;
  }

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  writeUint32(endView, 0, 0x06054b50);
  writeUint16(endView, 8, entries.length);
  writeUint16(endView, 10, entries.length);
  writeUint32(endView, 12, centralSize);
  writeUint32(endView, 16, offset);
  return concatBytes([...localParts, ...centralParts, end]);
}

export async function createTodoProductionPack(bundle: TodoExportBundle): Promise<Uint8Array> {
  const audit = analyzeTodoWorkspace(bundle);
  return createStoredZip([
    { filename: "darma-tasks-backup.json", content: JSON.stringify(bundle, null, 2) },
    { filename: "workspace-audit.md", content: buildTodoAuditMarkdown(bundle, audit) },
    { filename: "tasks.csv", content: buildTodoTasksCsv(bundle) },
    {
      filename: "README.md",
      content: [
        "# Darma Tasks production backup",
        "",
        "- Import `darma-tasks-backup.json` from the Data menu to restore the workspace.",
        "- `workspace-audit.md` explains relationship, readiness, and privacy checks.",
        "- `tasks.csv` is a spreadsheet-friendly snapshot; formula-like cells are escaped.",
        "- The JSON backup includes archived lists and all task/column relationships.",
        "",
        `Schema: ${TODO_EXPORT_TOOL} v${TODO_EXPORT_VERSION}`,
      ].join("\n"),
    },
  ]);
}
