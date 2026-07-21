import type { FinderFilters, FinderValidationMessage, SortMode, WordMatch } from "./types";

/** Standard English Scrabble letter values. Blank tiles score 0. */
export const LETTER_SCORES: Record<string, number> = {
  a: 1, e: 1, i: 1, o: 1, u: 1, l: 1, n: 1, s: 1, t: 1, r: 1,
  d: 2, g: 2,
  b: 3, c: 3, m: 3, p: 3,
  f: 4, h: 4, v: 4, w: 4, y: 4,
  k: 5,
  j: 8, x: 8,
  q: 10, z: 10,
};

export const MAX_RACK_TILES = 15;

export type RackCounts = {
  letters: Record<string, number>;
  blanks: number;
};

/**
 * Parse a rack string into letter counts and a blank count.
 * `?`, `*`, and `_` count as blank (wildcard) tiles; spaces and other
 * punctuation are ignored as separators.
 */
export function parseRack(input: string): RackCounts {
  const letters: Record<string, number> = {};
  let blanks = 0;
  for (const raw of input.toLowerCase()) {
    if (raw === "?" || raw === "*" || raw === "_") {
      blanks += 1;
    } else if (raw >= "a" && raw <= "z") {
      letters[raw] = (letters[raw] ?? 0) + 1;
    }
  }
  return { letters, blanks };
}

export function countRackTiles(rack: RackCounts): number {
  return Object.values(rack.letters).reduce((sum, n) => sum + n, 0) + rack.blanks;
}

/** Word score, accounting for blank tiles covering deficit letters (which score 0). */
export function scoreWithBlanks(word: string, blankLetters: Record<string, number>): number {
  const remainingBlankCover = { ...blankLetters };
  let score = 0;
  for (const letter of word) {
    if ((remainingBlankCover[letter] ?? 0) > 0) {
      remainingBlankCover[letter] -= 1; // covered by a blank → 0 points
      continue;
    }
    score += LETTER_SCORES[letter] ?? 0;
  }
  return score;
}

/**
 * Check whether `word` can be formed from the rack. Returns the number of
 * blanks required and which letters they cover, or null if impossible.
 */
export function matchWord(word: string, rack: RackCounts): { blanksUsed: number; blankLetters: Record<string, number> } | null {
  const need: Record<string, number> = {};
  for (const letter of word) need[letter] = (need[letter] ?? 0) + 1;

  const blankLetters: Record<string, number> = {};
  let blanksUsed = 0;
  for (const [letter, count] of Object.entries(need)) {
    const have = rack.letters[letter] ?? 0;
    const deficit = count - have;
    if (deficit > 0) {
      blanksUsed += deficit;
      blankLetters[letter] = deficit;
    }
  }
  if (blanksUsed > rack.blanks) return null;
  return { blanksUsed, blankLetters };
}

function passesFilters(word: string, filters: FinderFilters): boolean {
  if (word.length < filters.minLength) return false;
  if (filters.maxLength > 0 && word.length > filters.maxLength) return false;
  if (filters.contains && !word.includes(filters.contains.toLowerCase())) return false;
  if (filters.startsWith && !word.startsWith(filters.startsWith.toLowerCase())) return false;
  if (filters.endsWith && !word.endsWith(filters.endsWith.toLowerCase())) return false;
  return true;
}

export function createDefaultFilters(): FinderFilters {
  return { contains: "", startsWith: "", endsWith: "", minLength: 2, maxLength: 0 };
}

/**
 * Find every dictionary word playable from the rack, scored and sorted.
 * The dictionary is an array of lowercase words.
 */
export function findWords(
  rackInput: string,
  dictionary: readonly string[],
  filters: FinderFilters,
  sort: SortMode = "score",
): WordMatch[] {
  const rack = parseRack(rackInput);
  if (countRackTiles(rack) === 0) return [];

  const matches: WordMatch[] = [];
  for (const word of dictionary) {
    if (!passesFilters(word, filters)) continue;
    const result = matchWord(word, rack);
    if (!result) continue;
    matches.push({
      word,
      blanksUsed: result.blanksUsed,
      score: scoreWithBlanks(word, result.blankLetters),
      length: word.length,
    });
  }

  return sortMatches(matches, sort);
}

export function sortMatches(matches: WordMatch[], sort: SortMode): WordMatch[] {
  const copy = matches.slice();
  if (sort === "alpha") {
    copy.sort((a, b) => a.word.localeCompare(b.word));
  } else if (sort === "length") {
    copy.sort((a, b) => b.length - a.length || b.score - a.score || a.word.localeCompare(b.word));
  } else {
    copy.sort((a, b) => b.score - a.score || b.length - a.length || a.word.localeCompare(b.word));
  }
  return copy;
}

/** Group matches by word length, descending length. */
export function groupByLength(matches: WordMatch[]): { length: number; words: WordMatch[] }[] {
  const groups = new Map<number, WordMatch[]>();
  for (const match of matches) {
    const bucket = groups.get(match.length) ?? [];
    bucket.push(match);
    groups.set(match.length, bucket);
  }
  return Array.from(groups.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([length, words]) => ({ length, words }));
}

/** Normalize an uploaded dictionary (one word per line) into clean lowercase words. */
export function parseDictionaryFile(raw: string): string[] {
  const seen = new Set<string>();
  const words: string[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const word = line.trim().toLowerCase();
    if (word.length < 2 || !/^[a-z]+$/.test(word) || seen.has(word)) continue;
    seen.add(word);
    words.push(word);
  }
  return words;
}

export function validateFinder(rackInput: string, dictionarySize: number): FinderValidationMessage[] {
  const rack = parseRack(rackInput);
  const tiles = countRackTiles(rack);
  const messages: FinderValidationMessage[] = [];

  if (tiles === 0) {
    messages.push({ type: "info", message: "Enter your letters. Use ? for a blank (wildcard) tile." });
  }
  if (tiles > MAX_RACK_TILES) {
    messages.push({ type: "warning", message: `You have ${tiles} tiles; a standard rack holds up to 7 (plus board letters).` });
  }
  if (rack.blanks > 2) {
    messages.push({ type: "warning", message: "More than two blanks is unusual and will match a very large number of words." });
  }
  messages.push({
    type: "info",
    message: `Searching ${dictionarySize.toLocaleString()} words. Load your own dictionary (TWL/SOWPODS) for tournament-accurate results.`,
  });
  return messages;
}
