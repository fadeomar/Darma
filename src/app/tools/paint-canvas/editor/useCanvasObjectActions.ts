"use client";

import { useCallback, type RefObject } from "react";
import type { Canvas as FabricCanvas, FabricObject } from "fabric";
import type { PaintTool } from "../types";
import {
  applyObjectLockState,
  ensureObjectMetadata,
  findCanvasObject,
  getObjectLabel,
  refreshClonedObjectMetadata,
  type FabricRuntime,
  type PaintFabricObject,
} from "./fabricHelpers";
import {
  alignmentDeltas,
  distributionDeltas,
  type AlignAction,
  type DistributeAction,
  type FlipAxis,
  type LayoutDelta,
} from "./objectLayout";

function setCanvasSelection(
  canvas: FabricCanvas,
  fabric: FabricRuntime,
  objects: FabricObject[],
): void {
  canvas.discardActiveObject();
  if (objects.length === 1) {
    canvas.setActiveObject(objects[0]);
  } else if (objects.length > 1) {
    canvas.setActiveObject(new fabric.ActiveSelection(objects, {
      canvas,
      snapAngle: 15,
      snapThreshold: 4,
      touchCornerSize: 36,
      cornerSize: 12,
      padding: 4,
    }));
  }
  canvas.requestRenderAll();
}

function moveObjectsByDeltas(
  objects: FabricObject[],
  deltas: LayoutDelta[],
  fabric: FabricRuntime,
): void {
  objects.forEach((object, index) => {
    const delta = deltas[index] ?? { x: 0, y: 0 };
    if (delta.x === 0 && delta.y === 0) return;
    const center = object.getCenterPoint();
    object.setXY(new fabric.Point(center.x + delta.x, center.y + delta.y), "center", "center");
    object.setCoords();
  });
}

