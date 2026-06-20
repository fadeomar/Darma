"use client";

import { useMemo, useState } from "react";
import { Plus, Play, X } from "lucide-react";
import { Badge, Button, Card, Input } from "@/components/ui";
import {
  ControlGrid,
  ControlSection,
  EditorPanel,
  SegmentedControl,
  ToolActionBar,
  ToolControlPanel,
  WarningPanel,
} from "@/features/tools/components";
import { ToolLayoutTextWorkbench } from "@/features/tools/layouts";
import { downloadText } from "../_shared/clientUtils";
import { TEXT_CLEANER_PRESETS } from "./presets";
import {
  SAMPLE_TEXT,
  TEXT_ACTION_GROUPS,
  DEFAULT_PREFIX_TEXT,
  DEFAULT_SUFFIX_TEXT,
  computeStats,
  formatReadingTime,
  getTransformById,
  runPipeline,
  type TextActionGroup,
} from "./transforms";

type TextCleanerTool = {
  id: string;
  title: string;
};

function formatStatsLine(stats: ReturnType<typeof computeStats>) {
  return `${stats.characters.toLocaleString()} chars / ${stats.words.toLocaleString()} words / ${stats.lines.toLocaleString()} lines`;
}

export default function TextCleanerClient({ tool }: { tool?: TextCleanerTool }) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [activeGroup, setActiveGroup] = useState<TextActionGroup>("clean");
  const [selectedActionIds, setSelectedActionIds] = useState<string[]>([]);
  const [prefixText, setPrefixText] = useState(DEFAULT_PREFIX_TEXT);
  const [suffixText, setSuffixText] = useState(DEFAULT_SUFFIX_TEXT);

  const inputStats = useMemo(() => computeStats(input), [input]);
  const outputStats = useMemo(() => computeStats(output), [output]);
  const activeTransforms = TEXT_ACTION_GROUPS.find((group) => group.id === activeGroup)?.transforms ?? [];
  const selectedTransforms = selectedActionIds.map(getTransformById).filter((item): item is NonNullable<typeof item> => Boolean(item));
  const transformContext = useMemo(() => ({ prefixText, suffixText }), [prefixText, suffixText]);

  function runAction(actionId: string) {
    const transform = getTransformById(actionId);
    if (!transform) return;
    setOutput(transform.fn(input, transformContext));
  }

  function togglePipelineAction(actionId: string) {
    setSelectedActionIds((current) =>
      current.includes(actionId) ? current.filter((id) => id !== actionId) : [...current, actionId],
    );
  }

  function runSelectedPipeline() {
    setOutput(runPipeline(input, selectedActionIds, transformContext));
  }

  function applyPreset(actionIds: string[]) {
    setSelectedActionIds(actionIds);
    if (input) setOutput(runPipeline(input, actionIds, transformContext));
  }

  function resetAll() {
    setInput("");
    setOutput("");
    setSelectedActionIds([]);
    setPrefixText(DEFAULT_PREFIX_TEXT);
    setSuffixText(DEFAULT_SUFFIX_TEXT);
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
          footer={output ? `${formatStatsLine(outputStats)} / ${Math.max(0, inputStats.characters - outputStats.characters).toLocaleString()} chars removed` : "Output stays local until you copy or download it."}
        />
      }
      actionsSlot={
        <ToolActionBar
          copyText={output}
          onDownload={() => downloadText("cleaned-text.txt", output)}
          onReset={resetAll}
          onSample={() => {
            setInput(SAMPLE_TEXT);
            setOutput("");
          }}
          onUseOutputAsInput={() => {
            setInput(output);
            setOutput("");
          }}
          tool={tool}
          className="border-0 bg-transparent p-0 shadow-none"
        />
      }
      optionsSlot={
        <ToolControlPanel
          title="Text Cleaner Pro"
          description="Run one action immediately, or build a selected pipeline and run the actions in order."
          sticky={false}
        >
          <ControlSection title="Quick presets" description="Preset buttons select a useful pipeline and run it when input is available.">
            <ControlGrid columns={3}>
              {TEXT_CLEANER_PRESETS.map((preset) => (
                <Button key={preset.id} size="sm" variant="secondary" onClick={() => applyPreset(preset.actionIds)} title={preset.description}>
                  {preset.title}
                </Button>
              ))}
            </ControlGrid>
          </ControlSection>

          <ControlSection
            title="Selected pipeline"
            description="Actions run from left to right. Clear the pipeline when you want to start over."
            action={
              <Button size="sm" variant="ghost" disabled={!selectedActionIds.length} onClick={() => setSelectedActionIds([])}>
                Clear
              </Button>
            }
          >
            {selectedTransforms.length ? (
              <div className="flex flex-wrap gap-2">
                {selectedTransforms.map((transform, index) => (
                  <button
                    key={`${transform.id}-${index}`}
                    type="button"
                    onClick={() => setSelectedActionIds((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                    className="inline-flex min-h-8 items-center gap-2 rounded-[var(--radius-full)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] px-3 text-xs font-semibold text-[var(--color-text-primary)] transition hover:border-[var(--color-border-strong)] focus:outline-none focus:shadow-[var(--focus-ring)]"
                    aria-label={`Remove ${transform.label} from pipeline`}
                  >
                    <span className="font-mono text-[10px] text-[var(--color-text-tertiary)]">{index + 1}</span>
                    {transform.label}
                    <X className="h-3.5 w-3.5" aria-hidden />
                  </button>
                ))}
              </div>
            ) : (
              <Card padding="sm" className="text-sm leading-6 text-[var(--color-text-secondary)]">
                Add actions from the library below to build a reusable cleanup flow.
              </Card>
            )}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" disabled={!input || !selectedActionIds.length} onClick={runSelectedPipeline} leftIcon={<Play className="h-4 w-4" aria-hidden />}>
                Run selected actions
              </Button>
              <Button size="sm" variant="secondary" disabled={!output} onClick={() => setInput(output)}>
                Use output as input
              </Button>
            </div>
          </ControlSection>

          <ControlSection title="Actions library" description="Run immediately, or add actions to the selected pipeline.">
            <SegmentedControl<TextActionGroup>
              ariaLabel="Text action group"
              value={activeGroup}
              onChange={setActiveGroup}
              options={TEXT_ACTION_GROUPS.map((group) => ({ value: group.id, label: group.label }))}
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
                        <h3 className="text-sm font-bold text-[var(--color-text-primary)]">{transform.label}</h3>
                        {selected ? <Badge variant="soft">Selected</Badge> : null}
                      </div>
                      <p className="mt-1 text-xs leading-5 text-[var(--color-text-tertiary)]">{transform.title}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" disabled={!input} onClick={() => runAction(transform.id)} leftIcon={<Play className="h-4 w-4" aria-hidden />}>
                        Run
                      </Button>
                      <Button
                        size="sm"
                        variant={selected ? "soft" : "secondary"}
                        onClick={() => togglePipelineAction(transform.id)}
                        leftIcon={selected ? <X className="h-4 w-4" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />}
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
          <Card padding="md">
            <Badge variant="soft">Stats</Badge>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-2xl font-black text-[var(--color-text-primary)]">{inputStats.words.toLocaleString()}</p>
                <p className="text-xs text-[var(--color-text-tertiary)]">Input words</p>
              </div>
              <div>
                <p className="text-2xl font-black text-[var(--color-text-primary)]">{outputStats.words.toLocaleString()}</p>
                <p className="text-xs text-[var(--color-text-tertiary)]">Output words</p>
              </div>
              <div>
                <p className="text-lg font-black text-[var(--color-text-primary)]">{formatReadingTime(inputStats.readingTimeSec)}</p>
                <p className="text-xs text-[var(--color-text-tertiary)]">Input read time</p>
              </div>
              <div>
                <p className="text-lg font-black text-[var(--color-text-primary)]">{selectedActionIds.length}</p>
                <p className="text-xs text-[var(--color-text-tertiary)]">Pipeline actions</p>
              </div>
            </div>
          </Card>
          <WarningPanel messages={[{ id: "local", severity: "info", title: "Local processing", message: "Text cleanup runs in your browser. Darma does not upload this text or require login." }]} />
        </div>
      }
    />
  );
}
