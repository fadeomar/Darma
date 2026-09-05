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
  { id: "readme", label: "Project README", category: "GitHub", description: "Repository overview with setup, scripts, and contribution notes.", content: `# Atlas UI

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

## Contributing

1. Create a focused branch.
2. Add tests for behavior changes.
3. Open a pull request with screenshots when UI changes.
` },
  { id: "api-docs", label: "API Reference", category: "Developer docs", description: "Endpoint documentation with request, response, and error sections.", content: `# Orders API

## Create an order

\`POST /v1/orders\`

Creates a draft order for the authenticated workspace.

### Request body

| Field | Type | Required |
| --- | --- | --- |
| customerId | string | Yes |
| items | array | Yes |

\`\`\`json
{
  "customerId": "cus_42",
  "items": [{ "sku": "coffee-1kg", "quantity": 2 }]
}
\`\`\`

### Errors

- \`400\` — invalid payload
- \`401\` — missing or expired token
- \`409\` — inventory conflict
` },
  { id: "release-notes", label: "Release Notes", category: "Product", description: "A changelog entry for features, fixes, and upgrade notes.", content: `# Release 2.4.0

Released on September 4, 2026.

## Highlights

- Added saved filters to the activity feed.
- Improved keyboard navigation.
- Reduced dashboard loading time.

## Fixes

- Fixed duplicate notifications.
- Corrected mobile spacing in the settings page.

## Upgrade notes

No migration is required for this release.
` },
  { id: "runbook", label: "Incident Runbook", category: "Operations", description: "Operational checklist with symptoms, mitigations, and escalation.", content: `# Checkout latency runbook

## Trigger

Use this runbook when p95 checkout latency exceeds 2 seconds for 10 minutes.

## First checks

- [ ] Confirm the alert window.
- [ ] Check database connections.
- [ ] Compare API error rate.

## Mitigation

1. Disable expensive recommendations.
2. Reduce background worker concurrency.
3. Escalate if latency remains high.
` },
  { id: "blog-draft", label: "Blog Draft", category: "Content", description: "Article structure with summary, sections, examples, and CTA.", content: `# A practical guide to browser-only tools

Browser-only utilities can keep simple workflows fast and private.

## Why local processing matters

Explain the user problem, then show a concrete workflow.

## Example

> Convert or inspect data locally before sharing it.

## Takeaway

Choose the simplest tool that keeps the user in control.
` },
  { id: "meeting-notes", label: "Meeting Notes", category: "Team", description: "Agenda, decisions, owners, and follow-up actions.", content: `# Product sync — September 4

## Agenda

- Context recovery sprint
- QA ownership
- Release timing

## Decisions

1. Keep richer use-case libraries.
2. Show only the first group by default.

## Actions

- [ ] Fadi — review preview deployment
- [ ] Team — confirm regression coverage
` },
  { id: "pull-request", label: "Pull Request", category: "GitHub", description: "Concise PR body with intent, changes, testing, and screenshots.", content: `# Context recovery batch

## What changed

- Expanded practical presets.
- Restored missing examples.
- Preserved the current control UI.

## Testing

- [x] Typecheck
- [x] Relevant unit tests
- [ ] Browser QA

## Screenshots

Add before/after screenshots for visual changes.
` },
  { id: "issue-report", label: "Bug Report", category: "GitHub", description: "Reproduction-focused issue with expected and actual behavior.", content: `# Preview controls cover the image

## Steps to reproduce

1. Open the photo filter editor.
2. Upload a landscape image.
3. Resize the browser to laptop width.

## Expected

The image preview remains visible while editing.

## Actual

The controls cover most of the preview.

## Environment

- Browser: Chrome
- Viewport: 1440 × 900
` },
  { id: "architecture-decision", label: "ADR", category: "Engineering", description: "Architecture decision record with context and consequences.", content: `# ADR: Keep image processing client-side

## Status

Accepted

## Context

The tool handles user-selected images and does not require shared storage.

## Decision

Use browser APIs for decoding, processing, and export.

## Consequences

- Better privacy
- No upload latency
- Browser memory limits apply
` },
  { id: "test-plan", label: "QA Test Plan", category: "Quality", description: "Structured manual test scenarios with clear pass criteria.", content: `# Image converter QA

## Core flow

- [ ] Upload PNG, JPEG, and WebP.
- [ ] Convert each output format.
- [ ] Verify dimensions and filenames.

## Edge cases

- [ ] Transparent PNG to JPEG
- [ ] Very small source image
- [ ] Multiple files

## Pass criteria

No crash, output opens correctly, and privacy messaging is accurate.
` },
  { id: "project-brief", label: "Project Brief", category: "Product", description: "Short product brief with problem, users, scope, and success criteria.", content: `# Darma context recovery

## Problem

Recent UI improvements reduced the number of practical examples in several tools.

## Users

People who want a useful result quickly without designing settings from scratch.

## Scope

Restore guided starting points without reintroducing UI clutter.

## Success

Users can find a relevant starting point before touching advanced controls.
` },
  { id: "support-article", label: "Support Article", category: "Support", description: "Help-center article with symptoms, steps, and escalation guidance.", content: `# Why did my image become larger?

A converted image can grow when the chosen format is less efficient for the source content.

## Try this

1. Use WebP for photos and web graphics.
2. Reduce dimensions before lowering quality heavily.
3. Compare output size before downloading.

## Still stuck?

Keep the original and try a different preset.
` },
  { id: "onboarding-guide", label: "Onboarding Guide", category: "Team", description: "New-team-member checklist with setup and first-week milestones.", content: `# Engineering onboarding

## Day 1

- [ ] Clone the repository.
- [ ] Configure local environment variables.
- [ ] Run the test suite.

## First week

- [ ] Ship one small fix.
- [ ] Review one pull request.
- [ ] Read the architecture notes.
` },
  { id: "comparison-table", label: "Comparison Note", category: "Research", description: "Feature comparison with a compact table and decision summary.", content: `# Image format comparison

| Format | Best for | Transparency | Typical size |
| --- | --- | --- | --- |
| PNG | UI assets | Yes | Larger |
| JPEG | Photos | No | Small |
| WebP | Modern web | Yes | Small |

## Recommendation

Prefer WebP for web delivery unless compatibility or lossless requirements point elsewhere.
` },
  { id: "learning-notes", label: "Study Notes", category: "Learning", description: "Topic summary with concepts, examples, and review questions.", content: `# CSS container queries

## Core idea

A component can respond to the size of its containing element instead of only the viewport.

## Example

\`\`\`css
.card-shell { container-type: inline-size; }
@container (min-width: 36rem) { .card { grid-template-columns: 1fr 2fr; } }
\`\`\`

## Review questions

1. When is a container query better than a media query?
2. Which element establishes the query container?
` },
  { id: "decision-log", label: "Decision Log", category: "Team", description: "Small running record of decisions, reasons, and follow-ups.", content: `# Decision log

## 2026-09-04 — Preserve example density

**Decision:** Keep larger preset libraries and collapse them visually instead of deleting examples.

**Reason:** Users should be able to select a close use case before tuning controls manually.

**Follow-up:** Validate the pattern across the next tool batches.
` },
];

export const QUICK_EXAMPLES: MarkdownExample[] = [
  { label: "Heading", syntax: "## Section title", description: "Create a clear document section." },
  { label: "Task", syntax: "- [ ] Follow-up item", description: "Add an unchecked task item." },
  { label: "Bold", syntax: "**important text**", description: "Emphasize a key phrase." },
  { label: "Link", syntax: "[Darma](https://example.com)", description: "Add a readable link." },
  { label: "Code", syntax: "```ts\nconst ready = true;\n```", description: "Insert a fenced code example." },
  { label: "Table", syntax: "| Name | Type |\n| --- | --- |\n| id | string |", description: "Create a compact data table." },
];
