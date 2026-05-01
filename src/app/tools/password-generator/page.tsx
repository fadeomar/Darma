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
  loading: () => <div className="h-[420px] animate-pulse rounded-3xl bg-slate-100" />,
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
        <p className="max-w-2xl text-sm leading-7 text-slate-700 dark:text-slate-300">
          Cryptographically random passwords and passphrases, generated entirely in your browser. Nothing is sent to a server.
        </p>
      }
    >
      <ToolLayoutSingleUtility
        resultSlot={<PasswordGeneratorClient />}
        infoSlot={
          <div className="grid gap-5 lg:grid-cols-3">
            <SurfaceCard>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Strength guide</h2>
              <dl className="mt-3 space-y-2.5 text-sm leading-6">
                {[
                  ["Very weak", "< 28 bits", "text-red-500"],
                  ["Weak", "28-39 bits", "text-orange-500"],
                  ["Fair", "40-59 bits", "text-yellow-600"],
                  ["Strong", "60-79 bits", "text-emerald-500"],
                  ["Very strong", "80+ bits", "text-emerald-700"],
                ].map(([label, range, color]) => (
                  <div key={label} className="flex items-center justify-between gap-2">
                    <dt className={["font-semibold", color].join(" ")}>{label}</dt>
                    <dd className="font-mono text-xs text-slate-500">{range}</dd>
                  </div>
                ))}
              </dl>
            </SurfaceCard>
            <SurfaceCard>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Quick tips</h2>
              <ul className="mt-3 space-y-2.5 text-sm leading-6 text-slate-700 dark:text-slate-300">
                <li><strong className="text-slate-900 dark:text-slate-100">16 characters</strong> is the minimum for important accounts.</li>
                <li>Use a <strong className="text-slate-900 dark:text-slate-100">passphrase</strong> for your master password.</li>
                <li>Never reuse passwords across sites. Use a password manager.</li>
              </ul>
            </SurfaceCard>
            <SurfaceCard>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Colour key</h2>
              <ul className="mt-3 space-y-1.5 font-mono text-sm">
                <li className="text-[var(--textColor)]">a-z lowercase</li>
                <li className="text-blue-600">A-Z uppercase</li>
                <li className="text-amber-600">0-9 numbers</li>
                <li className="text-purple-600">!@# symbols</li>
              </ul>
            </SurfaceCard>
          </div>
        }
        articleSlot={<ToolContentCard title="About password security"><Article /></ToolContentCard>}
      />
    </ToolPage>
  );
}