export function useCanvasObjectActions({
  canvasRef,
  fabricRef,
  recordHistory,
  syncSelection,
  syncObjects,
  selectTool,
  setStatus,
}: {
  canvasRef: RefObject<FabricCanvas | null>;
  fabricRef: RefObject<FabricRuntime | null>;
  recordHistory: () => void;
  syncSelection: () => void;
  syncObjects: () => void;
  selectTool: (tool: PaintTool) => void;
  setStatus: (status: string) => void;
}) {
  const deleteSelection = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const objects = canvas.getActiveObjects();
    if (objects.length === 0) return;
    canvas.discardActiveObject();
    objects.forEach((object) => canvas.remove(object));
    canvas.requestRenderAll();
    recordHistory();
    syncSelection();
    setStatus(`Deleted ${objects.length === 1 ? "the selected object" : `${objects.length} selected objects`}.`);
  }, [canvasRef, recordHistory, setStatus, syncSelection]);

  const duplicateSelection = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const activeObjects = canvas.getActiveObjects();
    const active = canvas.getActiveObject();
    if (!active || activeObjects.length !== 1) {
      if (activeObjects.length > 1) setStatus("Group the objects first if you want to duplicate them together.");
      return;
    }
    const clone = await active.clone();
    clone.set({ left: (active.left ?? 0) + 24, top: (active.top ?? 0) + 24 });
    const metadata = clone as PaintFabricObject;
    metadata.paintLocked = false;
    refreshClonedObjectMetadata(clone, `${getObjectLabel(active)} copy`);
    applyObjectLockState(clone);
    canvas.discardActiveObject();
    canvas.add(clone);
    canvas.setActiveObject(clone);
    canvas.requestRenderAll();
    recordHistory();
    syncSelection();
    setStatus("Duplicated the selection.");
  }, [canvasRef, recordHistory, setStatus, syncSelection]);

  const bringToFront = useCallback(() => {
    const canvas = canvasRef.current;
    const active = canvas?.getActiveObject();
    if (!canvas || !active || canvas.getActiveObjects().length !== 1) return;
    if (canvas.bringObjectToFront(active)) {
      canvas.requestRenderAll();
      recordHistory();
      syncObjects();
      setStatus("Moved the selection to the front.");
    }
  }, [canvasRef, recordHistory, setStatus, syncObjects]);

  const sendToBack = useCallback(() => {
    const canvas = canvasRef.current;
    const active = canvas?.getActiveObject();
    if (!canvas || !active || canvas.getActiveObjects().length !== 1) return;
    if (canvas.sendObjectToBack(active)) {
      canvas.requestRenderAll();
      recordHistory();
      syncObjects();
      setStatus("Moved the selection to the back.");
    }
  }, [canvasRef, recordHistory, setStatus, syncObjects]);

  const selectObject = useCallback((id: string) => {
    const canvas = canvasRef.current;
    const object = canvas ? findCanvasObject(canvas, id) : undefined;
    if (!canvas || !object || object.visible === false) return;
    if (object.paintLocked) {
      setStatus("Unlock that object before selecting or editing it.");
      return;
    }
    canvas.setActiveObject(object);
    canvas.requestRenderAll();
    syncSelection();
    selectTool("select");
  }, [canvasRef, selectTool, setStatus, syncSelection]);

  const toggleObjectSelection = useCallback((id: string) => {
    const canvas = canvasRef.current;
    const fabric = fabricRef.current;
    const object = canvas ? findCanvasObject(canvas, id) : undefined;
    if (!canvas || !fabric || !object || object.visible === false) return;
    if (object.paintLocked) {
      setStatus("Unlock that object before adding it to a selection.");
      return;
    }
    const current = canvas.getActiveObjects();
    const alreadySelected = current.includes(object);
    const next = alreadySelected
      ? current.filter((candidate) => candidate !== object)
      : [...current, object];
    setCanvasSelection(canvas, fabric, next);
    syncSelection();
    selectTool("select");
    setStatus(alreadySelected ? "Removed the object from the selection." : "Added the object to the selection.");
  }, [canvasRef, fabricRef, selectTool, setStatus, syncSelection]);

  const selectAll = useCallback(() => {
    const canvas = canvasRef.current;
    const fabric = fabricRef.current;
    if (!canvas || !fabric) return;
    const eligible = canvas.getObjects().filter((object) => {
      const metadata = object as PaintFabricObject;
      return object.visible !== false && !metadata.paintLocked;
    });
    if (eligible.length === 0) {
      setStatus("There are no visible unlocked objects to select.");
      return;
    }
    setCanvasSelection(canvas, fabric, eligible);
    syncSelection();
    selectTool("select");
    setStatus(eligible.length === 1 ? "Selected the only editable object." : `Selected all ${eligible.length} editable objects.`);
  }, [canvasRef, fabricRef, selectTool, setStatus, syncSelection]);

  const groupSelection = useCallback(() => {
    const canvas = canvasRef.current;
    const fabric = fabricRef.current;
    const active = canvas?.getActiveObject();
    if (!canvas || !fabric || !(active instanceof fabric.ActiveSelection)) {
      setStatus("Select at least two objects before grouping.");
      return;
    }
    const members = active.removeAll();
    if (members.length < 2) return;
    canvas.discardActiveObject();
    // An ActiveSelection keeps its members on the canvas, so they have to be removed
    // before the Group takes ownership or the document would hold both copies.
    canvas.remove(...members);
    const group = new fabric.Group(members);
    ensureObjectMetadata(group, `Group (${members.length})`);
    applyObjectLockState(group);
    canvas.add(group);
    canvas.setActiveObject(group);
    canvas.requestRenderAll();
    recordHistory();
    syncSelection();
    setStatus(`Grouped ${members.length} objects.`);
  }, [canvasRef, fabricRef, recordHistory, setStatus, syncSelection]);

  const ungroupSelection = useCallback(() => {
    const canvas = canvasRef.current;
    const fabric = fabricRef.current;
    const active = canvas?.getActiveObject();
    if (!canvas || !fabric || !(active instanceof fabric.Group)) {
      setStatus("Select a group to ungroup it.");
      return;
    }
    canvas.remove(active);
    const members = active.removeAll();
    // Group.removeAll() detaches the members from the canvas too, so they have to be
    // re-added or the ungrouped objects would vanish from the document.
    canvas.add(...members);
    members.forEach((object) => {
      ensureObjectMetadata(object);
      applyObjectLockState(object);
      object.setCoords();
    });
    setCanvasSelection(canvas, fabric, members);
    recordHistory();
    syncSelection();
    setStatus(`Ungrouped ${members.length} objects.`);
  }, [canvasRef, fabricRef, recordHistory, setStatus, syncSelection]);

  const renameObject = useCallback((id: string, name: string) => {
    const canvas = canvasRef.current;
    const object = canvas ? findCanvasObject(canvas, id) : undefined;
    if (!canvas || !object) return;
    object.paintName = name.trim() || getObjectLabel(object);
    recordHistory();
    syncSelection();
    setStatus("Renamed the object.");
  }, [canvasRef, recordHistory, setStatus, syncSelection]);

  const toggleObjectVisibility = useCallback((id: string) => {
    const canvas = canvasRef.current;
    const object = canvas ? findCanvasObject(canvas, id) : undefined;
    if (!canvas || !object) return;
    object.set("visible", object.visible === false);
    applyObjectLockState(object);
    if (object.visible === false && canvas.getActiveObjects().includes(object)) canvas.discardActiveObject();
    canvas.requestRenderAll();
    recordHistory();
    syncSelection();
  }, [canvasRef, recordHistory, syncSelection]);

  const toggleObjectLock = useCallback((id: string) => {
    const canvas = canvasRef.current;
    const object = canvas ? findCanvasObject(canvas, id) : undefined;
    if (!canvas || !object) return;
    object.paintLocked = !object.paintLocked;
    applyObjectLockState(object);
    if (object.paintLocked && canvas.getActiveObjects().includes(object)) canvas.discardActiveObject();
    canvas.requestRenderAll();
    recordHistory();
    syncSelection();
  }, [canvasRef, recordHistory, syncSelection]);

  const moveObject = useCallback((id: string, direction: "up" | "down") => {
    const canvas = canvasRef.current;
    const object = canvas ? findCanvasObject(canvas, id) : undefined;
    if (!canvas || !object) return;
    const changed = direction === "up" ? canvas.bringObjectForward(object) : canvas.sendObjectBackwards(object);
    if (!changed) return;
    canvas.requestRenderAll();
    recordHistory();
    syncObjects();
  }, [canvasRef, recordHistory, syncObjects]);

  const updateSelectedObject = useCallback((patch: { opacity?: number; angle?: number }) => {
    const canvas = canvasRef.current;
    const active = canvas?.getActiveObject();
    if (!canvas || !active || canvas.getActiveObjects().length !== 1) return;
    active.set(patch);
    active.setCoords();
    canvas.requestRenderAll();
    recordHistory();
    syncSelection();
  }, [canvasRef, recordHistory, syncSelection]);

  const alignSelection = useCallback((action: AlignAction) => {
    const canvas = canvasRef.current;
    const fabric = fabricRef.current;
    if (!canvas || !fabric) return;
    const objects = canvas.getActiveObjects();
    if (objects.length < 2) {
      setStatus("Select at least two objects to align them.");
      return;
    }
    canvas.discardActiveObject();
    objects.forEach((object) => object.setCoords());
    const rects = objects.map((object) => object.getBoundingRect());
    moveObjectsByDeltas(objects, alignmentDeltas(rects, action), fabric);
    setCanvasSelection(canvas, fabric, objects);
    recordHistory();
    syncSelection();
    setStatus("Aligned the selected objects.");
  }, [canvasRef, fabricRef, recordHistory, setStatus, syncSelection]);

  const distributeSelection = useCallback((action: DistributeAction) => {
    const canvas = canvasRef.current;
    const fabric = fabricRef.current;
    if (!canvas || !fabric) return;
    const objects = canvas.getActiveObjects();
    if (objects.length < 3) {
      setStatus("Select at least three objects to distribute them evenly.");
      return;
    }
    canvas.discardActiveObject();
    objects.forEach((object) => object.setCoords());
    const rects = objects.map((object) => object.getBoundingRect());
    moveObjectsByDeltas(objects, distributionDeltas(rects, action), fabric);
    setCanvasSelection(canvas, fabric, objects);
    recordHistory();
    syncSelection();
    setStatus(action === "horizontal" ? "Distributed the selection horizontally." : "Distributed the selection vertically.");
  }, [canvasRef, fabricRef, recordHistory, setStatus, syncSelection]);

  const flipSelection = useCallback((axis: FlipAxis) => {
    const canvas = canvasRef.current;
    const active = canvas?.getActiveObject();
    if (!canvas || !active) return;
    if (canvas.getActiveObjects().length !== 1) {
      setStatus("Group multiple objects before flipping them together.");
      return;
    }
    if (axis === "horizontal") active.set("flipX", !active.flipX);
    else active.set("flipY", !active.flipY);
    active.setCoords();
    canvas.requestRenderAll();
    recordHistory();
    syncSelection();
    setStatus(axis === "horizontal" ? "Flipped the selection horizontally." : "Flipped the selection vertically.");
  }, [canvasRef, recordHistory, setStatus, syncSelection]);

  const nudgeSelection = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current;
    const fabric = fabricRef.current;
    if (!canvas || !fabric) return;
    const objects = canvas.getActiveObjects();
    if (objects.length === 0) return;
    canvas.discardActiveObject();
    moveObjectsByDeltas(objects, objects.map(() => ({ x, y })), fabric);
    setCanvasSelection(canvas, fabric, objects);
    recordHistory();
    syncSelection();
  }, [canvasRef, fabricRef, recordHistory, syncSelection]);

  return {
    deleteSelection,
    duplicateSelection,
    bringToFront,
    sendToBack,
    selectObject,
    toggleObjectSelection,
    selectAll,
    groupSelection,
    ungroupSelection,
    renameObject,
    toggleObjectVisibility,
    toggleObjectLock,
    moveObject,
    updateSelectedObject,
    alignSelection,
    distributeSelection,
    flipSelection,
    nudgeSelection,
  };
}
