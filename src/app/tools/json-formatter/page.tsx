import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import ToolPageShell from "@/features/tools/ui/ToolPageShell";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";
import SurfaceCard from "@/components/ui/SurfaceCard";

export const metadata: Metadata = {
  title: "JSON Formatter & Validator | Darma Tools",
  description:
    "Format, validate, and minify JSON instantly in your browser. Clear error messages with line and column numbers, 2/4-space or tab indentation, one-click copy and download. No signup, nothing uploaded.",
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
      "Paste JSON, format it for readability, minify it for transport, and get precise error messages when something is broken. All client-side — nothing leaves your browser.",
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
          and format it for reading, minify it for transport, or validate it to
          find exactly where the syntax breaks. Clear error messages, line and
          column numbers, one-click copy. Everything runs locally.
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
                — prettify with 2 spaces, 4 spaces, or tabs
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
                — check syntax with line + column errors
              </li>
              <li>
                <strong className="text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
                  Copy
                </strong>{" "}
                — one-click clipboard copy
              </li>
              <li>
                <strong className="text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
                  Download
                </strong>{" "}
                — save as <code className="font-mono text-xs">.json</code>
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
        </div>
      }
    >
      <ToolContentCard
        title="JSON Formatter & Validator"
        description="Paste JSON on the left, pick an action, and inspect the result on the right."
      >
        <JsonFormatterClient />
      </ToolContentCard>

      <ToolContentCard title="About this tool">
        <Article />
      </ToolContentCard>
    </ToolPageShell>
  );
}
