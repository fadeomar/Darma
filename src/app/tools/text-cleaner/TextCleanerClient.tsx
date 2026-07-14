"use client";

import JSZip from "jszip";
import { useMemo, useRef, useState } from "react";
import {
  Archive,
  Braces,
  ChevronLeft,
  ChevronRight,
  FileJson,
  FileText,
  Play,
  Plus,
  Table2,
  Upload,
  X,
} from "lucide-react";
import { Badge, Button, Card, Input } from "@/components/ui";
import {
  ControlGrid,
  ControlSection,
  EditorPanel,
  SegmentedControl,
  ToolActionBar,
  ToolControlPanel,
  WarningPanel,
  type WarningMessage,
} from "@/features/tools/components";
import { downloadBlobFile } from "@/features/tools/export/downloadBlob";
import { downloadTextFile } from "@/features/tools/export/downloadText";
import { ToolLayoutTextWorkbench } from "@/features/tools/layouts";
import { TEXT_CLEANER_PRESETS } from "./presets";
import {
  SAMPLE_TEXT,
  TEXT_ACTION_GROUPS,
  DEFAULT_PREFIX_TEXT,
  DEFAULT_SUFFIX_TEXT,
  computeStats,
  getTransformById,
  type TextActionGroup,
} from "./transforms";
import {
  buildTextCleanerAudit,
  buildTextCleanerJavaScript,
  buildTextCleanerMarkdownReport,
  buildTextCleanerMetricsCsv,
  buildTextCleanerProductionFiles,
  buildTextCleanerSnapshot,
  buildTextCleanerSummaryCards,
  createTextCleanerProject,
  firstWorkflowGroup,
  parseTextCleanerProject,
  runTextCleanerWorkflow,
  summarizeTextCleanerAudit,
  type TextCleanerAuditCheck,
  type TextCleanerWorkflow,
} from "./studio";

type TextCleanerTool = {
  id: string;
  title: string;
};

type LastRun = {
  input: string;
  workflow: TextCleanerWorkflow;
};

const IMPORT_LIMIT_BYTES = 1_000_000;

function formatStatsLine(stats: ReturnType<typeof computeStats>) {
  return `${stats.characters.toLocaleString()} chars / ${stats.words.toLocaleString()} words / ${stats.lines.toLocaleString()} lines`;
}

function signed(value: number) {
  if (!value) return "0";
  return `${value > 0 ? "+" : ""}${value.toLocaleString()}`;
}

function auditToWarning(check: TextCleanerAuditCheck): WarningMessage {
  return {
    id: check.id,
    title: check.title,
    message: check.message,
    severity:
      check.severity === "error"
        ? "danger"
        : check.severity === "warning"
          ? "warning"
          : check.severity === "pass"
            ? "success"
            : "info",
  };
}

function SummaryCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3 shadow-[var(--shadow-xs)]">
      <div className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
        {label}
      </div>
      <div className="mt-1 break-words text-base font-black tracking-[-0.02em] text-[var(--color-text-primary)]">
        {value}
      </div>
      <p className="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">
        {detail}
      </p>
    </div>
  );
}

