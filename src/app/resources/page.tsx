import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Compass, GitBranch, Route, ShieldCheck } from "lucide-react";
import { PortalHero } from "@/components/portals";
import { Badge, Card } from "@/components/ui";
import { absoluteUrl } from "@/features/tools/seo";
import { getLearningPathLinksByResourceId, getLearningPaths } from "@/features/learning-paths";
import { getTechCareerLinksByResourceId, getTechCareers } from "@/features/tech-careers";
import { getWayLinksByResourceId, getWaysOfWorking } from "@/features/ways-of-working";
import {
  getFeaturedResources,
  getResourceCatalog,
  getResourceCategoryCounts,
  getResourceGovernanceSummary,
  RESOURCE_CATEGORIES,
  type Resource,
} from "@/features/resources";
import { ResourceExplorer } from "@/features/resources/components";
import type { ResourceExplorerInitialFilters } from "@/features/resources/components/ResourceExplorer";
import { getResourceHubs } from "@/features/editorial";

const BASE_METADATA: Metadata = {
  title: "Developer Resources | curated docs, tools, courses, and design references",
  description: "Search Darma's curated technical library for official documentation, courses, tutorials, generators, accessibility references, design assets, JavaScript tools, and practical resources.",
  keywords: ["developer resources", "web development resources", "JavaScript learning resources", "frontend developer tools", "design resources", "programming references"],
  alternates: { canonical: "/resources" },
  openGraph: { title: "Darma Developer Resource Explorer", description: "A searchable reference library connected to practical technology learning paths.", url: absoluteUrl("/resources"), type: "website" },
};

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const hasFilters = Object.values(params).some((value) => Array.isArray(value) ? value.some(Boolean) : Boolean(value));
  return { ...BASE_METADATA, robots: hasFilters ? { index: false, follow: true } : { index: true, follow: true } };
}

const VALUE_POINTS = [
  { icon: Compass, title: "Start from the task", text: "Search by goal and use ranked matches instead of needing to know a website or tool name first." },
  { icon: ShieldCheck, title: "Trust stays visible", text: "Official, community, verified, and review-needed states remain explicit rather than being guessed." },
  { icon: Route, title: "Resources become a path", text: "Core references show the Darma learning paths and practical stages where they are useful." },
];

function jsonLd(resources: Resource[]) {
  const featured = getFeaturedResources(10);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${absoluteUrl("/resources")}#collection`,
        url: absoluteUrl("/resources"),
        name: "Darma Developer Resource Explorer",
        description: "A curated searchable collection of developer documentation, learning references, design resources, and technical tools.",
        mainEntity: { "@id": `${absoluteUrl("/resources")}#resources` },
      },
      {
        "@type": "ItemList",
        "@id": `${absoluteUrl("/resources")}#resources`,
        numberOfItems: resources.length,
        itemListElement: featured.map((resource, index) => ({ "@type": "ListItem", position: index + 1, name: resource.name, url: resource.url })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
          { "@type": "ListItem", position: 2, name: "Resources", item: absoluteUrl("/resources") },
        ],
      },
    ],
  };
}

const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
const allowed = <T extends string>(value: string | undefined, values: readonly T[], fallback: T) => value && values.includes(value as T) ? value as T : fallback;
const TYPE_FILTERS = ["all", "documentation", "course", "tutorial", "tool", "generator", "community", "reference", "asset-library"] as const;
const PRICE_FILTERS = ["all", "free", "freemium", "paid", "unknown"] as const;
const LEVEL_FILTERS = ["all", "beginner", "intermediate", "advanced"] as const;
const PUBLISHER_FILTERS = ["all", "official", "community", "unknown"] as const;

