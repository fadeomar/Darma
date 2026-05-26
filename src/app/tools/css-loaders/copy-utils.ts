import {
  buildCustomizedLoaderCss,
  buildCustomizedLoaderHtml,
  buildCustomizedReactCode,
  buildCustomizedTailwindCode,
} from "./loader-utils";
import type { LoaderCustomizationState, LoaderDefinition, LoaderFormat } from "./types";

export async function copyTextToClipboard(text: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall back to a temporary textarea below. Some browsers block Clipboard API
      // access outside secure contexts or without explicit permission.
    }
  }

  if (typeof document === "undefined") {
    throw new Error("Clipboard is not available in this environment.");
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.top = "0";
  textarea.style.left = "0";
  textarea.style.width = "1px";
  textarea.style.height = "1px";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";

  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  try {
    const copied = document.execCommand("copy");
    if (!copied) throw new Error("Copy command was not accepted by the browser.");
  } finally {
    document.body.removeChild(textarea);
  }
}

export function buildLoaderCopyText(loader: LoaderDefinition, format: LoaderFormat, customization?: LoaderCustomizationState) {
  if (!customization) {
    if (format === "html") return loader.code.html.trim();
    if (format === "css") return loader.code.css.trim();
    if (format === "react" && loader.code.react) return loader.code.react.trim();
    if (format === "tailwind" && loader.code.tailwind) return loader.code.tailwind.trim();

    return ["<!-- HTML -->", loader.code.html.trim(), "", "/* CSS */", loader.code.css.trim()].join("\n");
  }

  if (format === "html") return buildCustomizedLoaderHtml(loader, customization);
  if (format === "css") return buildCustomizedLoaderCss(loader, customization);
  if (format === "react") return buildCustomizedReactCode(loader, customization);
  if (format === "tailwind") return buildCustomizedTailwindCode(loader, customization) ?? buildCustomizedReactCode(loader, customization);

  return ["<!-- HTML -->", buildCustomizedLoaderHtml(loader, customization), "", "/* CSS */", buildCustomizedLoaderCss(loader, customization)].join("\n");
}

export function buildLoaderCopyAllText(loader: LoaderDefinition, customization?: LoaderCustomizationState) {
  const parts = ["<!-- HTML -->", buildLoaderCopyText(loader, "html", customization), "", "/* CSS */", buildLoaderCopyText(loader, "css", customization)];

  if (loader.code.react) {
    parts.push("", "/* React */", buildLoaderCopyText(loader, "react", customization));
  }

  if (loader.code.tailwind) {
    parts.push("", "/* Tailwind */", buildLoaderCopyText(loader, "tailwind", customization));
  }

  return parts.join("\n");
}

export function buildLoaderCopyFilename(loader: LoaderDefinition, format: LoaderFormat) {
  if (format === "react" || format === "tailwind") return `${loader.id}.tsx`;
  if (format === "css") return `${loader.id}.css`;
  return `${loader.id}.html`;
}

export async function copyLoaderCode(loader: LoaderDefinition, format: LoaderFormat, customization?: LoaderCustomizationState) {
  await copyTextToClipboard(buildLoaderCopyText(loader, format, customization));
}
