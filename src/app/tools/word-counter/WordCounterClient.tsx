"use client";

import { useMemo, useState } from "react";
import { Button, CopyButton } from "@/components/ui";
import { EditorPanel, ToolControlPanel, ControlSection, WarningPanel } from "@/features/tools/components";
import { ToolLayoutTextWorkbench } from "@/features/tools/layouts";
import { downloadText } from "../_shared/clientUtils";
import {
  buildStatsSummary,
  computeWordStats,
  formatDuration,
  PLATFORM_LIMITS,
  SAMPLE_TEXT,
  topWords,
} from "./stats";

const PRIMARY_STATS = [
  { key: "words", label: "Words" },
  { key: "characters", label: "Characters" },
  { key: "charactersNoSpaces", label: "Characters (no spaces)" },
  { key: "sentences", label: "Sentences" },
  { key: "paragraphs", label: "Paragraphs" },
  { key: "lines", label: "Lines" },
] as const;

export default function WordCounterClient() {
  const [input, setInput] = useState("");

  const stats = useMemo(() => computeWordStats(input), [input]);
  const frequencies = useMemo(() => topWords(input), [input]);
  const summary = useMemo(() => buildStatsSummary(stats), [stats]);
  const maxFrequency = frequencies[0]?.count ?? 0;

  return (
    <ToolLayoutTextWorkbench
      inputSlot={
        <EditorPanel
          title="Your text"
          language="Text"
          value={input}
          onChange={setInput}
          minRows={15}
          placeholder="Start typing or paste your text here. Counts update as you type."
          actions={
            <>
              <Button size="sm" variant="secondary" onClick={() => setInput(SAMPLE_TEXT)}>Sample</Button>
              <Button size="sm" variant="ghost" onClick={() => setInput("")} disabled={!input}>Clear</Button>
            </>
          }
          footer={`${stats.characters.toLocaleString()} chars · ${stats.words.toLocaleString()} words · ${formatDuration(stats.readingTimeSec)} read`}
        />
      }
      outputSlot={
        <section className="flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-sm)]">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/75 px-4 py-3">
            <h2 className="text-sm font-bold tracking-[-0.01em] text-[var(--color-text-primary)]">Statistics</h2>
            <div className="flex items-center gap-2">
              <CopyButton text={summary} size="sm" variant="secondary">Copy stats</CopyButton>
              <Button size="sm" variant="secondary" disabled={!input} onClick={() => downloadText("text-stats.txt", summary)}>Download</Button>
            </div>
          </div>
          <div className="grid flex-1 grid-cols-2 gap-3 p-4 sm:grid-cols-3">
            {PRIMARY_STATS.map((item) => (
              <div key={item.key} className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3 text-center shadow-[inset_0_1px_0_var(--color-border-subtle)]">
                <div className="font-mono text-2xl font-black tracking-tight text-[var(--color-text-primary)]">
                  {stats[item.key].toLocaleString()}
                </div>
                <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </section>
      }
      optionsSlot={
        <ToolControlPanel title="Platform limits" description="See how your text fits common length limits for titles, posts, and descriptions.">
          <ControlSection title="Character limits">
            <ul className="space-y-2.5">
              {PLATFORM_LIMITS.map((limit) => {
                const remaining = limit.max - stats.characters;
                const over = remaining < 0;
                const pct = Math.min(100, (stats.characters / limit.max) * 100);
                return (
                  <li key={limit.id}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[var(--color-text-secondary)]">{limit.label}</span>
                      <span className={`font-mono font-semibold ${over ? "text-[var(--color-danger)]" : "text-[var(--color-text-tertiary)]"}`}>
                        {stats.characters.toLocaleString()} / {limit.max.toLocaleString()}
                        {over ? ` (${Math.abs(remaining).toLocaleString()} over)` : ""}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-subtle)]">
                      <div
                        className={`h-full rounded-full transition-[width] ${over ? "bg-[var(--color-danger)]" : "bg-[var(--color-primary)]"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </ControlSection>
        </ToolControlPanel>
      }
      statsSlot={
        <div className="space-y-4">
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-4 shadow-[var(--shadow-sm)]">
            <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Details</h3>
            <dl className="mt-3 space-y-2 text-sm">
              {[
                { label: "Reading time", value: formatDuration(stats.readingTimeSec) },
                { label: "Speaking time", value: formatDuration(stats.speakingTimeSec) },
                { label: "Unique words", value: stats.uniqueWords.toLocaleString() },
                { label: "Avg. word length", value: stats.averageWordLength.toFixed(1) },
                { label: "Longest word", value: `${stats.longestWordLength} chars` },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-3">
                  <dt className="text-[var(--color-text-tertiary)]">{row.label}</dt>
                  <dd className="font-mono font-semibold text-[var(--color-text-primary)]">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {frequencies.length > 0 ? (
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-4 shadow-[var(--shadow-sm)]">
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Top words</h3>
              <ul className="mt-3 space-y-2">
                {frequencies.map((item) => (
                  <li key={item.word} className="text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="min-w-0 truncate font-medium text-[var(--color-text-secondary)]">{item.word}</span>
                      <span className="font-mono text-xs text-[var(--color-text-tertiary)]">{item.count}</span>
                    </div>
                    <div className="mt-1 h-1 overflow-hidden rounded-full bg-[var(--color-surface-subtle)]">
                      <div className="h-full rounded-full bg-[var(--color-primary-soft)]" style={{ width: `${maxFrequency ? (item.count / maxFrequency) * 100 : 0}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <WarningPanel messages={[{ id: "local", severity: "info", title: "Local processing", message: "Your text stays in your browser and is never uploaded." }]} />
        </div>
      }
    />
  );
}
