# Base64 Encoder / Decoder

Encode text or binary data to Base64 and decode it back, with URL-safe and padding options.

## Privacy

`local-only` — all encoding and decoding runs entirely in the browser using the native `TextEncoder`, `TextDecoder`, and `btoa`/`atob` APIs. No data is sent to any server.

## Logic

`base64.ts` exports four pure functions:

| Function | Description |
|---|---|
| `encodeBase64(input, options)` | UTF-8 encodes the string, converts to Base64, and applies URL-safe / no-padding transforms |
| `decodeBase64(input, options)` | Normalises whitespace and padding, validates the structure, then decodes back to a UTF-8 string |
| `transformBase64(input, mode, options)` | Thin dispatcher that delegates to encode or decode |
| `computeBase64Stats(input, output, mode)` | Returns character counts, byte sizes, and a `sizeChangePercent` |

### Options

| Option | Type | Effect |
|---|---|---|
| `urlSafe` | `boolean` | Replaces `+` → `-` and `/` → `_` for safe use in URLs and filenames |
| `removePadding` | `boolean` | Strips trailing `=` characters from encoded output |

### Error handling

`decodeBase64` returns `{ ok: false, error: { code, message } }` for:
- `invalid-characters` — non-Base64 characters or too many `=` signs
- `invalid-padding` — length not a multiple of 4 (after auto-repair attempt)
- `unable-to-decode` — byte sequence is not valid UTF-8

Auto-padding: the decoder automatically re-adds missing `=` signs for inputs with 2 or 3 characters in the final block, so lightly-stripped input usually still decodes.

## Tests

`base64.test.ts` — 24 tests covering:
- Encode: empty input, ASCII, Unicode, emoji, URL-safe mode, padding removal
- Decode: valid Base64, auto-padding, URL-safe decode, invalid characters, excess padding, whitespace stripping
- `transformBase64` dispatch
- `computeBase64Stats` character counts, byte sizes, size change percent
