"use client";

import Link from "next/link";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Compass, ExternalLink, RotateCcw, Share2, Sparkles } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { withGsap, userPrefersReducedMotion } from "@/core/motion/gsap-loader";
import { PATHFINDER_QUESTIONS } from "../questions";
import type { PathfinderCareer, PathfinderOption } from "../types";

type AnswerMap = Record<string, string>;
type ScoredCareer = PathfinderCareer & { score: number; reasons: string[] };
const STORAGE_KEY = "darma:career-pathfinder:answers:v1";

function scoreCareers(careers: PathfinderCareer[], answers: AnswerMap): ScoredCareer[] {
  const chosen = PATHFINDER_QUESTIONS.map((question) => question.options.find((option) => option.id === answers[question.id])).filter((option): option is PathfinderOption => Boolean(option));

  return careers
    .map((career) => {
      let score = career.featured ? 0.25 : 0;
      const reasons: string[] = [];
      for (const option of chosen) {
        const focusScore = option.focusWeights?.[career.focus] ?? 0;
        const categoryScore = option.categoryWeights?.[career.category] ?? 0;
        const keywordScore = (option.keywords ?? []).reduce((sum, keyword) => {
          const haystack = `${career.title} ${career.summary} ${career.tags.join(" ")}`.toLowerCase();
          return sum + (haystack.includes(keyword.toLowerCase()) ? 1.2 : 0);
        }, 0);
        score += focusScore + categoryScore + keywordScore;
        if (focusScore >= 3) reasons.push(`Your answers strongly match ${career.focus}-focused work.`);
        if (categoryScore >= 3) reasons.push(`You showed interest in ${career.category.replace("-", " and ")} environments.`);
      }
      return { ...career, score, reasons: [...new Set(reasons)].slice(0, 2) };
    })
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
}

