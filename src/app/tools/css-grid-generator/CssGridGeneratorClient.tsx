"use client";

import { useMemo, useState } from "react";
import { Download, Grid3X3, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/ui/CopyButton";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import { cn } from "@/lib/cn";
import { GRID_PRESETS } from "./presets";
import {
  clampItemToGrid,
  createDefaultGridState,
  createGridItem,
  generateGridCss,
  generateGridHtml,
  generateGridJsx,
  generateTailwindStarter,
  normalizeGridState,
  validateGridState,
} from "./grid";
import type {
  GridAlignment,
  GridGeneratorState,
  GridItem,
  GridSelfAlignment,
} from "./types";

type PanelTab = "grid" | "items" | "alignment" | "responsive" | "export";
type CodeTab = "css" | "html" | "jsx" | "tailwind";

const PANEL_TABS: readonly TabItem<PanelTab>[] = [
  { value: "grid", label: "Grid" },
  { value: "items", label: "Items" },
  { value: "alignment", label: "Alignment" },
  { value: "responsive", label: "Responsive" },
  { value: "export", label: "Export" },
];

const CODE_TABS: readonly TabItem<CodeTab>[] = [
  { value: "css", label: "CSS" },
  { value: "html", label: "HTML" },
  { value: "jsx", label: "React JSX" },
  { value: "tailwind", label: "Tailwind-style" },
];

const selfAlignmentValues: GridSelfAlignment[] = [
  "auto",
  "stretch",
  "start",
  "center",
  "end",
];
const containerAlignmentValues: GridAlignment[] = [
  "stretch",
  "start",
  "center",
  "end",
  "space-between",
  "space-around",
  "space-evenly",
];

export default function CssGridGeneratorClient() {
  const [state, setState] = useState<GridGeneratorState>(() =>
    createDefaultGridState(),
  );
  const [panelTab, setPanelTab] = useState<PanelTab>("grid");
  const [codeTab, setCodeTab] = useState<CodeTab>("css");
  const [activePreset, setActivePreset] = useState("bento-grid");

  const normalized = useMemo(() => normalizeGridState(state), [state]);
  const selectedItem =
    normalized.items.find((item) => item.id === normalized.selectedItemId) ??
    normalized.items[0] ??
    null;
  const css = useMemo(() => generateGridCss(normalized), [normalized]);
  const html = useMemo(() => generateGridHtml(normalized), [normalized]);
  const jsx = useMemo(() => generateGridJsx(normalized), [normalized]);
  const tailwind = useMemo(
    () => generateTailwindStarter(normalized),
    [normalized],
  );
  const messages = useMemo(() => validateGridState(normalized), [normalized]);
  const currentCode = { css, html, jsx, tailwind }[codeTab];

  function patchState(patch: Partial<GridGeneratorState>) {
    setState((current) => normalizeGridState({ ...current, ...patch }));
  }

  function updateSelectedItem(patch: Partial<GridItem>) {
    if (!selectedItem) return;
    setState((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.id === selectedItem.id
          ? clampItemToGrid(
              { ...item, ...patch },
              current.columns,
              current.rows,
            )
          : item,
      ),
    }));
  }

  function addItem() {
    if (normalized.items.length >= 24) return;
    const item = createGridItem({
      name: `Item ${normalized.items.length + 1}`,
      areaName: `item${normalized.items.length + 1}`,
      columnStart: 1,
      columnEnd: Math.min(2, normalized.columns + 1),
      rowStart: 1,
      rowEnd: Math.min(2, normalized.rows + 1),
      background: ["#2563eb", "#7c3aed", "#0f766e", "#ea580c", "#be123c"][
        normalized.items.length % 5
      ],
      content: `Item ${normalized.items.length + 1}`,
    });
    patchState({ items: [...normalized.items, item], selectedItemId: item.id });
    setPanelTab("items");
  }

  function duplicateSelectedItem() {
    if (!selectedItem || normalized.items.length >= 24) return;
    const item = createGridItem({
      ...selectedItem,
      id: undefined,
      name: `${selectedItem.name} copy`,
      areaName: `${selectedItem.areaName}Copy`,
      content: `${selectedItem.content} copy`,
    });
    patchState({
      items: [
        ...normalized.items,
        clampItemToGrid(item, normalized.columns, normalized.rows),
      ],
      selectedItemId: item.id,
    });
  }

  function deleteSelectedItem() {
    if (!selectedItem || normalized.items.length <= 1) return;
    const items = normalized.items.filter(
      (item) => item.id !== selectedItem.id,
    );
    patchState({ items, selectedItemId: items[0]?.id ?? null });
  }

  function loadPreset(presetId: string) {
    const preset = GRID_PRESETS.find((item) => item.id === presetId);
    if (!preset) return;
    setState(normalizeGridState(preset.state));
    setActivePreset(preset.id);
  }

  function downloadFile(
    filename: string,
    content: string,
    type = "text/plain",
  ) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] p-3 md:grid-cols-[minmax(0,1fr)_auto_auto_auto] md:items-end">
        <Field label="Preset" className="min-w-0">
          <Select
            value={activePreset}
            onChange={(event) => loadPreset(event.target.value)}
            aria-label="Choose a CSS Grid preset"
          >
            <option value="">Choose a layout preset</option>
            {GRID_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Columns">
          <Input
            type="number"
            min={1}
            max={12}
            value={normalized.columns}
            onChange={(event) =>
              patchState({
                columns: Number(event.target.value),
                columnTemplate: `repeat(${Number(event.target.value) || 1}, minmax(0, 1fr))`,
              })
            }
          />
        </Field>
        <Field label="Rows">
          <Input
            type="number"
            min={1}
            max={12}
            value={normalized.rows}
            onChange={(event) =>
              patchState({
                rows: Number(event.target.value),
                rowTemplate: `repeat(${Number(event.target.value) || 1}, minmax(120px, auto))`,
              })
            }
          />
        </Field>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={addItem}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Add item
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setState(createDefaultGridState());
              setActivePreset("bento-grid");
            }}
            leftIcon={<RefreshCw className="h-4 w-4" />}
          >
            Reset
          </Button>
          <CopyButton text={css}>Copy CSS</CopyButton>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {GRID_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => loadPreset(preset.id)}
            className={cn(
              "rounded-3xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md",
              activePreset === preset.id
                ? "border-[var(--color-accent)] bg-[var(--color-bg-soft)]"
                : "border-[var(--color-border)] bg-[var(--color-surface)]",
            )}
          >
            <MiniPreset state={preset.state} />
            <span className="mt-3 block text-sm font-bold text-[var(--color-text)]">
              {preset.name}
            </span>
            <span className="mt-1 block text-xs leading-5 text-[var(--color-text-muted)]">
              {preset.description}
            </span>
          </button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="space-y-4 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Grid3X3 className="h-5 w-5 text-[var(--color-accent)]" />
                <h3 className="text-lg font-bold text-[var(--color-text)]">
                  Live grid preview
                </h3>
              </div>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                Uses real CSS Grid with line overlays, labels, and responsive
                width controls.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[375, 768, 1024, 1280].map((width) => (
                <Button
                  key={width}
                  variant={
                    normalized.previewWidth === width ? "primary" : "secondary"
                  }
                  size="sm"
                  onClick={() => patchState({ previewWidth: width })}
                >
                  {width}px
                </Button>
              ))}
            </div>
          </div>

          <Field label={`Preview width: ${normalized.previewWidth}px`}>
            <input
              className="w-full accent-[var(--color-accent)]"
              type="range"
              min={320}
              max={1440}
              step={10}
              value={normalized.previewWidth}
              onChange={(event) =>
                patchState({ previewWidth: Number(event.target.value) })
              }
            />
          </Field>

          <div className="overflow-auto rounded-3xl border border-dashed border-[var(--color-border)] bg-gradient-to-br from-slate-50 to-white p-4 dark:from-slate-950 dark:to-slate-900">
            <div
              className="relative mx-auto transition-all"
              style={{ width: normalized.previewWidth, maxWidth: "100%" }}
            >
              {normalized.showLineNumbers ? (
                <LineNumbers
                  columns={normalized.columns}
                  rows={normalized.rows}
                />
              ) : null}
              <div
                className={cn(
                  "relative grid min-h-[420px] rounded-3xl p-3",
                  normalized.showGridLines &&
                    "bg-[linear-gradient(to_right,rgba(148,163,184,.24)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,.24)_1px,transparent_1px)] bg-[size:48px_48px]",
                )}
                style={{
                  gridTemplateColumns: normalized.columnTemplate,
                  gridTemplateRows: normalized.rowTemplate,
                  gap: `${normalized.gap.row}${normalized.gap.unit} ${normalized.gap.column}${normalized.gap.unit}`,
                  justifyItems: normalized.justifyItems,
                  alignItems: normalized.alignItems,
                  justifyContent: normalized.justifyContent,
                  alignContent: normalized.alignContent,
                }}
              >
                {normalized.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      patchState({ selectedItemId: item.id });
                      setPanelTab("items");
                    }}
                    className={cn(
                      "group min-h-20 rounded-2xl border p-4 text-left shadow-sm transition hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]",
                      item.id === normalized.selectedItemId
                        ? "ring-4 ring-[var(--color-accent)]/30"
                        : "border-white/40",
                    )}
                    style={{
                      gridColumn: `${item.columnStart} / ${item.columnEnd}`,
                      gridRow: `${item.rowStart} / ${item.rowEnd}`,
                      background: item.background,
                      color: item.textColor,
                      borderRadius: item.borderRadius,
                      padding: item.padding,
                      justifySelf:
                        item.justifySelf === "auto"
                          ? undefined
                          : item.justifySelf,
                      alignSelf:
                        item.alignSelf === "auto" ? undefined : item.alignSelf,
                    }}
                  >
                    <span className="block text-sm font-black">
                      {normalized.showAreaNames ? item.areaName : item.name}
                    </span>
                    <span className="mt-2 block text-xs opacity-80">
                      {item.columnStart}/{item.rowStart} → {item.columnEnd}/
                      {item.rowEnd}
                    </span>
                    <span className="mt-4 block text-sm font-medium opacity-90">
                      {item.content}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <Toggle
              label="Grid lines"
              checked={normalized.showGridLines}
              onChange={(checked) => patchState({ showGridLines: checked })}
            />
            <Toggle
              label="Line numbers"
              checked={normalized.showLineNumbers}
              onChange={(checked) => patchState({ showLineNumbers: checked })}
            />
            <Toggle
              label="Area names"
              checked={normalized.showAreaNames}
              onChange={(checked) => patchState({ showAreaNames: checked })}
            />
          </div>
        </section>

        <aside className="space-y-4 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
          <Tabs<PanelTab>
            items={PANEL_TABS}
            value={panelTab}
            onChange={setPanelTab}
            ariaLabel="CSS Grid controls"
          />
          {panelTab === "grid" ? (
            <GridControls state={normalized} patchState={patchState} />
          ) : null}
          {panelTab === "items" ? (
            <ItemsPanel
              state={normalized}
              selectedItem={selectedItem}
              setSelected={(id) => patchState({ selectedItemId: id })}
              updateSelectedItem={updateSelectedItem}
              addItem={addItem}
              duplicateSelectedItem={duplicateSelectedItem}
              deleteSelectedItem={deleteSelectedItem}
            />
          ) : null}
          {panelTab === "alignment" ? (
            <AlignmentControls
              state={normalized}
              patchState={patchState}
              selectedItem={selectedItem}
              updateSelectedItem={updateSelectedItem}
            />
          ) : null}
          {panelTab === "responsive" ? (
            <ResponsiveControls state={normalized} patchState={patchState} />
          ) : null}
          {panelTab === "export" ? (
            <ExportControls
              state={normalized}
              patchState={patchState}
              downloadFile={downloadFile}
              css={css}
              html={html}
            />
          ) : null}
        </aside>
      </div>

      {messages.length ? (
        <div className="grid gap-2 md:grid-cols-2">
          {messages.slice(0, 6).map((message, index) => (
            <div
              key={`${message.message}-${index}`}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] p-3 text-sm text-[var(--color-text-muted)]"
            >
              <Badge
                variant={
                  message.type === "error"
                    ? "danger"
                    : message.type === "warning"
                      ? "warning"
                      : "soft"
                }
              >
                {message.type}
              </Badge>
              <span className="ml-2">{message.message}</span>
            </div>
          ))}
        </div>
      ) : null}

      <section className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs<CodeTab>
            items={CODE_TABS}
            value={codeTab}
            onChange={setCodeTab}
            ariaLabel="Generated code output"
          />
          <div className="flex flex-wrap gap-2">
            <CopyButton text={currentCode} variant="secondary">
              Copy current
            </CopyButton>
            <CopyButton text={`${css}\n\n${html}`} variant="primary">
              Copy all
            </CopyButton>
          </div>
        </div>
        <pre className="mt-4 max-h-[520px] overflow-auto rounded-2xl bg-slate-950 p-4 text-xs leading-6 text-slate-100">
          <code>{currentCode}</code>
        </pre>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          [
            "Best for",
            "Dashboards, bento sections, app shells, galleries, pricing cards, and page regions.",
          ],
          [
            "Export formats",
            "Copy CSS, HTML, React JSX, a Tailwind-style starter, or download separate CSS/HTML files.",
          ],
          [
            "Privacy",
            "Everything runs in your browser. No layout data is uploaded or stored on a server.",
          ],
        ].map(([title, description]) => (
          <div
            key={title}
            className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] p-5"
          >
            <h3 className="font-bold text-[var(--color-text)]">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
              {description}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}

