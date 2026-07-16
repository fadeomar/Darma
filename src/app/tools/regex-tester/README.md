# Regex Tester Production Studio

Browser-local JavaScript regular-expression workbench for matching, capture inspection, replacement previews, production checks, portable projects, and developer handoff.

## Core behavior

- Uses the native JavaScript `RegExp` engine.
- Supports `g`, `i`, `m`, `s`, `u`, `y`, and `d` flags.
- Limits patterns to 2,000 characters, samples to 50,000 characters, replacements to 10,000 characters, and previews to 1,000 matches.
- Advances `lastIndex` after zero-length global matches so previews cannot loop forever.
- Blocks every high-risk heuristic result and pauses medium-risk patterns when the sample exceeds 128 characters.

## Project import

`regex-project.json` uses:

```json
{
  "tool": "regex-tester",
  "version": 1,
  "savedAt": "2026-07-14T12:00:00.000Z",
  "pattern": "(?<word>foo)",
  "flags": "g",
  "text": "foo and foo",
  "replacement": "$<word>-ok"
}
```

Imports are limited to 1 MB and reject malformed JSON, the wrong tool or schema version, unsupported or duplicate flags, and values above the editor limits. Null characters are removed.

## Exports

- Reopenable project JSON
- Markdown production report
- Per-match CSV evidence with spreadsheet-formula protection
- Standalone JavaScript module
- Typed TypeScript module
- ZIP production pack containing eight files

The project, report, CSV, sample, and replacement-output files can contain the current test data. Replace sensitive values before sharing.

## Tests

```bash
npm exec vitest run \
  src/app/tools/regex-tester/regex.test.ts \
  src/app/tools/regex-tester/studio.test.ts \
  src/app/tools/regex-tester/studio.export.test.ts
```
