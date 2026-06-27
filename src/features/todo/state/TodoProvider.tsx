"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePersistentToolState } from "@/features/tools/hooks/usePersistentToolState";
import { copyTextToClipboard } from "@/lib/copy-to-clipboard";
import { RECENT_TEMPLATES_KEY, TODO_UI_STORAGE_KEY } from "../domain/constants";
import { filterBySidebar, getRolloverCandidates } from "../domain/filters";
import { sortTasks } from "../domain/sorting";
import { fromDateInputValue, toggleCompleted, moveTaskToStatus } from "../domain/taskRules";
import type { SidebarFilter, SortMode, Task, TaskStatus, TodoList, TodoUiPrefs, TodoView } from "../domain/types";
import {
  importTodoJson,
  exportTodoJson,
  exportListJson,
  summarizeImportJson,
  buildMarkdown,
  buildPlainText,
  type ImportMode,
  type ImportResult,
  type ImportSummary,
} from "../data/importExport";
import { SEED_TEMPLATES, getTemplateById } from "../data/seedTemplates";
import { createList, duplicateListWithTasks, getAllLists } from "../data/repositories/listsRepository";
import {
  bulkSetCompleted,
  createTask,
  deleteCompletedInList,
  deleteTask,
  duplicateTask,
  getAllColumns,
  getAllTasks,
  getSubtasks,
  moveTaskToColumn,
  reorderTasksInList,
  updateTask,
} from "../data/repositories/tasksRepository";
import { seedDatabaseIfEmpty } from "../data/todoDb";

const DEFAULT_UI: TodoUiPrefs = {
  activeFilter: "today",
  activeListId: null,
  activeView: "list",
  sortBy: "manual",
  searchQuery: "",
  selectedTag: null,
  inspectorOpen: false,
  selectedTaskId: null,
  sidebarCollapsed: false,
  rolloverDismissedAt: null,
};

type UndoEntry = { task: Task; subtasks: Task[] };

type TodoContextValue = {
  ready: boolean;
  lists: TodoList[];
  tasks: Task[];
  columns: Awaited<ReturnType<typeof getAllColumns>>;
  ui: TodoUiPrefs;
  setUi: (patch: Partial<TodoUiPrefs> | ((prev: TodoUiPrefs) => Partial<TodoUiPrefs>)) => void;
  visibleTasks: Task[];
  allTags: string[];
  selectedTask: Task | null;
  subtasks: Task[];
  rolloverCount: number;
  rolloverCandidates: Task[];
  showRollover: boolean;
  refresh: () => Promise<void>;
  tasksForList: (listId: string) => Task[];
  addTask: (title: string, opts?: Partial<Task> & { select?: boolean }) => Promise<Task | null>;
  saveTask: (id: string, patch: Partial<Task>) => Promise<void>;
  removeTask: (id: string) => Promise<void>;
  undoDelete: () => Promise<void>;
  canUndo: boolean;
  toggleComplete: (id: string) => Promise<void>;
  duplicateTaskById: (id: string) => Promise<void>;
  setTaskStatus: (id: string, status: TaskStatus) => Promise<void>;
  reorderVisible: (orderedIds: string[]) => Promise<void>;
  moveToColumn: (taskId: string, status: TaskStatus, columnTaskIds: string[]) => Promise<void>;
  moveTaskToDay: (taskId: string, dayValue: string | null) => Promise<void>;
  moveTasksToToday: (ids: string[]) => Promise<void>;
  clearCompleted: (listId: string) => Promise<number>;
  duplicateList: (listId: string) => Promise<void>;
  resetChecklist: (listId: string) => Promise<void>;
  completeAllInList: (listId: string) => Promise<void>;
  applyTemplate: (templateId: string) => Promise<void>;
  recentTemplateIds: string[];
  exportData: () => Promise<string>;
  exportListData: (listId: string) => Promise<string>;
  importData: (json: string, mode?: ImportMode) => Promise<ImportResult>;
  summarizeImport: (json: string) => ImportSummary;
  copyAsMarkdown: () => Promise<boolean>;
  copyAsPlainText: () => Promise<boolean>;
  copyListText: (listId: string, format: "md" | "txt") => Promise<boolean>;
  rolloverMoveToToday: () => Promise<void>;
  rolloverKeepOverdue: () => void;
  rolloverReview: () => void;
};

const TodoContext = createContext<TodoContextValue | null>(null);

