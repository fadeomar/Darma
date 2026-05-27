import type { Metadata } from "next";
import dynamic from "next/dynamic";
import SurfaceCard from "@/components/ui/SurfaceCard";
import { getToolRegistry } from "@/features/tools";
import { ToolLayoutSingleUtility, ToolPage } from "@/features/tools/layouts";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";

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
  loading: () => <div className="h-[420px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)]" />,
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
        <p className="max-w-2xl text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
          Cryptographically random passwords and passphrases, generated entirely in your browser. Nothing is sent to a server.
        </p>
      }
    >
      <ToolLayoutSingleUtility
        resultSlot={<PasswordGeneratorClient />}
        infoSlot={
          <div className="grid gap-5 lg:grid-cols-3">
            <SurfaceCard>
              <h2 className="text-lg font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">Strength guide</h2>
              <dl className="mt-3 space-y-2.5 text-sm leading-6">
                {[
                  ["Very weak", "< 28 bits", "text-[var(--color-danger-text)]"],
                  ["Weak", "28-39 bits", "text-[var(--color-warning-text)]"],
                  ["Fair", "40-59 bits", "text-[var(--color-warning-text)]"],
                  ["Strong", "60-79 bits", "text-[var(--color-success-text)]"],
                  ["Very strong", "80+ bits", "text-[var(--color-success-text)]"],
                ].map(([label, range, color]) => (
                  <div key={label} className="flex items-center justify-between gap-2">
                    <dt className={["font-semibold", color].join(" ")}>{label}</dt>
                    <dd className="font-mono text-xs text-[var(--color-text-tertiary)]">{range}</dd>
                  </div>
                ))}
              </dl>
            </SurfaceCard>
            <SurfaceCard>
              <h2 className="text-lg font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">Quick tips</h2>
              <ul className="mt-3 space-y-2.5 text-sm leading-6 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
                <li><strong className="text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">16 characters</strong> is the minimum for important accounts.</li>
                <li>Use a <strong className="text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">passphrase</strong> for your master password.</li>
                <li>Never reuse passwords across sites. Use a password manager.</li>
              </ul>
            </SurfaceCard>
            <SurfaceCard>
              <h2 className="text-lg font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">Colour key</h2>
              <ul className="mt-3 space-y-1.5 font-mono text-sm">
                <li className="text-[var(--textColor)]">a-z lowercase</li>
                <li className="text-[var(--color-primary)]">A-Z uppercase</li>
                <li className="text-[var(--color-warning-text)]">0-9 numbers</li>
                <li className="text-[var(--color-accent)]">!@# symbols</li>
              </ul>
            </SurfaceCard>
          </div>
        }
        articleSlot={<ToolContentCard title="About password security"><Article /></ToolContentCard>}
      />
    </ToolPage>
  );
}
