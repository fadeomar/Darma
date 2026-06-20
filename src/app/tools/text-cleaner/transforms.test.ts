import { describe, expect, it } from "vitest";
import {
  collapseBlankLines,
  computeStats,
  convertCommaListToLines,
  convertLinesToCommaList,
  addPrefixToEachLine,
  addSuffixToEachLine,
  extractEmails,
  extractUrls,
  formatReadingTime,
  normalizeArabicAlef,
  removeDuplicateLines,
  removeEmptyLines,
  removeExtraSpaces,
  removeTashkeel,
  runPipeline,
  sortLinesAZ,
  sortLinesZA,
  toCamelCase,
  toKebabCase,
  toLowerCase,
  toPascalCase,
  toSentenceCase,
  toSnakeCase,
  toTitleCase,
  toUpperCase,
  trimEachLine,
  trimText,
} from "./transforms";

describe("case transforms", () => {
  it("converts uppercase and lowercase", () => {
    expect(toUpperCase("hello World")).toBe("HELLO WORLD");
    expect(toLowerCase("HELLO World")).toBe("hello world");
  });

  it("converts title and sentence case", () => {
    expect(toTitleCase("hELLO wORLD")).toBe("Hello World");
    expect(toSentenceCase("HELLO WORLD. HOW ARE YOU?")).toBe("Hello world. How are you?");
  });

  it("converts camelCase and PascalCase", () => {
    expect(toCamelCase("hello world test")).toBe("helloWorldTest");
    expect(toPascalCase("my-component")).toBe("MyComponent");
  });

  it("converts snake_case", () => {
    expect(toSnakeCase("myVariableName")).toBe("my_variable_name");
  });

  it("converts kebab-case", () => {
    expect(toKebabCase("myVariableName")).toBe("my-variable-name");
  });
});

describe("clean transforms", () => {
  it("trims text and lines", () => {
    expect(trimText("  hello  ")).toBe("hello");
    expect(trimEachLine("  a  \n  b  ")).toBe("a\nb");
  });

  it("collapses extra spaces per line", () => {
    expect(removeExtraSpaces("  hi  \n  there   friend  ")).toBe("hi\nthere friend");
  });

  it("removes empty lines", () => {
    expect(removeEmptyLines("a\n   \n\nb")).toBe("a\nb");
  });

  it("collapses blank lines", () => {
    expect(collapseBlankLines("a\n\n\n\nb")).toBe("a\n\nb");
  });

  it("removes duplicate lines", () => {
    expect(removeDuplicateLines("apple\nbanana\napple\n  banana  ")).toBe("apple\nbanana");
  });

  it("sorts lines", () => {
    expect(sortLinesAZ("banana\napple\ncherry")).toBe("apple\nbanana\ncherry");
    expect(sortLinesZA("apple\nbanana\ncherry")).toBe("cherry\nbanana\napple");
  });
});

describe("arabic transforms", () => {
  it("normalizes Arabic alef variants", () => {
    expect(normalizeArabicAlef("أحمد إلى آب")).toBe("احمد الى اب");
  });

  it("removes tashkeel", () => {
    expect(removeTashkeel("النَّصُّ العَرَبِيُّ")).toBe("النص العربي");
  });
});

describe("extract transforms", () => {
  it("extracts URLs", () => {
    expect(extractUrls("Visit https://example.com/a?b=1, and http://test.dev")).toBe("https://example.com/a?b=1\nhttp://test.dev");
  });

  it("extracts emails", () => {
    expect(extractEmails("Email hi@example.com and team+dev@test.co")).toBe("hi@example.com\nteam+dev@test.co");
  });
});

describe("format transforms", () => {
  it("converts lines to comma list", () => {
    expect(convertLinesToCommaList("alpha\n\nbeta\ngamma")).toBe("alpha, beta, gamma");
  });

  it("converts comma list to lines", () => {
    expect(convertCommaListToLines("alpha, beta, gamma")).toBe("alpha\nbeta\ngamma");
  });

  it("adds default prefix and suffix text", () => {
    expect(addPrefixToEachLine("alpha\nbeta")).toBe("> alpha\n> beta");
    expect(addSuffixToEachLine("alpha\nbeta")).toBe("alpha.\nbeta.");
  });

  it("adds custom prefix and suffix text", () => {
    expect(addPrefixToEachLine("alpha\nbeta", { prefixText: "* " })).toBe("* alpha\n* beta");
    expect(addSuffixToEachLine("alpha\nbeta", { suffixText: ";" })).toBe("alpha;\nbeta;");
  });
});

describe("pipeline", () => {
  it("runs selected transforms in order", () => {
    expect(runPipeline("  Banana\napple\nBanana  ", ["trim-lines", "dedupe-lines", "sort-az"])).toBe("apple\nBanana");
  });

  it("passes custom format options through the pipeline", () => {
    expect(runPipeline("alpha\nbeta", ["prefix-lines", "suffix-lines"], { prefixText: "- ", suffixText: ";" })).toBe("- alpha;\n- beta;");
  });
});

describe("stats", () => {
  it("computes text stats", () => {
    const stats = computeStats("one two\n\nthree");
    expect(stats.characters).toBe(14);
    expect(stats.words).toBe(3);
    expect(stats.lines).toBe(3);
    expect(stats.paragraphs).toBe(2);
  });

  it("formats reading time", () => {
    expect(formatReadingTime(45)).toBe("45s read");
    expect(formatReadingTime(61)).toBe("2 min read");
  });
});
