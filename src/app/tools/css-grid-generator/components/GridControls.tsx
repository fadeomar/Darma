import { useEffect, useState } from "react";
import { Button, Input, Select } from "@/components/ui";
import {
  ColorField,
  ControlGrid,
  ControlSection,
  NumberField,
  PresetGallery,
  SegmentedControl,
  SliderNumberField,
  ToolControlPanel,
} from "@/features/tools/components";
import { GRID_PRESETS } from "../presets";
import { createNestedGrid, createNestedGridItem, normalizeNestedGrid } from "../grid";
import {
  appendTrack,
  detectTrackKind,
  expandFixedTrackTemplate,
  getTrackPreset,
  readSimpleTrackNumber,
  removeTrackAt,
  resizeTrackTemplate,
  serializeTracks,
  updateTrackAt,
  type SimpleTrackKind,
  type TrackAxis,
} from "../tracks";
import type {
  GridAlignment,
  GridAutoFlow,
  GridBreakpoint,
  GridGeneratorState,
  GridItem,
  GridNestedGrid,
  GridNestedItem,
  GridPreset,
  GridSelfAlignment,
  ResponsiveSettings,
} from "../types";

const selfAlign: GridSelfAlignment[] = ["auto", "stretch", "start", "center", "end"];
const align: GridAlignment[] = ["stretch", "start", "center", "end", "space-between", "space-around", "space-evenly"];
const trackKinds: SimpleTrackKind[] = ["fr", "px", "%", "rem", "em", "auto", "minmax", "fit-content", "custom"];

