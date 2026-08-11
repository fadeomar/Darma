import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getToolRegistry } from "@/features/tools";
import { ToolPage } from "@/features/tools/layouts";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";

import Article from "./Article";
import TextToSpeechClient from "./TextToSpeechClient";
import "./style.css";
import "./enhancements.css";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("text-to-speech");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

export default function Page() {
  const tool = getToolRegistry().getById("text-to-speech");
  if (!tool) notFound();
  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPage
      tool={tool}
      maxWidth="full"
      intro={
        <p className="max-w-3xl text-sm leading-7 text-[var(--color-text-secondary)]">
          Preview Piper voices before downloading them, cache a model once, tune speaking speed and loudness, then
          generate and export WAV speech entirely in your browser without a Darma TTS server or paid cloud speech
          API.
        </p>
      }
      article={
        <ToolContentCard title="How to use TTS Studio">
          <Article />
        </ToolContentCard>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <TextToSpeechClient />
    </ToolPage>
  );
}