function GridControls({
  state,
  patchState,
}: {
  state: GridGeneratorState;
  patchState: (patch: Partial<GridGeneratorState>) => void;
}) {
  return (
    <div className="space-y-4">
      <Field
        label="Column template"
        description="Use repeat(), minmax(), auto-fit, px, fr, %, or custom tracks."
      >
        <Input
          value={state.columnTemplate}
          onChange={(event) =>
            patchState({ columnTemplate: event.target.value })
          }
        />
      </Field>
      <Field label="Row template">
        <Input
          value={state.rowTemplate}
          onChange={(event) => patchState({ rowTemplate: event.target.value })}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Row gap">
          <Input
            type="number"
            min={0}
            max={state.gap.unit === "rem" ? 6 : 96}
            step={state.gap.unit === "rem" ? 0.25 : 1}
            value={state.gap.row}
            onChange={(event) =>
              patchState({
                gap: { ...state.gap, row: Number(event.target.value) },
              })
            }
          />
        </Field>
        <Field label="Column gap">
          <Input
            type="number"
            min={0}
            max={state.gap.unit === "rem" ? 6 : 96}
            step={state.gap.unit === "rem" ? 0.25 : 1}
            value={state.gap.column}
            onChange={(event) =>
              patchState({
                gap: { ...state.gap, column: Number(event.target.value) },
              })
            }
          />
        </Field>
      </div>
      <Field label="Gap unit">
        <Select
          value={state.gap.unit}
          onChange={(event) =>
            patchState({
              gap: { ...state.gap, unit: event.target.value as "px" | "rem" },
            })
          }
        >
          <option value="rem">rem</option>
          <option value="px">px</option>
        </Select>
      </Field>
      <Toggle
        label="Generate named template areas"
        checked={state.useTemplateAreas}
        onChange={(checked) => patchState({ useTemplateAreas: checked })}
      />
      <Toggle
        label="Include demo visual styles"
        checked={state.includeDemoStyles}
        onChange={(checked) => patchState({ includeDemoStyles: checked })}
      />
    </div>
  );
}

