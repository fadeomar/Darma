import type { LoaderSourceDefinition } from "../../src/app/tools/css-loaders/types";

function toPascalCase(value: string) {
  return value
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

function htmlToJsx(html: string) {
  return html
    .replace(/class=/g, "className=")
    .replace(/<!--([\s\S]*?)-->/g, "{/*$1*/}");
}

export function generateReactCode(definition: LoaderSourceDefinition, scopedHtml: string) {
  const componentName = `${toPascalCase(definition.id)}Loader`;

  return `export default function ${componentName}() {\n  return (\n    ${htmlToJsx(scopedHtml)}\n  );\n}\n`;
}
