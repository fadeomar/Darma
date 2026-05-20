# Slug Generator

Convert any text — titles, headings, file names — into clean, URL-safe slugs.

## Privacy

`local-only` — all slug generation runs as pure string transforms in the browser. No data is sent anywhere.

## Logic

`slug.ts` exports one main function:

```ts
generateSlug(input: string, options: SlugOptions): SlugResult
```

### Options (`SlugOptions`)

| Option | Type | Default | Description |
|---|---|---|---|
| `separator` | `"-" \| "_"` | `"-"` | Character used between words |
| `caseMode` | `"lower" \| "keep" \| "upper"` | `"lower"` | Whether to lowercase, keep original, or uppercase |
| `keepNumbers` | `boolean` | `true` | If false, removes all digits |
| `removeStopWords` | `boolean` | `false` | Strips common English stop words (`a`, `an`, `the`, `and`, `of`, etc.) |
| `maxLengthEnabled` | `boolean` | `false` | Whether to enforce a character limit |
| `maxLength` | `number` | `80` | Maximum slug length (no trailing separator after trim) |
| `preserveSlashes` | `boolean` | `false` | If true, `/` is treated as a path separator and kept in the output |

### Result (`SlugResult`)

```ts
{
  slug: string;
  warnings: SlugWarning[];
  stats: { originalChars, slugChars, wordCount, isUrlFriendly };
}
```

**Warnings:** `"empty-input"` · `"empty-output"` · `"trimmed"` (maxLength applied) · `"very-long"` (> 96 chars)

### Processing pipeline

1. Trim input whitespace
2. Split on `/` if `preserveSlashes` is enabled
3. Per segment: remove Latin diacritics via NFD decomposition, apply case, strip disallowed characters, remove numbers (if opted out), remove stop words, replace spaces with the chosen separator
4. Collapse repeated separators and strip leading/trailing separators
5. Apply max-length trim (avoids ending on a separator)

Latin diacritics (`é` → `e`, `ü` → `u`) are stripped. Non-Latin scripts (Arabic, CJK, etc.) are preserved as valid Unicode letters in the slug.

## Tests

`slug.test.ts` — 26 tests covering basic slugification, separator, case modes, numbers, stop words, max-length trimming, slash preservation, diacritics, stats, and warnings.
