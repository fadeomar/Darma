import { CodeOutputPanel } from "@/features/tools/components";

export function GridCodeOutput({
  css,
  cssVariables,
  html,
  jsx,
  tailwind,
  tokens,
  areaMap,
}: {
  css: string;
  cssVariables: string;
  html: string;
  jsx: string;
  tailwind: string;
  tokens: string;
  areaMap: string;
}) {
  return (
    <CodeOutputPanel
      title="Generated grid code"
      description="Copy exact responsive CSS, breakpoint-aware variables, markup, React, Tailwind output, design tokens, or the active breakpoint area map."
      tabs={[
        { id: "css", label: "CSS", language: "css", code: css, filename: "grid.css" },
        { id: "vars", label: "CSS vars", language: "css", code: cssVariables, filename: "grid-variables.css" },
        { id: "html", label: "HTML", language: "html", code: html, filename: "grid.html" },
        { id: "jsx", label: "React JSX", language: "tsx", code: jsx, filename: "GridLayout.tsx" },
        { id: "tailwind", label: "Tailwind", language: "txt", code: tailwind, filename: "grid-tailwind.txt" },
        { id: "tokens", label: "Tokens", language: "json", code: tokens, filename: "grid.tokens.json" },
        { id: "map", label: "Area map", language: "txt", code: areaMap, filename: "grid-map.txt" },
      ]}
    />
  );
}
