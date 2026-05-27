"use client";

import { CodeOutputPanel, type CodeOutputTab } from "@/features/tools/components";

interface CodeOutputProps {
  html: string;
  css: string;
  particleCount: number;
}

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
  const tabs: CodeOutputTab[] = [
    { id: "full", label: "HTML + CSS", language: "html", filename: "animated-background.html", code: `${html}\n\n<style>\n${css}\n</style>` },
    { id: "css", label: "CSS", language: "css", filename: "animated-background.css", code: css },
    { id: "react", label: "React", language: "tsx", filename: "AnimatedBackground.tsx", code: reactSnippet(css, particleCount) },
    { id: "tailwind", label: "Tailwind", language: "html", filename: "animated-background-tailwind.html", code: tailwindSnippet(html, css) },
  ];

  return (
    <CodeOutputPanel
      title="Animated background code"
      description="Copy complete HTML/CSS, scoped CSS, a React component, or a Tailwind-friendly starter."
      tabs={tabs}
      defaultTab="full"
    />
  );
}
