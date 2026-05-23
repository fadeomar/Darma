import type { MarkdownExample, MarkdownOptions } from "./types";

export const MARKDOWN_INPUT_LIMIT = 100_000;

export const DEFAULT_MARKDOWN_OPTIONS: MarkdownOptions = {
  livePreview: true,
  githubLineBreaks: true,
  openLinksInNewTab: true,
  sanitizeHtml: true,
};

export const SAMPLE_MARKDOWN = `# Product API Notes

Write Markdown on the left and preview clean HTML on the right.

## Checklist

- Validate request payloads
- Return helpful error messages
- Document auth headers

> Tip: keep examples close to the endpoint they explain.

### Example response

\`\`\`json
{
  "id": "prod_123",
  "name": "Coffee Beans",
  "active": true
}
\`\`\`

| Field | Type | Notes |
| --- | --- | --- |
| id | string | Stable identifier |
| name | string | Display name |
| active | boolean | Visible in POS |

Read more in the [developer docs](https://example.com/docs).
`;

export const QUICK_EXAMPLES: MarkdownExample[] = [
  { label: "Heading", syntax: "# Page title", description: "Use # through ###### for headings." },
  { label: "Bold / italic", syntax: "**bold** and *italic*", description: "Emphasize important words or labels." },
  { label: "Link", syntax: "[Darma](https://example.com)", description: "Create readable links for docs and READMEs." },
  { label: "List", syntax: "- First item\n- Second item", description: "Use bullets for quick notes and checklists." },
  { label: "Code block", syntax: "```ts\nconst value = true;\n```", description: "Fence code examples with triple backticks." },
  { label: "Blockquote", syntax: "> Important note", description: "Call out notes, warnings, and quotes." },
  { label: "Table", syntax: "| Name | Type |\n| --- | --- |\n| id | string |", description: "Useful for API fields and comparison docs." },
];
