import type { Metadata } from "next";
import Link from "next/link";
import { GitCompareArrows, ShieldCheck } from "lucide-react";
import { MotionSection } from "@/components/motion";
import { PortalHero } from "@/components/portals";
import { Card } from "@/components/ui";
import { EditorialCard, getEditorialPagesByKind } from "@/features/editorial";
import { absoluteUrl } from "@/features/tools/seo";

export const metadata: Metadata = {
  title: "Technology Comparisons | choose roles, frameworks, and workflows | Darma",
  description: "Compare frontend and backend roles, React and Vue and Angular, React Native and Flutter, design roles, product and project management, DevOps and SRE, developer levels, and delivery methods.",
  keywords: ["technology comparisons", "React vs Vue vs Angular", "DevOps vs SRE", "frontend vs backend", "Agile vs Scrum vs Kanban"],
  alternates: { canonical: "/comparisons" },
  openGraph: { title: "Darma Technology Comparisons", description: "Side-by-side technology decisions with practical criteria, primary references, and connected next steps.", url: absoluteUrl("/comparisons"), type: "website" },
};

export default function ComparisonsPage() {
  const comparisons = getEditorialPagesByKind("comparison");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Darma Technology Comparisons",
    description: metadata.description,
    url: absoluteUrl("/comparisons"),
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: comparisons.length,
      itemListElement: comparisons.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.title, url: absoluteUrl(`/comparisons/${item.slug}`) })),
    },
  };

  return (
    <div className="pb-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <PortalHero
        variant="comparisons"
        eyebrow="Darma decision library"
        badges={["Real constraints", "No universal winners"]}
        title="Compare technology choices through the work and risk that change the answer."
        description="How daily work, team fit, cost, and long-term maintenance differ before you pick a framework, platform, or process."
        actions={[
          { href: "#comparison-library", label: "Browse comparisons", icon: "compare", tone: "primary" },
          { href: "/guides", label: "Open practical guides", icon: "route", tone: "secondary" },
          { href: "/editorial-policy", label: "Review the method", icon: "resources", tone: "quiet" },
        ]}
        metrics={[
          { value: comparisons.length, label: "reviewed comparisons" },
          { value: "2+", label: "options per decision" },
          { value: "6", label: "decision lenses" },
          { value: "0", label: "universal winners" },
        ]}
        signals={[
          { label: "Context", value: "Team and product needs" },
          { label: "Trade-offs", value: "Cost, risk, maintenance" },
          { label: "Evidence", value: "Primary references" },
          { label: "Outcome", value: "Explainable decision" },
        ]}
      />
      <MotionSection as="section" className="mx-auto max-w-[var(--container-page)] px-4 py-8 sm:px-6 lg:px-8" distance={18}>
        <Card padding="lg" className="portal-method-card grid gap-4 border-[var(--color-primary-border)] md:grid-cols-[auto_1fr_auto] md:items-center">
          <span className="atlas-symbol"><GitCompareArrows className="h-5 w-5" aria-hidden /></span>
          <div>
            <h2 className="text-xl font-black text-[var(--color-text-primary)]">The question comes before the winner.</h2>
            <p className="mt-2 text-sm leading-7 text-[var(--color-text-secondary)]">Every comparison begins with team skills, product needs, risk, environment, and the work you actually want to do. The same option can be right in one context and wasteful in another.</p>
          </div>
          <Link href="/editorial-policy" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--color-border-default)] px-4 text-sm font-black text-[var(--color-primary-text-strong)]"><ShieldCheck className="h-4 w-4" aria-hidden />Review method</Link>
        </Card>
      </MotionSection>
      <section id="comparison-library" className="mx-auto max-w-[var(--container-wide)] scroll-mt-28 px-4 sm:px-6 lg:px-8">
        <div className="mb-7 max-w-3xl">
          <p className="font-mono text-xs font-black uppercase tracking-[0.16em] text-[var(--color-primary-text-strong)]">Comparison library</p>
          <h2 className="darma-balanced-heading mt-2 text-3xl font-black tracking-[-0.04em] text-[var(--color-text-primary)]">Start with the decision you are trying to make.</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--color-text-secondary)]">Each page makes the criteria visible first, then connects the decision to guides, roles, workflows, and primary references.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {comparisons.map((item, index) => (
            <MotionSection key={item.slug} delay={(index % 3) * .05} distance={18}>
              <EditorialCard page={item} />
            </MotionSection>
          ))}
        </div>
      </section>
    </div>
  );
}
