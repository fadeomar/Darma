"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Search, Upload } from "lucide-react";
import { Button, CopyButton, Input, Select } from "@/components/ui";
import {
  createDefaultFilters,
  findWords,
  groupByLength,
  parseDictionaryFile,
  validateFinder,
} from "./rack";
import { STARTER_WORDS } from "./starterWords";
import type { DictionarySource, FinderFilters, SortMode } from "./types";

const MESSAGE_STYLES = {
  info: "border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-[var(--color-info-text)]",
  warning: "border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]",
  error: "border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]",
} as const;

// De-duplicated starter dictionary, prepared once.
const STARTER_DICTIONARY = Array.from(new Set(STARTER_WORDS)).sort();

export default function ScrabbleWordFinderClient() {
  const [rack, setRack] = useState("");
  const [filters, setFilters] = useState<FinderFilters>(createDefaultFilters);
  const [sort, setSort] = useState<SortMode>("score");
  const [grouped, setGrouped] = useState(true);
  const [customDict, setCustomDict] = useState<string[] | null>(null);
  const [dictSource, setDictSource] = useState<DictionarySource>("starter");
  const [dictName, setDictName] = useState("Starter word list");
  const [status, setStatus] = useState("Enter your rack letters to find playable words.");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const dictionary = dictSource === "custom" && customDict ? customDict : STARTER_DICTIONARY;
  const results = useMemo(() => findWords(rack, dictionary, filters, sort), [rack, dictionary, filters, sort]);
  const groupedResults = useMemo(() => groupByLength(results), [results]);
  const messages = validateFinder(rack, dictionary.length);
  const best = results[0];

  const loadDictionary = useCallback((file: File | null | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const words = typeof reader.result === "string" ? parseDictionaryFile(reader.result) : [];
      if (words.length === 0) {
        setStatus("That file did not contain any valid words (expected one word per line).");
        return;
      }
      setCustomDict(words);
      setDictSource("custom");
      setDictName(`${file.name} (${words.length.toLocaleString()} words)`);
      setStatus(`Loaded ${words.length.toLocaleString()} words from ${file.name}.`);
    };
    reader.readAsText(file);
  }, []);

  const updateFilter = useCallback(<K extends keyof FinderFilters>(key: K, value: FinderFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const allWordsText = useMemo(() => results.map((r) => r.word).join(" "), [results]);

  return (
    <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
      {/* Controls */}
      <div className="flex min-w-0 flex-col gap-4">
        <label className="block text-xs font-bold text-[var(--color-text-secondary)]">
          Your letters (use ? for a blank)
          <Input
            className="mt-1"
            value={rack}
            onChange={(event) => setRack(event.target.value)}
            placeholder="e.g. rsteain?"
            spellCheck={false}
            autoFocus
          />
        </label>

        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs font-bold text-[var(--color-text-secondary)]">
            Contains
            <Input className="mt-1" value={filters.contains} onChange={(e) => updateFilter("contains", e.target.value)} spellCheck={false} />
          </label>
          <label className="text-xs font-bold text-[var(--color-text-secondary)]">
            Starts with
            <Input className="mt-1" value={filters.startsWith} onChange={(e) => updateFilter("startsWith", e.target.value)} spellCheck={false} />
          </label>
          <label className="text-xs font-bold text-[var(--color-text-secondary)]">
            Ends with
            <Input className="mt-1" value={filters.endsWith} onChange={(e) => updateFilter("endsWith", e.target.value)} spellCheck={false} />
          </label>
          <label className="text-xs font-bold text-[var(--color-text-secondary)]">
            Min length
            <Input
              className="mt-1"
              type="number"
              min={2}
              max={15}
              value={filters.minLength}
              onChange={(e) => updateFilter("minLength", Math.max(2, Number(e.target.value) || 2))}
            />
          </label>
        </div>

        <div className="flex items-end gap-2">
          <label className="flex-1 text-xs font-bold text-[var(--color-text-secondary)]">
            Sort by
            <Select className="mt-1" value={sort} onChange={(e) => setSort(e.target.value as SortMode)}>
              <option value="score">Highest score</option>
              <option value="length">Longest</option>
              <option value="alpha">A → Z</option>
            </Select>
          </label>
          <label className="flex items-center gap-2 pb-2 text-sm text-[var(--color-text-secondary)]">
            <input type="checkbox" checked={grouped} onChange={(e) => setGrouped(e.target.checked)} />
            Group by length
          </label>
        </div>

        <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3">
          <div className="mb-1 text-xs font-black uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Dictionary</div>
          <p className="text-xs text-[var(--color-text-secondary)]">{dictName}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" leftIcon={<Upload className="h-4 w-4" />} onClick={() => fileInputRef.current?.click()}>
              Load dictionary
            </Button>
            {dictSource === "custom" && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setDictSource("starter");
                  setDictName("Starter word list");
                  setStatus("Switched back to the starter word list.");
                }}
              >
                Use starter
              </Button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,text/plain"
            className="hidden"
            onChange={(event) => {
              loadDictionary(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
          <p className="mt-2 text-xs leading-relaxed text-[var(--color-text-tertiary)]">
            The built-in list is a small set of common words. For tournament play, load a full TWL or SOWPODS
            word list (a plain text file, one word per line). It is read locally and never uploaded.
          </p>
        </div>

        {messages.length > 0 && (
          <ul className="flex flex-col gap-2">
            {messages.map((message, index) => (
              <li key={index} className={`rounded-[var(--radius-sm)] border px-3 py-2 text-xs ${MESSAGE_STYLES[message.type]}`}>
                {message.message}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Results */}
      <div className="min-w-0">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm font-bold text-[var(--color-text-primary)]">
            {results.length > 0 ? (
              <>
                {results.length.toLocaleString()} word{results.length === 1 ? "" : "s"}
                {best && (
                  <span className="ml-2 font-normal text-[var(--color-text-secondary)]">
                    · best: <strong>{best.word}</strong> ({best.score} pts)
                  </span>
                )}
              </>
            ) : (
              "No words yet"
            )}
          </div>
          {results.length > 0 && (
            <CopyButton size="sm" variant="secondary" getText={() => allWordsText}>
              Copy all
            </CopyButton>
          )}
        </div>

        {results.length === 0 ? (
          <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-subtle)] text-center text-[var(--color-text-tertiary)]">
            <Search className="h-6 w-6" />
            <p className="text-sm">{rack.trim() ? "No matches — try different letters or filters." : "Type your letters to see playable words."}</p>
          </div>
        ) : grouped ? (
          <div className="flex flex-col gap-4">
            {groupedResults.map((group) => (
              <div key={group.length}>
                <h3 className="mb-2 text-xs font-black uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
                  {group.length} letters ({group.words.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {group.words.map((match) => (
                    <WordChip key={match.word} word={match.word} score={match.score} blanks={match.blanksUsed} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {results.map((match) => (
              <WordChip key={match.word} word={match.word} score={match.score} blanks={match.blanksUsed} />
            ))}
          </div>
        )}

        <div role="status" aria-live="polite" className="sr-only">
          {status}
        </div>
      </div>
    </div>
  );
}

function WordChip({ word, score, blanks }: { word: string; score: number; blanks: number }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-2 py-1 text-sm"
      title={blanks > 0 ? `${blanks} blank tile${blanks === 1 ? "" : "s"} used` : undefined}
    >
      <span className="font-semibold text-[var(--color-text-primary)]">{word}</span>
      <span className="tabular-nums text-xs text-[var(--color-text-tertiary)]">{score}</span>
      {blanks > 0 && <span className="text-xs text-[var(--color-warning-text)]">·{blanks}?</span>}
    </span>
  );
}
