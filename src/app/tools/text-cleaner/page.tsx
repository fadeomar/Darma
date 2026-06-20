import type { Metadata } from "next";
import dynamic from "next/dynamic";
import SurfaceCard from "@/components/ui/SurfaceCard";
import { NextToolSuggestions } from "@/features/tools/components/NextToolSuggestions";
import { getToolRegistry } from "@/features/tools";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";
import ToolPageShell from "@/features/tools/ui/ToolPageShell";

export const metadata: Metadata = {
  title: "Text Cleaner Pro | Darma Tools",
  description:
    "Clean, normalize, extract, format, and transform text instantly in your browser with presets, Arabic cleanup, and multi-step pipelines.",
  keywords: [
    "text cleaner",
    "text cleaner pro",
    "case converter",
    "remove extra spaces",
    "text formatter",
    "arabic text cleanup",
    "extract urls",
    "extract emails",
    "snake_case converter",
    "kebab-case converter",
    "remove duplicate lines",
    "sort lines",
    "online text tool",
  ],
  openGraph: {
    title: "Text Cleaner Pro - Fix Any Text Instantly",
    description:
      "Paste messy text and clean it up with presets, extraction tools, Arabic normalization, and ordered pipelines - all in your browser, nothing uploaded.",
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
          Paste any text and clean it up instantly - collapse spaces, normalize
          Arabic text, extract links and emails, format lists, convert case, and
          run multi-step pipelines. Everything runs locally; nothing leaves your browser.
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
                "camelCase",
                "PascalCase",
                "snake_case",
                "kebab-case",
              ].map((format) => (
                <li key={format} className="font-mono text-xs">
                  {format}
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
              <li>Remove duplicate lines</li>
              <li>Sort A-Z / Z-A</li>
              <li>Extract URLs, emails, phones, hashtags, mentions, and numbers</li>
              <li>Normalize Arabic alef, yaa, tashkeel, tatweel, and punctuation</li>
            </ul>
          </SurfaceCard>

          <SurfaceCard>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
              How it works
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)] dark:text-[var(--color-text-tertiary)]">
              Run a single action for quick cleanup, or add multiple actions to
              a selected pipeline and run them in order. Use output as input when
              you want to continue refining a result.
            </p>
          </SurfaceCard>

          <NextToolSuggestions toolIds={["slug-generator", "meta-tag-generator", "word-counter"]} />
        </div>
      }
    >
      <ToolContentCard
        title="Text Cleaner Pro"
        description="Paste your text on the left, run presets or actions, and copy or download the result on the right."
      >
        <TextCleanerClient tool={{ id: tool.id, title: tool.title }} />
      </ToolContentCard>

      <ToolContentCard title="About this tool">
        <Article />
      </ToolContentCard>
    </ToolPageShell>
  );
}
