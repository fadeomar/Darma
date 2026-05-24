import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import ToolPageShell from "@/features/tools/ui/ToolPageShell";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";
import SurfaceCard from "@/components/ui/SurfaceCard";

export const metadata: Metadata = {
  title: "Lorem Ipsum Generator | Darma Tools",
  description:
    "Generate classic lorem ipsum, readable placeholder text, startup copy, ecommerce descriptions, and fully structured HTML blocks for mockups, wireframes, and UI prototyping.",
  keywords: [
    "lorem ipsum generator",
    "placeholder text",
    "dummy text",
    "filler content",
    "UI mockup text",
    "wireframe content",
    "HTML placeholder",
    "design placeholder",
    "fake text generator",
    "content placeholder",
  ],
  openGraph: {
    title: "Lorem Ipsum Generator — Placeholder Content Studio",
    description:
      "Go beyond basic filler text. Generate hero sections, testimonials, FAQ blocks, product descriptions, pricing tables, and more — in plain text or ready-to-use HTML.",
  },
};

const LoremIpsumClient = dynamic(() => import("./LoremIpsumClient"), {
  loading: () => <div className="h-[540px] animate-pulse rounded-3xl bg-slate-100" />,
});

const Article = dynamic(() => import("./Article"));

export default function LoremIpsumPage() {
  const tool = getToolRegistry().getById("lorem-ipsum-generator");
  if (!tool) return null;

  return (
    <ToolPageShell
      tool={tool}
      intro={
        <p className="max-w-2xl text-sm leading-7 text-slate-700 dark:text-slate-300">
          More than basic lorem ipsum — choose your text style, pick a design
          preset, and generate placeholder content shaped like real UI copy.
          Instant output, one-click copy, optional HTML wrapping.
        </p>
      }
      sidebar={
        <div className="flex flex-col gap-5">
          <SurfaceCard>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Best for
            </h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
              <li>Mockups and wireframes</li>
              <li>Component library storybooks</li>
              <li>CMS field previews</li>
              <li>Landing page copy drafts</li>
              <li>Design handoff documentation</li>
              <li>UI prototyping and demos</li>
            </ul>
          </SurfaceCard>

          <SurfaceCard>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Text styles
            </h2>
            <dl className="mt-3 space-y-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
              {[
                ["Classic Latin", "Traditional lorem ipsum from Cicero"],
                ["Readable", "English-style neutral placeholder"],
                ["Startup", "Tech and SaaS landing page tone"],
                ["Ecommerce", "Product description style"],
                ["Blog", "Editorial and journalistic copy"],
                ["Profile", "Bio and about-page text"],
              ].map(([name, desc]) => (
                <div key={name}>
                  <dt className="font-semibold text-slate-900 dark:text-slate-100">{name}</dt>
                  <dd className="text-slate-600 dark:text-slate-400">{desc}</dd>
                </div>
              ))}
            </dl>
          </SurfaceCard>

          <SurfaceCard>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Structured blocks
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
              Switch to{" "}
              <strong className="text-slate-900 dark:text-slate-100">Structured</strong>{" "}
              mode to generate complete UI blocks — hero sections, feature cards,
              testimonials, FAQ, product listings, pricing tables, and more.
            </p>
          </SurfaceCard>
        </div>
      }
    >
      <ToolContentCard
        title="Placeholder content studio"
        description="Pick a mode, choose a style or preset, and generate instantly. Copy plain text or HTML — whichever fits your workflow."
      >
        <LoremIpsumClient />
      </ToolContentCard>

      <ToolContentCard title="About this tool">
        <Article />
      </ToolContentCard>
    </ToolPageShell>
  );
}
