# Text Cleaner Production Studio

A browser-local text cleanup workbench with ordered workflows, Arabic normalization, extraction, formatting, result metrics, validated workflow import, and production exports.

## Privacy model

- Transformations run locally in the browser.
- Workflow JSON contains settings only and excludes input/output text.
- Markdown and CSV reports contain workflow details and aggregate metrics only.
- The production ZIP intentionally includes `cleaned-text.txt`; users should review where that archive is stored or shared.
- No network breach, content, or analytics service is called by the tool.

## Core files

- `transforms.ts` — pure transform functions, action registry, pipeline runner, and text statistics.
- `presets.ts` — practical ordered cleanup workflows.
- `studio.ts` — workflow schema, import normalization, comparison metrics, production checks, summary cards, reports, JavaScript export, and production-file generation.
- `TextCleanerClient.tsx` — editors, workflow ordering, import/export controls, audit UI, and ZIP generation.

## Workflow schema

```json
{
  "schema": "darma.text-cleaner-workflow",
  "version": 1,
  "exportedAt": "2026-07-14T00:00:00.000Z",
  "workflow": {
    "actionIds": ["trim-lines", "extra-spaces", "dedupe-lines"],
    "prefixText": "> ",
    "suffixText": "."
  }
}
```

Imported workflows:

- accept known action IDs only;
- remove duplicate steps while preserving order;
- cap workflows at 40 actions;
- remove null characters from prefix/suffix settings;
- cap prefix and suffix settings at 500 characters;
- reject unrelated schemas and unsupported versions.

## Production checks

Checks use `error`, `warning`, `info`, and `pass` severities. They cover:

- empty input or workflow;
- very large input;
- stale output;
- extraction order;
- competing case or sort actions;
- round-trip list conversions;
- redundant blank-line operations;
- Arabic PDF cleanup overlap;
- empty or oversized prefix/suffix settings;
- personal-data-like values in exportable content;
- destructive transformations and empty output.

## Exports

- `cleaned-text.txt`
- `text-cleaner-workflow.json`
- `text-cleaner-report.md`
- `text-cleaner-metrics.csv`
- `text-cleaner-pipeline.js`
- `text-cleaner-production-pack.zip`

The JavaScript runner uses CommonJS and exports `{ workflow, cleanText }`.

## Tests

```bash
npm exec vitest run \
  src/app/tools/text-cleaner/transforms.test.ts \
  src/app/tools/text-cleaner/studio.test.ts
```

The existing transform suite covers every pure text operation. The studio suite covers workflow normalization, project import/export, metrics, audit states, reports, JavaScript generation, production files, and workflow execution.
