// ─── Types ────────────────────────────────────────────────────────────────────

export type IndentOption = 2 | 4 | "tab";

export type ValidationResult =
  | { ok: true }
  | {
      ok: false;
      error: string;   // human-readable
      raw: string;     // original SyntaxError message
      line?: number;
      col?: number;
    };

export type ProcessResult = {
  ok: boolean;
  output?: string;
  validation: ValidationResult;
};

// ─── Error parsing ────────────────────────────────────────────────────────────

function charPosToLineCol(
  input: string,
  pos: number,
): { line: number; col: number } {
  const before = input.substring(0, pos);
  const lines = before.split("\n");
  return { line: lines.length, col: lines[lines.length - 1].length + 1 };
}

function parseJsonError(err: unknown, input: string): ValidationResult {
  if (!(err instanceof SyntaxError)) {
    return {
      ok: false,
      error: "An unexpected error occurred while parsing.",
      raw: String(err),
    };
  }

  const msg = err.message;
  let line: number | undefined;
  let col: number | undefined;

  // Firefox / SpiderMonkey:
  // "JSON.parse: unexpected character at line 3 column 5 of the JSON data"
  const ffMatch = msg.match(/at line (\d+) column (\d+)/i);
  if (ffMatch) {
    line = parseInt(ffMatch[1], 10);
    col = parseInt(ffMatch[2], 10);
  }

  // V8 (Chrome / Node / Edge):
  // "Unexpected token '}' at position 42"
  // "Expected ',' or ']' after array element in JSON at position 42"
  if (!line) {
    const v8Match = msg.match(/at position (\d+)/i);
    if (v8Match) {
      const charPos = parseInt(v8Match[1], 10);
      ({ line, col } = charPosToLineCol(input, charPos));
    }
  }

  // Clean up the raw message into something readable
  let human = msg
    .replace(/^JSON\.parse:\s*/i, "")
    .replace(/ in JSON at position \d+/i, "")
    .replace(/ of the JSON data/i, "")
    .trim();
  human = human.charAt(0).toUpperCase() + human.slice(1);
  if (!human.endsWith(".")) human += ".";

  return { ok: false, error: human, raw: msg, line, col };
}

// ─── Core operations ──────────────────────────────────────────────────────────

export function validateJSON(input: string): ValidationResult {
  const trimmed = input.trim();
  if (!trimmed) return { ok: false, error: "Input is empty.", raw: "" };

  try {
    JSON.parse(trimmed);
    return { ok: true };
  } catch (err) {
    return parseJsonError(err, trimmed);
  }
}

export function formatJSON(input: string, indent: IndentOption): ProcessResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { ok: false, validation: { ok: false, error: "Input is empty.", raw: "" } };
  }

  try {
    const parsed = JSON.parse(trimmed);
    const indentValue: string | number = indent === "tab" ? "\t" : indent;
    const output = JSON.stringify(parsed, null, indentValue);
    return { ok: true, output, validation: { ok: true } };
  } catch (err) {
    return { ok: false, validation: parseJsonError(err, trimmed) };
  }
}

export function minifyJSON(input: string): ProcessResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { ok: false, validation: { ok: false, error: "Input is empty.", raw: "" } };
  }

  try {
    const parsed = JSON.parse(trimmed);
    const output = JSON.stringify(parsed);
    return { ok: true, output, validation: { ok: true } };
  } catch (err) {
    return { ok: false, validation: parseJsonError(err, trimmed) };
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Rough count of top-level keys (works for objects and arrays). */
export function getTopLevelCount(json: string): number {
  try {
    const parsed = JSON.parse(json);
    if (parsed !== null && typeof parsed === "object") {
      return Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length;
    }
  } catch {
    // ignore
  }
  return 0;
}

// ─── Sample JSON ──────────────────────────────────────────────────────────────

export const SAMPLE_JSON = `{
  "user": {
    "id": 1042,
    "name": "Alex Rivera",
    "email": "alex@example.com",
    "role": "developer",
    "active": true,
    "joinedAt": "2023-08-15T09:30:00Z",
    "preferences": {
      "theme": "dark",
      "notifications": true,
      "language": "en"
    }
  },
  "projects": [
    {
      "id": "proj-001",
      "title": "API Dashboard",
      "status": "in-progress",
      "tags": ["api", "dashboard", "react"],
      "completionRate": 0.72
    },
    {
      "id": "proj-002",
      "title": "Mobile App",
      "status": "planning",
      "tags": ["mobile", "ios", "android"],
      "completionRate": 0.1
    }
  ],
  "meta": {
    "version": "2.1.0",
    "requestId": "req_8f3a9c2b",
    "processingMs": 43
  }
}`;
