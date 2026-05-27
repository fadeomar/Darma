
"use client";

import React, { useState } from "react";
import CodeEditor from "@/components/CodeEditor";

type Tab = "html" | "css" | "js";

type Props = {
  htmlCode: string;
  cssCode: string;
  jsCode: string;
  setHtmlCode: React.Dispatch<React.SetStateAction<string>>;
  setCssCode: React.Dispatch<React.SetStateAction<string>>;
  setJsCode: React.Dispatch<React.SetStateAction<string>>;
  initialTab?: Tab;
  className?: string;
};

const tabs: Tab[] = ["html", "css", "js"];

export default function CodeTabs({
  htmlCode,
  cssCode,
  jsCode,
  setHtmlCode,
  setCssCode,
  setJsCode,
  initialTab = "html",
  className = "",
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  return (
    <section className={["overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-code-border)] bg-[var(--color-code-bg)] shadow-[var(--shadow-card)]", className].join(" ")}>
      <div className="flex items-center justify-between border-b border-[var(--color-code-border)] bg-[var(--color-code-surface)] px-3 py-2">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-code-muted)]">Source editor</p>
        <div className="inline-flex rounded-[var(--radius-full)] border border-[var(--color-code-border)] bg-[var(--color-code-bg)] p-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-[var(--radius-full)] px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.08em] transition ${
                activeTab === tab
                  ? "bg-[var(--color-primary)] text-[var(--color-primary-text)]"
                  : "text-[var(--color-code-muted)] hover:text-[var(--color-code-text)]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[var(--color-code-bg)] p-2">
        {activeTab === "html" ? (
          <CodeEditor
            code={htmlCode}
            setCode={setHtmlCode}
            language="html"
            showCopyButton
            analyticsContext="html code form element"
          />
        ) : null}

        {activeTab === "css" ? (
          <CodeEditor
            code={cssCode}
            setCode={setCssCode}
            language="css"
            analyticsContext="css code form element"
          />
        ) : null}

        {activeTab === "js" ? (
          <CodeEditor
            code={jsCode}
            setCode={setJsCode}
            language="javascript"
            analyticsContext="js code form element"
          />
        ) : null}
      </div>
    </section>
  );
}
