import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import ToolPageShell from "@/features/tools/ui/ToolPageShell";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";
import SurfaceCard from "@/components/ui/SurfaceCard";

export const metadata: Metadata = {
  title: "Text Cleaner & Case Converter | Darma Tools",
  description:
    "Clean, format, and transform text instantly in your browser. Remove extra spaces, fix line endings, deduplicate lines, sort, and convert between UPPERCASE, lowercase, camelCase, snake_case, and more.",
  keywords: [
    "text cleaner",
    "case converter",
    "remove extra spaces",
    "text formatter",
    "camelCase converter",
    "snake_case converter",
    "kebab-case converter",
    "remove duplicate lines",
    "sort lines",
    "text transform",
    "online text tool",
    "string utilities",
  ],
  openGraph: {
    title: "Text Cleaner & Case Converter — Fix Any Text Instantly",
    description:
      "Paste messy text and clean it up in one click. Remove whitespace, normalize line endings, deduplicate, sort lines, and convert case — all in your browser, nothing uploaded.",
  },
};

const TextCleanerClient = dynamic(() => import("./TextCleanerClient"), {
  loading: () => <div className="h-[540px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)]" />,
});

const Article = dynamic(() => import("./Article"));

export default function TextCleanerPage() {
  const tool = getToolRegistry().getById("text-cleaner");
  if (!tool) return null;

  return (
    <ToolPageShell
      tool={tool}
      intro={
        <p className="max-w-2xl text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
          Paste any text and clean it up instantly — collapse spaces, fix
          capitalisation, sort lines, remove duplicates, and convert between
          ten case formats. Transforms chain together, so you can apply several
          in sequence. Everything runs locally; nothing leaves your browser.
        </p>
      }
      sidebar={
        <div className="flex flex-col gap-5">
          <SurfaceCard>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
              Case formats
            </h2>
            <ul className="mt-3 space-y-1.5 text-sm leading-6 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
              {[
                "UPPERCASE",
                "lowercase",
                "Title Case",
                "Sentence case",
                "Each Word",
                "iNVERSE",
                "camelCase",
                "PascalCase",
                "snake_case",
                "kebab-case",
              ].map((f) => (
                <li key={f} className="font-mono text-xs">
                  {f}
                </li>
              ))}
            </ul>
          </SurfaceCard>

          <SurfaceCard>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
              Cleaning tools
            </h2>
            <ul className="mt-3 space-y-1.5 text-sm leading-6 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
              <li>Trim whitespace</li>
              <li>Remove extra spaces</li>
              <li>Remove empty lines</li>
              <li>Trim each line</li>
              <li>Normalize line breaks</li>
              <li>Collapse blank lines</li>
              <li>Remove duplicate lines</li>
              <li>Sort A → Z / Z → A</li>
            </ul>
          </SurfaceCard>

          <SurfaceCard>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
              How it works
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)] dark:text-[var(--color-text-tertiary)]">
              Each transform you click applies to the current{" "}
              <strong className="text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
                output
              </strong>{" "}
              (or input if there is no output yet). Results chain — apply as many
              transforms as you like in sequence.
            </p>
          </SurfaceCard>
        </div>
      }
    >
      <ToolContentCard
        title="Text cleaner & case converter"
        description="Paste your text on the left, apply transforms, and copy or download the result on the right."
      >
        <TextCleanerClient />
      </ToolContentCard>

      <ToolContentCard title="About this tool">
        <Article />
      </ToolContentCard>
    </ToolPageShell>
  );
}
