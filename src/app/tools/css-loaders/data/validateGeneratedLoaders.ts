export type GeneratedCssLoaderDefinition = {
  id?: unknown;
  name?: unknown;
  category?: unknown;
  tags?: unknown;
  formats?: unknown;
  previewHtml?: unknown;
  previewCss?: unknown;
  code?: unknown;
};

export type GeneratedCssLoaderIssue = {
  loaderId: string;
  field: string;
  message: string;
};

const HTML_IN_CSS_PATTERN = /<\/?(?:div|p|span|svg|path|br|button|input|section|article)\b/i;
const PAIRED_TAGS = ["div", "span", "p", "svg", "button", "section", "article"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function countMatches(value: string, pattern: RegExp) {
  return value.match(pattern)?.length ?? 0;
}

function findUnbalancedPairedTags(value: string) {
  return PAIRED_TAGS.filter((tag) => {
    const openings = countMatches(value, new RegExp(`<${tag}(?:\\s|>|$)`, "gi"));
    const closings = countMatches(value, new RegExp(`</${tag}>`, "gi"));
    return openings !== closings;
  });
}

export function validateGeneratedCssLoaderDefinition(
  definition: GeneratedCssLoaderDefinition,
): GeneratedCssLoaderIssue[] {
  const loaderId = hasText(definition.id) ? definition.id : "(missing id)";
  const issues: GeneratedCssLoaderIssue[] = [];
  const code = isRecord(definition.code) ? definition.code : {};

  const requiredTextFields: Array<[field: string, value: unknown]> = [
    ["id", definition.id],
    ["name", definition.name],
    ["category", definition.category],
    ["previewHtml", definition.previewHtml],
    ["previewCss", definition.previewCss],
    ["code.html", code.html],
    ["code.css", code.css],
    ["code.react", code.react],
  ];

  for (const [field, value] of requiredTextFields) {
    if (!hasText(value)) {
      issues.push({ loaderId, field, message: "Required text field is empty or missing." });
    }
  }

  if (!Array.isArray(definition.tags) || definition.tags.length === 0) {
    issues.push({ loaderId, field: "tags", message: "Tags must be a non-empty array." });
  }

  if (!Array.isArray(definition.formats) || definition.formats.length === 0) {
    issues.push({ loaderId, field: "formats", message: "Formats must be a non-empty array." });
  }

  for (const [field, value] of [
    ["previewCss", definition.previewCss],
    ["code.css", code.css],
  ] as const) {
    if (hasText(value) && HTML_IN_CSS_PATTERN.test(value)) {
      issues.push({
        loaderId,
        field,
        message: "CSS appears to contain leaked HTML markup.",
      });
    }
  }

  for (const [field, value] of [
    ["previewHtml", definition.previewHtml],
    ["code.html", code.html],
  ] as const) {
    if (hasText(value)) {
      const unbalancedTags = findUnbalancedPairedTags(value);
      if (unbalancedTags.length > 0) {
        issues.push({
          loaderId,
          field,
          message: `HTML has unbalanced paired tags: ${unbalancedTags.join(", ")}.`,
        });
      }
    }
  }

  if (hasText(code.react)) {
    const react = code.react.trim();
    const unbalancedTags = findUnbalancedPairedTags(react);
    if (!react.includes("return (") || !react.endsWith("}") || unbalancedTags.length > 0) {
      issues.push({
        loaderId,
        field: "code.react",
        message:
          unbalancedTags.length > 0
            ? `React output appears truncated; unbalanced tags: ${unbalancedTags.join(", ")}.`
            : "React output appears truncated or malformed.",
      });
    }
  }

  return issues;
}
