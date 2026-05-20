import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import ToolPageShell from "@/features/tools/ui/ToolPageShell";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";
import SurfaceCard from "@/components/ui/SurfaceCard";

export const metadata: Metadata = {
  title: "Free Base64 Encoder and Decoder - Encode and Decode Text Online",
  description:
    "Encode text to Base64 or decode Base64 back to readable text directly in your browser. Supports Unicode, URL-safe Base64, copy, validation, and instant output.",
  keywords: [
    "base64",
    "base64 encoder",
    "base64 decoder",
    "encode",
    "decode",
    "url-safe base64",
    "unicode base64",
    "developer tool",
  ],
  openGraph: {
    title: "Free Base64 Encoder and Decoder - Encode and Decode Text Online",
    description:
      "Instantly encode text to Base64 or decode Base64 into readable text. Unicode-safe, URL-safe options, validation, and copy-ready output in your browser.",
  },
};

const Base64Client = dynamic(() => import("./Base64Client"), {
  loading: () => <div className="h-[560px] animate-pulse rounded-3xl bg-slate-100" />,
});

const Article = dynamic(() => import("./Article"));

export default function Base64EncoderDecoderPage() {
  const tool = getToolRegistry().getById("base64-encoder-decoder");
  if (!tool) notFound();

  return (
    <ToolPageShell
      tool={tool}
      intro={
        <p className="max-w-2xl text-sm leading-7 text-slate-700 dark:text-slate-300">
          Encode plain text to Base64 or decode Base64 back to readable text
          instantly. Supports Unicode, URL-safe mode, validation, and one-click
          copy. Everything runs locally in your browser.
        </p>
      }
      sidebar={
        <div className="flex flex-col gap-5">
          <SurfaceCard>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              What this tool does
            </h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
              <li>Encode text to Base64</li>
              <li>Decode Base64 to text</li>
              <li>Validate Base64 input in decode mode</li>
              <li>Handle Unicode safely (Arabic, emojis, accents)</li>
              <li>Support URL-safe Base64 options</li>
            </ul>
          </SurfaceCard>

          <SurfaceCard>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Important note
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
              Base64 is encoding, not encryption. It is useful for transport and
              formatting compatibility, not for data security.
            </p>
          </SurfaceCard>

          <SurfaceCard>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Privacy
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
              Your input never leaves the browser. No server processing.
            </p>
          </SurfaceCard>
        </div>
      }
    >
      <ToolContentCard
        title="Base64 Encoder / Decoder"
        description="Type or paste input, switch mode, and get instant output with validation."
      >
        <Base64Client />
      </ToolContentCard>

      <ToolContentCard title="About Base64">
        <Article />
      </ToolContentCard>
    </ToolPageShell>
  );
}
