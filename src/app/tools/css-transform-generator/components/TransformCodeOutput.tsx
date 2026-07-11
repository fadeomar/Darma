import { CodeOutputPanel } from "@/features/tools/components";

export function TransformCodeOutput({
  css,
  html,
  jsx,
  tailwind,
  variables,
  reactStyle,
  tokenJson,
  keyframes,
}: {
  css: string;
  html: string;
  jsx: string;
  tailwind: string;
  variables: string;
  reactStyle: string;
  tokenJson: string;
  keyframes: string;
}) {
  return (
    <CodeOutputPanel
      title="Generated transform code"
      description="Copy production CSS, variables, HTML, React, Tailwind starters, or design tokens."
      defaultTab="css"
      tabs={[
        { id: "css", label: "CSS", code: css, language: "css" },
        { id: "variables", label: "Variables", code: variables, language: "css" },
        { id: "html", label: "HTML", code: html, language: "html" },
        { id: "jsx", label: "React JSX", code: jsx, language: "tsx" },
        { id: "style", label: "React style", code: reactStyle, language: "tsx" },
        { id: "tailwind", label: "Tailwind", code: tailwind, language: "txt" },
        { id: "tokens", label: "Tokens", code: tokenJson, language: "json" },
        { id: "keyframes", label: "Keyframes", code: keyframes, language: "css" },
      ]}
    />
  );
}
