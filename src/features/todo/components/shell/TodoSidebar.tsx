"use client";

import { useEffect, useRef, useState } from "react";
import {
  Calendar,
  CalendarClock,
  CalendarPlus,
  CalendarRange,
  CheckCircle2,
  CheckSquare,
  Circle,
  Download,
  Flag,
  GripVertical,
  LayoutGrid,
  LayoutTemplate,
  List,
  Sparkles,
  MoreHorizontal,
  Printer,
  Search,
  Table,
  Tag,
  Trash2,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { VIEW_LABELS } from "../../domain/constants";
import { buildMarkdown, buildPlainText, type ImportMode, type ImportSummary } from "../../data/importExport";
import type { SidebarFilter, SortMode, TodoView } from "../../domain/types";
import { TodoConfirmDialog } from "../dialogs/TodoConfirmDialog";
import { TodoImportDialog } from "../dialogs/TodoImportDialog";
import { useActiveListId, useTodo } from "../../state/TodoProvider";

const VIEW_ICONS: Partial<Record<TodoView, typeof List>> = {
  list: List,
  board: LayoutGrid,
  table: Table,
  week: CalendarRange,
  checklist: CheckSquare,
  print: Printer,
};

function downloadBlob(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

const FILTERS: { id: SidebarFilter; label: string; icon: typeof List }[] = [
  { id: "today", label: "Today", icon: Calendar },
  { id: "upcoming", label: "Upcoming", icon: CalendarClock },
  { id: "overdue", label: "Overdue", icon: Flag },
  { id: "completed", label: "Completed", icon: CheckCircle2 },
  { id: "high-priority", label: "High Priority", icon: Flag },
  { id: "no-date", label: "No Date", icon: Circle },
];

const SORTS: { id: SortMode; label: string }[] = [
  { id: "manual", label: "Manual" },
  { id: "due", label: "Due date" },
  { id: "priority", label: "Priority" },
  { id: "created", label: "Created" },
  { id: "status", label: "Status" },
];

type Props = {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
};

export function TodoSidebar({ mobileOpen, onCloseMobile }: Props) {
  const { lists, ui, setUi, allTags } = useTodo();
  const activeListId = useActiveListId();

  return (
    <aside
      className={cn(
        "todo-studio__sidebar todo-panel flex h-full flex-col border-e",
        mobileOpen && "todo-studio__sidebar--open",
      )}
    >
      <div className="todo-sidebar-section">
        <p className="todo-sidebar-title">Smart filters</p>
      </div>
      <nav className="todo-sidebar-nav" aria-label="Smart filters">
        {FILTERS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            aria-current={ui.activeFilter === id ? "true" : undefined}
            className={cn("todo-nav-item", ui.activeFilter === id && "todo-nav-item--active")}
            onClick={() => {
              setUi({ activeFilter: id, activeListId: null });
              onCloseMobile?.();
            }}
          >
            <Icon className="todo-nav-item__icon" size={16} aria-hidden />
            <span className="todo-nav-item__label">{label}</span>
          </button>
        ))}
      </nav>

      <div className="todo-sidebar-section">
        <p className="todo-sidebar-title">Lists</p>
      </div>
      <nav className="todo-sidebar-nav" aria-label="Lists">
        {lists.map((list) => {
          const active = ui.activeFilter === "all" && (ui.activeListId ?? activeListId) === list.id;
          return (
            <button
              key={list.id}
              type="button"
              aria-current={active ? "true" : undefined}
              className={cn("todo-nav-item", active && "todo-nav-item--active")}
              onClick={() => {
                setUi({ activeFilter: "all", activeListId: list.id });
                onCloseMobile?.();
              }}
            >
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ background: list.color ?? "var(--todo-primary)" }}
                aria-hidden
              />
              <span className="todo-nav-item__label">{list.name}</span>
            </button>
          );
        })}
      </nav>

      {allTags.length > 0 && (
        <>
          <div className="todo-sidebar-section">
            <p className="todo-sidebar-title">Tags</p>
          </div>
          <div className="todo-sidebar-tags">
            <button
              type="button"
              className={cn("todo-chip", !ui.selectedTag && "ring-1 ring-[var(--todo-primary)]")}
              onClick={() => setUi({ selectedTag: null })}
            >
              All
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                className={cn(
                  "todo-chip",
                  ui.selectedTag === tag && "ring-1 ring-[var(--todo-primary)]",
                )}
                onClick={() => setUi({ selectedTag: tag })}
              >
                <Tag size={10} aria-hidden />#{tag}
              </button>
            ))}
          </div>
        </>
      )}

      <div className="todo-sidebar-sort">
        <label className="mb-1 block text-xs font-semibold todo-muted" htmlFor="todo-sort">
          Sort by
        </label>
        <select
          id="todo-sort"
          className="todo-input text-sm"
          value={ui.sortBy}
          onChange={(e) => setUi({ sortBy: e.target.value as SortMode })}
        >
          {SORTS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
    </aside>
  );
}

