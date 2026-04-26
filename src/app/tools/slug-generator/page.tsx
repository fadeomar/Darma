import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import ToolPageShell from "@/features/tools/ui/ToolPageShell";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";
import SurfaceCard from "@/components/ui/SurfaceCard";

export const metadata: Metadata = {
  title: "Free Slug Generator - Create Clean SEO URL Slugs",
  description:
    "Convert titles and text into clean, readable, SEO-friendly URL slugs directly in your browser.",
  keywords: [
    "slug generator",
    "url slug",
    "seo slug",
    "blog slug",
    "cms slug",
    "url cleaner",
    "kebab case",
    "url friendly text",
  ],
  openGraph: {
    title: "Free Slug Generator - Create Clean SEO URL Slugs",
    description:
      "Generate clean URL slugs from titles and text instantly. Supports Arabic and multilingual input, separator options, and browser-only processing.",
  },
};

const SlugGeneratorClient = dynamic(() => import("./SlugGeneratorClient"), {
  loading: () => <div className="h-[520px] animate-pulse rounded-3xl bg-slate-100" />,
});

const Article = dynamic(() => import("./Article"));

export default function SlugGeneratorPage() {
  const tool = getToolRegistry().getById("slug-generator");
  if (!tool) return null;

  return (
    <ToolPageShell
      tool={tool}
      intro={
        <p className="max-w-2xl text-sm leading-7 text-slate-700 dark:text-slate-300">
          Turn headings, article names, and product titles into clean URL slugs
          in real time. Choose separator style, casing, optional stop-word
          removal, and max length. Everything runs locally in your browser.
        </p>
      }
      sidebar={
        <div className="flex flex-col gap-5">
          <SurfaceCard>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Good slug checklist
            </h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
              <li>Keep it short and descriptive</li>
              <li>Use one separator style consistently</li>
              <li>Avoid symbols and repeated separators</li>
              <li>Keep important keywords near the start</li>
              <li>Do not change published slugs without redirects</li>
            </ul>
          </SurfaceCard>

          <SurfaceCard>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Common use cases
            </h2>
            <ul className="mt-3 space-y-1.5 text-sm leading-6 text-slate-700 dark:text-slate-300">
              <li>Blog article URLs</li>
              <li>Product page handles</li>
              <li>CMS and headless content paths</li>
              <li>Documentation routes</li>
              <li>SEO-friendly campaign pages</li>
            </ul>
          </SurfaceCard>

          <SurfaceCard>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Privacy
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
              Slug generation happens entirely in your browser. No text is sent
              to any server.
            </p>
          </SurfaceCard>
        </div>
      }
    >
      <ToolContentCard
        title="Slug Generator"
        description="Paste text, adjust options, and copy a clean URL slug instantly."
      >
        <SlugGeneratorClient />
      </ToolContentCard>

      <ToolContentCard title="About URL slugs">
        <Article />
      </ToolContentCard>
    </ToolPageShell>
  );
}