export default function TextCleanerClient({
  tool,
}: {
  tool?: TextCleanerTool;
}) {
  const importRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [activeGroup, setActiveGroup] = useState<TextActionGroup>("clean");
  const [selectedActionIds, setSelectedActionIds] = useState<string[]>([]);
  const [prefixText, setPrefixText] = useState(DEFAULT_PREFIX_TEXT);
  const [suffixText, setSuffixText] = useState(DEFAULT_SUFFIX_TEXT);
  const [lastRun, setLastRun] = useState<LastRun | null>(null);
  const [exporting, setExporting] = useState(false);
  const [importMessage, setImportMessage] = useState<WarningMessage | null>(
    null,
  );

  const currentWorkflow = useMemo<TextCleanerWorkflow>(
    () => ({ actionIds: selectedActionIds, prefixText, suffixText }),
    [prefixText, selectedActionIds, suffixText],
  );
  const activeWorkflow = lastRun?.workflow ?? currentWorkflow;
  const isCurrent = Boolean(lastRun && lastRun.input === input);
  const inputStats = useMemo(() => computeStats(input), [input]);
  const outputStats = useMemo(() => computeStats(output), [output]);
  const activeTransforms =
    TEXT_ACTION_GROUPS.find((group) => group.id === activeGroup)?.transforms ??
    [];
  const selectedTransforms = selectedActionIds
    .map(getTransformById)
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const snapshot = useMemo(
    () =>
      buildTextCleanerSnapshot({
        input,
        output,
        workflow: activeWorkflow,
        hasRun: Boolean(lastRun),
        isCurrent,
      }),
    [activeWorkflow, input, isCurrent, lastRun, output],
  );
  const audit = useMemo(() => buildTextCleanerAudit(snapshot), [snapshot]);
  const auditSummary = useMemo(() => summarizeTextCleanerAudit(audit), [audit]);
  const summaryCards = useMemo(
    () => buildTextCleanerSummaryCards(snapshot, audit),
    [audit, snapshot],
  );
  const canExportResult = Boolean(
    lastRun && isCurrent && !auditSummary.counts.error,
  );

  function runWorkflow(workflow: TextCleanerWorkflow) {
    const result = runTextCleanerWorkflow(input, workflow);
    setOutput(result);
    setLastRun({
      input,
      workflow: { ...workflow, actionIds: [...workflow.actionIds] },
    });
    setImportMessage(null);
  }

  function runAction(actionId: string) {
    runWorkflow({ actionIds: [actionId], prefixText, suffixText });
  }

  function togglePipelineAction(actionId: string) {
    setSelectedActionIds((current) =>
      current.includes(actionId)
        ? current.filter((id) => id !== actionId)
        : [...current, actionId],
    );
  }

  function movePipelineAction(index: number, direction: -1 | 1) {
    setSelectedActionIds((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function runSelectedPipeline() {
    runWorkflow(currentWorkflow);
  }

  function applyPreset(actionIds: string[]) {
    const workflow = { actionIds, prefixText, suffixText };
    setSelectedActionIds(actionIds);
    setActiveGroup(firstWorkflowGroup(workflow));
    if (input) runWorkflow(workflow);
  }

  function resetAll() {
    setInput("");
    setOutput("");
    setSelectedActionIds([]);
    setPrefixText(DEFAULT_PREFIX_TEXT);
    setSuffixText(DEFAULT_SUFFIX_TEXT);
    setActiveGroup("clean");
    setLastRun(null);
    setImportMessage(null);
  }

  function downloadWorkflow() {
    downloadTextFile({
      content: `${JSON.stringify(createTextCleanerProject(currentWorkflow), null, 2)}\n`,
      filename: "text-cleaner-workflow.json",
      mimeType: "application/json;charset=utf-8",
    });
  }

  function downloadReport() {
    downloadTextFile({
      content: buildTextCleanerMarkdownReport(snapshot, audit),
      filename: "text-cleaner-report.md",
      mimeType: "text/markdown;charset=utf-8",
    });
  }

  function downloadMetrics() {
    downloadTextFile({
      content: buildTextCleanerMetricsCsv(snapshot),
      filename: "text-cleaner-metrics.csv",
      mimeType: "text/csv;charset=utf-8",
    });
  }

  function downloadJavaScript() {
    downloadTextFile({
      content: buildTextCleanerJavaScript(currentWorkflow),
      filename: "text-cleaner-pipeline.js",
      mimeType: "text/javascript;charset=utf-8",
    });
  }

  async function downloadProductionPack() {
    if (!canExportResult) return;
    setExporting(true);
    try {
      const zip = new JSZip();
      const files = buildTextCleanerProductionFiles(snapshot);
      for (const [filename, content] of Object.entries(files))
        zip.file(filename, content);
      const blob = await zip.generateAsync({ type: "blob" });
      downloadBlobFile({ blob, filename: "text-cleaner-production-pack.zip" });
    } finally {
      setExporting(false);
    }
  }

  async function importWorkflow(file: File) {
    if (file.size > IMPORT_LIMIT_BYTES) {
      setImportMessage({
        id: "import-size",
        title: "Workflow file is too large",
        message: "Choose a Text Cleaner workflow JSON file smaller than 1 MB.",
        severity: "danger",
      });
      return;
    }

    try {
      const workflow = parseTextCleanerProject(await file.text());
      setSelectedActionIds(workflow.actionIds);
      setPrefixText(workflow.prefixText);
      setSuffixText(workflow.suffixText);
      setActiveGroup(firstWorkflowGroup(workflow));
      setOutput("");
      setLastRun(null);
      setImportMessage({
        id: "import-success",
        title: "Workflow imported",
        message: `${workflow.actionIds.length} ordered ${workflow.actionIds.length === 1 ? "step was" : "steps were"} loaded. Input text was not changed.`,
        severity: "success",
      });
    } catch (error) {
      setImportMessage({
        id: "import-error",
        title: "Workflow import failed",
        message:
          error instanceof Error
            ? error.message
            : "The selected workflow could not be read.",
        severity: "danger",
      });
    }
  }

  return (
    <ToolLayoutTextWorkbench
      inputSlot={
        <EditorPanel
          title="Input text"
          language="Text"
          value={input}
          onChange={setInput}
          minRows={16}
          placeholder="Paste messy text here..."
          footer={formatStatsLine(inputStats)}
        />
      }
      outputSlot={
        <EditorPanel
          title="Output"
          language="Text"
          value={output}
          readOnly
          minRows={16}
          placeholder="Run an action, preset, or selected pipeline to create output."
          footer={
            output
              ? `${formatStatsLine(outputStats)} / ${signed(snapshot.metrics.characterDelta)} chars / ${snapshot.metrics.changedLines.toLocaleString()} lines changed${isCurrent ? "" : " / input changed since run"}`
              : "Output stays local until you copy or download it."
          }
        />
      }
      actionsSlot={
        <ToolActionBar
          copyText={output}
          onDownload={() =>
            downloadTextFile({
              content: output,
              filename: "cleaned-text.txt",
              mimeType: "text/plain;charset=utf-8",
            })
          }
          onReset={resetAll}
          onSample={() => {
            setInput(SAMPLE_TEXT);
            setOutput("");
            setLastRun(null);
            setImportMessage(null);
          }}
          onUseOutputAsInput={() => {
            setInput(output);
            setOutput("");
            setLastRun(null);
          }}
          tool={tool}
          className="border-0 bg-transparent p-0 shadow-none"
        />
      }
      optionsSlot={
        <ToolControlPanel
          title="Text Cleaner Production Studio"
          description="Build an ordered workflow, compare the result, and export a reusable local production pack."
          sticky={false}
        >
          <ControlSection
            title="Quick presets"
            description="Presets select an ordered workflow and run immediately when input is available."
          >
            <ControlGrid columns={3}>
              {TEXT_CLEANER_PRESETS.map((preset) => (
                <Button
                  key={preset.id}
                  size="sm"
                  variant="secondary"
                  onClick={() => applyPreset(preset.actionIds)}
                  title={preset.description}
                >
                  {preset.title}
                </Button>
              ))}
            </ControlGrid>
          </ControlSection>

          <ControlSection
            title="Selected workflow"
            description="Steps run from left to right. Reorder them before running or exporting the workflow."
            action={
              <Button
                size="sm"
                variant="ghost"
                disabled={!selectedActionIds.length}
                onClick={() => setSelectedActionIds([])}
              >
                Clear
              </Button>
            }
          >
            {selectedTransforms.length ? (
              <ol className="space-y-2">
                {selectedTransforms.map((transform, index) => (
                  <li
                    key={transform.id}
                    className="flex min-w-0 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] p-2"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[var(--radius-full)] bg-[var(--color-surface-subtle)] font-mono text-[10px] font-bold text-[var(--color-text-tertiary)]">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-xs font-bold text-[var(--color-text-primary)]">
                      {transform.label}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 min-h-0"
                      disabled={index === 0}
                      onClick={() => movePipelineAction(index, -1)}
                      aria-label={`Move ${transform.label} earlier`}
                      leftIcon={
                        <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
                      }
                    >
                      Move earlier
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 min-h-0"
                      disabled={index === selectedTransforms.length - 1}
                      onClick={() => movePipelineAction(index, 1)}
                      aria-label={`Move ${transform.label} later`}
                      leftIcon={
                        <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                      }
                    >
                      Move later
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 min-h-0"
                      onClick={() => togglePipelineAction(transform.id)}
                      aria-label={`Remove ${transform.label} from workflow`}
                      leftIcon={<X className="h-3.5 w-3.5" aria-hidden />}
                    >
                      Remove step
                    </Button>
                  </li>
                ))}
              </ol>
            ) : (
              <Card
                padding="sm"
                className="text-sm leading-6 text-[var(--color-text-secondary)]"
              >
                Add actions from the library below or choose a preset to build a
                reusable cleanup workflow.
              </Card>
            )}
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                disabled={!input || !selectedActionIds.length}
                onClick={runSelectedPipeline}
                leftIcon={<Play className="h-4 w-4" aria-hidden />}
              >
                Run workflow
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={!output}
                onClick={() => {
                  setInput(output);
                  setOutput("");
                  setLastRun(null);
                }}
              >
                Use output as input
              </Button>
            </div>
          </ControlSection>

          <ControlSection
            title="Actions library"
            description="Run one action immediately or add it to the ordered workflow."
          >
            <SegmentedControl<TextActionGroup>
              ariaLabel="Text action group"
              value={activeGroup}
              onChange={setActiveGroup}
              options={TEXT_ACTION_GROUPS.map((group) => ({
                value: group.id,
                label: group.label,
              }))}
              fullWidth
            />
            {activeGroup === "format" ? (
              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
                  Prefix text
                  <Input
                    value={prefixText}
                    onChange={(event) => setPrefixText(event.target.value)}
                    placeholder={DEFAULT_PREFIX_TEXT}
                    size="sm"
                  />
                </label>
                <label className="grid gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
                  Suffix text
                  <Input
                    value={suffixText}
                    onChange={(event) => setSuffixText(event.target.value)}
                    placeholder={DEFAULT_SUFFIX_TEXT}
                    size="sm"
                  />
                </label>
              </div>
            ) : null}
            <div className="grid gap-3 md:grid-cols-2">
              {activeTransforms.map((transform) => {
                const selected = selectedActionIds.includes(transform.id);
                return (
                  <Card key={transform.id} padding="sm" className="space-y-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                          {transform.label}
                        </h3>
                        {selected ? (
                          <Badge variant="soft">Selected</Badge>
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs leading-5 text-[var(--color-text-tertiary)]">
                        {transform.title}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        disabled={!input}
                        onClick={() => runAction(transform.id)}
                        leftIcon={<Play className="h-4 w-4" aria-hidden />}
                      >
                        Run
                      </Button>
                      <Button
                        size="sm"
                        variant={selected ? "soft" : "secondary"}
                        onClick={() => togglePipelineAction(transform.id)}
                        leftIcon={
                          selected ? (
                            <X className="h-4 w-4" aria-hidden />
                          ) : (
                            <Plus className="h-4 w-4" aria-hidden />
                          )
                        }
                      >
                        {selected ? "Remove" : "Add"}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </ControlSection>
        </ToolControlPanel>
      }
      statsSlot={
        <div className="space-y-4">
          <section
            className="grid grid-cols-2 gap-3"
            aria-label="Text Cleaner summary"
          >
            {summaryCards.map((card) => (
              <SummaryCard key={card.label} {...card} />
            ))}
          </section>

          {importMessage ? <WarningPanel messages={[importMessage]} /> : null}

          <ToolControlPanel
            title="Production checks"
            description="Review workflow order, result freshness, destructive steps, performance, and export privacy."
            sticky={false}
          >
            <WarningPanel messages={audit.map(auditToWarning)} />
          </ToolControlPanel>

          <ToolControlPanel
            title="Workflow and exports"
            description="Workflow JSON excludes text. Reports exclude source content; the ZIP intentionally includes the cleaned result."
            sticky={false}
          >
            <input
              ref={importRef}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) void importWorkflow(file);
              }}
            />
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => importRef.current?.click()}
                leftIcon={<Upload className="h-4 w-4" aria-hidden />}
              >
                Import workflow
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={downloadWorkflow}
                leftIcon={<FileJson className="h-4 w-4" aria-hidden />}
              >
                Workflow JSON
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={!lastRun}
                onClick={downloadReport}
                leftIcon={<FileText className="h-4 w-4" aria-hidden />}
              >
                Markdown report
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={!lastRun}
                onClick={downloadMetrics}
                leftIcon={<Table2 className="h-4 w-4" aria-hidden />}
              >
                Metrics CSV
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={downloadJavaScript}
                leftIcon={<Braces className="h-4 w-4" aria-hidden />}
              >
                JavaScript runner
              </Button>
              <Button
                size="sm"
                disabled={!canExportResult}
                loading={exporting}
                onClick={() => void downloadProductionPack()}
                leftIcon={<Archive className="h-4 w-4" aria-hidden />}
              >
                Production ZIP
              </Button>
            </div>
            {!canExportResult ? (
              <p className="text-xs leading-5 text-[var(--color-text-tertiary)]">
                Run a valid workflow on the current input before creating the
                production ZIP.
              </p>
            ) : null}
          </ToolControlPanel>
        </div>
      }
    />
  );
}
