import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Compass, Lightbulb, ShieldCheck } from "lucide-react";
import { AtlasHeroScene, MotionSection, SplitTextReveal } from "@/components/motion";
import { Badge, Card } from "@/components/ui";
import { CareerPathfinder, type PathfinderCareer } from "@/features/career-pathfinder";
import { getTechCareers } from "@/features/tech-careers";
import { absoluteUrl } from "@/features/tools/seo";

export const metadata: Metadata = {
  title: "Career Pathfinder — explore technology roles that fit your interests | Darma",
  description: "Answer six practical questions and explore technology roles that match the kind of outcomes, craft, collaboration, and work environment you prefer.",
  alternates: { canonical: "/career-pathfinder" },
  openGraph: { title: "Darma Career Pathfinder", description: "A practical, privacy-friendly way to explore technology careers and the learning paths connected to them.", url: absoluteUrl("/career-pathfinder"), type: "website" },
};

export default async function CareerPathfinderPage({ searchParams }: { searchParams: Promise<{ matches?: string }> }) {
  const { matches = "" } = await searchParams;
  const initialMatches = matches.split(",").map((value) => value.trim()).filter(Boolean).slice(0, 3);
  const careers: PathfinderCareer[] = getTechCareers().map(({ slug, title, shortTitle, summary, category, focus, tags, learningPathSlugs, featured }) => ({ slug, title, shortTitle, summary, category, focus, tags, learningPathSlugs, featured }));
  const structuredData = { "@context": "https://schema.org", "@graph": [{ "@type": "WebApplication", name: "Darma Career Pathfinder", url: absoluteUrl("/career-pathfinder"), applicationCategory: "EducationalApplication", operatingSystem: "Any modern browser", description: metadata.description, isAccessibleForFree: true }, { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") }, { "@type": "ListItem", position: 2, name: "Tech Careers", item: absoluteUrl("/tech-careers") }, { "@type": "ListItem", position: 3, name: "Career Pathfinder", item: absoluteUrl("/career-pathfinder") }] }] };

  return (
    <div className="pb-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      <section className="visual-grid-bg border-b border-[var(--color-border-subtle)]">
        <div className="mx-auto grid max-w-[var(--container-wide)] gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(380px,.82fr)] lg:items-center lg:px-8 lg:py-20">
          <div>
            <div className="flex flex-wrap gap-2"><Badge variant="soft">Darma Tech Atlas</Badge><Badge variant="outline">Interactive career exploration</Badge></div>
            <SplitTextReveal text="Find a technology role worth exploring—not a label you have to commit to." className="mt-5 text-4xl font-black tracking-[-0.05em] text-[var(--color-text-primary)] sm:text-5xl lg:text-6xl" />
            <p className="mt-6 max-w-3xl text-base leading-8 text-[var(--color-text-secondary)] sm:text-lg">Use your preferred outcomes, craft, collaboration style, and environment to identify three practical starting directions. Then open the detailed role guides and test the fit through real work.</p>
            <div className="mt-8 flex flex-wrap gap-3"><a href="#career-pathfinder" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 text-sm font-black text-[var(--color-primary-text)]">Start the Pathfinder <ArrowRight className="h-4 w-4" aria-hidden /></a><Link href="/tech-careers" className="inline-flex min-h-11 items-center rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] px-5 text-sm font-black text-[var(--color-text-primary)]">Browse all roles</Link></div>
          </div>
          <AtlasHeroScene src="/atlas/pathfinder-compass.svg" alt="A visual career compass connecting build, design, leadership, and support directions" priority labels={["6 focused questions", "20 role guides", "Private by default", "Clear next steps"]} />
        </div>
      </section>

      <MotionSection as="section" className="mx-auto max-w-[var(--container-wide)] px-4 py-12 sm:px-6 lg:px-8" distance={18}>
        <div className="grid gap-4 md:grid-cols-3">
          {[{ icon: Compass, title: "Direction, not destiny", text: "The result is a shortlist for exploration. It does not claim to measure personality, ability, or hiring readiness." }, { icon: ShieldCheck, title: "Private and browser-based", text: "Answers are stored locally so you can continue later. Darma does not create a profile or send quiz responses to a server." }, { icon: Lightbulb, title: "Connected to real evidence", text: "Every result links to detailed responsibilities, skill levels, collaborators, sources, and relevant learning paths." }].map((item) => { const Icon = item.icon; return <Card key={item.title} padding="lg" className="visual-card"><span className="atlas-symbol"><Icon className="h-5 w-5" aria-hidden /></span><h2 className="mt-5 text-xl font-black text-[var(--color-text-primary)]">{item.title}</h2><p className="mt-3 text-sm leading-7 text-[var(--color-text-secondary)]">{item.text}</p></Card>; })}
        </div>
      </MotionSection>

      <section id="career-pathfinder" className="mx-auto max-w-[var(--container-wide)] scroll-mt-28 px-4 pb-12 sm:px-6 lg:px-8"><CareerPathfinder careers={careers} initialMatches={initialMatches} /></section>

      <MotionSection as="section" className="mx-auto max-w-[var(--container-page)] px-4 sm:px-6 lg:px-8" distance={18}>
        <Card padding="lg" className="grid gap-6 border-[var(--color-accent-border)] bg-[var(--color-accent-soft)] lg:grid-cols-[1fr_auto] lg:items-center"><div><div className="flex items-center gap-2 text-[var(--color-accent)]"><CheckCircle2 className="h-5 w-5" aria-hidden /><span className="font-mono text-xs font-black uppercase tracking-[0.14em]">How to use the result</span></div><h2 className="mt-3 text-2xl font-black text-[var(--color-text-primary)]">Read two role guides, try one small project, then compare the experience.</h2><p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--color-text-secondary)]">A useful career decision comes from evidence: what work you can sustain, which problems you enjoy, the feedback you receive, and the environment where you perform well.</p></div><Link href="/guides/technology-careers-guide" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--color-text-primary)] px-5 text-sm font-black text-[var(--color-surface-base)]">Read the career guide <ArrowRight className="h-4 w-4" aria-hidden /></Link></Card>
      </MotionSection>
    </div>
  );
}
