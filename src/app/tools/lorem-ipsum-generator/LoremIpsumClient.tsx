"use client";

import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { Button, Select } from "@/components/ui";
import { CodeOutputPanel, ControlGrid, ControlSection, NumberField, SegmentedControl, ToolControlPanel, WarningPanel } from "@/features/tools/components";
import { ToolLayoutSingleUtility } from "@/features/tools/layouts";
import { downloadText } from "../_shared/clientUtils";
import { computeStats, formatReadingTime, generate } from "./generator";
import { DESIGN_PRESETS } from "./presets";
import type { CodeOutputTab } from "@/features/tools/components/CodeOutputPanel";
import type { GenerationMode, LoremConfig, OutputFormat, TextStyle } from "./types";

const MODE_DEFAULTS: Record<GenerationMode, number> = { words: 50, sentences: 5, paragraphs: 3, structured: 1 };
const DEFAULT_CONFIG: LoremConfig = { mode: "paragraphs", style: "readable", amount: MODE_DEFAULTS.paragraphs, blockLength: "medium", outputFormat: "plain", startWithLorem: false, includeHeadings: false, includeLists: false, structuredBlock: "hero" };

export default function LoremIpsumClient() {
  const [config, setConfig] = useState<LoremConfig>(DEFAULT_CONFIG);
  const [nonce, setNonce] = useState(0);
  const output = useMemo(() => generate(config), [config, nonce]);
  const stats = useMemo(() => computeStats(output.plain), [output.plain]);

  function patch(next: Partial<LoremConfig>) { setConfig((current) => ({ ...current, ...next })); }

  function handleDownload(tab: CodeOutputTab) {
    const isHtml = tab.id === "html";
    downloadText(
      isHtml ? "lorem.html" : "lorem.txt",
      tab.code,
      isHtml ? "text/html;charset=utf-8" : "text/plain;charset=utf-8",
    );
  }

  return (
    <ToolLayoutSingleUtility
      controlsSlot={
        <ToolControlPanel title="Content settings">
          <div className="grid gap-x-8 sm:grid-cols-2 sm:items-start">
            <ControlSection title="Mode">
              <SegmentedControl<GenerationMode>
                ariaLabel="Generation mode"
                value={config.mode}
                onChange={(mode) => patch({ mode, amount: MODE_DEFAULTS[mode] })}
                options={[
                  { value: "words", label: "Words" },
                  { value: "sentences", label: "Sentences" },
                  { value: "paragraphs", label: "Paragraphs" },
                  { value: "structured", label: "Structured" },
                ]}
              />
            </ControlSection>
            <ControlSection title="Controls" className="sm:border-t-0 sm:pt-0">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <NumberField label="Amount" value={config.amount} min={1} max={50} onChange={(amount) => patch({ amount })} />
                <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                  Style
                  <Select size="sm" className="mt-1 w-full" value={config.style} onChange={(e) => patch({ style: e.target.value as TextStyle })}>
                    <option value="classic">Classic</option>
                    <option value="readable">Readable</option>
                    <option value="startup">Startup</option>
                    <option value="ecommerce">Ecommerce</option>
                    <option value="blog">Blog</option>
                    <option value="profile">Profile</option>
                  </Select>
                </label>
                <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                  Format
                  <Select size="sm" className="mt-1 w-full" value={config.outputFormat} onChange={(e) => patch({ outputFormat: e.target.value as OutputFormat })}>
                    <option value="plain">Plain</option>
                    <option value="html">HTML</option>
                  </Select>
                </label>
              </div>
            </ControlSection>
          </div>
        </ToolControlPanel>
      }
      presetsSlot={
        <div className="flex flex-wrap gap-2">
          {DESIGN_PRESETS.slice(0, 8).map((preset) => (
            <Button key={preset.id} size="sm" variant="secondary" onClick={() => patch(preset.config)}>
              {preset.icon} {preset.label}
            </Button>
          ))}
        </div>
      }
      resultSlot={
        <CodeOutputPanel
          title="Generated placeholder content"
          description={`${stats.words} words · ${formatReadingTime(stats.readingTimeSeconds)}`}
          tabs={[
            { id: "plain", label: "Plain text", code: output.plain, language: "txt" },
            { id: "html", label: "HTML", code: output.html, language: "html" },
          ]}
          defaultTab={config.outputFormat === "html" ? "html" : "plain"}
          actions={<Button size="sm" leftIcon={<Sparkles className="h-3.5 w-3.5" />} onClick={() => setNonce((n) => n + 1)}>Generate</Button>}
          onDownload={handleDownload}
        />
      }
      infoSlot={
        <WarningPanel messages={[{ id: "copy", severity: "info", title: "Generated locally", message: "Use placeholder copy for layouts only. Replace with real content before publishing." }]} />
      }
    />
  );
}
