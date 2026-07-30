"use client";

import { useMemo, useState } from "react";
import { GitBranch, RotateCcw, Search } from "lucide-react";
import { Button, Card, Input, Select } from "@/components/ui";
import type { WayKind, WayOfWorking } from "../schema";
import { WayCard } from "./WayCard";

type KindFilter = WayKind | "all";
const KINDS: Record<KindFilter, string> = { all: "All types", principles: "Principles", framework: "Framework", method: "Method", lifecycle: "Lifecycle", "design-process": "Design process", "predictive-model": "Predictive model", hybrid: "Hybrid" };
const NEEDS = [
  { label: "Adapt through feedback", query: "feedback" },
  { label: "Manage continuous flow", query: "flow" },
  { label: "Coordinate formal phases", query: "sequential" },
  { label: "Discover the right problem", query: "design" },
  { label: "Improve delivery and operation", query: "DevOps" },
];

export function WaysExplorer({ ways }: { ways: WayOfWorking[] }) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<KindFilter>("all");
  const [coreOnly, setCoreOnly] = useState(false);
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return ways.filter((way) => {
      if (kind !== "all" && way.kind !== kind) return false;
      if (coreOnly && !way.featured) return false;
      if (!term) return true;
      return [way.title, way.summary, way.description, ...way.tags, ...way.bestFor, ...way.coreIdeas].join(" ").toLowerCase().includes(term);
    });
  }, [coreOnly, kind, query, ways]);
  const active = Boolean(query || kind !== "all" || coreOnly);
  const reset = () => { setQuery(""); setKind("all"); setCoreOnly(false); };
  return (
    <section className="mx-auto max-w-[var(--container-wide)] px-4 pb-16 sm:px-6 lg:px-8" aria-labelledby="ways-explorer-title">
      <Card padding="lg" className="mb-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div className="max-w-2xl"><p className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-primary)]">Choose by the problem</p><h2 id="ways-explorer-title" className="mt-3 text-3xl font-black tracking-[-0.035em] text-[var(--color-text-primary)]">Understand the system before copying the ceremony.</h2><p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">Compare purpose, flow, roles, cadence, artifacts, strengths, risks, and signs of healthy use.</p></div><div className="flex flex-wrap gap-2">{NEEDS.map((need) => <Button key={need.label} size="sm" variant="outline" onClick={() => setQuery(need.query)}>{need.label}</Button>)}</div></div>
        <div className="mt-6 grid gap-3 md:grid-cols-[minmax(280px,1.7fr)_minmax(200px,1fr)_auto_auto]"><label className="relative block"><span className="sr-only">Search ways of working</span><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-tertiary)]" aria-hidden /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search flow, Sprints, discovery, delivery…" className="pl-9" /></label><label><span className="sr-only">Filter by method type</span><Select value={kind} onChange={(event) => setKind(event.target.value as KindFilter)}>{Object.entries(KINDS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></label><Button variant={coreOnly ? "secondary" : "outline"} onClick={() => setCoreOnly((value) => !value)}>Core references</Button><Button variant="ghost" disabled={!active} onClick={reset} leftIcon={<RotateCcw className="h-4 w-4" aria-hidden />}>Reset</Button></div>
        <p className="mt-4 flex items-center gap-2 text-sm text-[var(--color-text-secondary)]" aria-live="polite"><GitBranch className="h-4 w-4" aria-hidden /><strong className="text-[var(--color-text-primary)]">{filtered.length}</strong> matching {filtered.length === 1 ? "approach" : "approaches"}</p>
      </Card>
      {filtered.length ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{filtered.map((way) => <WayCard key={way.slug} way={way} />)}</div> : <Card padding="lg" className="text-center"><h3 className="text-xl font-bold text-[var(--color-text-primary)]">No approach matches those filters</h3><p className="mt-2 text-sm text-[var(--color-text-secondary)]">Reset the filters or search for the team problem you are trying to solve.</p><Button className="mt-5" variant="secondary" onClick={reset}>Show all approaches</Button></Card>}
    </section>
  );
}
