import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpenText, BriefcaseBusiness, GitBranch, Network } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { absoluteUrl } from "@/features/tools/seo";
import { getGlossaryTerms } from "@/features/tech-glossary";
import { GlossaryExplorer } from "@/features/tech-glossary/components";

export const metadata: Metadata = {
  title: "Technology Glossary — practical software, product, design, and delivery terms | Darma",
  description: "Understand common technology terms through clear definitions, practical meaning, examples, related roles, and ways of working.",
  keywords: ["technology glossary", "software development terms", "Agile glossary", "DevOps glossary", "product management terms", "UI UX terminology"],
  alternates: { canonical: "/tech-glossary" },
  openGraph: { title: "Darma Technology Glossary", description: "Practical explanations of the language used by software, product, design, delivery, and operations teams.", url: absoluteUrl("/tech-glossary"), type: "website" },
};

function jsonLd() {
  const terms = getGlossaryTerms();
  return { "@context": "https://schema.org", "@graph": [{ "@type": "DefinedTermSet", name: "Darma Technology Glossary", description: "Practical technology, product, design, delivery, and operations terms.", url: absoluteUrl("/tech-glossary"), hasDefinedTerm: terms.map((term) => ({ "@type": "DefinedTerm", name: term.term, description: term.definition, termCode: term.acronym, url: `${absoluteUrl("/tech-glossary")}#${term.slug}` })) }, { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") }, { "@type": "ListItem", position: 2, name: "Tech Glossary", item: absoluteUrl("/tech-glossary") }] }] };
}

export default function TechGlossaryPage() {
  const terms = getGlossaryTerms(); const data = jsonLd();
  return <div className="pb-16"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />
    <section className="mx-auto max-w-[var(--container-wide)] px-4 py-12 sm:px-6 lg:px-8 lg:py-16"><div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start"><div className="max-w-4xl"><div className="flex flex-wrap gap-2"><Badge variant="soft">Darma Tech Atlas</Badge><Badge variant="outline">Practical glossary</Badge></div><h1 className="mt-5 text-4xl font-black tracking-[-0.045em] text-[var(--color-text-primary)] sm:text-5xl lg:text-6xl">Understand the language technology teams use every day.</h1><p className="mt-6 max-w-3xl text-base leading-8 text-[var(--color-text-secondary)] sm:text-lg">Definitions are only the beginning. Each term explains what it changes in practice, gives a realistic example, and links to the people and workflows where it appears.</p><div className="mt-8 flex flex-wrap gap-3"><a href="#glossary-explorer-title" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-5 text-sm font-semibold text-[var(--color-primary-text)]">Search the glossary <ArrowRight className="h-4 w-4" aria-hidden /></a><Link href="/tech-atlas" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] px-5 text-sm font-semibold text-[var(--color-primary-text-strong)]">Open the complete atlas</Link></div></div><Card padding="lg"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-soft)] text-[var(--color-primary-text-strong)]"><BookOpenText className="h-5 w-5" aria-hidden /></div><div><p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-text-tertiary)]">Glossary status</p><p className="text-lg font-black text-[var(--color-text-primary)]">{terms.length} connected terms</p></div></div><div className="mt-5 grid grid-cols-2 gap-3">{[{ icon: BriefcaseBusiness, label: "Role links" }, { icon: GitBranch, label: "Method links" }, { icon: Network, label: "Related terms" }, { icon: BookOpenText, label: "Examples" }].map((item) => { const Icon = item.icon; return <div key={item.label} className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] p-3"><Icon className="h-4 w-4 text-[var(--color-primary-text-strong)]" aria-hidden /><p className="mt-2 text-xs font-bold text-[var(--color-text-secondary)]">{item.label}</p></div>; })}</div></Card></div></section>
    <GlossaryExplorer terms={terms} />
  </div>;
}
