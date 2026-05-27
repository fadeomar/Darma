import { CodeOutputPanel } from "@/features/tools/components";

export function GridCodeOutput({ css, html, jsx, tailwind }: { css: string; html: string; jsx: string; tailwind: string }) {
  return (
    <CodeOutputPanel
      title="Generated grid code"
      description="Copy CSS, HTML, React JSX, or a Tailwind-style starter."
      tabs={[
        { id: "css", label: "CSS", language: "css", code: css, filename: "grid.css" },
        { id: "html", label: "HTML", language: "html", code: html, filename: "grid.html" },
        { id: "jsx", label: "React JSX", language: "tsx", code: jsx, filename: "GridLayout.tsx" },
        { id: "tailwind", label: "Tailwind-style", language: "txt", code: tailwind, filename: "grid-tailwind.txt" },
      ]}
    />
  );
}
