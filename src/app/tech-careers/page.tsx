import type { Metadata } from "next";
import Link from "next/link";
import { BriefcaseBusiness, GitBranch, Network, ShieldCheck } from "lucide-react";
import { PortalHero } from "@/components/portals";
import { Card } from "@/components/ui";
import { absoluteUrl } from "@/features/tools/seo";
import { getTechCareers } from "@/features/tech-careers";
import { CareerExplorer } from "@/features/tech-careers/components";

export const metadata: Metadata = {
  title: "Technology Careers | roles, skills, seniority, and team collaboration | Darma",
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
  const categories = new Set(careers.map((career) => career.category)).size;
  const featured = careers.filter((career) => career.featured).length;
  const linkedPaths = new Set(careers.flatMap((career) => career.learningPathSlugs)).size;

  return (
    <div className="pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />
      <PortalHero
        variant="careers"
        eyebrow="Darma technology career atlas"
        badges={["Role guides", "Scope and evidence", "Team context"]}
        title="See what technology roles deliver, who they work with, and how responsibility grows."
        description="Go beyond job-title lists. Understand daily work, responsibilities, deliverables, skills, collaborators, career levels, common misconceptions, and the clearest ways to start."
        actions={[
          { href: "/career-pathfinder", label: "Try Career Pathfinder", icon: "atlas", tone: "primary" },
          { href: "#career-explorer-title", label: "Browse all roles", icon: "search", tone: "secondary" },
          { href: "/tech-teams", label: "See team structures", icon: "route", tone: "quiet" },
        ]}
        metrics={[
          { value: careers.length, label: "role guides" },
          { value: categories, label: "career families" },
          { value: featured, label: "featured roles" },
          { value: linkedPaths, label: "linked learning paths" },
        ]}
        signals={[
          { label: "Work", value: "Daily responsibilities" },
          { label: "Evidence", value: "Deliverables and outcomes" },
          { label: "Scope", value: "Junior to senior" },
          { label: "Context", value: "Collaborators and teams" },
        ]}
      />
      <section className="mx-auto max-w-[var(--container-wide)] px-4 py-10 sm:px-6 lg:px-8">
        <div className="portal-principle-grid">
          {PRINCIPLES.map((principle, index) => {
            const Icon = principle.icon;
            return (
              <Card key={principle.title} padding="md" className="portal-principle-card h-full">
                <span className="portal-principle-index">0{index + 1}</span>
                <span className="portal-principle-icon"><Icon className="h-5 w-5" aria-hidden /></span>
                <h2>{principle.title}</h2>
                <p>{principle.text}</p>
              </Card>
            );
          })}
        </div>
      </section>
      <CareerExplorer careers={careers} />
      <section className="mx-auto max-w-[var(--container-wide)] px-4 sm:px-6 lg:px-8">
        <Card padding="lg" className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="flex items-center gap-2 text-[var(--color-primary-text-strong)]"><GitBranch className="h-5 w-5" aria-hidden /><span className="font-mono text-xs font-bold uppercase tracking-[0.14em]">Titles vary between companies</span></div>
            <h2 className="mt-3 text-2xl font-black text-[var(--color-text-primary)]">Use these guides to ask better questions, not to force every company into one chart.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">Scope, product type, company stage, team topology, and local labor markets change titles. Compare the actual responsibilities and expected evidence.</p>
          </div>
          <Link href="/tech-glossary" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] px-5 text-sm font-semibold text-[var(--color-text-primary)] transition hover:border-[var(--color-primary-border)] hover:text-[var(--color-primary-text-strong)]">Open the tech glossary</Link>
        </Card>
      </section>
    </div>
  );
}
