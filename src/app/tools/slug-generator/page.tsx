import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import ToolPageShell from "@/features/tools/ui/ToolPageShell";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";
import SurfaceCard from "@/components/ui/SurfaceCard";

export const metadata: Metadata = {
  title: "Slug Route Studio - Bulk Slugs, Redirects & Collision Checks",
  description:
    "Generate single or bulk URL slugs, resolve collisions, audit reserved routes, create redirect mappings, and export CSV, JSON, Next.js, or ZIP route packs locally.",
  keywords: [
    "slug generator",
    "bulk slug generator",
    "url slug",
    "redirect generator",
    "nextjs redirects",
    "route manifest",
    "seo slug",
    "unicode slug",
    "cms migration",
    "url collision checker",
  ],
  openGraph: {
    title: "Slug Route Studio - Bulk Slugs, Redirects & Collision Checks",
    description:
      "Build production-ready route manifests with bulk slug generation, collision handling, redirect exports, Unicode support, and browser-local checks.",
  },
};

const SlugGeneratorClient = dynamic(() => import("./SlugGeneratorClient"), {
  loading: () => <div className="h-[720px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)]" />,
});

const Article = dynamic(() => import("./Article"));

export default function SlugGeneratorPage() {
  const tool = getToolRegistry().getById("slug-generator");
  if (!tool) return null;

  return (
    <ToolPageShell
      tool={tool}
      intro={
        <p className="max-w-3xl text-sm leading-7 text-[var(--color-text-secondary)]">
          Turn one title or an entire content catalog into reviewed URL routes.
          Resolve duplicates, preserve nested paths, flag reserved segments, map
          previous URLs, and export deployment-ready route and redirect files.
          Everything runs locally in your browser.
        </p>
      }
      sidebar={
        <div className="flex flex-col gap-5">
          <SurfaceCard>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
              Production checklist
            </h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--color-text-secondary)]">
              <li>Resolve duplicate or blocked routes</li>
              <li>Review framework-reserved segments</li>
              <li>Keep public URLs lowercase consistently</li>
              <li>Create redirects before changing live URLs</li>
              <li>Verify Unicode support across your stack</li>
            </ul>
          </SurfaceCard>

          <SurfaceCard>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
              Export formats
            </h2>
            <ul className="mt-3 space-y-1.5 text-sm leading-6 text-[var(--color-text-secondary)]">
              <li>Route manifest CSV</li>
              <li>Redirect JSON</li>
              <li>Next.js redirect config</li>
              <li>TypeScript slug utility</li>
              <li>Full JSON and ZIP audit packs</li>
            </ul>
          </SurfaceCard>

          <SurfaceCard>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
              Bulk input format
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
              Enter one title per line. For migrations, add a tab followed by the
              old path to generate a redirect mapping.
            </p>
          </SurfaceCard>
        </div>
      }
    >
      <ToolContentCard
        title="Slug Route Studio"
        description="Generate, review, de-duplicate, and export production URL routes."
      >
        <SlugGeneratorClient />
      </ToolContentCard>

      <ToolContentCard title="Production slug and redirect guide">
        <Article />
      </ToolContentCard>
    </ToolPageShell>
  );
}