export function GridControls({
  state,
  activeBreakpoint,
  activePreset,
  selectedItem,
  onPatch,
  onResponsivePatch,
  onBreakpointChange,
  onConfigureBreakpoint,
  onLoadPreset,
  onUpdateItem,
  onAddItem,
  onDuplicateItem,
  onDeleteItem,
  onImportCss,
  onCopyShareLink,
  onResetWorkspace,
}: {
  state: GridGeneratorState;
  activeBreakpoint: GridBreakpoint;
  activePreset: string;
  selectedItem: GridItem | null;
  onPatch: (patch: Partial<GridGeneratorState>) => void;
  onResponsivePatch: (patch: Partial<ResponsiveSettings>) => void;
  onBreakpointChange: (breakpoint: GridBreakpoint) => void;
  onConfigureBreakpoint: (
    breakpoint: Exclude<GridBreakpoint, "desktop">,
    strategy: "copy-desktop" | "copy-tablet" | "auto",
  ) => void;
  onLoadPreset: (preset: GridPreset) => void;
  onUpdateItem: (patch: Partial<GridItem>) => void;
  onAddItem: () => void;
  onDuplicateItem: () => void;
  onDeleteItem: () => void;
  onImportCss: (css: string) => { ok: boolean; message: string };
  onCopyShareLink: () => Promise<{ ok: boolean; message: string }>;
  onResetWorkspace: () => void;
}) {
  const [importCss, setImportCss] = useState("");
  const [workspaceMessage, setWorkspaceMessage] = useState("");
  const [resetArmed, setResetArmed] = useState(false);
  const [expandedNestedId, setExpandedNestedId] = useState<string | null>(null);
  const nestedItemIds = selectedItem?.nestedGrid?.items.map((item) => item.id).join("|") ?? "";

  useEffect(() => {
    setResetArmed(false);
  }, [activeBreakpoint, state]);

  useEffect(() => {
    const ids = nestedItemIds ? nestedItemIds.split("|") : [];
    if (!ids.length) {
      setExpandedNestedId(null);
      return;
    }
    if (!ids.includes(expandedNestedId ?? "")) {
      setExpandedNestedId(ids[0]);
    }
  }, [expandedNestedId, nestedItemIds]);

  async function copyShareLink() {
    setResetArmed(false);
    const result = await onCopyShareLink();
    setWorkspaceMessage(result.message);
  }

  function importWorkspaceCss() {
    setResetArmed(false);
    const result = onImportCss(importCss);
    setWorkspaceMessage(result.message);
    if (result.ok) setImportCss("");
  }

  function changeGapUnit(unit: GridGeneratorState["gap"]["unit"]) {
    if (unit === state.gap.unit) return;
    const factor = unit === "px" ? 16 : 1 / 16;
    const precision = unit === "px" ? 1 : 100;
    const convert = (value: number) =>
      Math.round(value * factor * precision) / precision;
    onPatch({
      gap: {
        row: convert(state.gap.row),
        column: convert(state.gap.column),
        unit,
      },
    });
  }

  function changeNestedGapUnit(unit: GridNestedGrid["gap"]["unit"]) {
    if (!selectedItem?.nestedGrid || unit === selectedItem.nestedGrid.gap.unit) return;
    const factor = unit === "px" ? 16 : 1 / 16;
    const precision = unit === "px" ? 1 : 100;
    const convert = (value: number) =>
      Math.round(value * factor * precision) / precision;
    patchNestedGrid({
      gap: {
        row: convert(selectedItem.nestedGrid.gap.row),
        column: convert(selectedItem.nestedGrid.gap.column),
        unit,
      },
    });
  }

  function patchNestedGrid(patch: Partial<GridNestedGrid>) {
    if (!selectedItem?.nestedGrid) return;
    onUpdateItem({
      nestedGrid: normalizeNestedGrid(selectedItem, {
        ...selectedItem.nestedGrid,
        ...patch,
      }),
    });
  }

  function updateNestedItem(id: string, patch: Partial<GridNestedItem>) {
    if (!selectedItem?.nestedGrid) return;
    patchNestedGrid({
      items: selectedItem.nestedGrid.items.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    });
  }

  function addNestedItem() {
    if (!selectedItem?.nestedGrid || selectedItem.nestedGrid.items.length >= 8) return;
    const nested = selectedItem.nestedGrid;
    let column = 1;
    let row = 1;
    outer: for (let rowIndex = 1; rowIndex <= nested.rows; rowIndex += 1) {
      for (let columnIndex = 1; columnIndex <= nested.columns; columnIndex += 1) {
        const occupied = nested.items.some(
          (item) =>
            columnIndex >= item.columnStart &&
            columnIndex < item.columnEnd &&
            rowIndex >= item.rowStart &&
            rowIndex < item.rowEnd,
        );
        if (!occupied) {
          column = columnIndex;
          row = rowIndex;
          break outer;
        }
      }
    }
    const number = nested.items.length + 1;
    const nextItem = createNestedGridItem({
      name: `Nested ${number}`,
      content: `Nested ${number}`,
      columnStart: column,
      columnEnd: column + 1,
      rowStart: row,
      rowEnd: row + 1,
    });
    patchNestedGrid({
      items: [...nested.items, nextItem],
    });
    setExpandedNestedId(nextItem.id);
  }

  function requestWorkspaceReset() {
    if (!resetArmed) {
      setResetArmed(true);
      setWorkspaceMessage(
        "Reset will replace the current workspace. Click Confirm reset to continue; Undo will still restore it afterward.",
      );
      return;
    }
    onResetWorkspace();
    setResetArmed(false);
    setWorkspaceMessage("Workspace reset. Use Undo to restore the previous layout.");
  }
  return (
    <ToolControlPanel
      title="Grid settings"
      description="Build a production-ready grid with visual tracks, named areas, responsive output, and exports."
      sticky={false}
    >
      <ControlSection title="Presets" description="Start from common production layout patterns.">
        <PresetGallery
          presets={GRID_PRESETS}
          selectedId={activePreset}
          onSelect={(_, preset) => onLoadPreset(preset)}
          getId={(preset) => preset.id}
          getLabel={(preset) => preset.name}
          getDescription={(preset) => preset.description}
          initialVisibleCount={6}
          showMoreLabel="Show all layouts"
          showLessLabel="Show fewer layouts"
        />
      </ControlSection>

      <ControlSection
        title="Responsive workspace"
        description="Edit a real layout for each breakpoint. Desktop stays the base; Tablet and Mobile generate their own media-query tracks and item placements."
      >
        <div className="space-y-3">
          <SegmentedControl
            ariaLabel="Active grid breakpoint"
            value={activeBreakpoint}
            onChange={onBreakpointChange}
            fullWidth
            options={[
              { value: "desktop", label: "Desktop" },
              { value: "tablet", label: "Tablet" },
              { value: "mobile", label: "Mobile" },
            ]}
          />
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3 text-xs text-[var(--color-text-soft)]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold text-[var(--color-text)]">
                {activeBreakpoint === "desktop"
                  ? "Base layout"
                  : `${activeBreakpoint === "tablet" ? "Tablet" : "Mobile"} layout`}
              </span>
              <span>
                {state.columns} × {state.rows} tracks
              </span>
            </div>
            {activeBreakpoint !== "desktop" && !state.responsive.enabled ? (
              <div className="mt-3 rounded-lg border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] px-3 py-2 text-xs leading-5 text-[var(--color-warning-text)]">
                Responsive output is off. You can keep editing this layout, but it will not be included in generated responsive code until you turn output on below.
              </div>
            ) : null}
            {activeBreakpoint !== "desktop" ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    onConfigureBreakpoint(activeBreakpoint, "copy-desktop")
                  }
                >
                  Copy desktop
                </Button>
                {activeBreakpoint === "mobile" ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onConfigureBreakpoint("mobile", "copy-tablet")}
                  >
                    Copy tablet
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onConfigureBreakpoint(activeBreakpoint, "auto")}
                >
                  {activeBreakpoint === "tablet" ? "Auto 2-column" : "Auto stack"}
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </ControlSection>

      <ControlSection title="Tracks" description="Build explicit rows and columns visually. Numeric repeat() expressions are expanded automatically.">
        <div className="space-y-4">
          <TrackEditor
            axis="columns"
            count={state.columns}
            template={state.columnTemplate}
            onChange={(columns, columnTemplate) => onPatch({ columns, columnTemplate })}
          />
          <TrackEditor
            axis="rows"
            count={state.rows}
            template={state.rowTemplate}
            onChange={(rows, rowTemplate) => onPatch({ rows, rowTemplate })}
          />
        </div>
      </ControlSection>

      <ControlSection title="Selected item" description={selectedItem ? `${selectedItem.name} · ${selectedItem.columnEnd - selectedItem.columnStart} × ${selectedItem.rowEnd - selectedItem.rowStart} cells` : "Select an item from the preview."} action={<Button size="sm" variant="secondary" onClick={onAddItem} disabled={state.items.length >= 24}>Add</Button>}>
        {selectedItem ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3 text-xs">
              <InspectorStat label="Columns" value={`${selectedItem.columnStart} → ${selectedItem.columnEnd}`} />
              <InspectorStat label="Rows" value={`${selectedItem.rowStart} → ${selectedItem.rowEnd}`} />
              <InspectorStat label="Column span" value={String(selectedItem.columnEnd - selectedItem.columnStart)} />
              <InspectorStat label="Row span" value={String(selectedItem.rowEnd - selectedItem.rowStart)} />
            </div>
            <ControlGrid columns={2}>
              <LabeledInput label="Name" value={selectedItem.name} onChange={(name) => onUpdateItem({ name })} />
              <LabeledInput label="Area name" value={selectedItem.areaName} onChange={(areaName) => onUpdateItem({ areaName })} />
              <NumberField
                label="Column start"
                value={selectedItem.columnStart}
                min={1}
                max={state.columns}
                onChange={(columnStart) => {
                  const span = selectedItem.columnEnd - selectedItem.columnStart;
                  onUpdateItem({ columnStart, columnEnd: columnStart + span });
                }}
              />
              <NumberField label="Column span" value={selectedItem.columnEnd - selectedItem.columnStart} min={1} max={state.columns - selectedItem.columnStart + 1} onChange={(columnSpan) => onUpdateItem({ columnEnd: selectedItem.columnStart + columnSpan })} />
              <NumberField
                label="Row start"
                value={selectedItem.rowStart}
                min={1}
                max={state.rows}
                onChange={(rowStart) => {
                  const span = selectedItem.rowEnd - selectedItem.rowStart;
                  onUpdateItem({ rowStart, rowEnd: rowStart + span });
                }}
              />
              <NumberField label="Row span" value={selectedItem.rowEnd - selectedItem.rowStart} min={1} max={state.rows - selectedItem.rowStart + 1} onChange={(rowSpan) => onUpdateItem({ rowEnd: selectedItem.rowStart + rowSpan })} />
              <ColorField label="Background" value={selectedItem.background} onChange={(background) => onUpdateItem({ background })} />
              <ColorField label="Text" value={selectedItem.textColor} onChange={(textColor) => onUpdateItem({ textColor })} />
              <SliderNumberField label="Radius" value={selectedItem.borderRadius} min={0} max={48} step={1} unit="px" onChange={(borderRadius) => onUpdateItem({ borderRadius })} />
              <LabeledInput label="Padding" value={selectedItem.padding} onChange={(padding) => onUpdateItem({ padding })} />
              <CompactSelect label="Justify self" value={selectedItem.justifySelf} values={selfAlign} onChange={(justifySelf) => onUpdateItem({ justifySelf })} />
              <CompactSelect label="Align self" value={selectedItem.alignSelf} values={selfAlign} onChange={(alignSelf) => onUpdateItem({ alignSelf })} />
            </ControlGrid>
            <LabeledInput label="Content" value={selectedItem.content} onChange={(content) => onUpdateItem({ content })} />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={onDuplicateItem} disabled={state.items.length >= 24}>Duplicate</Button>
              <Button size="sm" variant="danger" onClick={onDeleteItem} disabled={state.items.length <= 1}>Remove</Button>
            </div>
          </div>
        ) : null}
      </ControlSection>

      <ControlSection
        title="Nested grid / subgrid"
        description="Turn the selected parent item into a real nested grid. Each axis can use independent tracks or inherit the parent tracks with CSS subgrid."
      >
        {selectedItem ? (
          <div className="space-y-4">
            <SegmentedControl
              ariaLabel="Nested grid"
              value={selectedItem.nestedGrid ? "on" : "off"}
              onChange={(value) =>
                onUpdateItem({
                  nestedGrid:
                    value === "on"
                      ? selectedItem.nestedGrid ?? createNestedGrid(selectedItem)
                      : null,
                })
              }
              options={[
                { value: "off", label: "Off" },
                { value: "on", label: "Nested grid" },
              ]}
            />

            {selectedItem.nestedGrid ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-[var(--color-text)]">Columns</p>
                    <SegmentedControl
                      ariaLabel="Nested column mode"
                      value={selectedItem.nestedGrid.columnMode}
                      onChange={(columnMode) =>
                        patchNestedGrid({
                          columnMode: columnMode as GridNestedGrid["columnMode"],
                        })
                      }
                      fullWidth
                      options={[
                        { value: "independent", label: "Independent" },
                        { value: "subgrid", label: "Subgrid" },
                      ]}
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-[var(--color-text)]">Rows</p>
                    <SegmentedControl
                      ariaLabel="Nested row mode"
                      value={selectedItem.nestedGrid.rowMode}
                      onChange={(rowMode) =>
                        patchNestedGrid({
                          rowMode: rowMode as GridNestedGrid["rowMode"],
                        })
                      }
                      fullWidth
                      options={[
                        { value: "independent", label: "Independent" },
                        { value: "subgrid", label: "Subgrid" },
                      ]}
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3 text-xs leading-5 text-[var(--color-text-soft)]">
                  Parent span: {selectedItem.columnEnd - selectedItem.columnStart} column track{selectedItem.columnEnd - selectedItem.columnStart === 1 ? "" : "s"} × {selectedItem.rowEnd - selectedItem.rowStart} row track{selectedItem.rowEnd - selectedItem.rowStart === 1 ? "" : "s"}. Subgrid inherits that axis directly from the parent layout.
                </div>

                {selectedItem.nestedGrid.columnMode === "independent" ? (
                  <TrackEditor
                    axis="columns"
                    count={selectedItem.nestedGrid.columns}
                    template={selectedItem.nestedGrid.columnTemplate}
                    onChange={(columns, columnTemplate) =>
                      patchNestedGrid({ columns, columnTemplate })
                    }
                  />
                ) : (
                  <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-soft)] px-3 py-2 text-xs text-[var(--color-text-soft)]">
                    Columns inherit {selectedItem.columnEnd - selectedItem.columnStart} parent track{selectedItem.columnEnd - selectedItem.columnStart === 1 ? "" : "s"} with <code>grid-template-columns: subgrid</code>.
                  </div>
                )}

                {selectedItem.nestedGrid.rowMode === "independent" ? (
                  <TrackEditor
                    axis="rows"
                    count={selectedItem.nestedGrid.rows}
                    template={selectedItem.nestedGrid.rowTemplate}
                    onChange={(rows, rowTemplate) =>
                      patchNestedGrid({ rows, rowTemplate })
                    }
                  />
                ) : (
                  <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-soft)] px-3 py-2 text-xs text-[var(--color-text-soft)]">
                    Rows inherit {selectedItem.rowEnd - selectedItem.rowStart} parent track{selectedItem.rowEnd - selectedItem.rowStart === 1 ? "" : "s"} with <code>grid-template-rows: subgrid</code>.
                  </div>
                )}

                <ControlGrid columns={2}>
                  <SliderNumberField
                    label="Nested row gap"
                    value={selectedItem.nestedGrid.gap.row}
                    min={0}
                    max={selectedItem.nestedGrid.gap.unit === "rem" ? 6 : 96}
                    step={selectedItem.nestedGrid.gap.unit === "rem" ? 0.25 : 1}
                    unit={selectedItem.nestedGrid.gap.unit}
                    onChange={(row) =>
                      patchNestedGrid({ gap: { ...selectedItem.nestedGrid!.gap, row } })
                    }
                  />
                  <SliderNumberField
                    label="Nested column gap"
                    value={selectedItem.nestedGrid.gap.column}
                    min={0}
                    max={selectedItem.nestedGrid.gap.unit === "rem" ? 6 : 96}
                    step={selectedItem.nestedGrid.gap.unit === "rem" ? 0.25 : 1}
                    unit={selectedItem.nestedGrid.gap.unit}
                    onChange={(column) =>
                      patchNestedGrid({ gap: { ...selectedItem.nestedGrid!.gap, column } })
                    }
                  />
                </ControlGrid>
                <SegmentedControl
                  ariaLabel="Nested gap unit"
                  value={selectedItem.nestedGrid.gap.unit}
                  onChange={(unit) =>
                    changeNestedGapUnit(unit as GridNestedGrid["gap"]["unit"])
                  }
                  options={[
                    { value: "rem", label: "rem" },
                    { value: "px", label: "px" },
                  ]}
                />

                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-black text-[var(--color-text)]">Nested children</p>
                      <p className="text-xs text-[var(--color-text-soft)]">Position children on the nested grid lines. Up to 8 children per parent.</p>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={addNestedItem}
                      disabled={selectedItem.nestedGrid.items.length >= 8}
                    >
                      Add child
                    </Button>
                  </div>

                  {selectedItem.nestedGrid.items.map((nestedItem, nestedIndex) => {
                    const expanded = expandedNestedId === nestedItem.id;
                    return (
                      <div
                        key={nestedItem.id}
                        className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)]"
                      >
                        <div className="flex items-center gap-2 p-2.5">
                          <button
                            type="button"
                            aria-expanded={expanded}
                            aria-controls={`nested-child-${nestedItem.id}`}
                            onClick={() =>
                              setExpandedNestedId(expanded ? null : nestedItem.id)
                            }
                            className="min-w-0 flex-1 rounded-lg px-1 py-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-soft)]"
                          >
                            <span className="flex items-center gap-2">
                              <span className="text-xs font-black text-[var(--color-text)]">
                                {nestedItem.name || `Child ${nestedIndex + 1}`}
                              </span>
                              <span className="rounded-full bg-[var(--color-surface)] px-2 py-0.5 font-mono text-xs text-[var(--color-text-soft)]">
                                C{nestedItem.columnStart}:{nestedItem.columnEnd} · R{nestedItem.rowStart}:{nestedItem.rowEnd}
                              </span>
                            </span>
                            <span className="mt-0.5 block text-xs text-[var(--color-text-soft)]">
                              {expanded ? "Hide child controls" : "Edit child"}
                            </span>
                          </button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => {
                              patchNestedGrid({
                                items: selectedItem.nestedGrid!.items.filter(
                                  (item) => item.id !== nestedItem.id,
                                ),
                              });
                              if (expanded) setExpandedNestedId(null);
                            }}
                          >
                            Remove
                          </Button>
                        </div>

                        {expanded ? (
                          <div
                            id={`nested-child-${nestedItem.id}`}
                            className="space-y-3 border-t border-[var(--color-border)] p-3"
                          >
                            <ControlGrid columns={2}>
                              <LabeledInput
                                label="Name"
                                value={nestedItem.name}
                                onChange={(name) =>
                                  updateNestedItem(nestedItem.id, { name })
                                }
                              />
                              <LabeledInput
                                label="Content"
                                value={nestedItem.content}
                                onChange={(content) =>
                                  updateNestedItem(nestedItem.id, { content })
                                }
                              />
                              <NumberField
                                label="Column start"
                                value={nestedItem.columnStart}
                                min={1}
                                max={selectedItem.nestedGrid!.columns}
                                onChange={(columnStart) => {
                                  const span =
                                    nestedItem.columnEnd - nestedItem.columnStart;
                                  updateNestedItem(nestedItem.id, {
                                    columnStart,
                                    columnEnd: columnStart + span,
                                  });
                                }}
                              />
                              <NumberField
                                label="Column span"
                                value={
                                  nestedItem.columnEnd - nestedItem.columnStart
                                }
                                min={1}
                                max={
                                  selectedItem.nestedGrid!.columns -
                                  nestedItem.columnStart +
                                  1
                                }
                                onChange={(columnSpan) =>
                                  updateNestedItem(nestedItem.id, {
                                    columnEnd:
                                      nestedItem.columnStart + columnSpan,
                                  })
                                }
                              />
                              <NumberField
                                label="Row start"
                                value={nestedItem.rowStart}
                                min={1}
                                max={selectedItem.nestedGrid!.rows}
                                onChange={(rowStart) => {
                                  const span =
                                    nestedItem.rowEnd - nestedItem.rowStart;
                                  updateNestedItem(nestedItem.id, {
                                    rowStart,
                                    rowEnd: rowStart + span,
                                  });
                                }}
                              />
                              <NumberField
                                label="Row span"
                                value={nestedItem.rowEnd - nestedItem.rowStart}
                                min={1}
                                max={
                                  selectedItem.nestedGrid!.rows -
                                  nestedItem.rowStart +
                                  1
                                }
                                onChange={(rowSpan) =>
                                  updateNestedItem(nestedItem.id, {
                                    rowEnd: nestedItem.rowStart + rowSpan,
                                  })
                                }
                              />
                              <ColorField
                                label="Background"
                                value={nestedItem.background}
                                onChange={(background) =>
                                  updateNestedItem(nestedItem.id, { background })
                                }
                              />
                              <ColorField
                                label="Text"
                                value={nestedItem.textColor}
                                onChange={(textColor) =>
                                  updateNestedItem(nestedItem.id, { textColor })
                                }
                              />
                            </ControlGrid>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <p className="text-xs leading-5 text-[var(--color-text-soft)]">
                Enable a nested grid to place children inside this item. Subgrid is available per axis and only emits where it is semantically valid: on this nested grid container.
              </p>
            )}
          </div>
        ) : (
          <p className="text-xs text-[var(--color-text-soft)]">Select a parent item first.</p>
        )}
      </ControlSection>

      <ControlSection title="Layout" description="Control spacing, placement mode, and generated class names.">
        <ControlGrid columns={2}>
          <SliderNumberField label="Row gap" value={state.gap.row} min={0} max={state.gap.unit === "rem" ? 6 : 96} step={state.gap.unit === "rem" ? 0.25 : 1} unit={state.gap.unit} onChange={(row) => onPatch({ gap: { ...state.gap, row } })} />
          <SliderNumberField label="Column gap" value={state.gap.column} min={0} max={state.gap.unit === "rem" ? 6 : 96} step={state.gap.unit === "rem" ? 0.25 : 1} unit={state.gap.unit} onChange={(column) => onPatch({ gap: { ...state.gap, column } })} />
        </ControlGrid>
        <div className="flex flex-wrap gap-2">
          <SegmentedControl ariaLabel="Gap unit" value={state.gap.unit} onChange={changeGapUnit} options={[{ value: "rem", label: "rem" }, { value: "px", label: "px" }]} />
          <SegmentedControl ariaLabel="Placement mode" value={state.useTemplateAreas ? "areas" : "lines"} onChange={(mode) => onPatch({ useTemplateAreas: mode === "areas" })} options={[{ value: "lines", label: "Lines" }, { value: "areas", label: "Areas" }]} />
        </div>
        <ControlGrid columns={2}>
          <LabeledInput label="Container class" value={state.containerClassName} onChange={(containerClassName) => onPatch({ containerClassName })} />
          <LabeledInput label="Item prefix" value={state.itemClassPrefix} onChange={(itemClassPrefix) => onPatch({ itemClassPrefix })} />
        </ControlGrid>
      </ControlSection>

      <ControlSection title="Alignment" description="Control how items and the complete grid align inside the container.">
        <ControlGrid columns={2}>
          <CompactSelect label="Justify items" value={state.justifyItems} values={selfAlign} onChange={(justifyItems) => onPatch({ justifyItems })} />
          <CompactSelect label="Align items" value={state.alignItems} values={selfAlign} onChange={(alignItems) => onPatch({ alignItems })} />
          <CompactSelect label="Justify content" value={state.justifyContent} values={align} onChange={(justifyContent) => onPatch({ justifyContent })} />
          <CompactSelect label="Align content" value={state.alignContent} values={align} onChange={(alignContent) => onPatch({ alignContent })} />
        </ControlGrid>
      </ControlSection>

      <ControlSection title="Advanced templates" description="Use raw CSS for complex expressions. Dynamic auto-fit/auto-fill remains here until the responsive canvas can represent an unknown track count exactly.">
        <LabeledInput label="Columns template" value={state.columnTemplate} onChange={(columnTemplate) => onPatch({ columnTemplate })} />
        <LabeledInput label="Rows template" value={state.rowTemplate} onChange={(rowTemplate) => onPatch({ rowTemplate })} />
      </ControlSection>

      <ControlSection
        title="Auto placement"
        description="Control how unpositioned items create and fill implicit Grid tracks. Dense modes can visually reorder content, so Darma flags the accessibility tradeoff."
      >
        <div className="space-y-3">
          <SegmentedControl
            ariaLabel="Grid auto flow"
            value={state.autoFlow}
            onChange={(autoFlow) => onPatch({ autoFlow: autoFlow as GridAutoFlow })}
            fullWidth
            options={[
              { value: "row", label: "Row" },
              { value: "column", label: "Column" },
              { value: "row dense", label: "Row dense" },
              { value: "column dense", label: "Column dense" },
            ]}
          />
          <ControlGrid columns={2}>
            <LabeledInput label="Implicit columns" value={state.autoColumns} onChange={(autoColumns) => onPatch({ autoColumns })} />
            <LabeledInput label="Implicit rows" value={state.autoRows} onChange={(autoRows) => onPatch({ autoRows })} />
          </ControlGrid>
          <p className="text-xs leading-5 text-[var(--color-text-soft)]">
            These map directly to grid-auto-flow, grid-auto-columns, and grid-auto-rows and are emitted per breakpoint.
          </p>
        </div>
      </ControlSection>

      <ControlSection title="Import & workspace" description="Paste existing Grid CSS, autosave locally in this browser, or copy a shareable URL. Nothing is uploaded to Darma.">
        <div className="space-y-3">
          <label className="block space-y-1 text-xs font-semibold text-[var(--color-text-soft)]">
            <span>Import CSS</span>
            <textarea
              value={importCss}
              onChange={(event) => setImportCss(event.target.value)}
              placeholder={".layout {\n  display: grid;\n  grid-template-columns: 240px 1fr;\n}"}
              rows={7}
              className="w-full resize-y rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 font-mono text-xs font-normal leading-5 text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)]"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={importWorkspaceCss} disabled={!importCss.trim()}>Import CSS</Button>
            <Button size="sm" variant="secondary" onClick={copyShareLink}>Copy share link</Button>
            <Button
              size="sm"
              variant={resetArmed ? "danger" : "secondary"}
              onClick={requestWorkspaceReset}
            >
              {resetArmed ? "Confirm reset" : "Reset workspace"}
            </Button>
          </div>
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3 text-xs leading-5 text-[var(--color-text-soft)]">
            <p>Autosaved locally after edits. Share links contain the Grid configuration in the URL; they do not create a server record.</p>
            {workspaceMessage ? <p className="mt-1 font-semibold text-[var(--color-text)]">{workspaceMessage}</p> : null}
          </div>
        </div>
      </ControlSection>

      <ControlSection
        title="Responsive output"
        description="Set the media-query boundaries. The Tablet and Mobile tabs above contain the actual tracks, gaps, and item placements emitted at each breakpoint."
      >
        <div className="space-y-3">
          <SegmentedControl
            ariaLabel="Responsive output"
            value={state.responsive.enabled ? "on" : "off"}
            onChange={(value) => onResponsivePatch({ enabled: value === "on" })}
            options={[
              { value: "on", label: "On" },
              { value: "off", label: "Off" },
            ]}
          />
          <ControlGrid columns={2}>
            <NumberField
              label="Tablet max"
              value={state.responsive.tabletBreakpoint}
              min={Math.max(480, state.responsive.mobileBreakpoint + 1)}
              max={1200}
              unit="px"
              onChange={(tabletBreakpoint) =>
                onResponsivePatch({ tabletBreakpoint })
              }
            />
            <NumberField
              label="Mobile max"
              value={state.responsive.mobileBreakpoint}
              min={280}
              max={Math.min(760, state.responsive.tabletBreakpoint - 1)}
              unit="px"
              onChange={(mobileBreakpoint) =>
                onResponsivePatch({ mobileBreakpoint })
              }
            />
          </ControlGrid>
          <p className="text-xs leading-5 text-[var(--color-text-soft)]">
            Output order: Desktop base → Tablet at ≤ {state.responsive.tabletBreakpoint}px → Mobile at ≤ {state.responsive.mobileBreakpoint}px.
          </p>
        </div>
      </ControlSection>

      <ControlSection title="Output options">
        <div className="flex flex-wrap gap-2">
          <SegmentedControl ariaLabel="Demo styles" value={state.includeDemoStyles ? "demo" : "layout"} onChange={(value) => onPatch({ includeDemoStyles: value === "demo" })} options={[{ value: "demo", label: "Demo CSS" }, { value: "layout", label: "Layout only" }]} />
          <SegmentedControl ariaLabel="Preview labels" value={state.showAreaNames ? "labels" : "names"} onChange={(value) => onPatch({ showAreaNames: value === "labels" })} options={[{ value: "labels", label: "Areas" }, { value: "names", label: "Names" }]} />
        </div>
      </ControlSection>
    </ToolControlPanel>
  );
}

