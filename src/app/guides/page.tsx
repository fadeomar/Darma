import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, ShieldCheck } from "lucide-react";
import { MotionSection } from "@/components/motion";
import { PortalHero } from "@/components/portals";
import { Card } from "@/components/ui";
import { EditorialCard, getEditorialPagesByKind } from "@/features/editorial";
import { absoluteUrl } from "@/features/tools/seo";

export const metadata: Metadata = {
  title: "Technology Guides | practical learning and career roadmaps | Darma",
  description: "Read practical, reviewed guides for web development, frontend, full stack JavaScript, mobile development, UI/UX, DevOps, technology careers, and software methodologies.",
  keywords: ["technology guides", "developer roadmaps", "web development roadmap", "technology career guide", "software development guide"],
  alternates: { canonical: "/guides" },
  openGraph: { title: "Darma Technology Guides", description: "Practical roadmaps and decision guides connected to cataloged sources, learning paths, careers, and real projects.", url: absoluteUrl("/guides"), type: "website" },
};

export default function GuidesPage() {
  const guides = getEditorialPagesByKind("guide");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Darma Technology Guides",
    description: metadata.description,
    url: absoluteUrl("/guides"),
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: guides.length,
      itemListElement: guides.map((guide, index) => ({ "@type": "ListItem", position: index + 1, name: guide.title, url: absoluteUrl(`/guides/${guide.slug}`) })),
    },
  };

  return (
    <div className="pb-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <PortalHero
        variant="guides"
        eyebrow="Darma editorial knowledge hub"
        badges={["Reviewed guides", "Projects and evidence", "Primary references"]}
        title="Use a roadmap that explains the order, the trade-offs, and the proof of progress."
        description="Start with a goal, understand what to learn now, see what can wait, and connect every topic to cataloged references, practical projects, career context, and real delivery work."
        actions={[
          { href: "#guide-library", label: "Browse practical guides", icon: "route", tone: "primary" },
          { href: "/comparisons", label: "Open comparisons", icon: "compare", tone: "secondary" },
          { href: "/editorial-policy", label: "Review the editorial method", icon: "resources", tone: "quiet" },
        ]}
        metrics={[
          { value: guides.length, label: "reviewed guides" },
          { value: "4", label: "roadmap layers" },
          { value: "1+", label: "projects per guide" },
          { value: "100%", label: "source connected" },
        ]}
        signals={[
          { label: "Answer", value: "Direct starting point" },
          { label: "Order", value: "Capabilities in sequence" },
          { label: "Practice", value: "Projects and checks" },
          { label: "Evidence", value: "Primary references" },
        ]}
      />
      <MotionSection as="section" className="mx-auto max-w-[var(--container-page)] px-4 py-10 sm:px-6 lg:px-8" distance={18}>
        <Card padding="lg" className="portal-method-card grid gap-6 border-[var(--color-primary-border)] lg:grid-cols-[auto_1fr_auto] lg:items-center">
          <span className="atlas-symbol"><BookOpen className="h-5 w-5" aria-hidden /></span>
          <div>
            <h2 className="text-xl font-black text-[var(--color-text-primary)]">A useful guide should change what you do next.</h2>
            <p className="mt-2 text-sm leading-7 text-[var(--color-text-secondary)]">Every Darma guide aims to provide a direct answer, ordered capabilities, practical projects, clear alternatives, review metadata, and links to primary references.</p>
          </div>
          <Link href="/editorial-policy" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--color-border-default)] px-4 text-sm font-black text-[var(--color-primary-text-strong)]"><ShieldCheck className="h-4 w-4" aria-hidden />Editorial policy</Link>
        </Card>
      </MotionSection>
      <section id="guide-library" className="mx-auto max-w-[var(--container-wide)] scroll-mt-28 px-4 sm:px-6 lg:px-8">
        <div className="mb-7 max-w-3xl">
          <p className="font-mono text-xs font-black uppercase tracking-[0.16em] text-[var(--color-primary-text-strong)]">Guide library</p>
          <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[var(--color-text-primary)]">Choose the roadmap closest to your current goal.</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--color-text-secondary)]">Use comparisons when the decision is unclear, then return to the guide for an ordered path and practical checkpoints.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {guides.map((guide, index) => (
            <MotionSection key={guide.slug} delay={(index % 3) * .05} distance={18}>
              <EditorialCard page={guide} />
            </MotionSection>
          ))}
        </div>
      </section>
    </div>
  );
}
