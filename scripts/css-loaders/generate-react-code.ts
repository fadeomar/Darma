import type { LoaderSourceDefinition } from "../../src/app/tools/css-loaders/types";

function toPascalCase(value: string) {
  return value
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

function toCamelCaseAttribute(attributeName: string) {
  if (attributeName === "class") return "className";
  if (attributeName === "for") return "htmlFor";
  if (attributeName === "xlink:href") return "href";
  if (attributeName.includes(":")) {
    return attributeName.replace(/:([a-z])/g, (_match, char: string) => char.toUpperCase());
  }
  if (attributeName.startsWith("data-") || attributeName.startsWith("aria-")) return attributeName;

  return attributeName.replace(/-([a-z])/g, (_match, char: string) => char.toUpperCase());
}

function toStyleKey(propertyName: string) {
  const trimmed = propertyName.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("--")) return JSON.stringify(trimmed);
  return trimmed.replace(/-([a-z])/g, (_match, char: string) => char.toUpperCase());
}

function escapeJsString(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

function convertStyleAttribute(styleValue: string) {
  const declarations = styleValue
    .split(";")
    .map((declaration) => declaration.trim())
    .filter(Boolean)
    .map((declaration) => {
      const separatorIndex = declaration.indexOf(":");
      if (separatorIndex === -1) return null;

      const key = toStyleKey(declaration.slice(0, separatorIndex));
      const value = declaration.slice(separatorIndex + 1).trim();
      if (!key || !value) return null;

      return `${key}: "${escapeJsString(value)}"`;
    })
    .filter((declaration): declaration is string => Boolean(declaration));

  if (!declarations.length) return "style={{}}";
  return `style={{ ${declarations.join(", ")} } as CSSProperties}`;
}

function htmlToJsx(html: string) {
  return html
    .replace(/style=(['"])([\s\S]*?)\1/g, (_match, _quote: string, styleValue: string) => convertStyleAttribute(styleValue))
    .replace(/\s([a-zA-Z_:][\w:.-]*)=/g, (_match, attributeName: string) => ` ${toCamelCaseAttribute(attributeName)}=`)
    .replace(/<!--([\s\S]*?)-->/g, "{/*$1*/}");
}

export function generateReactCode(definition: LoaderSourceDefinition, scopedHtml: string) {
  const componentName = `${toPascalCase(definition.id)}Loader`;

  return `import type { CSSProperties } from "react";\n\nexport default function ${componentName}() {\n  return (\n    ${htmlToJsx(scopedHtml)}\n  );\n}\n`;
}