function TrackEditor({
  axis,
  count,
  template,
  onChange,
}: {
  axis: TrackAxis;
  count: number;
  template: string;
  onChange: (count: number, template: string) => void;
}) {
  const fallback = axis === "columns" ? "1fr" : "minmax(120px, auto)";
  const maxCount = axis === "columns" ? 12 : 24;
  const parsed = expandFixedTrackTemplate(template, count, fallback);
  const label = axis === "columns" ? "Columns" : "Rows";

  function changeCount(nextCount: number) {
    const safeCount = Math.max(1, Math.min(maxCount, Math.round(nextCount)));
    onChange(
      safeCount,
      resizeTrackTemplate({
        template,
        currentCount: count,
        nextCount: safeCount,
        fallback,
        maxCount,
      }),
    );
  }

  function updateTrack(index: number, value: string) {
    onChange(count, updateTrackAt(template, count, index, value, fallback));
  }

  function removeTrack(index: number) {
    const next = removeTrackAt(template, count, index, fallback);
    onChange(next.count, next.template);
  }

  function addTrack() {
    const next = appendTrack(template, count, fallback, maxCount);
    onChange(next.count, next.template);
  }

  return (
    <div className="space-y-3 rounded-xl border border-[var(--color-border)] p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-[var(--color-text)]">{label}</p>
          <p className="text-xs text-[var(--color-text-soft)]">{count} explicit track{count === 1 ? "" : "s"}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => changeCount(count - 1)} disabled={count <= 1}>−</Button>
          <Button size="sm" variant="secondary" onClick={addTrack} disabled={count >= maxCount}>+</Button>
        </div>
      </div>

      {parsed.editable ? (
        <div className="space-y-2">
          {parsed.tracks.map((track, index) => (
            <TrackRow
              key={`${axis}-${index}`}
              axis={axis}
              index={index}
              value={track}
              canRemove={count > 1}
              onChange={(value) => updateTrack(index, value)}
              onRemove={() => removeTrack(index)}
            />
          ))}
          <div className="flex flex-wrap gap-2 pt-1">
            <Button size="sm" variant="secondary" onClick={() => onChange(count, `repeat(${count}, ${fallback})`)}>Equal tracks</Button>
            {axis === "columns" ? (
              <Button size="sm" variant="secondary" onClick={() => onChange(count, serializeTracks(Array.from({ length: count }, (_, index) => index === 0 ? "240px" : "1fr")))}>Sidebar starter</Button>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="space-y-2 rounded-lg border border-amber-300/60 bg-amber-50/60 p-3 text-xs text-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
          <p>{parsed.reason}</p>
          <Button size="sm" variant="secondary" onClick={() => onChange(count, `repeat(${count}, ${fallback})`)}>Convert to editable tracks</Button>
        </div>
      )}
    </div>
  );
}

function TrackRow({
  axis,
  index,
  value,
  canRemove,
  onChange,
  onRemove,
}: {
  axis: TrackAxis;
  index: number;
  value: string;
  canRemove: boolean;
  onChange: (value: string) => void;
  onRemove: () => void;
}) {
  const kind = detectTrackKind(value);
  const simple = ["fr", "px", "%", "rem", "em"].includes(kind);

  function changeKind(nextKind: SimpleTrackKind) {
    if (nextKind === "custom") {
      onChange("var(--track-size)");
      return;
    }
    onChange(getTrackPreset(axis, nextKind));
  }

  return (
    <div className="grid grid-cols-[28px_minmax(82px,0.8fr)_minmax(0,1.4fr)_auto] items-end gap-2">
      <span className="pb-2 text-center text-xs font-semibold text-[var(--color-text-soft)]">{index + 1}</span>
      <CompactSelect label="Type" value={kind} values={trackKinds} onChange={changeKind} />
      {simple ? (
        <LabeledInput
          label="Value"
          inputMode="decimal"
          value={readSimpleTrackNumber(value)}
          onChange={(number) => onChange(`${number || "0"}${kind}`)}
        />
      ) : kind === "auto" ? (
        <div className="pb-2 text-xs text-[var(--color-text-soft)]">Automatic size</div>
      ) : (
        <LabeledInput label="Expression" value={value} onChange={onChange} />
      )}
      <Button size="sm" variant="secondary" onClick={onRemove} disabled={!canRemove} aria-label={`Remove ${axis === "columns" ? "column" : "row"} ${index + 1}`}>×</Button>
    </div>
  );
}

function InspectorStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-[var(--color-text-soft)]">{label}</div>
      <div className="font-mono font-semibold text-[var(--color-text)]">{value}</div>
    </div>
  );
}

function LabeledInput({ label, value, onChange, inputMode }: { label: string; value: string; onChange: (value: string) => void; inputMode?: "text" | "decimal" | "numeric" }) {
  return (
    <label className="space-y-1 text-xs font-semibold text-[var(--color-text-soft)]">
      <span>{label}</span>
      <Input size="sm" inputMode={inputMode} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function CompactSelect<T extends string>({ label, value, values, onChange }: { label: string; value: T; values: readonly T[]; onChange: (value: T) => void }) {
  return (
    <label className="space-y-1 text-xs font-semibold text-[var(--color-text-soft)]">
      <span>{label}</span>
      <Select size="sm" value={value} onChange={(event) => onChange(event.target.value as T)}>
        {values.map((item) => <option key={item} value={item}>{item}</option>)}
      </Select>
    </label>
  );
}
