# Text Cleaner

Apply case conversions and text-cleaning transforms to any pasted text — instantly, in the browser.

## Privacy

`local-only` — all transforms run as pure string operations in the browser. No data is transmitted.

## Logic

`transforms.ts` exports pure transform functions and two registries:

### Case transforms

| Export | Description |
|---|---|
| `toUpperCase` | All caps |
| `toLowerCase` | All lowercase |
| `toTitleCase` | Capitalise first letter of every word |
| `toSentenceCase` | Capitalise the first letter after `.`, `!`, `?` |
| `capitalizeEachWord` | `\b\w` — every word boundary |
| `toInverseCase` | Flip the case of every character |
| `toCamelCase` | `helloWorldTest` — splits on spaces, hyphens, and camelCase boundaries |
| `toPascalCase` | `HelloWorldTest` |
| `toSnakeCase` | `hello_world_test` |
| `toKebabCase` | `hello-world-test` |

### Clean transforms

| Export | Description |
|---|---|
| `trimText` | Strip leading and trailing whitespace |
| `removeExtraSpaces` | Collapse multiple horizontal spaces to one per line |
| `removeEmptyLines` | Delete all blank / whitespace-only lines |
| `trimEachLine` | Trim whitespace from the start and end of every line |
| `normalizeLineBreaks` | Convert `\r\n` and `\r` to `\n` |
| `collapseBlankLines` | Reduce 3+ consecutive blank lines to 2 |
| `removeDuplicateLines` | Keep only the first occurrence of each line (trimmed comparison) |
| `sortLinesAZ` | Locale-insensitive ascending sort |
| `sortLinesZA` | Locale-insensitive descending sort |

### Stats

`computeStats(text): TextStats` — returns `{ characters, charactersNoSpaces, words, lines, paragraphs, readingTimeSec }`.

`formatReadingTime(sec): string` — formats as `"45s read"` or `"3 min read"`.

### Registries

`CASE_TRANSFORMS` and `CLEAN_TRANSFORMS` are `TransformDef[]` arrays used by the UI to render buttons. Each entry has `{ id, label, title, fn, mono? }`.

## Tests

`transforms.test.ts` — 53 tests covering every transform function, `computeStats`, and `formatReadingTime`.
