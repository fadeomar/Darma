"use client";

import { useState } from "react";
import CodeEditor from "@/components/CodeEditor";

interface CodeOutputProps {
  html: string;
  css: string;
  particleCount: number;
}

type Tab = "full" | "css" | "react" | "tailwind";

const TABS: { id: Tab; label: string }[] = [
  { id: "full", label: "HTML + CSS" },
  { id: "css", label: "CSS" },
  { id: "react", label: "React" },
  { id: "tailwind", label: "Tailwind" },
];

function reactSnippet(css: string, particleCount: number) {
  return `export function AnimatedBackground() {
  return (
    <div className="darma-animated-bg">
      <style>{\`
${css}
\`}</style>
      {Array.from({ length: ${particleCount} }, (_, i) => (
        <span key={i} />
      ))}
    </div>
  );
}`;
}

function tailwindSnippet(html: string, css: string) {
  return `{/* The animation relies on custom keyframes, so keep this CSS alongside your Tailwind setup. */}
<div className="relative w-full min-h-[420px] overflow-hidden">
${html
    .split("\n")
    .map((line) => (line ? `  ${line}` : line))
    .join("\n")}
</div>

<style>
${css}
</style>`;
}

export default function CodeOutput({ html, css, particleCount }: CodeOutputProps) {
  const [tab, setTab] = useState<Tab>("full");

  const full = `${html}\n\n<style>\n${css}\n</style>`;
  const code =
    tab === "css"
      ? css
      : tab === "react"
        ? reactSnippet(css, particleCount)
        : tab === "tailwind"
          ? tailwindSnippet(html, css)
          : full;
  const language = tab === "css" ? "css" : tab === "react" ? "tsx" : "html";

  return (
    <div className="rounded-3xl border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">Export</p>
          <h2 className="mt-1 text-xl font-black text-[var(--color-text-primary)]">Copy production-ready code</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${tab === item.id ? "bg-[var(--color-primary)] text-[var(--color-primary-text)]" : "bg-[var(--color-control-track)] text-[var(--color-text-secondary)] hover:bg-[var(--color-control-hover)]"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <CodeEditor code={code} language={language} showCopyButton setCode={() => {}} analyticsContext={`animated background ${tab}`} height="520px" />
    </div>
  );
}