function ItemsPanel({
  state,
  selectedItem,
  setSelected,
  updateSelectedItem,
  addItem,
  duplicateSelectedItem,
  deleteSelectedItem,
}: {
  state: GridGeneratorState;
  selectedItem: GridItem | null;
  setSelected: (id: string) => void;
  updateSelectedItem: (patch: Partial<GridItem>) => void;
  addItem: () => void;
  duplicateSelectedItem: () => void;
  deleteSelectedItem: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        {state.items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSelected(item.id)}
            className={cn(
              "rounded-2xl border p-3 text-left text-sm transition",
              item.id === state.selectedItemId
                ? "border-[var(--color-accent)] bg-[var(--color-bg-soft)]"
                : "border-[var(--color-border)] hover:bg-[var(--color-bg-soft)]",
            )}
          >
            <span className="font-bold text-[var(--color-text)]">
              {item.name}
            </span>
            <span className="block text-xs text-[var(--color-text-soft)]">
              {item.columnStart}/{item.rowStart} → {item.columnEnd}/
              {item.rowEnd}
            </span>
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={addItem}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Add
        </Button>
        <Button size="sm" variant="secondary" onClick={duplicateSelectedItem}>
          Duplicate
        </Button>
        <Button
          size="sm"
          variant="danger"
          onClick={deleteSelectedItem}
          disabled={state.items.length <= 1}
          leftIcon={<Trash2 className="h-4 w-4" />}
        >
          Delete
        </Button>
      </div>
      {selectedItem ? (
        <div className="space-y-3 border-t border-[var(--color-border)] pt-4">
          <Field label="Name">
            <Input
              value={selectedItem.name}
              onChange={(event) =>
                updateSelectedItem({ name: event.target.value })
              }
            />
          </Field>
          <Field label="Area name">
            <Input
              value={selectedItem.areaName}
              onChange={(event) =>
                updateSelectedItem({ areaName: event.target.value })
              }
            />
          </Field>
          <Field label="Content">
            <Input
              value={selectedItem.content}
              onChange={(event) =>
                updateSelectedItem({ content: event.target.value })
              }
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Column start">
              <Input
                type="number"
                min={1}
                max={state.columns}
                value={selectedItem.columnStart}
                onChange={(event) =>
                  updateSelectedItem({
                    columnStart: Number(event.target.value),
                  })
                }
              />
            </Field>
            <Field label="Column end">
              <Input
                type="number"
                min={2}
                max={state.columns + 1}
                value={selectedItem.columnEnd}
                onChange={(event) =>
                  updateSelectedItem({ columnEnd: Number(event.target.value) })
                }
              />
            </Field>
            <Field label="Row start">
              <Input
                type="number"
                min={1}
                max={state.rows}
                value={selectedItem.rowStart}
                onChange={(event) =>
                  updateSelectedItem({ rowStart: Number(event.target.value) })
                }
              />
            </Field>
            <Field label="Row end">
              <Input
                type="number"
                min={2}
                max={state.rows + 1}
                value={selectedItem.rowEnd}
                onChange={(event) =>
                  updateSelectedItem({ rowEnd: Number(event.target.value) })
                }
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Background">
              <Input
                type="color"
                value={selectedItem.background}
                onChange={(event) =>
                  updateSelectedItem({ background: event.target.value })
                }
              />
            </Field>
            <Field label="Text">
              <Input
                type="color"
                value={selectedItem.textColor}
                onChange={(event) =>
                  updateSelectedItem({ textColor: event.target.value })
                }
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Radius">
              <Input
                type="number"
                min={0}
                max={48}
                value={selectedItem.borderRadius}
                onChange={(event) =>
                  updateSelectedItem({
                    borderRadius: Number(event.target.value),
                  })
                }
              />
            </Field>
            <Field label="Padding">
              <Input
                value={selectedItem.padding}
                onChange={(event) =>
                  updateSelectedItem({ padding: event.target.value })
                }
              />
            </Field>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function AlignmentControls({
  state,
  patchState,
  selectedItem,
  updateSelectedItem,
}: {
  state: GridGeneratorState;
  patchState: (patch: Partial<GridGeneratorState>) => void;
  selectedItem: GridItem | null;
  updateSelectedItem: (patch: Partial<GridItem>) => void;
}) {
  return (
    <div className="space-y-4">
      <Field label="justify-items">
        <OptionSelect
          value={state.justifyItems}
          options={selfAlignmentValues.filter((value) => value !== "auto")}
          onChange={(value) =>
            patchState({ justifyItems: value as GridSelfAlignment })
          }
        />
      </Field>
      <Field label="align-items">
        <OptionSelect
          value={state.alignItems}
          options={selfAlignmentValues.filter((value) => value !== "auto")}
          onChange={(value) =>
            patchState({ alignItems: value as GridSelfAlignment })
          }
        />
      </Field>
      <Field label="justify-content">
        <OptionSelect
          value={state.justifyContent}
          options={containerAlignmentValues}
          onChange={(value) =>
            patchState({ justifyContent: value as GridAlignment })
          }
        />
      </Field>
      <Field label="align-content">
        <OptionSelect
          value={state.alignContent}
          options={containerAlignmentValues}
          onChange={(value) =>
            patchState({ alignContent: value as GridAlignment })
          }
        />
      </Field>
      {selectedItem ? (
        <div className="border-t border-[var(--color-border)] pt-4">
          <Field label={`${selectedItem.name} justify-self`}>
            <OptionSelect
              value={selectedItem.justifySelf}
              options={selfAlignmentValues}
              onChange={(value) =>
                updateSelectedItem({ justifySelf: value as GridSelfAlignment })
              }
            />
          </Field>
          <Field label={`${selectedItem.name} align-self`} className="mt-3">
            <OptionSelect
              value={selectedItem.alignSelf}
              options={selfAlignmentValues}
              onChange={(value) =>
                updateSelectedItem({ alignSelf: value as GridSelfAlignment })
              }
            />
          </Field>
        </div>
      ) : null}
    </div>
  );
}

function ResponsiveControls({
  state,
  patchState,
}: {
  state: GridGeneratorState;
  patchState: (patch: Partial<GridGeneratorState>) => void;
}) {
  return (
    <div className="space-y-4">
      <Toggle
        label="Enable responsive CSS"
        checked={state.responsive.enabled}
        onChange={(checked) =>
          patchState({ responsive: { ...state.responsive, enabled: checked } })
        }
      />
      <Field label="Tablet breakpoint">
        <Input
          type="number"
          min={560}
          max={1024}
          value={state.responsive.tabletBreakpoint}
          onChange={(event) =>
            patchState({
              responsive: {
                ...state.responsive,
                tabletBreakpoint: Number(event.target.value),
              },
            })
          }
        />
      </Field>
      <Field label="Mobile breakpoint">
        <Input
          type="number"
          min={320}
          max={640}
          value={state.responsive.mobileBreakpoint}
          onChange={(event) =>
            patchState({
              responsive: {
                ...state.responsive,
                mobileBreakpoint: Number(event.target.value),
              },
            })
          }
        />
      </Field>
      <Field label="Tablet columns">
        <Input
          type="number"
          min={1}
          max={6}
          value={state.responsive.tabletColumns}
          onChange={(event) =>
            patchState({
              responsive: {
                ...state.responsive,
                tabletColumns: Number(event.target.value),
              },
            })
          }
        />
      </Field>
      <Field label="Mobile behavior">
        <Select
          value={state.responsive.mobileBehavior}
          onChange={(event) =>
            patchState({
              responsive: {
                ...state.responsive,
                mobileBehavior: event.target
                  .value as GridGeneratorState["responsive"]["mobileBehavior"],
              },
            })
          }
        >
          <option value="stack">Stack items</option>
          <option value="preserve">Preserve placement</option>
          <option value="two-column">Two-column compact</option>
        </Select>
      </Field>
    </div>
  );
}

function ExportControls({
  state,
  patchState,
  downloadFile,
  css,
  html,
}: {
  state: GridGeneratorState;
  patchState: (patch: Partial<GridGeneratorState>) => void;
  downloadFile: (filename: string, content: string, type?: string) => void;
  css: string;
  html: string;
}) {
  return (
    <div className="space-y-4">
      <Field label="Container class">
        <Input
          value={state.containerClassName}
          onChange={(event) =>
            patchState({
              containerClassName:
                event.target.value.replace(/[^a-zA-Z0-9_-]/g, "") ||
                "grid-layout",
            })
          }
        />
      </Field>
      <Field label="Item class prefix">
        <Input
          value={state.itemClassPrefix}
          onChange={(event) =>
            patchState({
              itemClassPrefix:
                event.target.value.replace(/[^a-zA-Z0-9_-]/g, "") ||
                "grid-item",
            })
          }
        />
      </Field>
      <Button
        variant="secondary"
        fullWidth
        onClick={() => downloadFile("grid-layout.css", css, "text/css")}
        leftIcon={<Download className="h-4 w-4" />}
      >
        Download CSS
      </Button>
      <Button
        variant="secondary"
        fullWidth
        onClick={() =>
          downloadFile(
            "grid-layout.html",
            `<!doctype html>\n<html>\n<head>\n<style>\n${css}\n</style>\n</head>\n<body>\n${html}\n</body>\n</html>`,
            "text/html",
          )
        }
        leftIcon={<Download className="h-4 w-4" />}
      >
        Download HTML
      </Button>
    </div>
  );
}

function OptionSelect<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
}) {
  return (
    <Select
      value={value}
      onChange={(event) => onChange(event.target.value as T)}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </Select>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-3 py-2 text-sm font-semibold text-[var(--color-text)]">
      <span>{label}</span>
      <input
        type="checkbox"
        className="h-5 w-5 accent-[var(--color-accent)]"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}

function MiniPreset({ state }: { state: GridGeneratorState }) {
  const previewState = normalizeGridState(state);
  return (
    <span
      className="grid h-20 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white p-1 dark:bg-slate-950"
      style={{
        gridTemplateColumns: `repeat(${previewState.columns}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${previewState.rows}, minmax(0, 1fr))`,
        gap: 3,
      }}
      aria-hidden
    >
      {previewState.items.slice(0, 8).map((item) => (
        <span
          key={item.id}
          className="rounded-md opacity-90"
          style={{
            gridColumn: `${item.columnStart} / ${item.columnEnd}`,
            gridRow: `${item.rowStart} / ${item.rowEnd}`,
            background: item.background,
          }}
        />
      ))}
    </span>
  );
}

function LineNumbers({ columns, rows }: { columns: number; rows: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 hidden text-[10px] font-bold text-slate-500 md:block">
      <div className="absolute left-3 right-3 top-1 flex justify-between">
        {Array.from({ length: columns + 1 }, (_, index) => (
          <span
            key={`c-${index}`}
            className="rounded-full bg-white/90 px-1 shadow dark:bg-slate-800"
          >
            {index + 1}
          </span>
        ))}
      </div>
      <div className="absolute bottom-1 top-8 flex flex-col justify-between">
        {Array.from({ length: rows + 1 }, (_, index) => (
          <span
            key={`r-${index}`}
            className="rounded-full bg-white/90 px-1 shadow dark:bg-slate-800"
          >
            {index + 1}
          </span>
        ))}
      </div>
    </div>
  );
}
