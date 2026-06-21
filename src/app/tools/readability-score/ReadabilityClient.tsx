"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui";
import { WarningPanel } from "@/features/tools/components";
import { ToolLayoutTextWorkbench } from "@/features/tools/layouts";
import { computeReadability } from "./readability";

const SAMPLE_TEXT = `Clear writing helps people act with confidence. A useful article begins with the reader's question and answers it without delay. Short sentences make the path easier to follow, while familiar words reduce the effort needed to understand each point. Good structure matters too. Headings show where ideas begin, lists make related details easy to scan, and examples turn abstract advice into something concrete. Writers should remove phrases that repeat the same thought. They should also explain necessary technical terms the first time those terms appear.

Editing is where plain language becomes strong. Read a draft aloud and notice where your voice slows down or runs out of breath. Those spots often contain a sentence that needs to be divided. Check whether each paragraph develops one main idea. Replace vague claims with specific facts, and move important instructions before background details. A friendly tone does not require jokes or casual slang. It comes from speaking directly, using active verbs, and respecting the reader's time. Finally, ask someone unfamiliar with the subject to read the work. Their questions reveal missing context that an expert may overlook. Readability scores can guide this process, but they cannot judge accuracy, warmth, or purpose. Revise carefully.`;

export default function ReadabilityClient() {
  const [text, setText] = useState("");
  const counts = useMemo(() => ({ characters: text.length, words: text.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g)?.length ?? 0 }), [text]);
  const result = useMemo(() => computeReadability(text), [text]);
  const progressClass = useMemo(() => {
    if (!result) return "bg-[var(--color-border-default)]";
    if (result.fleschReadingEase >= 70) return "bg-[var(--color-success)]";
    if (result.fleschReadingEase >= 50) return "bg-[var(--color-warning)]";
    if (result.fleschReadingEase >= 30) return "bg-[var(--color-primary)]";
    return "bg-[var(--color-danger)]";
  }, [result]);
  const supportingStats = useMemo(() => result ? [
    { label: "Syllables", value: result.syllableCount.toLocaleString() },
    { label: "Syllables / word", value: result.averageSyllablesPerWord.toFixed(2) },
    { label: "Words / sentence", value: result.averageWordsPerSentence.toFixed(2) },
  ] : [], [result]);

  return (
    <ToolLayoutTextWorkbench
      inputSlot={
        <section className="flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-sm)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/75 px-4 py-3">
            <div>
              <h2 className="text-sm font-bold text-[var(--color-text-primary)]">Text to score</h2>
              <div className="mt-1 inline-flex rounded-[var(--radius-full)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{counts.characters.toLocaleString()} characters · {counts.words.toLocaleString()} words</div>
            </div>
            <Button size="sm" variant="secondary" onClick={() => setText(SAMPLE_TEXT)}>Try sample</Button>
          </div>
          <div className="flex flex-1 p-4">
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              aria-label="Text to analyze"
              aria-invalid={Boolean(text.trim()) && !result}
              placeholder="Paste at least three sentences here…"
              className="min-h-[300px] w-full resize-y rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-control-bg)] p-4 text-sm leading-7 text-[var(--color-text-primary)] outline-none transition placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-primary)] focus:shadow-[var(--focus-ring)]"
            />
          </div>
        </section>
      }
      outputSlot={
        <section className="flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-sm)]" aria-live="polite">
          <div className="border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/75 px-4 py-3">
            <h2 className="text-sm font-bold text-[var(--color-text-primary)]">Readability result</h2>
          </div>
          <div className="flex flex-1 flex-col gap-4 p-4">
            {result ? (
              <>
                <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-5 text-center shadow-[inset_0_1px_0_var(--color-border-subtle)]">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Flesch Reading Ease</div>
                  <div className="mt-1 text-5xl font-black tracking-tight text-[var(--color-text-primary)]">{result.fleschReadingEase.toFixed(1)}</div>
                  <div className="mt-1 text-sm font-bold text-[var(--color-text-secondary)]">{result.label}</div>
                  <div className="mt-4 h-2 overflow-hidden rounded-[var(--radius-full)] bg-[var(--color-surface-subtle)]" role="progressbar" aria-label="Reading ease score" aria-valuemin={0} aria-valuemax={100} aria-valuenow={result.fleschReadingEase}>
                    <div className={`h-full rounded-[var(--radius-full)] ${progressClass}`} style={{ width: `${result.fleschReadingEase}%` }} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Flesch-Kincaid grade", value: result.fleschKincaidGrade.toFixed(1) },
                    { label: "Gunning Fog", value: result.gunningFog.toFixed(1) },
                  ].map((item) => (
                    <div key={item.label} className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 text-center">
                      <div className="font-mono text-2xl font-black text-[var(--color-text-primary)]">{item.value}</div>
                      <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{item.label}</div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {supportingStats.map((item) => (
                    <div key={item.label} className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3 text-center">
                      <div className="font-mono text-base font-black text-[var(--color-text-primary)]">{item.value}</div>
                      <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{item.label}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : <div className="flex flex-1 items-center justify-center text-center text-sm text-[var(--color-text-tertiary)]">Enter at least 3 sentences for a reliable score.</div>}
          </div>
        </section>
      }
      statsSlot={<WarningPanel messages={[{ id: "local", severity: "info", title: "About the score", message: "Calculated in your browser. Readability scores work best on 100+ words of prose. Results vary for technical jargon, poetry, or non-English text." }]} />}
    />
  );
}
