# Timestamp Converter

Convert Unix timestamps (seconds or milliseconds) to human-readable dates, and convert a local or ISO datetime back to a Unix timestamp.

## Privacy

`local-only` — all conversions use the browser's built-in `Date` API. No data is sent anywhere.

## Logic

`timestamp.ts` exports the following functions:

### `convertTimestampInput(input, mode): TimestampResult`

Parses a raw integer string (with optional leading `−`) and converts it to a `Date`.

| `mode` | Behaviour |
|---|---|
| `"auto"` | Detects seconds vs milliseconds by digit length (≤10 → seconds, ≥13 → ms, 11–12 → proximity heuristic) |
| `"seconds"` | Always interprets as Unix seconds |
| `"milliseconds"` | Always interprets as JavaScript milliseconds |

Returns one of three discriminated union shapes:

```ts
{ ok: true, status: "empty" }
{ ok: true, status: "valid", unit, date, formats, detectedLabel, note, ... }
{ ok: false, status: "invalid", error: { code, message } }
```

Error codes: `"invalid-format"` · `"out-of-range"` · `"invalid-date"`

### `formatRelativeTime(date, now?): string`

Returns a human-readable relative string: `"3 days ago"`, `"in 2 hours"`, `"now"`.  
Units: days → hours → minutes → seconds → "now".

### `formatTimezoneOffset(date): string`

Returns the browser local timezone offset as `"UTC+05:30"` or `"UTC-07:00"`.

### `formatTimestampDate(date, now?): TimestampFormats`

Returns all six format strings: `local`, `utc`, `iso`, `unixSeconds`, `unixMilliseconds`, `timezoneOffset`, `relative`.

### `convertDateInputs(localDateTime, isoDateTime): DateInputResult`

Accepts either a `YYYY-MM-DDTHH:mm` local string or an ISO datetime with timezone (e.g. `2030-01-01T00:00:00.000Z`). The ISO input takes priority when both are provided.

### `toDateTimeLocalValue(date): string`

Serialises a `Date` back to `YYYY-MM-DDTHH:mm:ss` for use in `<input type="datetime-local">`.

## Tests

`timestamp.test.ts` — 32 tests covering empty input, 10-digit seconds, 13-digit milliseconds, manual modes, invalid inputs, `formatRelativeTime` (past/future days/hours/minutes/seconds/now), `formatTimezoneOffset`, `formatTimestampDate`, `convertDateInputs`, and `toDateTimeLocalValue`.
