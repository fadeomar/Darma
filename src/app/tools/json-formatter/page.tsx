import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import ToolPageShell from "@/features/tools/ui/ToolPageShell";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";
import SurfaceCard from "@/components/ui/SurfaceCard";
import { NextToolSuggestions } from "@/features/tools/components/NextToolSuggestions";

export const metadata: Metadata = {
  title: "JSON Formatter & Validator | Darma Tools",
  description:
    "Format, validate, repair, minify, sort, and inspect JSON in your browser. Syntax highlighting, line numbers, tree/table views, payload stats, drag-and-drop upload, one-click copy and download.",
  keywords: [
    "json formatter",
    "json validator",
    "format json online",
    "minify json",
    "validate json",
    "json prettifier",
    "json beautifier",
    "json syntax checker",
    "pretty print json",
    "json error finder",
    "online json tool",
    "json linter",
  ],
  openGraph: {
    title: "JSON Formatter & Validator — Instant, Free, Private",
    description:
      "Paste JSON, format it, repair common syntax mistakes, inspect it as a tree or table, and get clear line/column errors. All client-side — nothing leaves your browser.",
  },
};

const JsonFormatterClient = dynamic(() => import("./JsonFormatterClient"), {
  loading: () => (
    <div className="h-[560px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)]" />
  ),
});

const Article = dynamic(() => import("./Article"));

export default function JsonFormatterPage() {
  const tool = getToolRegistry().getById("json-formatter");
  if (!tool) return null;

  return (
    <ToolPageShell
      tool={tool}
      intro={
        <p className="max-w-2xl text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
          Paste any JSON — from an API response, config file, or log export —
          then format, minify, repair common syntax mistakes, sort keys, and
          inspect the payload as text, tree, table, or stats. Everything runs
          locally in your browser.
        </p>
      }
      sidebar={
        <div className="flex flex-col gap-5">
          <SurfaceCard>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
              What you can do
            </h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
              <li>
                <strong className="text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
                  Format
                </strong>{" "}
                — prettify with 2 spaces, 4 spaces, tabs, and optional sorted keys
              </li>
              <li>
                <strong className="text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
                  Minify
                </strong>{" "}
                — compact to a single line
              </li>
              <li>
                <strong className="text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
                  Validate
                </strong>{" "}
                — check syntax with live line + column errors
              </li>
              <li>
                <strong className="text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
                  Fix JSON
                </strong>{" "}
                — repair comments, single quotes, unquoted keys, and trailing commas
              </li>
              <li>
                <strong className="text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
                  Inspect
                </strong>{" "}
                — browse text, tree, table, and stats views
              </li>
            </ul>
          </SurfaceCard>

          <SurfaceCard>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
              Common error causes
            </h2>
            <ul className="mt-3 space-y-1.5 text-sm leading-6 text-[var(--color-text-secondary)] dark:text-[var(--color-text-tertiary)]">
              <li>Trailing comma after last item</li>
              <li>Single quotes instead of double</li>
              <li>Unquoted property names</li>
              <li>Missing or extra bracket / brace</li>
              <li>Comments inside the JSON</li>
              <li>
                <code className="font-mono text-xs">undefined</code> or{" "}
                <code className="font-mono text-xs">NaN</code> as values
              </li>
            </ul>
          </SurfaceCard>

          <SurfaceCard>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
              Privacy
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)] dark:text-[var(--color-text-tertiary)]">
              All processing uses the browser&apos;s built-in{" "}
              <code className="font-mono text-xs">JSON.parse</code> and{" "}
              <code className="font-mono text-xs">JSON.stringify</code>. Your
              data never leaves the page — safe for internal payloads and
              sensitive configs.
            </p>
          </SurfaceCard>

          <NextToolSuggestions
            title="Continue debugging"
            description="Useful companion tools for API payloads, tokens, and encoded request data."
            toolIds={["json-to-typescript", "base64-encoder-decoder", "url-encoder-decoder", "jwt-decoder"]}
          />
        </div>
      }
    >
      <ToolContentCard
        title="JSON Formatter & Validator"
        description="A browser-only JSON studio with formatting, validation, repair, sorted keys, tree/table inspection, stats, copy, upload, and download."
      >
        <JsonFormatterClient />
      </ToolContentCard>

      <ToolContentCard title="About this tool">
        <Article />
      </ToolContentCard>
    </ToolPageShell>
  );
}