export function TodoProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [lists, setLists] = useState<TodoList[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [columns, setColumns] = useState<Awaited<ReturnType<typeof getAllColumns>>>([]);
  const [subtasks, setSubtasks] = useState<Task[]>([]);
  const undoRef = useRef<UndoEntry | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [recentTemplateIds, setRecentTemplateIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(RECENT_TEMPLATES_KEY);
      if (raw) setRecentTemplateIds(JSON.parse(raw) as string[]);
    } catch {
      // ignore storage failures
    }
  }, []);

  const [ui, setUiState] = usePersistentToolState<TodoUiPrefs>(TODO_UI_STORAGE_KEY, DEFAULT_UI, {
    version: 1,
    debounceMs: 300,
  });

  const setUi = useCallback(
    (patch: Partial<TodoUiPrefs> | ((prev: TodoUiPrefs) => Partial<TodoUiPrefs>)) => {
      setUiState((prev) => ({ ...prev, ...(typeof patch === "function" ? patch(prev) : patch) }));
    },
    [setUiState],
  );

  const refresh = useCallback(async () => {
    await seedDatabaseIfEmpty();
    const [l, t, c] = await Promise.all([getAllLists(), getAllTasks(), getAllColumns()]);
    setLists(l);
    setTasks(t);
    setColumns(c);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      await refresh();
      if (active) setReady(true);
    })();
    return () => {
      active = false;
    };
  }, [refresh]);

  const activeListId = ui.activeListId ?? lists[0]?.id ?? "list-today";

  const visibleTasks = useMemo(() => {
    const filtered = filterBySidebar(tasks, ui.activeFilter, {
      listId: ui.activeFilter === "all" ? ui.activeListId : null,
      tag: ui.selectedTag,
      search: ui.searchQuery,
    });
    return sortTasks(filtered, ui.sortBy);
  }, [tasks, ui.activeFilter, ui.activeListId, ui.selectedTag, ui.searchQuery, ui.sortBy]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => t.tags.forEach((tag) => tag.trim() && set.add(tag.trim())));
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [tasks]);

  const selectedTask = useMemo(
    () => (ui.selectedTaskId ? tasks.find((t) => t.id === ui.selectedTaskId) ?? null : null),
    [tasks, ui.selectedTaskId],
  );

  useEffect(() => {
    if (!selectedTask) {
      setSubtasks([]);
      return;
    }
    getSubtasks(selectedTask.id).then(setSubtasks);
  }, [selectedTask, tasks]);

  const rolloverCandidates = useMemo(() => getRolloverCandidates(tasks), [tasks]);
  const rolloverCount = rolloverCandidates.length;
  const showRollover =
    rolloverCount > 0 &&
    ui.activeFilter !== "overdue" &&
    (!ui.rolloverDismissedAt || ui.rolloverDismissedAt.slice(0, 10) !== new Date().toISOString().slice(0, 10));

  const addTask = useCallback(
    async (title: string, opts: Partial<Task> & { select?: boolean } = {}) => {
      const listId = opts.listId ?? activeListId;
      const created = await createTask({
        listId,
        title,
        description: opts.description,
        status: opts.status,
        priority: opts.priority,
        dueAt: opts.dueAt,
        tags: opts.tags,
        parentTaskId: opts.parentTaskId,
        section: opts.section,
        estimateMinutes: opts.estimateMinutes,
        source: opts.source,
      });
      if (created) {
        setTasks((prev) => [...prev, created]);
        // Default: select top-level tasks (so the inspector opens). Subtasks pass
        // select:false so adding one doesn't navigate away from the parent.
        const shouldSelect = opts.select ?? !created.parentTaskId;
        if (shouldSelect) setUi({ selectedTaskId: created.id, inspectorOpen: true });
      }
      return created;
    },
    [activeListId, setUi],
  );

  const saveTask = useCallback(async (id: string, patch: Partial<Task>) => {
    const updated = await updateTask(id, patch);
    if (updated) {
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    }
  }, []);

  const removeTask = useCallback(
    async (id: string) => {
      const removed = await deleteTask(id);
      if (!removed) return;
      const subs = await getSubtasks(id);
      undoRef.current = { task: removed, subtasks: subs };
      setCanUndo(true);
      setTasks((prev) => prev.filter((t) => t.id !== id && t.parentTaskId !== id));
      if (ui.selectedTaskId === id) {
        setUi({ selectedTaskId: null, inspectorOpen: false });
      }
      window.setTimeout(() => {
        undoRef.current = null;
        setCanUndo(false);
      }, 8000);
    },
    [setUi, ui.selectedTaskId],
  );

  const undoDelete = useCallback(async () => {
    const entry = undoRef.current;
    if (!entry) return;
    const { task, subtasks: subs } = entry;
    await updateTask(task.id, task);
    for (const sub of subs) {
      await createTask({
        listId: sub.listId,
        title: sub.title,
        description: sub.description,
        status: sub.status,
        priority: sub.priority,
        dueAt: sub.dueAt,
        tags: sub.tags,
        parentTaskId: task.id,
        source: sub.source,
      });
    }
    undoRef.current = null;
    setCanUndo(false);
    await refresh();
  }, [refresh]);

  const toggleComplete = useCallback(async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const patch = toggleCompleted(task);
    await saveTask(id, patch);
  }, [tasks, saveTask]);

  const duplicateTaskById = useCallback(
    async (id: string) => {
      const copy = await duplicateTask(id);
      if (copy) {
        await refresh();
        setUi({ selectedTaskId: copy.id, inspectorOpen: true });
      }
    },
    [refresh, setUi],
  );

  const setTaskStatus = useCallback(
    async (id: string, status: TaskStatus) => {
      const task = tasks.find((t) => t.id === id);
      if (!task) return;
      const patch = moveTaskToStatus(task, status);
      await saveTask(id, patch);
    },
    [tasks, saveTask],
  );

  const reorderVisible = useCallback(async (orderedIds: string[]) => {
    await reorderTasksInList(orderedIds);
    setTasks((prev) => {
      const map = new Map(prev.map((t) => [t.id, t]));
      return orderedIds
        .map((id, index) => {
          const t = map.get(id);
          return t ? { ...t, order: index } : null;
        })
        .filter(Boolean)
        .concat(prev.filter((t) => !orderedIds.includes(t.id))) as Task[];
    });
  }, []);

  const moveToColumn = useCallback(
    async (taskId: string, status: TaskStatus, columnTaskIds: string[]) => {
      const order = columnTaskIds.includes(taskId) ? columnTaskIds : [...columnTaskIds, taskId];
      const updated = await moveTaskToColumn(taskId, status, order);
      if (!updated) return;
      // Apply the new status and the full column ordering to local state in one
      // pass so the board reflects the drop immediately without a refresh flicker.
      const orderMap = new Map(order.map((id, index) => [id, index]));
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === taskId) return { ...updated, order: orderMap.get(taskId) ?? updated.order };
          if (orderMap.has(t.id)) return { ...t, order: orderMap.get(t.id) as number };
          return t;
        }),
      );
    },
    [],
  );

  const tasksForList = useCallback(
    (listId: string) => tasks.filter((t) => t.listId === listId),
    [tasks],
  );

  const moveTaskToDay = useCallback(
    async (taskId: string, dayValue: string | null) => {
      const dueAt = dayValue ? fromDateInputValue(dayValue) : undefined;
      await saveTask(taskId, { dueAt });
    },
    [saveTask],
  );

  const moveTasksToToday = useCallback(
    async (ids: string[]) => {
      const today = new Date().toISOString();
      for (const id of ids) {
        await saveTask(id, { dueAt: today });
      }
    },
    [saveTask],
  );

  const clearCompleted = useCallback(
    async (listId: string) => {
      const removed = await deleteCompletedInList(listId);
      if (removed > 0) {
        setTasks((prev) => prev.filter((t) => !(t.listId === listId && t.completed)));
      }
      return removed;
    },
    [],
  );

  const duplicateList = useCallback(
    async (listId: string) => {
      const newList = await duplicateListWithTasks(listId);
      if (!newList) return;
      await refresh();
      setUi({ activeListId: newList.id, activeFilter: "all", selectedTaskId: null, inspectorOpen: false });
    },
    [refresh, setUi],
  );

  const resetChecklist = useCallback(
    async (listId: string) => {
      const ids = tasks.filter((t) => t.listId === listId).map((t) => t.id);
      await bulkSetCompleted(ids, false);
      await refresh();
    },
    [tasks, refresh],
  );

  const completeAllInList = useCallback(
    async (listId: string) => {
      const ids = tasks.filter((t) => t.listId === listId).map((t) => t.id);
      await bulkSetCompleted(ids, true);
      await refresh();
    },
    [tasks, refresh],
  );

  const recordRecentTemplate = useCallback((templateId: string) => {
    setRecentTemplateIds((prev) => {
      const next = [templateId, ...prev.filter((id) => id !== templateId)].slice(0, 6);
      try {
        window.localStorage.setItem(RECENT_TEMPLATES_KEY, JSON.stringify(next));
      } catch {
        // ignore storage failures
      }
      return next;
    });
  }, []);

  const applyTemplate = useCallback(
    async (templateId: string) => {
      const template = getTemplateById(templateId) ?? SEED_TEMPLATES.find((t) => t.id === templateId);
      if (!template) return;

      const list = await createList({
        name: template.name,
        type: template.listType,
        color: template.color,
        defaultView: template.defaultView,
      });

      for (let i = 0; i < template.tasks.length; i++) {
        const tt = template.tasks[i];
        const dueAt =
          typeof tt.dueOffsetDays === "number"
            ? (() => {
                const d = new Date();
                d.setHours(12, 0, 0, 0);
                d.setDate(d.getDate() + (tt.dueOffsetDays as number));
                return d.toISOString();
              })()
            : undefined;
        await createTask({
          listId: list.id,
          title: tt.title,
          description: tt.description,
          priority: tt.priority,
          tags: tt.tags,
          status: tt.status,
          section: tt.section,
          dueAt,
          order: i,
          source: "template",
        });
      }

      recordRecentTemplate(template.id);
      await refresh();
      setUi({
        activeListId: list.id,
        activeFilter: "all",
        activeView: template.defaultView,
        selectedTaskId: null,
        inspectorOpen: false,
      });
    },
    [refresh, setUi, recordRecentTemplate],
  );

  const exportData = useCallback(() => exportTodoJson(), []);
  const exportListData = useCallback((listId: string) => exportListJson(listId), []);

  const importData = useCallback(
    async (json: string, mode: ImportMode = "replace") => {
      const result = await importTodoJson(json, mode);
      if (result.ok) await refresh();
      return result;
    },
    [refresh],
  );

  const summarizeImport = useCallback((json: string) => summarizeImportJson(json, lists, tasks), [lists, tasks]);

  const copyAsMarkdown = useCallback(async () => {
    const list = lists.find((l) => l.id === activeListId);
    return copyTextToClipboard(buildMarkdown(visibleTasks, tasks, { title: list?.name }));
  }, [visibleTasks, tasks, lists, activeListId]);

  const copyAsPlainText = useCallback(async () => {
    const list = lists.find((l) => l.id === activeListId);
    return copyTextToClipboard(buildPlainText(visibleTasks, tasks, { title: list?.name }));
  }, [visibleTasks, tasks, lists, activeListId]);

  const copyListText = useCallback(
    async (listId: string, format: "md" | "txt") => {
      const list = lists.find((l) => l.id === listId);
      const listTasks = tasks.filter((t) => t.listId === listId);
      const text =
        format === "md"
          ? buildMarkdown(listTasks, tasks, { title: list?.name })
          : buildPlainText(listTasks, tasks, { title: list?.name });
      return copyTextToClipboard(text);
    },
    [lists, tasks],
  );

  const rolloverMoveToToday = useCallback(async () => {
    const today = new Date().toISOString();
    for (const task of rolloverCandidates) {
      await saveTask(task.id, { dueAt: today, listId: "list-today" });
    }
    setUi({ activeFilter: "today", activeListId: "list-today", rolloverDismissedAt: new Date().toISOString() });
  }, [rolloverCandidates, saveTask, setUi]);

  const rolloverKeepOverdue = useCallback(() => {
    setUi({ rolloverDismissedAt: new Date().toISOString() });
  }, [setUi]);

  const rolloverReview = useCallback(() => {
    setUi({ activeFilter: "overdue", rolloverDismissedAt: new Date().toISOString() });
  }, [setUi]);

  const value: TodoContextValue = {
    ready,
    lists,
    tasks,
    columns,
    ui,
    setUi,
    visibleTasks,
    allTags,
    selectedTask,
    subtasks,
    rolloverCount,
    rolloverCandidates,
    showRollover,
    refresh,
    tasksForList,
    addTask,
    saveTask,
    removeTask,
    undoDelete,
    canUndo,
    toggleComplete,
    duplicateTaskById,
    setTaskStatus,
    reorderVisible,
    moveToColumn,
    moveTaskToDay,
    moveTasksToToday,
    clearCompleted,
    duplicateList,
    resetChecklist,
    completeAllInList,
    applyTemplate,
    recentTemplateIds,
    exportData,
    exportListData,
    importData,
    summarizeImport,
    copyAsMarkdown,
    copyAsPlainText,
    copyListText,
    rolloverMoveToToday,
    rolloverKeepOverdue,
    rolloverReview,
  };

  return <TodoContext.Provider value={value}>{children}</TodoContext.Provider>;
}

export function useTodo(): TodoContextValue {
  const ctx = useContext(TodoContext);
  if (!ctx) throw new Error("useTodo must be used within TodoProvider");
  return ctx;
}

export function useActiveListId(): string {
  const { lists, ui } = useTodo();
  return ui.activeListId ?? lists[0]?.id ?? "list-today";
}

export type { SidebarFilter, SortMode, TodoView };
