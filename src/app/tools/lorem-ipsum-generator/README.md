# Lorem Ipsum Generator

Generate placeholder text in multiple styles and formats — from classic Latin to startup copy, e-commerce descriptions, and fully structured UI blocks.

## Privacy

`local-only` — all text is generated from bundled word/sentence pools. No network requests are made.

## Logic

### `generate(config: LoremConfig): GeneratedOutput`

Returns `{ plain: string, html: string }`.

#### Generation modes (`config.mode`)

| Mode | Description |
|---|---|
| `"words"` | Picks `amount` words from the style's word pool, shuffled and capitalised |
| `"sentences"` | Picks `amount` sentences; supports `startWithLorem` for classic style |
| `"paragraphs"` | Builds `amount` paragraphs with optional `__heading__` and `__list__` tokens inserted |
| `"structured"` | Emits named block tokens (`__hero__`, `__card__`, `__testimonial__`, `__faq__`, `__product__`, `__about__`, `__onboarding__`, `__pricing__`) |

#### Styles (`config.style`)

`"classic"` · `"readable"` · `"startup"` · `"ecommerce"` · `"blog"` · `"profile"`

Each style has its own word pool and sentence pool defined in `contentPools.ts`.

#### Config options

| Option | Type | Description |
|---|---|---|
| `amount` | `number` | Number of words / sentences / paragraphs / blocks |
| `blockLength` | `"short" \| "medium" \| "long"` | Sentences per paragraph (2–3 / 3–5 / 5–8) |
| `startWithLorem` | `boolean` | Prefix first sentence with the classic opening (classic style only) |
| `includeHeadings` | `boolean` | Insert `__heading__` token every 2–3 paragraphs |
| `includeLists` | `boolean` | Insert `__list__` token every 3rd paragraph |
| `structuredBlock` | `StructuredBlock` | Block type for `"structured"` mode |
| `outputFormat` | `"plain" \| "html"` | Consumed by the UI — `generate` always returns both |

#### Token serialisation

Paragraph mode produces an internal token array. Two serialisers render it:
- `tokenToPlain` — converts tokens to readable plain text (headings on their own line, bullets with `•`)
- `tokenToHtml` — converts tokens to semantic HTML (`<h2>`, `<ul>`, `<section class="hero">`, `<blockquote>`, etc.)

### `computeStats(plain): LoremStats`

Returns `{ words, characters, sentences, paragraphs, readingTimeSeconds }`.  
Reading time assumes 200 wpm, minimum 1 second.

### `formatReadingTime(seconds): string`

`"30s read"` or `"3 min read"`.

## Tests

`generator.test.ts` — 28 tests covering all four modes (words, sentences, paragraphs, structured), all structured block types (hero, card, testimonial, faq, pricing), all six styles, `computeStats`, and `formatReadingTime`.
