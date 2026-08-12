"use client";

import { useEffect, type RefObject } from "react";
import type { Canvas as FabricCanvas, FabricObject } from "fabric";

export function usePaintShortcuts({
  workspaceRef,
  canvasRef,
  onPasteImage,
  undo,
  redo,
  duplicateSelection,
  deleteSelection,
  selectAll,
  nudgeSelection,
  zoomIn,
  zoomOut,
  resetView,
  syncSelection,
}: {
  workspaceRef: RefObject<HTMLDivElement | null>;
  canvasRef: RefObject<FabricCanvas | null>;
  onPasteImage: (file: File) => void;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  duplicateSelection: () => Promise<void>;
  deleteSelection: () => void;
  selectAll: () => void;
  nudgeSelection: (x: number, y: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  syncSelection: () => void;
}) {
  useEffect(() => {
    const workspaceIsActive = () => workspaceRef.current?.contains(document.activeElement) ?? false;

    const onPaste = (event: ClipboardEvent) => {
      if (!workspaceIsActive()) return;
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select, [contenteditable='true']")) return;
      const file = Array.from(event.clipboardData?.items ?? [])
        .find((item) => item.type.startsWith("image/"))
        ?.getAsFile();
      if (!file) return;
      event.preventDefault();
      onPasteImage(file);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const canvas = canvasRef.current;
      if (!canvas || !workspaceIsActive()) return;
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select, [contenteditable='true']")) return;
      const active = canvas.getActiveObject() as FabricObject & { isEditing?: boolean };
      if (active?.isEditing) return;
      const command = event.metaKey || event.ctrlKey;

      if (command && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) void redo();
        else void undo();
        return;
      }
      if (command && event.key.toLowerCase() === "a") {
        event.preventDefault();
        selectAll();
        return;
      }
      if (command && event.key.toLowerCase() === "d") {
        event.preventDefault();
        void duplicateSelection();
        return;
      }
      if (command && (event.key === "+" || event.key === "=")) {
        event.preventDefault();
        zoomIn();
        return;
      }
      if (command && event.key === "-") {
        event.preventDefault();
        zoomOut();
        return;
      }
      if (command && event.key === "0") {
        event.preventDefault();
        resetView();
        return;
      }
      if (!command && canvas.getActiveObjects().length > 0 && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
        event.preventDefault();
        const distance = event.shiftKey ? 10 : 1;
        if (event.key === "ArrowLeft") nudgeSelection(-distance, 0);
        if (event.key === "ArrowRight") nudgeSelection(distance, 0);
        if (event.key === "ArrowUp") nudgeSelection(0, -distance);
        if (event.key === "ArrowDown") nudgeSelection(0, distance);
        return;
      }
      if ((event.key === "Delete" || event.key === "Backspace") && canvas.getActiveObjects().length > 0) {
        event.preventDefault();
        deleteSelection();
        return;
      }
      if (event.key === "Escape") {
        canvas.discardActiveObject();
        canvas.requestRenderAll();
        syncSelection();
      }
    };

    window.addEventListener("paste", onPaste);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("paste", onPaste);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [canvasRef, deleteSelection, duplicateSelection, nudgeSelection, onPasteImage, redo, resetView, selectAll, syncSelection, undo, workspaceRef, zoomIn, zoomOut]);
}
