"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { BookOpen, Brain, ClipboardCopy, Lightbulb, RotateCcw, Shuffle, Sparkles, Target, Trophy } from "lucide-react";
import { Badge, Button, Select } from "@/components/ui";
import type { GameDefinition } from "../../domain/game";
import { calculateWordMatchAccuracy, chooseWordMatchCard, createWordMatchRound, createWordMatchSummary, getPairById, revealWordMatchHint } from "./wordMatchEngine";
import { clearWordMatchStats, DEFAULT_WORD_MATCH_STATS, loadWordMatchStats, saveWordMatchStats, updateWordMatchStats } from "./wordMatchStorage";
import type { WordMatchCard, WordMatchCategory, WordMatchDifficulty, WordMatchRound, WordMatchStats } from "./wordMatchTypes";

const CATEGORY_LABELS: Record<WordMatchCategory, string> = {
  synonyms: "Synonyms",
  opposites: "Opposites",
  categories: "Categories",
  "english-arabic": "English ↔ Arabic",
  mixed: "Mixed",
};

const DIFFICULTY_LABELS: Record<WordMatchDifficulty, string> = {
  easy: "Easy · 4 pairs",
  medium: "Medium · 6 pairs",
  hard: "Hard · 8 pairs",
  expert: "Expert · 10 pairs",
};

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const rest = Math.max(0, seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${rest}`;
}

export function WordMatchGame({ game }: { game: GameDefinition }) {
  const [category, setCategory] = useState<WordMatchCategory>("synonyms");
  const [difficulty, setDifficulty] = useState<WordMatchDifficulty>("medium");
  const [seed, setSeed] = useState(() => `${Date.now()}`);
  const [round, setRound] = useState<WordMatchRound>(() => createWordMatchRound(category, difficulty, seed));
  const [stats, setStats] = useState<WordMatchStats>(DEFAULT_WORD_MATCH_STATS);
  const [copied, setCopied] = useState(false);
  const recordedRef = useRef(false);

  const accuracy = useMemo(() => calculateWordMatchAccuracy(round), [round]);
  const matchedCount = round.leftCards.filter((card) => card.matched).length;
  const progress = Math.round((matchedCount / round.leftCards.length) * 100);
  const missedPairs = round.missedPairs.map(getPairById).filter(Boolean);

  useEffect(() => setStats(loadWordMatchStats()), []);

  useEffect(() => {
    if (!round.startedAt || round.status === "won") return;
    const interval = window.setInterval(() => {
      setRound((current) => current.startedAt ? { ...current, elapsedSeconds: Math.floor((Date.now() - current.startedAt) / 1000) } : current);
    }, 500);
    return () => window.clearInterval(interval);
  }, [round.startedAt, round.status]);

  useEffect(() => {
    if (round.status !== "won" || recordedRef.current) return;
    recordedRef.current = true;
    const nextStats = updateWordMatchStats(stats, round);
    setStats(nextStats);
    saveWordMatchStats(nextStats);
  }, [round, stats]);

  function startNew(nextCategory = category, nextDifficulty = difficulty) {
    recordedRef.current = false;
    setCopied(false);
    const nextSeed = `${Date.now()}-${Math.random()}`;
    setSeed(nextSeed);
    setRound(createWordMatchRound(nextCategory, nextDifficulty, nextSeed));
  }

  function updateCategory(value: WordMatchCategory) {
    setCategory(value);
    startNew(value, difficulty);
  }

  function updateDifficulty(value: WordMatchDifficulty) {
    setDifficulty(value);
    startNew(category, value);
  }

  function choose(cardId: string) {
    setRound((current) => chooseWordMatchCard(current, cardId));
  }

  function hint() {
    setRound((current) => revealWordMatchHint(current));
  }

  async function copyResult() {
    try {
      await navigator.clipboard.writeText(createWordMatchSummary(round));
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  function clearStats() {
    clearWordMatchStats();
    setStats(DEFAULT_WORD_MATCH_STATS);
  }

  return (
    <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-card)]">
      <div className="border-b border-[var(--color-border-subtle)] bg-gradient-to-br from-[var(--color-surface-raised)] to-[var(--color-surface-base)] p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">Vocabulary puzzle</p>
            <h2 className="mt-1 text-2xl font-black tracking-[-0.03em] text-[var(--color-text-primary)]">{game.title}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">Tap a word, then tap its matching meaning, opposite, category, or Arabic translation. Build streaks and learn from missed pairs.</p>
          </div>
          <div className="flex flex-wrap gap-2"><Badge variant="soft">Best score {stats.bestScore}</Badge><Badge variant="outline">Perfect {stats.perfectRounds}</Badge></div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto]">
          <label className="grid gap-1 text-xs font-bold text-[var(--color-text-secondary)]">Category<Select value={category} onChange={(event) => updateCategory(event.target.value as WordMatchCategory)}><option value="synonyms">Synonyms</option><option value="opposites">Opposites</option><option value="categories">Categories</option><option value="english-arabic">English ↔ Arabic</option><option value="mixed">Mixed</option></Select></label>
          <label className="grid gap-1 text-xs font-bold text-[var(--color-text-secondary)]">Difficulty<Select value={difficulty} onChange={(event) => updateDifficulty(event.target.value as WordMatchDifficulty)}><option value="easy">Easy · 4 pairs</option><option value="medium">Medium · 6 pairs</option><option value="hard">Hard · 8 pairs</option><option value="expert">Expert · 10 pairs</option></Select></label>
          <div className="grid gap-1 text-xs font-bold text-[var(--color-text-secondary)]"><span>Hint</span><Button variant="secondary" onClick={hint} leftIcon={<Lightbulb className="h-4 w-4" />}>Hint</Button></div>
          <div className="grid gap-1 text-xs font-bold text-[var(--color-text-secondary)]"><span>Round</span><Button onClick={() => startNew()} leftIcon={<Shuffle className="h-4 w-4" />}>New</Button></div>
        </div>
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-[1fr_320px] sm:p-5">
        <div className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-4">
            <Metric icon={<Trophy className="h-4 w-4" />} label="Score" value={round.score} />
            <Metric icon={<Target className="h-4 w-4" />} label="Accuracy" value={`${accuracy}%`} />
            <Metric icon={<Sparkles className="h-4 w-4" />} label="Streak" value={round.streak} />
            <Metric icon={<Brain className="h-4 w-4" />} label="Time" value={formatTime(round.elapsedSeconds)} />
          </div>

          <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3">
            <div className="flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]"><span>{CATEGORY_LABELS[category]} · {DIFFICULTY_LABELS[difficulty]}</span><span>{progress}% complete</span></div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--color-surface-subtle)]"><div className="h-full rounded-full bg-[var(--color-primary)] transition-all" style={{ width: `${progress}%` }} /></div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <CardColumn title="Words" cards={round.leftCards} selectedId={round.selectedLeftId} onChoose={choose} />
            <CardColumn title="Matches" cards={round.rightCards} selectedId={round.selectedRightId} onChoose={choose} />
          </div>

          <div className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-4">
            <div className="flex items-start gap-3"><BookOpen className="mt-0.5 h-5 w-5 text-[var(--color-primary)]" /><div><p className="font-bold text-[var(--color-text-primary)]">{round.lastFeedback}</p><p className="mt-1 text-sm text-[var(--color-text-secondary)]">Tap-to-match is used instead of drag-and-drop so the game stays comfortable on phones and tablets.</p></div></div>
          </div>

          {round.status === "won" ? (
            <div className="rounded-[var(--radius-md)] border border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] p-4">
              <h3 className="text-lg font-black text-[var(--color-text-primary)]">Round complete</h3>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Score {round.score}, {accuracy}% accuracy, {round.mistakes} mistakes, best streak {round.bestStreak}.</p>
              <div className="mt-3 flex flex-wrap gap-2"><Button onClick={() => startNew()} leftIcon={<RotateCcw className="h-4 w-4" />}>Next round</Button><Button variant="outline" onClick={copyResult} leftIcon={<ClipboardCopy className="h-4 w-4" />}>{copied ? "Copied" : "Copy result"}</Button></div>
            </div>
          ) : null}
        </div>

        <aside className="space-y-4">
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-4">
            <h3 className="text-sm font-black text-[var(--color-text-primary)]">Local stats</h3>
            <dl className="mt-4 grid gap-3 text-sm"><Row label="Rounds" value={stats.roundsCompleted} /><Row label="Best score" value={stats.bestScore} /><Row label="Best streak" value={stats.bestStreak} /><Row label="Hints used" value={stats.hintsUsed} /></dl>
            <Button className="mt-4" variant="ghost" size="sm" onClick={clearStats}>Clear stats</Button>
          </div>

          <div className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-4">
            <h3 className="text-sm font-black text-[var(--color-text-primary)]">Mistake review</h3>
            {missedPairs.length ? <div className="mt-3 space-y-2">{missedPairs.slice(0, 6).map((pair) => pair ? <div key={pair.id} className="rounded-[var(--radius-sm)] bg-[var(--color-surface-subtle)] p-2 text-sm font-semibold text-[var(--color-text-secondary)]"><span className="font-black text-[var(--color-text-primary)]">{pair.left}</span> → {pair.right}<p className="text-xs text-[var(--color-text-tertiary)]">{pair.hint}</p></div> : null)}</div> : <p className="mt-2 text-sm text-[var(--color-text-tertiary)]">Missed pairs will appear here after wrong attempts.</p>}
          </div>

          <div className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-4">
            <h3 className="text-sm font-black text-[var(--color-text-primary)]">Scoring</h3>
            <ul className="mt-3 space-y-2 text-sm text-[var(--color-text-secondary)]"><li>Correct match: +100</li><li>Streak bonus: +20 per streak</li><li>Wrong match: -25</li><li>Hint: -50</li></ul>
          </div>
        </aside>
      </div>
    </section>
  );
}

function CardColumn({ title, cards, selectedId, onChoose }: { title: string; cards: WordMatchCard[]; selectedId: string | null; onChoose: (id: string) => void }) {
  return <div className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-3"><h3 className="mb-3 text-sm font-black text-[var(--color-text-primary)]">{title}</h3><div className="grid gap-2">{cards.map((card) => <button key={card.id} type="button" disabled={card.matched} onClick={() => onChoose(card.id)} className={["min-h-12 rounded-[var(--radius-sm)] border px-3 text-left text-base font-black transition focus-visible:shadow-[var(--focus-ring)]", card.matched ? "border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-text)] opacity-75" : selectedId === card.id ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)] shadow-[var(--focus-ring)]" : "border-[var(--color-border-default)] bg-[var(--color-control-bg)] text-[var(--color-text-primary)] hover:border-[var(--color-primary)] hover:bg-[var(--color-control-hover)]"].join(" ")}>{card.text}</button>)}</div></div>;
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return <div className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-3"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{icon}{label}</div><div className="mt-1 text-2xl font-black text-[var(--color-text-primary)]">{value}</div></div>;
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return <div className="flex items-center justify-between gap-3"><dt className="text-[var(--color-text-tertiary)]">{label}</dt><dd className="font-black text-[var(--color-text-primary)]">{value}</dd></div>;
}
