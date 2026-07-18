import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { getToolRegistry } from "@/features/tools";
import { ToolPage } from "@/features/tools/layouts";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";
import { PasswordHeroIllustration } from "./PasswordHeroIllustration";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("password-generator");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const PasswordGeneratorClient = dynamic(() => import("./PasswordGeneratorClient"), {
  loading: () => (
    <div className="h-[620px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)]" />
  ),
});

const Article = dynamic(() => import("./Article"));

export default function PasswordGeneratorPage() {
  const tool = getToolRegistry().getById("password-generator");
  if (!tool) notFound();

  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPage
      tool={tool}
      maxWidth="wide"
      eyebrow="Local security studio"
      headerSize="compact"
      intro={
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-center">
          <p className="max-w-2xl text-sm leading-7 text-[var(--color-text-secondary)] sm:text-base">
            Generate cryptographically random passwords or passphrases, compare them with practical
            account policies, review local production checks, and export safe policy packs that never
            contain the generated secret.
          </p>
          <PasswordHeroIllustration compact className="hidden lg:block" />
        </div>
      }
      article={
        <ToolContentCard
          title="Password generation and policy guidance"
          description="How entropy, account risk, passphrases, storage, and safe exports work."
        >
          <Article />
        </ToolContentCard>
      }
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PasswordGeneratorClient />
    </ToolPage>
  );
}
