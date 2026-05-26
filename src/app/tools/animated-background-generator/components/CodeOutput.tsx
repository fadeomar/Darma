"use client";

import { useState } from "react";
import CodeEditor from "@/components/CodeEditor";

interface CodeOutputProps {
  html: string;
  css: string;
}

type Tab = "full" | "html" | "css";

export default function CodeOutput({ html, css }: CodeOutputProps) {
  const [tab, setTab] = useState<Tab>("full");
  const full = `${html}\n\n<style>\n${css}\n</style>`;
  const code = tab === "html" ? html : tab === "css" ? css : full;
  const language = tab === "css" ? "css" : "html";

  return (
    <div className="rounded-3xl border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">Export</p>
          <h2 className="mt-1 text-xl font-black text-[var(--color-text-primary)]">Copy production-ready code</h2>
        </div>
        <div className="flex flex-wrap gap-2">
        {(["full", "html", "css"] as Tab[]).map((item) => (
          <button key={item} type="button" onClick={() => setTab(item)} className={`rounded-full px-4 py-2 text-sm font-semibold capitalize transition ${tab === item ? "bg-[var(--color-primary)] text-[var(--color-primary-text)]" : "bg-[var(--color-control-track)] text-[var(--color-text-secondary)] hover:bg-[var(--color-control-hover)]"}`}>
            {item === "full" ? "Full snippet" : item}
          </button>
        ))}
        </div>
      </div>
      <CodeEditor code={code} language={language} showCopyButton setCode={() => {}} analyticsContext={`animated background ${tab}`} height="520px" />
    </div>
  );
}
