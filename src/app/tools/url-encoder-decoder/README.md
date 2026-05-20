# URL Encoder / Decoder

Encode and decode URL strings using the browser's native `encodeURI` / `encodeURIComponent` and `decodeURI` / `decodeURIComponent` APIs. Also parses query parameters from full URLs or query strings.

## Privacy

`local-only` — all processing uses browser-native URL APIs. No data is sent to any server.

## Logic

`url.ts` exports two functions:

### `processUrlText(input, mode, type): UrlProcessResult`

| Parameter | Type | Values |
|---|---|---|
| `mode` | `UrlMode` | `"encode"` or `"decode"` |
| `type` | `UrlEncodingType` | `"full"` — uses `encodeURI`/`decodeURI` (preserves `:`, `//`, `?`, `&`, `=`, `#`) · `"component"` — uses `encodeURIComponent`/`decodeURIComponent` (encodes everything except unreserved chars) |

Returns `{ ok: true, output, status }` on success or `{ ok: false, output: "", status, error }` on failure.

**Error cases:**
- Empty input → `"Empty input"` status
- `URIError` from the browser (malformed `%` sequence) → `"Invalid URL encoding"` status with a descriptive message

### `parseQueryParams(input): QueryParamRow[]`

Accepts a full URL (`https://…?k=v`) or a bare query string (`?k=v` or `k=v`). Returns an array of `{ key, value }` rows.

Returns `[]` for plain text that doesn't resemble a query string (no `=` sign present).

## Tests

`url.test.ts` — 18 tests covering encode/decode for both types, round-trips, Arabic text, invalid percent sequences, and `parseQueryParams` with full URLs, bare query strings, and plain text.
