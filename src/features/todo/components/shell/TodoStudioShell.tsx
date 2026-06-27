"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { QuickCapture } from "../capture/QuickCapture";
import { RolloverBanner } from "../RolloverBanner";
import { BoardView } from "../views/BoardView";
import { ListView } from "../views/ListView";
import { TableView } from "../views/TableView";
import { WeekView } from "../views/WeekView";
import { ChecklistView } from "../views/ChecklistView";
import { PrintView } from "../views/PrintView";
import { TodoInspector } from "./TodoInspector";
import { TodoMobileNav, TodoSidebar, TodoTopBar } from "./TodoSidebar";
import { TemplateGallery } from "../templates/TemplateGallery";
import { PlanTodayPanel } from "../planning/PlanTodayPanel";
import { BrainDumpPanel } from "../brain/BrainDumpPanel";
import { useTodo } from "../../state/TodoProvider";

export function TodoStudioShell() {
  const { ready, ui, setUi, showRollover } = useTodo();
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [mobileInspector, setMobileInspector] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [brainOpen, setBrainOpen] = useState(false);

  useEffect(() => {
    function isTypingTarget(target: EventTarget | null): boolean {
      const el = target as HTMLElement | null;
      if (!el) return false;
      return ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName) || Boolean(el.closest("[contenteditable='true']"));
    }
    function onKey(e: KeyboardEvent) {
      if (isTypingTarget(e.target)) return;
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        document.querySelector<HTMLInputElement>("input[aria-label='Quick capture task title']")?.focus();
      }
      if (e.key === "/") {
        e.preventDefault();
        document.getElementById("todo-search-input")?.focus();
      }
      if (e.key === "Escape") {
        setGalleryOpen(false);
        setPlanOpen(false);
        setBrainOpen(false);
        setMobileSidebar(false);
        setMobileInspector(false);
        setUi({ inspectorOpen: false });
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [setUi]);

  if (!ready) {
    return (
      <div className="todo-studio flex min-h-[560px] items-center justify-center">
        <p className="todo-muted text-sm">Loading your tasks…</p>
      </div>
    );
  }

  const inspectorOpen = ui.inspectorOpen || mobileInspector;

  return (
    <div className="todo-studio">
      <TodoTopBar
        onOpenTemplates={() => setGalleryOpen(true)}
        onOpenPlanToday={() => setPlanOpen(true)}
        onOpenBrainDump={() => setBrainOpen(true)}
      />

      {showRollover && <RolloverBanner />}

      <div
        className={cn(
          "todo-studio__layout",
          !inspectorOpen && "todo-studio__layout--no-inspector",
        )}
      >
        <TodoSidebar mobileOpen={mobileSidebar} onCloseMobile={() => setMobileSidebar(false)} />

        <main className="todo-panel flex min-w-0 flex-col border-x">
          <QuickCapture />
          <div className="min-h-0 flex-1 overflow-auto">
            {ui.activeView === "list" && <ListView />}
            {ui.activeView === "board" && <BoardView />}
            {ui.activeView === "table" && <TableView />}
            {(ui.activeView === "week" || ui.activeView === "calendar") && <WeekView />}
            {ui.activeView === "checklist" && <ChecklistView />}
            {ui.activeView === "print" && <PrintView />}
          </div>
        </main>

        <TodoInspector
          mobileOpen={mobileInspector}
          onCloseMobile={() => {
            setMobileInspector(false);
            setUi({ inspectorOpen: false });
          }}
        />
      </div>

      <TodoMobileNav
        onOpenSidebar={() => setMobileSidebar(true)}
        onOpenInspector={() => {
          setMobileInspector(true);
          setUi({ inspectorOpen: true });
        }}
      />

      <TemplateGallery open={galleryOpen} onClose={() => setGalleryOpen(false)} />
      <PlanTodayPanel open={planOpen} onClose={() => setPlanOpen(false)} />
      <BrainDumpPanel open={brainOpen} onClose={() => setBrainOpen(false)} />

      {(mobileSidebar || mobileInspector) && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          aria-label="Close panel overlay"
          onClick={() => {
            setMobileSidebar(false);
            setMobileInspector(false);
            setUi({ inspectorOpen: false });
          }}
        />
      )}
    </div>
  );
}