export function CareerPathfinder({ careers, initialMatches = [] }: { careers: PathfinderCareer[]; initialMatches?: string[] }) {
  const validInitialMatches = useMemo(() => initialMatches.filter((slug) => careers.some((career) => career.slug === slug)).slice(0, 3), [careers, initialMatches]);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [step, setStep] = useState(0);
  const [sharedMatchSlugs, setSharedMatchSlugs] = useState<string[]>(validInitialMatches);
  const [complete, setComplete] = useState(validInitialMatches.length > 0);
  const [copied, setCopied] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const question = PATHFINDER_QUESTIONS[step];
  const results = useMemo(() => {
    if (sharedMatchSlugs.length && Object.keys(answers).length === 0) {
      return sharedMatchSlugs
        .map((slug) => careers.find((career) => career.slug === slug))
        .filter((career): career is PathfinderCareer => Boolean(career))
        .map((career) => ({ ...career, score: 0, reasons: ["This role was included in the shared Pathfinder result."] }));
    }
    return scoreCareers(careers, answers).slice(0, 3);
  }, [answers, careers, sharedMatchSlugs]);
  const progress = complete ? 100 : ((step + 1) / PATHFINDER_QUESTIONS.length) * 100;

  useLayoutEffect(() => {
    if (validInitialMatches.length) return;
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as AnswerMap;
      const firstUnanswered = PATHFINDER_QUESTIONS.findIndex((item) => {
        const answer = parsed[item.id];
        return !item.options.some((option) => option.id === answer);
      });
      setAnswers(parsed);
      if (firstUnanswered === -1) setComplete(true);
      else setStep(firstUnanswered);
    } catch {
      // The quiz remains usable when storage is unavailable or malformed.
    }
  }, [validInitialMatches.length]);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel || userPrefersReducedMotion()) return;
    let cancelled = false;
    let cleanup: (() => void) | undefined;
    withGsap(({ gsap }) => {
      if (cancelled || !panelRef.current) return;
      const context = gsap.context(() => {
        gsap.fromTo(panel, { opacity: 0, x: 18 }, { opacity: 1, x: 0, duration: 0.42, ease: "power3.out", clearProps: "transform,opacity" });
        gsap.fromTo("[data-pathfinder-option]", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.34, stagger: 0.05, delay: 0.08, ease: "power2.out" });
      }, panel);
      cleanup = () => context.revert();
    });
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [complete, step]);

  const selectOption = (optionId: string) => {
    const next = { ...answers, [question.id]: optionId };
    setSharedMatchSlugs([]);
    setAnswers(next);
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {
      // Storage is optional; keep the in-memory answer flow working.
    }
  };

  const continueToNext = () => {
    if (!answers[question.id]) return;
    if (step === PATHFINDER_QUESTIONS.length - 1) setComplete(true);
    else setStep((value) => value + 1);
  };

  const reset = () => {
    setAnswers({});
    setStep(0);
    setComplete(false);
    setSharedMatchSlugs([]);
    try { window.localStorage.removeItem(STORAGE_KEY); } catch {
      // Storage is optional; reset the in-memory flow regardless.
    }
    window.history.replaceState({}, "", window.location.pathname);
  };

  const shareResults = async () => {
    const url = new URL(window.location.href);
    url.searchParams.set("matches", results.map((result) => result.slug).join(","));
    try {
      await navigator.clipboard.writeText(url.toString());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.history.replaceState({}, "", url);
    }
  };

  return (
    <Card padding="none" className="pathfinder-shell border-[var(--color-primary-border)]">
      <div className="relative z-10 border-b border-[var(--color-border-subtle)] p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-primary)]">Interactive decision aid</p><h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[var(--color-text-primary)] sm:text-3xl">Career Pathfinder</h2></div>
          <Badge variant="outline">No account • saved locally</Badge>
        </div>
        <div className="pathfinder-progress mt-5" aria-label={`${Math.round(progress)} percent complete`}><span style={{ width: `${progress}%` }} /></div>
      </div>

      <div ref={panelRef} className="relative z-10 p-5 sm:p-8 lg:p-10">
        {!complete ? (
          <div className="mx-auto max-w-4xl">
            <div className="flex items-center justify-between gap-4"><p className="font-mono text-xs font-black uppercase tracking-[0.14em] text-[var(--color-text-tertiary)]">{question.eyebrow}</p><p className="text-xs font-bold text-[var(--color-text-tertiary)]">{step + 1} / {PATHFINDER_QUESTIONS.length}</p></div>
            <h3 className="darma-balanced-heading mt-3 text-3xl font-black tracking-[-0.04em] text-[var(--color-text-primary)] sm:text-4xl">{question.title}</h3>
            <p className="darma-pretty-copy mt-3 max-w-2xl text-sm leading-7 text-[var(--color-text-secondary)] sm:text-base">{question.helper}</p>
            <div className="mt-7 grid gap-3 md:grid-cols-2">
              {question.options.map((option, optionIndex) => {
                const selected = answers[question.id] === option.id;
                const isLastOddOption = question.options.length % 2 === 1 && optionIndex === question.options.length - 1;
                return (
                  <button
                    key={option.id}
                    data-pathfinder-option
                    type="button"
                    aria-pressed={selected}
                    onClick={() => selectOption(option.id)}
                    className={`pathfinder-option rounded-[1.2rem] border p-5 ${isLastOddOption ? "md:col-span-2 md:w-[calc(50%-0.375rem)] md:justify-self-center" : ""} ${selected ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] shadow-[0_0_0_2px_var(--color-primary-soft)]" : "border-[var(--color-border-default)] bg-[var(--color-surface-raised)]"}`}
                  >
                    <span className="flex items-start gap-3">
                      <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full border ${selected ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-text)]" : "border-[var(--color-border-strong)] bg-[var(--color-surface-base)]"}`}>{selected ? <Check className="h-4 w-4" aria-hidden /> : null}</span>
                      <span>
                        <span className="block text-base font-black text-[var(--color-text-primary)]">{option.label}</span>
                        <span className="darma-pretty-copy mt-1 block text-sm leading-6 text-[var(--color-text-secondary)]">{option.description}</span>
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border-subtle)] pt-5">
              <div className="flex flex-wrap gap-3">
                {step > 0 ? (
                  <button type="button" onClick={() => setStep((value) => Math.max(0, value - 1))} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-4 text-sm font-bold text-[var(--color-text-primary)]">
                    <ArrowLeft className="h-4 w-4" aria-hidden /> Previous
                  </button>
                ) : null}
                <button type="button" onClick={reset} className="inline-flex min-h-11 items-center px-2 text-sm font-bold text-[var(--color-text-tertiary)] hover:text-[var(--color-primary)]">Reset answers</button>
              </div>
              <button type="button" disabled={!answers[question.id]} onClick={continueToNext} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 text-sm font-black text-[var(--color-primary-text)] transition hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-45">
                {step === PATHFINDER_QUESTIONS.length - 1 ? "See my matches" : "Continue"} <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-5xl">
            <div className="mx-auto max-w-3xl text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]"><Compass className="h-7 w-7" aria-hidden /></span><p className="mt-5 font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-primary)]">Your strongest starting directions</p><h3 className="mt-3 text-3xl font-black tracking-[-0.04em] text-[var(--color-text-primary)] sm:text-5xl">Explore these roles first.</h3><p className="mt-4 text-sm leading-7 text-[var(--color-text-secondary)] sm:text-base">This is a structured reflection tool, not a personality test or hiring assessment. Open the role guides, compare the daily work, and test your interest through a small project.</p></div>
            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              {results.map((career, index) => (
                <Card key={career.slug} data-pathfinder-option variant="interactive" padding="lg" className="visual-card h-full">
                  <div className="flex items-center justify-between"><Badge variant={index === 0 ? "accent" : "soft"}>Match {index + 1}</Badge><Sparkles className="h-5 w-5 text-[var(--color-primary)]" aria-hidden /></div>
                  <h4 className="mt-5 text-2xl font-black tracking-[-0.035em] text-[var(--color-text-primary)]">{career.title}</h4>
                  <p className="mt-3 text-sm leading-7 text-[var(--color-text-secondary)]">{career.summary}</p>
                  <ul className="mt-4 space-y-2">{career.reasons.length ? career.reasons.map((reason) => <li key={reason} className="flex gap-2 text-xs leading-5 text-[var(--color-text-tertiary)]"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-accent)]" aria-hidden />{reason}</li>) : <li className="text-xs leading-5 text-[var(--color-text-tertiary)]">This role shares several patterns with your selected work preferences.</li>}</ul>
                  <Link href={`/tech-careers/${career.slug}`} className="mt-6 inline-flex items-center gap-2 text-sm font-black text-[var(--color-primary)]">Read the role guide <ArrowRight className="h-4 w-4" aria-hidden /></Link>
                </Card>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button type="button" onClick={shareResults} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 text-sm font-black text-[var(--color-primary-text)]"><Share2 className="h-4 w-4" aria-hidden />{copied ? "Link copied" : "Copy result link"}</button>
              <button type="button" onClick={reset} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] px-5 text-sm font-black text-[var(--color-text-primary)]"><RotateCcw className="h-4 w-4" aria-hidden />Start again</button>
              <Link href="/learning-paths" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] px-5 text-sm font-black text-[var(--color-primary)]">Compare learning paths <ExternalLink className="h-4 w-4" aria-hidden /></Link>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
