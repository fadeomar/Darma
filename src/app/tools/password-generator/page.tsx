import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import { ToolPage } from "@/features/tools/layouts";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";
import { PasswordHeroIllustration } from "./PasswordHeroIllustration";

export const metadata: Metadata = {
  title: "Password Generator | Darma Tools",
  description:
    "Generate strong, cryptographically random passwords and passphrases. Adjust length, character sets, and strength - all in your browser, nothing sent to a server.",
  keywords: [
    "password generator",
    "strong password",
    "random password",
    "passphrase generator",
    "secure password",
    "password strength",
    "password entropy",
    "free password generator",
  ],
  openGraph: {
    title: "Password Generator - Strong & Secure",
    description:
      "Create cryptographically random passwords and memorable passphrases with a real-time strength meter. Runs entirely in your browser.",
  },
};

const PasswordGeneratorClient = dynamic(() => import("./PasswordGeneratorClient"), {
  loading: () => <div className="h-[620px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)]" />,
});

const Article = dynamic(() => import("./Article"));

export default function PasswordGeneratorPage() {
  const tool = getToolRegistry().getById("password-generator");
  if (!tool) return null;

  return (
    <ToolPage
      tool={tool}
      maxWidth="wide"
      intro={
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-center">
          <p className="max-w-2xl text-sm leading-7 text-[var(--color-text-secondary)] sm:text-base">
            Generate strong passwords and passphrases locally in your browser. Use the main panel to tune length, character mix, readability, and passphrase options without uploading generated secrets anywhere.
          </p>
          <PasswordHeroIllustration compact className="hidden lg:block" />
        </div>
      }
    >
      <PasswordGeneratorClient />
      <section className="mt-8">
        <ToolContentCard title="About password security">
          <Article />
        </ToolContentCard>
      </section>
    </ToolPage>
  );
}
