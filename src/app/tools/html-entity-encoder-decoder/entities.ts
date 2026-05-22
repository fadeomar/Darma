import type { EncodeOptions, EntityStats } from "./types";

export const HTML_ENTITY_INPUT_LIMIT = 100_000;

const NAMED_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
  "©": "&copy;",
  "®": "&reg;",
  "™": "&trade;",
  "€": "&euro;",
  "£": "&pound;",
  "¥": "&yen;",
  "¢": "&cent;",
  "§": "&sect;",
  "¶": "&para;",
  "•": "&bull;",
  "…": "&hellip;",
  "–": "&ndash;",
  "—": "&mdash;",
  "‘": "&lsquo;",
  "’": "&rsquo;",
  "“": "&ldquo;",
  "”": "&rdquo;",
  " ": "&nbsp;",
  "×": "&times;",
  "÷": "&divide;",
};

const DECODE_NAMED_ENTITIES = Object.entries(NAMED_ENTITIES).reduce<Record<string, string>>((acc, [character, entity]) => {
  acc[entity.slice(1, -1)] = character;
  return acc;
}, {
  apos: "'",
});

function shouldEncodeCharacter(character: string, options: EncodeOptions): boolean {
  if (character === "\n" || character === "\r") return !options.preserveLineBreaks;
  if (character === "&" || character === "<" || character === ">") return true;
  if ((character === '"' || character === "'") && options.convertQuotes) return true;
  if (options.scope === "essential") return false;
  if (options.scope === "special" && NAMED_ENTITIES[character]) return true;
  if (options.scope === "nonAscii" && character.codePointAt(0)! > 127) return true;
  return false;
}

function encodeCharacter(character: string, format: EncodeOptions["format"]): string {
  const codePoint = character.codePointAt(0) ?? 0;
  if (format === "named" && NAMED_ENTITIES[character]) return NAMED_ENTITIES[character];
  if (format === "hex") return `&#x${codePoint.toString(16).toUpperCase()};`;
  return `&#${codePoint};`;
}

export function encodeHtmlEntities(input: string, options: EncodeOptions): string {
  let output = "";
  for (const character of input) {
    output += shouldEncodeCharacter(character, options) ? encodeCharacter(character, options.format) : character;
  }
  return output;
}

export function decodeHtmlEntities(input: string): string {
  return input.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]+);/g, (entity, body: string) => {
    if (body.startsWith("#x") || body.startsWith("#X")) {
      const value = Number.parseInt(body.slice(2), 16);
      return Number.isFinite(value) && value >= 0 && value <= 0x10FFFF ? String.fromCodePoint(value) : entity;
    }
    if (body.startsWith("#")) {
      const value = Number.parseInt(body.slice(1), 10);
      return Number.isFinite(value) && value >= 0 && value <= 0x10FFFF ? String.fromCodePoint(value) : entity;
    }
    return DECODE_NAMED_ENTITIES[body] ?? entity;
  });
}

export function getMalformedNumericEntities(input: string): string[] {
  const malformed = input.match(/&(?:#x[^;\s]*|#[^;\s]*);/gi) ?? [];
  return malformed.filter((entity) => {
    if (/^&#x[0-9a-f]+;$/i.test(entity)) return false;
    if (/^&#[0-9]+;$/.test(entity)) return false;
    return true;
  });
}

export function getEntityStats(input: string, output: string): EntityStats {
  let changedCharacters = 0;
  const max = Math.max(input.length, output.length);
  for (let index = 0; index < max; index += 1) {
    if (input[index] !== output[index]) changedCharacters += 1;
  }

  return {
    inputCharacters: input.length,
    outputCharacters: output.length,
    changedCharacters,
    entityCount: (output.match(/&(?:#x?[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]+);/g) ?? []).length,
  };
}
