import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getToolRegistry } from "@/features/tools";
import { ToolPage } from "@/features/tools/layouts";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";

import Article from "./Article";
import { TTS_FAQS } from "./content";
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
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: TTS_FAQS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <ToolPage
      tool={tool}
      maxWidth="full"
      intro={
        <div className="max-w-4xl space-y-2 text-sm leading-7 text-[var(--color-text-secondary)]">
          <p>
            <strong className="text-[var(--color-text-primary)]">Free text to speech with no sign up, subscription, credits, or Darma text quota.</strong>{" "}
            Preview Piper neural voices, download any available model once, then generate private WAV speech locally
            in your browser. Long text is processed in local chunks instead of being blocked by an artificial
            character or word limit.
          </p>
          <p>
            Your text and generated audio are not uploaded to a Darma TTS server, and session history stays in this
            tab so you can replay or download earlier generations without creating an account.
          </p>
        </div>
      }
      article={
        <ToolContentCard title="Free TTS Studio guide & FAQ">
          <Article />
        </ToolContentCard>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <TextToSpeechClient />
    </ToolPage>
  );
}
