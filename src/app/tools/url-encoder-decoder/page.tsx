import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import ToolPageShell from "@/features/tools/ui/ToolPageShell";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";
import SurfaceCard from "@/components/ui/SurfaceCard";

export const metadata: Metadata = {
  title: "Free URL Encoder and Decoder - Encode URLs and Query Parameters",
  description:
    "Encode URLs, decode percent-encoded text, inspect query parameters, and copy clean results instantly in your browser.",
  keywords: [
    "url encoder",
    "url decoder",
    "encodeURIComponent",
    "percent encoding",
    "query parameters",
    "decode url online",
    "encode url online",
    "developer tool",
    "web utility",
  ],
  openGraph: {
    title: "Free URL Encoder and Decoder — Encode URLs and Query Parameters",
    description:
      "Encode URLs, decode percent-encoded text, inspect query parameters, and copy clean results instantly in your browser.",
  },
};

const UrlEncoderDecoderClient = dynamic(() => import("./UrlEncoderDecoderClient"), {
  loading: () => <div className="h-[560px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)]" />,
});

const Article = dynamic(() => import("./Article"));

export default function UrlEncoderDecoderPage() {
  const tool = getToolRegistry().getById("url-encoder-decoder");
  if (!tool) return null;

  return (
    <ToolPageShell
      tool={tool}
      intro={
        <p className="max-w-2xl text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
          Encode full URLs, encode query values with component-safe escaping,
          decode percent-encoded text, and inspect query parameters without
          uploading anything. The tool runs fully in your browser using native
          URL APIs.
        </p>
      }
      sidebar={
        <div className="flex flex-col gap-5">
          <SurfaceCard>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
              What you can do
            </h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
              <li>Encode full URLs while preserving structure.</li>
              <li>Encode query values with component mode.</li>
              <li>Decode percent-encoded URLs and text.</li>
              <li>Inspect query string key/value pairs.</li>
              <li>Copy output or individual query values.</li>
            </ul>
          </SurfaceCard>

          <SurfaceCard>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
              Good to know
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)] dark:text-[var(--color-text-tertiary)]">
              URL encoding formats text for URLs. It does not encrypt, secure,
              or hide data. Sensitive tokens in URLs should still be handled
              carefully.
            </p>
          </SurfaceCard>

          <SurfaceCard>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
              Privacy
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)] dark:text-[var(--color-text-tertiary)]">
              Encoding, decoding, and query inspection happen locally in the
              browser. No URL or text input is sent to a server.
            </p>
          </SurfaceCard>
        </div>
      }
    >
      <ToolContentCard
        title="URL Encoder / Decoder"
        description="Paste a URL, query string, or text, choose the action and encoding type, then copy the clean result."
      >
        <UrlEncoderDecoderClient />
      </ToolContentCard>

      <ToolContentCard title="About this tool">
        <Article />
      </ToolContentCard>
    </ToolPageShell>
  );
}