export function TodoTopBar({
  onOpenTemplates,
  onOpenPlanToday,
  onOpenBrainDump,
}: {
  onOpenTemplates: () => void;
  onOpenPlanToday: () => void;
  onOpenBrainDump: () => void;
}) {
  const { ui, setUi, lists, tasks, tasksForList, exportData, exportListData, importData, summarizeImport, copyListText, clearCompleted } = useTodo();
  const activeListId = useActiveListId();
  const [menuOpen, setMenuOpen] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [importDialog, setImportDialog] = useState<{ text: string; summary: ImportSummary } | null>(null);
  const [dataNotice, setDataNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onDoc(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen]);

  useEffect(() => {
    if (!dataNotice) return;
    const id = window.setTimeout(() => setDataNotice(null), 2400);
    return () => window.clearTimeout(id);
  }, [dataNotice]);

  const activeList = lists.find((l) => l.id === activeListId);
  const safeName = (activeList?.name ?? "darma-tasks").replace(/[^a-z0-9]+/gi, "-").toLowerCase();

  async function handleExportAll() {
    downloadBlob(`darma-tasks-${new Date().toISOString().slice(0, 10)}.json`, await exportData(), "application/json");
  }

  async function handleExportList() {
    downloadBlob(`${safeName}.json`, await exportListData(activeListId), "application/json");
  }

  function handleDownloadList(format: "md" | "txt") {
    const listTasks = tasksForList(activeListId);
    const text =
      format === "md"
        ? buildMarkdown(listTasks, tasks, { title: activeList?.name })
        : buildPlainText(listTasks, tasks, { title: activeList?.name });
    downloadBlob(`${safeName}.${format}`, text, format === "md" ? "text/markdown" : "text/plain");
  }

  function handleImport() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const text = await file.text();
      const summary = summarizeImport(text);
      if (!summary.ok || !summary.counts) {
        setDataNotice(summary.error ?? "Import failed: invalid file.");
        return;
      }
      setImportDialog({ text, summary });
    };
    input.click();
  }

  async function confirmImport(mode: ImportMode) {
    if (!importDialog) return;
    setBusy(true);
    try {
      const result = await importData(importDialog.text, mode);
      if (!result.ok) {
        setDataNotice(result.error ?? "Import failed");
        return;
      }
      const skipped = result.skipped && (result.skipped.lists > 0 || result.skipped.tasks > 0)
        ? ` Skipped ${result.skipped.lists} duplicate list${result.skipped.lists === 1 ? "" : "s"}.`
        : "";
      setDataNotice(`Imported ${result.counts?.lists ?? 0} list${result.counts?.lists === 1 ? "" : "s"} and ${result.counts?.tasks ?? 0} task${result.counts?.tasks === 1 ? "" : "s"}.${skipped}`);
      setImportDialog(null);
    } finally {
      setBusy(false);
    }
  }

  async function handleClearCompleted() {
    setBusy(true);
    try {
      const removed = await clearCompleted(activeListId);
      setDataNotice(removed === 0 ? "No completed tasks to clear." : `Deleted ${removed} completed task${removed === 1 ? "" : "s"}.`);
      setClearDialogOpen(false);
      setMenuOpen(false);
    } finally {
      setBusy(false);
    }
  }

  const views: TodoView[] = ["list", "board", "table", "week", "checklist", "print"];

  return (
    <header className="todo-topbar">
      <div className="todo-topbar__search">
        <Search size={16} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 todo-muted" />
        <input
          id="todo-search-input"
          type="search"
          className="todo-input ps-9"
          placeholder="Search tasks…"
          value={ui.searchQuery}
          onChange={(e) => setUi({ searchQuery: e.target.value })}
          aria-label="Search tasks"
        />
      </div>

      <div className="todo-topbar__center">
        <div className="todo-view-switcher" role="tablist" aria-label="View switcher">
          {views.map((view) => {
            const Icon = VIEW_ICONS[view];
            return (
              <button
                key={view}
                type="button"
                role="tab"
                aria-selected={ui.activeView === view}
                title={VIEW_LABELS[view]}
                className={cn(
                  "todo-view-tab",
                  ui.activeView === view && "todo-view-tab--active",
                )}
                onClick={() => setUi({ activeView: view })}
              >
                {Icon ? <Icon size={14} aria-hidden /> : null}
                {VIEW_LABELS[view]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="todo-topbar__actions">
        <button type="button" className="todo-btn todo-action-btn--plan text-xs" onClick={onOpenPlanToday}>
          <CalendarPlus size={14} aria-hidden /> Plan today
        </button>
        <button type="button" className="todo-btn todo-action-btn--brain text-xs" onClick={onOpenBrainDump}>
          <Sparkles size={14} aria-hidden /> Brain Dump
        </button>
        <button type="button" className="todo-btn text-xs" onClick={onOpenTemplates}>
          <LayoutTemplate size={14} aria-hidden /> <span className="hidden xl:inline">Templates</span>
        </button>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            className="todo-btn todo-btn--icon"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Data: import, export and copy"
            title="Data"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <Download size={16} aria-hidden />
          </button>
          {menuOpen && (
            <div className="todo-menu" role="menu">
              <p className="todo-menu__label">Export</p>
              <button type="button" role="menuitem" className="todo-menu__item" onClick={() => { void handleExportAll(); setMenuOpen(false); }}>
                Export all data (JSON)
              </button>
              <button type="button" role="menuitem" className="todo-menu__item" onClick={() => { void handleExportList(); setMenuOpen(false); }}>
                Export this list (JSON)
              </button>
              <p className="todo-menu__label">Copy this list</p>
              <button type="button" role="menuitem" className="todo-menu__item" onClick={() => { void copyListText(activeListId, "md"); setMenuOpen(false); setDataNotice("Copied Markdown."); }}>
                Copy as Markdown
              </button>
              <button type="button" role="menuitem" className="todo-menu__item" onClick={() => { void copyListText(activeListId, "txt"); setMenuOpen(false); setDataNotice("Copied plain text."); }}>
                Copy as plain text
              </button>
              <p className="todo-menu__label">Download this list</p>
              <button type="button" role="menuitem" className="todo-menu__item" onClick={() => { handleDownloadList("txt"); setMenuOpen(false); }}>
                Download .txt
              </button>
              <button type="button" role="menuitem" className="todo-menu__item" onClick={() => { handleDownloadList("md"); setMenuOpen(false); }}>
                Download .md
              </button>
              <hr className="todo-menu__divider" />
              <button type="button" role="menuitem" className="todo-menu__item" onClick={() => { handleImport(); setMenuOpen(false); }}>
                <Upload size={14} aria-hidden /> Import JSON…
              </button>
              <button type="button" role="menuitem" className="todo-menu__item todo-menu__item--danger" onClick={() => setClearDialogOpen(true)}>
                <Trash2 size={14} aria-hidden /> Clear completed in this list
              </button>
            </div>
          )}
        </div>
      </div>

      {dataNotice && <p className="todo-data-notice" role="status">{dataNotice}</p>}

      <TodoImportDialog
        open={Boolean(importDialog)}
        summary={importDialog?.summary ?? null}
        busy={busy}
        onClose={() => setImportDialog(null)}
        onImport={confirmImport}
      />
      <TodoConfirmDialog
        open={clearDialogOpen}
        title="Clear completed tasks?"
        description={`This will delete all completed tasks in "${activeList?.name ?? "this list"}". This action cannot be undone.`}
        confirmLabel="Clear completed"
        variant="danger"
        busy={busy}
        onClose={() => setClearDialogOpen(false)}
        onConfirm={handleClearCompleted}
      />
    </header>
  );
}

export function TodoMobileNav({
  onOpenSidebar,
  onOpenInspector,
}: {
  onOpenSidebar: () => void;
  onOpenInspector: () => void;
}) {
  const { ui, setUi } = useTodo();

  return (
    <nav className="todo-mobile-nav lg:hidden" aria-label="Mobile navigation">
      <button type="button" className="todo-btn todo-btn--ghost flex-1 text-xs" onClick={onOpenSidebar}>
        <GripVertical size={16} aria-hidden />
        Menu
      </button>
      <button
        type="button"
        className={cn("todo-btn todo-btn--ghost flex-1 text-xs", ui.activeView === "list" && "text-[var(--todo-primary)]")}
        onClick={() => setUi({ activeView: "list" })}
      >
        <List size={16} aria-hidden />
        List
      </button>
      <button
        type="button"
        className={cn("todo-btn todo-btn--ghost flex-1 text-xs", ui.activeView === "board" && "text-[var(--todo-primary)]")}
        onClick={() => setUi({ activeView: "board" })}
      >
        <LayoutGrid size={16} aria-hidden />
        Board
      </button>
      <button type="button" className="todo-btn todo-btn--ghost flex-1 text-xs" onClick={onOpenInspector}>
        <MoreHorizontal size={16} aria-hidden />
        Details
      </button>
    </nav>
  );
}
