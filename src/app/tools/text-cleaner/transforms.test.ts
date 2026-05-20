import { describe, it, expect } from "vitest";
import {
  toUpperCase,
  toLowerCase,
  toTitleCase,
  toSentenceCase,
  toInverseCase,
  toCamelCase,
  toPascalCase,
  toSnakeCase,
  toKebabCase,
  removeExtraSpaces,
  removeEmptyLines,
  removeDuplicateLines,
  sortLinesAZ,
  sortLinesZA,
  trimText,
  trimEachLine,
  normalizeLineBreaks,
  collapseBlankLines,
  computeStats,
  formatReadingTime,
} from "./transforms";

// ─── Case transforms ──────────────────────────────────────────────────────────

describe("toUpperCase", () => {
  it("converts to all uppercase", () => {
    expect(toUpperCase("hello World")).toBe("HELLO WORLD");
  });
  it("handles already uppercase string", () => {
    expect(toUpperCase("ABC")).toBe("ABC");
  });
});

describe("toLowerCase", () => {
  it("converts to all lowercase", () => {
    expect(toLowerCase("HELLO World")).toBe("hello world");
  });
});

describe("toTitleCase", () => {
  it("capitalises every word", () => {
    expect(toTitleCase("the quick brown fox")).toBe("The Quick Brown Fox");
  });
  it("lowercases the rest of each word", () => {
    expect(toTitleCase("hELLO wORLD")).toBe("Hello World");
  });
});

describe("toSentenceCase", () => {
  it("capitalises the first character of each sentence", () => {
    const result = toSentenceCase("hello world. how are you? fine thanks.");
    expect(result).toMatch(/^Hello world\./);
    expect(result).toMatch(/\. How are you\?/);
    expect(result).toMatch(/\? Fine thanks\./);
  });
  it("lowercases the rest", () => {
    expect(toSentenceCase("HELLO WORLD")).toBe("Hello world");
  });
});

describe("toInverseCase", () => {
  it("flips case of every character", () => {
    expect(toInverseCase("Hello World")).toBe("hELLO wORLD");
  });
  it("leaves non-letter characters unchanged", () => {
    expect(toInverseCase("abc 123")).toBe("ABC 123");
  });
});

describe("toCamelCase", () => {
  it("converts space-separated words", () => {
    expect(toCamelCase("hello world test")).toBe("helloWorldTest");
  });
  it("converts hyphen-separated words", () => {
    expect(toCamelCase("my-component-name")).toBe("myComponentName");
  });
  it("handles PascalCase input", () => {
    expect(toCamelCase("MyVariableName")).toBe("myVariableName");
  });
  it("returns single word as lowercase", () => {
    expect(toCamelCase("hello")).toBe("hello");
  });
});

describe("toPascalCase", () => {
  it("converts space-separated words", () => {
    expect(toPascalCase("hello world test")).toBe("HelloWorldTest");
  });
  it("converts kebab-case", () => {
    expect(toPascalCase("my-component")).toBe("MyComponent");
  });
});

describe("toSnakeCase", () => {
  it("converts to underscore-separated lowercase", () => {
    expect(toSnakeCase("Hello World")).toBe("hello_world");
  });
  it("handles camelCase input", () => {
    expect(toSnakeCase("myVariableName")).toBe("my_variable_name");
  });
});

describe("toKebabCase", () => {
  it("converts to hyphen-separated lowercase", () => {
    expect(toKebabCase("Hello World")).toBe("hello-world");
  });
  it("handles camelCase input", () => {
    expect(toKebabCase("myVariableName")).toBe("my-variable-name");
  });
});

// ─── Clean transforms ─────────────────────────────────────────────────────────

describe("trimText", () => {
  it("removes leading and trailing whitespace", () => {
    expect(trimText("  hello  ")).toBe("hello");
  });
  it("leaves middle whitespace intact", () => {
    expect(trimText("  a b  ")).toBe("a b");
  });
});

describe("removeExtraSpaces", () => {
  it("collapses multiple spaces to one per line", () => {
    expect(removeExtraSpaces("hello   world")).toBe("hello world");
  });
  it("trims each line", () => {
    expect(removeExtraSpaces("  hi  \n  there  ")).toBe("hi\nthere");
  });
  it("handles tabs as whitespace", () => {
    expect(removeExtraSpaces("a\t\tb")).toBe("a b");
  });
});

