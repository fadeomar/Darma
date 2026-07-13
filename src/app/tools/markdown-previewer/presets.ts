import type { MarkdownExample, MarkdownOptions, MarkdownPreset } from "./types";

export const MARKDOWN_INPUT_LIMIT = 100_000;

export const DEFAULT_MARKDOWN_OPTIONS: MarkdownOptions = {
  livePreview: true,
  githubLineBreaks: true,
  openLinksInNewTab: true,
  previewTheme: "github",
};

export const SAMPLE_MARKDOWN = `# Product API Notes

A compact reference for the product service used by the storefront and internal dashboard.

## Checklist

- [x] Validate request payloads
- [x] Return helpful error messages
- [ ] Add pagination examples

> Keep examples close to the endpoint they explain.

## Create a product

\`POST /v1/products\` creates a product and returns the stored resource.

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

Read more in the [MDN documentation](https://developer.mozilla.org/).
`;

export const MARKDOWN_PRESETS: MarkdownPreset[] = [
  {
    id: "readme",
    label: "Project README",
    category: "GitHub",
    description: "A repository overview with setup, scripts, and contribution notes.",
    content: `# Atlas UI

A small component library for internal product teams.

## Features

- Accessible React components
- Design tokens with CSS variables
- Storybook examples
- TypeScript-first APIs

## Getting started

\`\`\`bash
npm install
npm run dev
\`\`\`

## Available scripts

| Command | Purpose |
| --- | --- |
| \`npm run dev\` | Start the local app |
| \`npm run test\` | Run the test suite |
| \`npm run build\` | Create a production build |

## Contributing

1. Create a focused branch.
2. Add tests for behavior changes.
3. Open a pull request with screenshots when UI changes.

> Do not commit secrets or local environment files.
`,
  },
  {
    id: "api-docs",
    label: "API Reference",
    category: "Developer docs",
    description: "Endpoint documentation with request, response, and error tables.",
    content: `# Orders API

## Create an order

\`POST /v1/orders\`

Creates a draft order for the authenticated workspace.

### Request body

| Field | Type | Required |
| --- | --- | --- |
| customerId | string | Yes |
| items | array | Yes |
| note | string | No |

\`\`\`json
{
  "customerId": "cus_42",
  "items": [{ "sku": "coffee-1kg", "quantity": 2 }]
}
\`\`\`

### Response

\`\`\`json
{
  "id": "ord_2026",
  "status": "draft",
  "total": 48
}
\`\`\`

### Errors

- \`400\` — invalid payload
- \`401\` — missing or expired token
- \`409\` — inventory conflict
`,
  },
  {
    id: "release-notes",
    label: "Release Notes",
    category: "Product",
    description: "A clear changelog entry for features, fixes, and upgrade notes.",
    content: `# Release 2.4.0

Released on July 12, 2026.

## Highlights

- Added saved filters to the activity feed.
- Improved keyboard navigation in command menus.
- Reduced dashboard loading time on large workspaces.

## Fixed

- Resolved duplicated notifications after reconnecting.
- Prevented table headers from overflowing on mobile.
- Corrected timezone labels in CSV exports.

## Upgrade notes

No database migration is required.

> Teams using custom themes should verify contrast on the new status badges.
`,
  },
  {
    id: "runbook",
    label: "Incident Runbook",
    category: "Operations",
    description: "A practical response checklist with commands and escalation steps.",
    content: `# API Latency Runbook

Use this runbook when p95 latency exceeds 800 ms for more than five minutes.

## Immediate checks

- [ ] Confirm the alert window and affected region.
- [ ] Check error rate and database saturation.
- [ ] Compare the latest deployment timestamp.
- [ ] Open an incident channel and assign an owner.

## Diagnostic commands

\`\`\`bash
kubectl get pods -n production
kubectl top pods -n production
kubectl logs deploy/api --since=15m
\`\`\`

## Mitigation

1. Roll back the latest deployment when errors correlate with release time.
2. Scale the API only when database capacity is healthy.
3. Disable expensive background jobs if queue pressure is the cause.

## Escalation

Contact the database owner after 10 minutes without recovery.
`,
  },
  {
    id: "blog-draft",
    label: "Blog Draft",
    category: "Content",
    description: "An article structure with a clear opening, sections, and conclusion.",
    content: `# Designing Faster Feedback Loops

Teams rarely need more dashboards. They need faster ways to notice a problem, understand it, and act with confidence.

## Start with the decision

Before adding a metric, write down the decision it should support. A useful signal changes what someone does next.

## Keep context beside the signal

A number without comparison creates unnecessary investigation. Pair current performance with a target, a previous period, or an expected range.

## Make ownership visible

Every recurring alert or report should have an owner who can explain the signal and improve it when it becomes noisy.

## Conclusion

Good feedback loops are small, specific, and connected to action. Build the shortest loop that helps the team make a better decision.
`,
  },
  {
    id: "meeting-notes",
    label: "Meeting Notes",
    category: "Team",
    description: "A reusable format for decisions, actions, and unresolved questions.",
    content: `# Product Sync — July 12, 2026

## Attendees

- Product
- Design
- Engineering
- Support

## Decisions

- Ship the compact navigation behind a feature flag.
- Keep the current onboarding copy for this release.
- Measure task completion before changing the dashboard layout.

## Action items

- [ ] Engineering: add analytics events by July 15.
- [ ] Design: prepare mobile QA screenshots.
- [ ] Support: collect the top five navigation complaints.

## Open questions

1. Should saved views sync across workspaces?
2. Do guests need access to export actions?
`,
  },
];

export const QUICK_EXAMPLES: MarkdownExample[] = [
  { label: "Heading", syntax: "## Section title", description: "Create a clear document section." },
  { label: "Task", syntax: "- [ ] Follow-up item", description: "Add an unchecked task item." },
  { label: "Bold", syntax: "**important text**", description: "Emphasize a key phrase." },
  { label: "Link", syntax: "[Darma](https://example.com)", description: "Add a readable link." },
  { label: "Code", syntax: "```ts\nconst ready = true;\n```", description: "Insert a fenced code example." },
  { label: "Table", syntax: "| Name | Type |\n| --- | --- |\n| id | string |", description: "Create a compact data table." },
];
