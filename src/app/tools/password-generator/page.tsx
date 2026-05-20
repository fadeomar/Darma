import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import SurfaceCard from "@/components/ui/SurfaceCard";
import { getToolRegistry } from "@/features/tools";
import { buildToolMetadata } from "@/features/tools/seo";
import { ToolLayoutSingleUtility, ToolPage } from "@/features/tools/layouts";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("password-generator");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const PasswordGeneratorClient = dynamic(() => import("./PasswordGeneratorClient"), {
  loading: () => <div className="h-[420px] animate-pulse rounded-[var(--radius-xl)] bg-[var(--color-surface-strong)]" />,
});

const Article = dynamic(() => import("./Article"));

export default function PasswordGeneratorPage() {
  const tool = getToolRegistry().getById("password-generator");
  if (!tool) notFound();

  return (
    <ToolPage tool={tool} maxWidth="wide">
      <ToolLayoutSingleUtility
        resultSlot={<PasswordGeneratorClient />}
        infoSlot={
          <div className="grid gap-5 lg:grid-cols-3">
            <SurfaceCard>
              <h2 className="text-lg font-bold text-[var(--color-text)]">Strength guide</h2>
              <dl className="mt-3 space-y-2.5 text-sm leading-6">
                {[
                  ["Very weak",   "< 28 bits",  "text-red-500"],
                  ["Weak",        "28-39 bits",  "text-orange-500"],
                  ["Fair",        "40-59 bits",  "text-yellow-600"],
                  ["Strong",      "60-79 bits",  "text-emerald-500"],
                  ["Very strong", "80+ bits",    "text-emerald-700"],
                ].map(([label, range, color]) => (
                  <div key={label} className="flex items-center justify-between gap-2">
                    <dt className={["font-semibold", color].join(" ")}>{label}</dt>
                    <dd className="font-mono text-xs text-[var(--color-text-muted)]">{range}</dd>
                  </div>
                ))}
              </dl>
            </SurfaceCard>
            <SurfaceCard>
              <h2 className="text-lg font-bold text-[var(--color-text)]">Quick tips</h2>
              <ul className="mt-3 space-y-2.5 text-sm leading-6 text-[var(--color-text-muted)]">
                <li><strong className="text-[var(--color-text)]">16 characters</strong> is the minimum for important accounts.</li>
                <li>Use a <strong className="text-[var(--color-text)]">passphrase</strong> for your master password.</li>
                <li>Never reuse passwords across sites. Use a password manager.</li>
              </ul>
            </SurfaceCard>
            <SurfaceCard>
              <h2 className="text-lg font-bold text-[var(--color-text)]">Colour key</h2>
              <ul className="mt-3 space-y-1.5 font-mono text-sm">
                <li className="text-[var(--color-text)]">a-z lowercase</li>
                <li className="text-blue-600">A-Z uppercase</li>
                <li className="text-amber-600">0-9 numbers</li>
                <li className="text-purple-600">!@# symbols</li>
              </ul>
            </SurfaceCard>
          </div>
        }
        articleSlot={<Article />}
      />
    </ToolPage>
  );
}