export default async function ResourcesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const resources = getResourceCatalog();
  const initial: ResourceExplorerInitialFilters = {
    query: first(params.q) ?? "",
    category: first(params.category) ?? "all",
    resourceType: allowed(first(params.type), TYPE_FILTERS, "all"),
    pricing: allowed(first(params.pricing), PRICE_FILTERS, "all"),
    level: allowed(first(params.level), LEVEL_FILTERS, "all"),
    publisher: allowed(first(params.publisher), PUBLISHER_FILTERS, "all"),
    view: allowed(first(params.view), ["all", "featured", "saved"] as const, "all"),
    sort: allowed(first(params.sort), ["recommended", "name", "category"] as const, "recommended"),
  };

  const data = jsonLd(resources);
  const paths = getLearningPaths();
  const careers = getTechCareers();
  const ways = getWaysOfWorking();
  const resourceHubs = getResourceHubs();
  const officialCount = resources.filter((resource) => resource.publisherType === "official").length;
  const governance = getResourceGovernanceSummary(resources);
  const featuredCount = resources.filter((resource) => resource.featured).length;
  const atlasLinks = [getLearningPathLinksByResourceId(), getTechCareerLinksByResourceId(), getWayLinksByResourceId()].reduce<Record<string, Array<{ title: string; href: string }>>>((merged, map) => {
    for (const [id, links] of Object.entries(map)) merged[id] = [...(merged[id] ?? []), ...links];
    return merged;
  }, {});

  return (
    <div className="pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />
      <PortalHero
        variant="resources"
        eyebrow="Darma resource catalog"
        badges={["Official sources", "Visible review status", "Connected to paths"]}
        title="Find the right technical source by the task it supports, not only by its name."
        description="Explore official documentation, courses, generators, design libraries, accessibility references, JavaScript tools, and community sources through one searchable catalog with visible trust signals."
        actions={[
          { href: "#resource-explorer-title", label: "Search the library", icon: "search", tone: "primary" },
          { href: "/learning-paths", label: "Follow a learning path", icon: "route", tone: "secondary" },
          { href: "/contribute#resources", label: "Suggest a source", icon: "resources", tone: "quiet" },
        ]}
        metrics={[
          { value: governance.total, label: "cataloged references" },
          { value: officialCount, label: "official publishers" },
          { value: governance.verified, label: "verified entries" },
          { value: RESOURCE_CATEGORIES.length, label: "subject categories" },
        ]}
        signals={[
          { label: "Review", value: `${governance.verified} of ${governance.total} verified` },
          { label: "Context", value: "Task-based ranking" },
          { label: "Connection", value: "Paths and careers" },
          { label: "Coverage", value: `${featuredCount} featured sources` },
        ]}
      />
      <section className="mx-auto max-w-[var(--container-wide)] px-4 py-10 sm:px-6 lg:px-8" aria-label="How the library works">
        <div className="portal-principle-grid">
          {VALUE_POINTS.map((point, index) => {
            const Icon = point.icon;
            return (
              <Card key={point.title} padding="md" className="portal-principle-card h-full">
                <span className="portal-principle-index">0{index + 1}</span>
                <span className="portal-principle-icon"><Icon className="h-5 w-5" aria-hidden /></span>
                <h2>{point.title}</h2>
                <p>{point.text}</p>
              </Card>
            );
          })}
        </div>
      </section>
      <section className="mx-auto max-w-[var(--container-wide)] px-4 pb-10 sm:px-6 lg:px-8">
        <div className="mb-5">
          <Badge variant="soft">Indexable topic hubs</Badge>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.035em] text-[var(--color-text-primary)]">Start with a curated subject, then narrow the full explorer.</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--color-text-secondary)]">These permanent pages add learning order, selection criteria, and recommended sources around the most useful categories.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {resourceHubs.map((hub) => (
            <Link key={hub.slug} href={`/resources/${hub.slug}`} className="block h-full">
              <Card variant="interactive" padding="lg" className="h-full">
                <Badge variant="outline">Resource hub</Badge>
                <h3 className="mt-4 text-lg font-black text-[var(--color-text-primary)]">{hub.shortTitle}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{hub.summary}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>
      <ResourceExplorer resources={resources} categories={RESOURCE_CATEGORIES} categoryCounts={getResourceCategoryCounts()} atlasLinksByResourceId={atlasLinks} initialFilters={initial} />
      <section className="mx-auto max-w-[var(--container-wide)] px-4 sm:px-6 lg:px-8">
        <Card padding="lg" className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="flex items-center gap-2 text-[var(--color-primary)]"><GitBranch className="h-5 w-5" aria-hidden /><span className="font-mono text-xs font-bold uppercase tracking-[0.14em]">Open catalog</span></div>
            <h2 className="mt-3 text-2xl font-black text-[var(--color-text-primary)]">A resource becomes more useful when its place in the journey is clear.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">Open the learning paths to see which sources support each stage, what to build, and how to check your understanding.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/learning-paths" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-5 text-sm font-semibold text-[var(--color-primary-text)] transition hover:bg-[var(--color-primary-hover)]">Browse learning paths <ArrowRight className="h-4 w-4" aria-hidden /></Link>
            <Link href="/contribute#resources" className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] px-5 text-sm font-semibold text-[var(--color-text-primary)] transition hover:border-[var(--color-primary-border)] hover:text-[var(--color-primary)]">Suggest a resource</Link>
          </div>
        </Card>
      </section>
    </div>
  );
}
