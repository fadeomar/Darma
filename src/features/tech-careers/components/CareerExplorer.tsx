"use client";

import { useMemo, useState } from "react";
import { BriefcaseBusiness, RotateCcw, Search } from "lucide-react";
import { Button, Card, Input, Select } from "@/components/ui";
import type { CareerCategory, CareerFocus, TechCareer } from "../schema";
import { CareerCard } from "./CareerCard";

type CategoryFilter = CareerCategory | "all";
type FocusFilter = CareerFocus | "all";

const CATEGORIES: Record<CategoryFilter, string> = {
  all: "All departments",
  engineering: "Engineering",
  "quality-security": "Quality & security",
  "design-research": "Design & research",
  "product-delivery": "Product & delivery",
  leadership: "Leadership",
  "operations-growth": "Operations & growth",
};
const FOCUSES: Record<FocusFilter, string> = {
  all: "Any focus",
  build: "Build systems",
  quality: "Quality & reliability",
  design: "Design experiences",
  discovery: "Discover direction",
  delivery: "Coordinate delivery",
  people: "Grow people",
  business: "Run and grow the business",
};
const GOALS = [
  { label: "I want to code", category: "engineering" as const, focus: "build" as const },
  { label: "I care about quality", category: "quality-security" as const, focus: "quality" as const },
  { label: "I want to design", category: "design-research" as const, focus: "all" as const },
  { label: "I coordinate work", category: "product-delivery" as const, focus: "delivery" as const },
  { label: "I support teams", category: "all" as const, focus: "people" as const },
];

export function CareerExplorer({ careers }: { careers: TechCareer[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [focus, setFocus] = useState<FocusFilter>("all");
  const [coreOnly, setCoreOnly] = useState(false);
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return careers.filter((career) => {
      if (category !== "all" && career.category !== category) return false;
      if (focus !== "all" && career.focus !== focus) return false;
      if (coreOnly && !career.featured) return false;
      if (!term) return true;
      return [
        career.title,
        career.shortTitle,
        career.summary,
        career.whatTheyDo,
        ...career.tags,
        ...career.skills.technical,
        ...career.skills.human,
      ].join(" ").toLowerCase().includes(term);
    });
  }, [careers, category, coreOnly, focus, query]);
  const active = Boolean(query || category !== "all" || focus !== "all" || coreOnly);
  const reset = () => { setQuery(""); setCategory("all"); setFocus("all"); setCoreOnly(false); };

  return (
    <section className="mx-auto max-w-[var(--container-wide)] px-4 pb-16 sm:px-6 lg:px-8" aria-labelledby="career-explorer-title">
      <Card padding="lg" className="mb-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-primary)]">Choose by the work you enjoy</p>
            <h2 id="career-explorer-title" className="mt-3 text-3xl font-black tracking-[-0.035em] text-[var(--color-text-primary)]">Find the role behind the title.</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">Compare responsibilities, daily work, evidence of seniority, collaborators, skills, and practical starting steps.</p>
          </div>
          <div className="flex flex-wrap gap-2">{GOALS.map((goal) => <Button key={goal.label} size="sm" variant="outline" onClick={() => { setCategory(goal.category); setFocus(goal.focus); }}>{goal.label}</Button>)}</div>
        </div>
        <div className="mt-6 grid gap-3 lg:grid-cols-[minmax(260px,1.5fr)_minmax(190px,1fr)_minmax(190px,1fr)_auto_auto]">
          <label className="relative block"><span className="sr-only">Search technology careers</span><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-tertiary)]" aria-hidden /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search roles, skills, or tools…" className="pl-9" /></label>
          <label><span className="sr-only">Filter by department</span><Select value={category} onChange={(event) => setCategory(event.target.value as CategoryFilter)}>{Object.entries(CATEGORIES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></label>
          <label><span className="sr-only">Filter by focus</span><Select value={focus} onChange={(event) => setFocus(event.target.value as FocusFilter)}>{Object.entries(FOCUSES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></label>
          <Button variant={coreOnly ? "secondary" : "outline"} onClick={() => setCoreOnly((value) => !value)}>Core roles</Button>
          <Button variant="ghost" onClick={reset} disabled={!active} leftIcon={<RotateCcw className="h-4 w-4" aria-hidden />}>Reset</Button>
        </div>
        <p className="mt-4 flex items-center gap-2 text-sm text-[var(--color-text-secondary)]" aria-live="polite"><BriefcaseBusiness className="h-4 w-4" aria-hidden /><strong className="text-[var(--color-text-primary)]">{filtered.length}</strong> matching {filtered.length === 1 ? "role" : "roles"}</p>
      </Card>
      {filtered.length ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{filtered.map((career) => <CareerCard key={career.slug} career={career} />)}</div> : <Card padding="lg" className="text-center"><h3 className="text-xl font-bold text-[var(--color-text-primary)]">No role matches those filters</h3><p className="mt-2 text-sm text-[var(--color-text-secondary)]">Try a broader skill, department, or work focus.</p><Button className="mt-5" variant="secondary" onClick={reset}>Show all careers</Button></Card>}
    </section>
  );
}
