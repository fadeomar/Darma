# OG Image / Social Preview Generator

Browser-only Darma tool for creating Open Graph images, Twitter/X cards, social previews, metadata snippets, export packs, and local validation checks.

## Route

`/tools/og-image-generator`

## Features

- 1200×630 live canvas preview
- Templates for SaaS, developer tools, blog posts, launches, terminal style, docs, portfolio, and announcements
- Logo and background image upload
- Solid, gradient, image, and pattern backgrounds
- Text, badge, domain, author, CTA, alt text, and site URL controls
- Platform previews for Twitter/X, LinkedIn, Discord, and Slack-style unfurls
- Export packs: Basic Web, Next.js App Router, Social Platforms, Blog/Article, Complete Launch
- Local ZIP generation without a dependency
- Generated file checklist and package validator

## Generated outputs

Depending on selected export pack:

- `opengraph-image.png`
- `twitter-image.png`
- `og-image.png`
- `linkedin-preview.png`
- `facebook-preview.png`
- `discord-slack-preview.png`
- `square-social-preview.png`
- `src/app/opengraph-image.png`
- `src/app/twitter-image.png`
- `html-meta-tags.txt`
- `metadata-snippet.ts`
- `social-preview.html`
- `validation-checklist.md`
- `asset-manifest.json`
- `README.md`

## Privacy

All image processing happens locally in the browser.

## Final QA polish notes

Latest polish pass:

- keeps the local HTML/meta checker synced with the current generated snippet until the user edits or uploads HTML;
- lets users copy HTML, Next.js metadata, and URL directly from the snippets panel;
- resets file inputs after uploads so the same file can be re-selected during QA;
- blocks downloads unless the generated package is in a ready state;
- clears stale generated assets if rendering fails;
- validates uploaded asset MIME types before reading them locally.
