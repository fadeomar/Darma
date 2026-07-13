import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import ToolPageShell from "@/features/tools/ui/ToolPageShell";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";
import SurfaceCard from "@/components/ui/SurfaceCard";

export const metadata: Metadata = {
  title: "URL Encoder, Decoder & Query Inspector",
  description:
    "Encode full URLs or components, decode percent escapes, edit query parameters, inspect URL structure, detect leakage risks, and export production-ready reports locally.",
  keywords: [
    "url encoder",
    "url decoder",
    "percent encoding",
    "encodeURIComponent",
    "URLSearchParams",
    "query string editor",
    "query parameter inspector",
    "double encoding detector",
    "url security checker",
    "application x-www-form-urlencoded",
  ],
  openGraph: {
    title: "URL Encoder, Decoder & Query Inspector",
    description:
      "Encode, decode, inspect, edit, audit, and export URLs and query parameters without uploading data.",
  },
};

const UrlEncoderDecoderClient = dynamic(() => import("./UrlEncoderDecoderClient"), {
  loading: () => (
    <div className="h-[720px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)]" />
  ),
});

const Article = dynamic(() => import("./Article"));

export default function UrlEncoderDecoderPage() {
  const tool = getToolRegistry().getById("url-encoder-decoder");
  if (!tool) return null;

  return (
    <ToolPageShell
      tool={tool}
      intro={
        <p className="max-w-3xl text-sm leading-7 text-[var(--color-text-secondary)]">
          Encode complete URLs, individual components, or form values; decode
          percent escapes; inspect URL structure; edit query parameters; and run
          production checks for malformed sequences, duplicates, credentials,
          sensitive values, and possible double encoding.
        </p>
      }
      sidebar={
        <div className="flex flex-col gap-5">
          <SurfaceCard>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Included workflows</h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--color-text-secondary)]">
              <li>Full URL, component, and form-value conversion.</li>
              <li>Editable duplicate-aware query parameter table.</li>
              <li>URL component and protocol inspection.</li>
              <li>Leakage, compatibility, and double-encoding checks.</li>
              <li>JavaScript, cURL, JSON, and ZIP exports.</li>
            </ul>
          </SurfaceCard>

          <SurfaceCard>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Security note</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
              Encoding is reversible formatting. It does not secure tokens,
              passwords, API keys, or private redirect data.
            </p>
          </SurfaceCard>

          <SurfaceCard>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Privacy</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
              All conversion, analysis, query editing, and export generation run
              locally in the browser.
            </p>
          </SurfaceCard>
        </div>
      }
    >
      <ToolContentCard
        title="URL Encoding & Query Studio"
        description="Transform, inspect, edit, review, and export URLs and query strings from one compact workspace."
      >
        <UrlEncoderDecoderClient />
      </ToolContentCard>

      <ToolContentCard title="URL encoding guide">
        <Article />
      </ToolContentCard>
    </ToolPageShell>
  );
}
