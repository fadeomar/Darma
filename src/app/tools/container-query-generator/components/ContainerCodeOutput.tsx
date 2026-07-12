import { CodeOutputPanel } from "@/features/tools/components";

export function ContainerCodeOutput({ css, variables, fallback, html, jsx, tailwind, tokens, explanation, audit }: { css: string; variables: string; fallback: string; html: string; jsx: string; tailwind: string; tokens: string; explanation: string; audit: string }) {
  return <CodeOutputPanel title="Generated container query code" description="Copy production CSS, fallback CSS, markup, framework starters, or implementation notes." tabs={[
    { id: "css", label: "CSS", code: css, language: "css" },
    { id: "vars", label: "Variables", code: variables, language: "css" },
    { id: "fallback", label: "Fallback", code: fallback, language: "css" },
    { id: "html", label: "HTML", code: html, language: "html" },
    { id: "jsx", label: "React", code: jsx, language: "tsx" },
    { id: "tailwind", label: "Tailwind", code: tailwind, language: "tsx" },
    { id: "tokens", label: "Tokens", code: tokens, language: "json" },
    { id: "audit", label: "Audit", code: audit, language: "txt" },
    { id: "explain", label: "Explain", code: explanation, language: "txt" },
  ]} />;
}
