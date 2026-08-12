"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui";
import ArrangePanel from "./components/ArrangePanel";
import BackgroundPanel from "./components/BackgroundPanel";
import CanvasSizePanel from "./components/CanvasSizePanel";
import CanvasStage from "./components/CanvasStage";
import ObjectsPanel from "./components/ObjectsPanel";
import PropertiesPanel from "./components/PropertiesPanel";
import SelectionPanel from "./components/SelectionPanel";
import ToolRail from "./components/ToolRail";
import TopBar from "./components/TopBar";
import { usePaintEditor } from "./editor/usePaintEditor";

export default function PaintCanvasClient() {
  const editor = usePaintEditor();
  // Destructured so the render body never reads ref properties off the hook result.
  const { workspaceRef, fileInputRef, projectInputRef, canvasElementRef, viewportRef } = editor;

  return (
    <div ref={workspaceRef} className="flex flex-col gap-4 outline-none" tabIndex={-1} onPointerDown={() => workspaceRef.current?.focus({ preventScroll: true })}>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={editor.handleFileInput} className="sr-only" />
      <input ref={projectInputRef} type="file" accept="application/json,.json" onChange={editor.handleProjectInput} className="sr-only" />

      <TopBar
        canUndo={editor.canUndo} canRedo={editor.canRedo} ready={editor.ready} exportFormat={editor.exportFormat} zoom={editor.zoom} saveState={editor.saveState}
        onExportFormatChange={editor.setExportFormat} onUndo={() => void editor.undo()} onRedo={() => void editor.redo()} onZoomOut={editor.zoomOut} onZoomIn={editor.zoomIn}
        onFit={editor.fitToViewport} onResetView={editor.resetView} onNew={editor.newDrawing} onOpenProject={editor.openProjectPicker} onSaveProject={editor.saveProject}
        onAddImage={editor.openImagePicker} onExport={editor.download}
      />

      {/* Stacks with flex instead of a `grid` class on purpose: the shared
          tool-workspace stylesheet force-fits any `.grid` with a `main` plus an
          `aside` child into two controls/result columns, which would drop the
          canvas below the tool rail. */}
      <div className="flex flex-col gap-4 xl:grid xl:grid-cols-[188px_minmax(0,1fr)_268px] xl:items-start">
        <ToolRail activeTool={editor.settings.tool} onToolChange={editor.selectTool} />
        <CanvasStage canvasRef={canvasElementRef} viewportRef={viewportRef} ready={editor.ready} status={editor.status} zoom={editor.zoom} background={editor.background} size={editor.canvasSize} settings={editor.settings} onDrop={editor.handleDrop} />
        <aside className="flex flex-col gap-4" data-tool-region="controls">
          <CanvasSizePanel size={editor.canvasSize} onResize={editor.resizeCanvas} />
          <PropertiesPanel settings={editor.settings} onChange={editor.updateSetting} onBrushPresetChange={editor.selectBrushPreset} />
          <BackgroundPanel background={editor.background} onChange={editor.setBackground} />
          <SelectionPanel
            selected={editor.selected}
            onDuplicate={() => void editor.duplicateSelection()}
            onDelete={editor.deleteSelection}
            onGroup={editor.groupSelection}
            onUngroup={editor.ungroupSelection}
            onFlipHorizontal={() => editor.flipSelection("horizontal")}
            onFlipVertical={() => editor.flipSelection("vertical")}
            onBringToFront={editor.bringToFront}
            onSendToBack={editor.sendToBack}
            onUpdate={editor.updateSelectedObject}
            onBlurImage={editor.blurSelectedImage}
            onPixelateImage={editor.pixelateSelectedImage}
            onResetImageEffects={editor.resetSelectedImageEffects}
          />
          <ArrangePanel count={editor.selected.count} onAlign={editor.alignSelection} onDistribute={editor.distributeSelection} />
          <ObjectsPanel objects={editor.objects} onSelect={editor.selectObject} onToggleSelection={editor.toggleObjectSelection} onSelectAll={editor.selectAll} onRename={editor.renameObject} onToggleVisibility={editor.toggleObjectVisibility} onToggleLock={editor.toggleObjectLock} onMove={editor.moveObject} />
          <Button size="sm" variant="ghost" leftIcon={<Trash2 className="h-4 w-4" />} onClick={editor.clearCanvas}>Clear canvas</Button>
        </aside>
      </div>

      <div role="status" aria-live="polite" className="sr-only">{editor.status}</div>
    </div>
  );
}
