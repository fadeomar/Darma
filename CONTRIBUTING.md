# Contributing to Darma

Darma is an open-source collection of practical browser tools, reusable front-end work, and the Darma Tech Atlas. Contributions should make the project more useful, trustworthy, accessible, or maintainable.

## Choose the smallest useful contribution

Use the structured GitHub issue forms when you want to:

- suggest a resource;
- report a broken or outdated link;
- improve a learning path;
- correct a career, workflow, team model, delivery stage, or glossary entry.

Open a pull request when the requested change is already clear and you can validate it locally.

## Local setup

```bash
npm ci
npm run dev
```

Restore the required local environment variables before running features that use Prisma, authentication, or the database. Tech Atlas content audits do not require database access.

## Tech Atlas quality rules

1. Prefer official documentation, standards, research, or primary maintainers.
2. Explain practical value and context instead of copying marketing text.
3. Do not present one company structure or delivery method as universal.
4. Do not guess pricing, publisher status, dates, or verification state.
5. Use HTTPS canonical URLs and check for duplicates before adding a resource.
6. Do not add affiliate, referral, tracking, or undisclosed sponsored links.
7. Keep quotations brief and attribute the source. Paraphrase original material.
8. Connect new content to existing paths, roles, methods, terms, and resources when relevant.

Read [Content Governance](docs/atlas/CONTENT_GOVERNANCE.md) for the complete review model.

## Editing Atlas data

Core content is stored in validated JSON catalogs under `src/features/`.

After editing Atlas data, run:

```bash
npm run atlas:quality
```

For a small network sample:

```bash
npm run atlas:links:sample
```

A full external-link check is intentionally separate because external websites can rate-limit or block automated requests.

## Pull requests

A strong pull request:

- solves one coherent problem;
- explains the user-facing result;
- includes primary evidence for factual changes;
- contains screenshots for visible changes;
- lists the validation commands that were run;
- identifies limitations or follow-up work honestly.

Do not combine broad refactors with content additions unless the refactor is required for the content change.

## Review expectations

Maintainers may request changes when a contribution is duplicated, weakly sourced, promotional, too broad, inaccessible, or structurally inconsistent. Rejection of a source does not necessarily mean the source has no value; it may simply not meet Darma's current scope or evidence standard.
