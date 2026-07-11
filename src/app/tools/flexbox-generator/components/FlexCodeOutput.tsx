import { CodeOutputPanel } from "@/features/tools/components";

export function FlexCodeOutput({
  css,
  cssVariables,
  html,
  jsx,
  tailwind,
  tokens,
  explanation,
}: {
  css: string;
  cssVariables: string;
  html: string;
  jsx: string;
  tailwind: string;
  tokens: string;
  explanation: string;
}) {
  return (
    <CodeOutputPanel
      title="Generated flexbox code"
      description="Copy production CSS, variables, HTML, React JSX, Tailwind starter, layout tokens, or a plain-English explanation."
      tabs={[
        { id: "css", label: "CSS", code: css, language: "css", filename: "flexbox.css" },
        { id: "vars", label: "CSS vars", code: cssVariables, language: "css", filename: "flexbox-variables.css" },
        { id: "html", label: "HTML", code: html, language: "html", filename: "flexbox.html" },
        { id: "jsx", label: "React JSX", code: jsx, language: "tsx", filename: "FlexLayout.tsx" },
        { id: "tailwind", label: "Tailwind", code: tailwind, language: "txt", filename: "flexbox-tailwind.txt" },
        { id: "tokens", label: "Tokens", code: tokens, language: "json", filename: "flexbox.tokens.json" },
        { id: "explain", label: "Explanation", code: explanation, language: "txt", filename: "flexbox-notes.txt" },
      ]}
    />
  );
}
