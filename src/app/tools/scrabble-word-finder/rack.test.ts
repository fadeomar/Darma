import { describe, expect, it } from "vitest";
import {
  countRackTiles,
  createDefaultFilters,
  findWords,
  groupByLength,
  LETTER_SCORES,
  matchWord,
  parseDictionaryFile,
  parseRack,
  scoreWithBlanks,
  sortMatches,
  validateFinder,
} from "./rack";

const DICT = ["cat", "act", "car", "arc", "care", "race", "acre", "scare", "dog", "cats"];

describe("parseRack", () => {
  it("counts letters and blanks", () => {
    const rack = parseRack("caT?");
    expect(rack.letters).toEqual({ c: 1, a: 1, t: 1 });
    expect(rack.blanks).toBe(1);
  });
  it("treats ?, *, _ as blanks and ignores spaces and punctuation", () => {
    expect(parseRack("a*b_c d!").blanks).toBe(2);
  });
  it("counts total tiles", () => {
    expect(countRackTiles(parseRack("abc?"))).toBe(4);
  });
});

describe("matchWord", () => {
  it("matches when the rack has all letters", () => {
    expect(matchWord("cat", parseRack("cat"))).toEqual({ blanksUsed: 0, blankLetters: {} });
  });
  it("uses blanks for missing letters", () => {
    const result = matchWord("care", parseRack("car?"));
    expect(result).toEqual({ blanksUsed: 1, blankLetters: { e: 1 } });
  });
  it("returns null when there are not enough tiles", () => {
    expect(matchWord("scare", parseRack("car"))).toBeNull();
  });
});

describe("scoreWithBlanks", () => {
  it("scores letters at their Scrabble value", () => {
    // c(3) + a(1) + t(1) = 5
    expect(scoreWithBlanks("cat", {})).toBe(5);
  });
  it("scores blank-covered letters as zero", () => {
    // care = c3 a1 r1 e1 = 6, but e covered by blank → 5
    expect(scoreWithBlanks("care", { e: 1 })).toBe(5);
  });
});

describe("findWords", () => {
  it("returns only words playable from the rack", () => {
    const results = findWords("cat", DICT, createDefaultFilters());
    const words = results.map((r) => r.word).sort();
    expect(words).toEqual(["act", "cat"]);
  });
  it("uses blanks and reports blanksUsed", () => {
    const results = findWords("car?", DICT, createDefaultFilters());
    const care = results.find((r) => r.word === "care");
    expect(care?.blanksUsed).toBe(1);
  });
  it("sorts by score by default (highest first)", () => {
    const results = findWords("scare", DICT, createDefaultFilters());
    expect(results[0].word).toBe("scare"); // longest, highest score
  });
  it("respects the contains filter", () => {
    const results = findWords("scare", DICT, { ...createDefaultFilters(), contains: "sc" });
    expect(results.every((r) => r.word.includes("sc"))).toBe(true);
  });
  it("respects min length", () => {
    const results = findWords("scare", DICT, { ...createDefaultFilters(), minLength: 4 });
    expect(results.every((r) => r.length >= 4)).toBe(true);
  });
  it("returns nothing for an empty rack", () => {
    expect(findWords("", DICT, createDefaultFilters())).toEqual([]);
  });
});

describe("sortMatches", () => {
  const matches = findWords("scare", DICT, createDefaultFilters());
  it("alpha sort orders words A→Z", () => {
    const sorted = sortMatches(matches, "alpha").map((m) => m.word);
    expect(sorted).toEqual([...sorted].sort());
  });
  it("length sort puts longest first", () => {
    const sorted = sortMatches(matches, "length");
    expect(sorted[0].length).toBeGreaterThanOrEqual(sorted[sorted.length - 1].length);
  });
});

describe("groupByLength", () => {
  it("groups descending by length", () => {
    const groups = groupByLength(findWords("scare", DICT, createDefaultFilters()));
    expect(groups[0].length).toBeGreaterThan(groups[groups.length - 1].length);
  });
});

describe("parseDictionaryFile", () => {
  it("cleans, lowercases, dedupes, and drops invalid lines", () => {
    expect(parseDictionaryFile("Cat\ncat\ndog\n\nA1\nok\n")).toEqual(["cat", "dog", "ok"]);
  });
});

describe("validateFinder", () => {
  it("prompts when the rack is empty", () => {
    expect(validateFinder("", 100).some((m) => m.message.includes("Enter your letters"))).toBe(true);
  });
  it("warns on oversized racks", () => {
    expect(validateFinder("abcdefghijklmnop", 100).some((m) => m.type === "warning")).toBe(true);
  });
});

describe("LETTER_SCORES", () => {
  it("uses standard high-value letters", () => {
    expect(LETTER_SCORES.q).toBe(10);
    expect(LETTER_SCORES.z).toBe(10);
    expect(LETTER_SCORES.a).toBe(1);
  });
});
