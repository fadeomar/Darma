import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, GitBranch, GraduationCap, Network, ShieldCheck } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { AtlasHeroScene, MotionSection, SplitTextReveal } from "@/components/motion";
import { absoluteUrl } from "@/features/tools/seo";
import { getTechCareers } from "@/features/tech-careers";
import { CareerExplorer } from "@/features/tech-careers/components";

export const metadata: Metadata = {
  title: "Technology Careers — roles, skills, seniority, and team collaboration | Darma",
  description: "Explore technology careers across engineering, design, product, delivery, quality, security, leadership, operations, and growth with practical role guides.",
  keywords: ["technology careers", "software engineering roles", "tech job titles", "junior vs senior developer", "product design careers", "DevOps careers", "technology team roles"],
  alternates: { canonical: "/tech-careers" },
  openGraph: { title: "Darma Technology Career Atlas", description: "Understand what technology roles actually do, how they collaborate, and how responsibility grows from junior to senior.", url: absoluteUrl("/tech-careers"), type: "website" },
};

const PRINCIPLES = [
  { icon: BriefcaseBusiness, title: "Role, level, and responsibility are different", text: "A job family explains the work, seniority explains scope and evidence, and titles such as lead or manager add contextual responsibilities." },
  { icon: Network, title: "No role works alone", text: "Every guide shows collaborators and handoffs so beginners can see how a real technology organization delivers outcomes." },
  { icon: ShieldCheck, title: "Evidence before title inflation", text: "Junior, mid-level, and senior guidance focuses on autonomy, complexity, influence, and outcomes. Years of experience are only one part of the picture." },
];

function careerJsonLd() {
  const careers = getTechCareers();
  return {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "CollectionPage", "@id": `${absoluteUrl("/tech-careers")}#collection`, name: "Darma Technology Career Atlas", url: absoluteUrl("/tech-careers"), description: "Practical guides to technology roles, skills, responsibilities, collaborators, and seniority." },
      { "@type": "ItemList", "@id": `${absoluteUrl("/tech-careers")}#roles`, numberOfItems: careers.length, itemListElement: careers.map((career, index) => ({ "@type": "ListItem", position: index + 1, name: career.title, url: absoluteUrl(`/tech-careers/${career.slug}`) })) },
      { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") }, { "@type": "ListItem", position: 2, name: "Tech Careers", item: absoluteUrl("/tech-careers") }] },
    ],
  };
}

export default function TechCareersPage() {
  const careers = getTechCareers();
  const data = careerJsonLd();
  return (
    <div className="pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />
      <section className="visual-grid-bg border-b border-[var(--color-border-subtle)]">
        <div className="mx-auto grid max-w-[var(--container-wide)] gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(390px,.85fr)] lg:items-center lg:px-8 lg:py-20">
          <div className="max-w-4xl"><div className="flex flex-wrap gap-2"><Badge variant="soft">Darma Tech Atlas</Badge><Badge variant="outline">Career reference</Badge></div><SplitTextReveal text="See how technology roles create one product together." className="mt-5 text-4xl font-black tracking-[-0.055em] text-[var(--color-text-primary)] sm:text-5xl lg:text-7xl" /><p className="mt-6 max-w-3xl text-base leading-8 text-[var(--color-text-secondary)] sm:text-lg">Go beyond job-title lists. Understand daily work, responsibilities, deliverables, skills, collaborators, career levels, common misconceptions, and the clearest ways to start.</p><div className="mt-8 flex flex-wrap gap-3"><Link href="/career-pathfinder" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 text-sm font-black text-[var(--color-primary-text)] shadow-[var(--shadow-md)]">Try Career Pathfinder <ArrowRight className="h-4 w-4" aria-hidden /></Link><a href="#career-explorer-title" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] px-6 text-sm font-black text-[var(--color-text-primary)]">Browse all roles</a><Link href="/tech-teams" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] px-6 text-sm font-black text-[var(--color-primary)]"><Network className="h-4 w-4" aria-hidden />See team structures</Link></div></div>
          <AtlasHeroScene src="/atlas/career-path.svg" alt="A visual career path moving from starting skills through evidence, scope, and growth" priority labels={[`${careers.length} roles`, "3 scope levels", "Real collaborators", "Verified references"]} />
        </div>
      </section>
      <MotionSection as="section" className="mx-auto max-w-[var(--container-wide)] px-4 py-10 sm:px-6 lg:px-8" distance={18}><div className="grid gap-4 md:grid-cols-3">{PRINCIPLES.map((principle) => { const Icon = principle.icon; return <Card key={principle.title} padding="md"><Icon className="h-5 w-5 text-[var(--color-primary)]" aria-hidden /><h2 className="mt-4 text-lg font-bold text-[var(--color-text-primary)]">{principle.title}</h2><p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{principle.text}</p></Card>; })}</div></MotionSection>
      <CareerExplorer careers={careers} />
      <section className="mx-auto max-w-[var(--container-wide)] px-4 sm:px-6 lg:px-8"><Card padding="lg" className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center"><div><div className="flex items-center gap-2 text-[var(--color-primary)]"><GitBranch className="h-5 w-5" aria-hidden /><span className="font-mono text-xs font-bold uppercase tracking-[0.14em]">Titles vary between companies</span></div><h2 className="mt-3 text-2xl font-black text-[var(--color-text-primary)]">Use these guides to ask better questions, not to force every company into one chart.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">Scope, product type, company stage, team topology, and local labor markets change titles. Compare the actual responsibilities and expected evidence.</p></div><Link href="/tech-glossary" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] px-5 text-sm font-semibold text-[var(--color-text-primary)] transition hover:border-[var(--color-primary-border)] hover:text-[var(--color-primary)]">Open the tech glossary</Link></Card></section>
    </div>
  );
}