describe("removeEmptyLines", () => {
  it("removes blank lines", () => {
    const input = "hello\n\nworld\n\n";
    expect(removeEmptyLines(input)).toBe("hello\nworld");
  });
  it("keeps lines with content", () => {
    expect(removeEmptyLines("a\nb\nc")).toBe("a\nb\nc");
  });
  it("removes whitespace-only lines", () => {
    expect(removeEmptyLines("a\n   \nb")).toBe("a\nb");
  });
});

describe("trimEachLine", () => {
  it("trims each line individually", () => {
    expect(trimEachLine("  a  \n  b  ")).toBe("a\nb");
  });
});

describe("normalizeLineBreaks", () => {
  it("converts CRLF to LF", () => {
    expect(normalizeLineBreaks("a\r\nb")).toBe("a\nb");
  });
  it("converts CR to LF", () => {
    expect(normalizeLineBreaks("a\rb")).toBe("a\nb");
  });
  it("leaves LF unchanged", () => {
    expect(normalizeLineBreaks("a\nb")).toBe("a\nb");
  });
});

describe("collapseBlankLines", () => {
  it("reduces 3+ consecutive blank lines to 2", () => {
    expect(collapseBlankLines("a\n\n\n\nb")).toBe("a\n\nb");
  });
  it("leaves 2 blank lines intact", () => {
    expect(collapseBlankLines("a\n\nb")).toBe("a\n\nb");
  });
});

describe("removeDuplicateLines", () => {
  it("keeps only the first occurrence of each line", () => {
    const input = "apple\nbanana\napple\ncherry\nbanana";
    expect(removeDuplicateLines(input)).toBe("apple\nbanana\ncherry");
  });
  it("comparison is based on trimmed line content", () => {
    const input = "hello\n  hello  \nworld";
    expect(removeDuplicateLines(input)).toBe("hello\nworld");
  });
});

describe("sortLinesAZ", () => {
  it("sorts lines alphabetically ascending", () => {
    expect(sortLinesAZ("banana\napple\ncherry")).toBe("apple\nbanana\ncherry");
  });
  it("is case-insensitive", () => {
    const result = sortLinesAZ("Banana\napple");
    expect(result.split("\n")[0].toLowerCase()).toBe("apple");
  });
});

describe("sortLinesZA", () => {
  it("sorts lines alphabetically descending", () => {
    expect(sortLinesZA("apple\nbanana\ncherry")).toBe("cherry\nbanana\napple");
  });
});

// ─── Stats ────────────────────────────────────────────────────────────────────

describe("computeStats", () => {
  it("returns zero stats for empty string", () => {
    const stats = computeStats("");
    expect(stats.characters).toBe(0);
    expect(stats.words).toBe(0);
    expect(stats.lines).toBe(0);
    expect(stats.paragraphs).toBe(0);
  });

  it("counts characters including spaces", () => {
    expect(computeStats("hello world").characters).toBe(11);
  });

  it("counts characters without spaces", () => {
    expect(computeStats("hello world").charactersNoSpaces).toBe(10);
  });

  it("counts words", () => {
    expect(computeStats("one two three").words).toBe(3);
  });

  it("counts lines", () => {
    expect(computeStats("a\nb\nc").lines).toBe(3);
  });

  it("counts paragraphs separated by blank lines", () => {
    expect(computeStats("para one\n\npara two").paragraphs).toBe(2);
  });

  it("reading time is at least 1 second for non-empty input", () => {
    expect(computeStats("hello").readingTimeSec).toBeGreaterThanOrEqual(1);
  });

  it("computes reading time based on 200 wpm", () => {
    // 200 words = 60 seconds
    const text = Array(200).fill("word").join(" ");
    expect(computeStats(text).readingTimeSec).toBe(60);
  });
});

describe("formatReadingTime", () => {
  it("shows seconds for < 60 seconds", () => {
    expect(formatReadingTime(45)).toBe("45s read");
  });
  it("shows minutes for >= 60 seconds", () => {
    expect(formatReadingTime(60)).toBe("1 min read");
  });
  it("rounds up to nearest minute", () => {
    expect(formatReadingTime(61)).toBe("2 min read");
  });
  it("handles exactly 120 seconds", () => {
    expect(formatReadingTime(120)).toBe("2 min read");
  });
});
