# Multilingual Rollout Plan

Darma should introduce Arabic as an editorial product, not as an automatic mirror of English pages.

## Architecture

When the first reviewed Arabic pages are ready, use stable locale paths:

```text
/en/...
/ar/...
```

Each language version must have:

- A self-referencing canonical URL
- Reciprocal `hreflang` links to genuine equivalents
- An `x-default` route only when a neutral selector or default page is appropriate
- Localized metadata, headings, navigation, structured data, and image alternatives
- Correct `lang` and direction (`dir="rtl"` for Arabic)

Do not add an Arabic alternate merely because an English page exists. Add alternates only after both pages are published and reviewed.

## Editorial sequence

Start with a small, high-value set:

1. Web development roadmap
2. Frontend developer roadmap
3. Frontend vs backend vs full stack
4. Agile vs Scrum vs Kanban vs Waterfall
5. Technology careers guide
6. Technical glossary landing experience

## Translation workflow

1. Translate the intent and terminology, not only sentences.
2. Use terminology familiar to Arabic-speaking developers and preserve important English technical terms where useful.
3. Adapt examples and search phrasing.
4. Perform technical review and native-language editorial review.
5. Validate RTL layouts, code samples, mixed-direction text, tables, and diagrams.
6. Publish and connect reciprocal alternates.
7. Measure Arabic queries separately before expanding the batch.

## What not to do

- Do not expose machine-translated pages as final indexable content.
- Do not redirect users solely by inferred language or location.
- Do not canonicalize Arabic pages to English equivalents.
- Do not mix substantial English and Arabic content under one URL.
- Do not translate official product names into ambiguous alternatives.
