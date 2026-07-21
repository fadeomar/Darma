import { describe, it, expect } from "vitest";
import { canonicalRecordString, deepEqual, recordHash, serializeItemFile, valueHash } from "./canonical";
import { orderRecord, COLUMN_ORDER } from "./element-schema";

function baseRecord(overrides: Record<string, unknown> = {}) {
  return orderRecord({
    id: "abc123",
    title: "Title",
    description: "desc",
    shortDescription: null,
    html: "<div>x</div>",
    css: ".a{}",
    js: null,
    tags: ["a", "b"],
    mainCategory: ["ui"],
    secondaryCategory: [],
    deleted: false,
    createdAt: "2025-03-06T19:54:35.002",
    updatedAt: "2026-01-26T09:18:39.83",
    reviewed: true,
    slug: null,
    ...overrides,
  });
}

describe("serializeItemFile", () => {
  it("adds schemaVersion first and ends with a trailing newline", () => {
    const out = serializeItemFile(baseRecord());
    expect(out.startsWith('{\n  "schemaVersion": 1,')).toBe(true);
    expect(out.endsWith("}\n")).toBe(true);
  });

  it("round-trips exactly (parse(serialize(x)) === data)", () => {
    const rec = baseRecord();
    const parsed = JSON.parse(serializeItemFile(rec));
    delete parsed.schemaVersion;
    expect(deepEqual(orderRecord(parsed), rec)).toBe(true);
  });

  it("uses 2-space indentation", () => {
    const out = serializeItemFile(baseRecord());
    expect(out).toContain('\n  "id": "abc123"');
  });

  it("preserves key order = schemaVersion then COLUMN_ORDER", () => {
    const parsed = JSON.parse(serializeItemFile(baseRecord()));
    expect(Object.keys(parsed)).toEqual(["schemaVersion", ...COLUMN_ORDER]);
  });
});

describe("value preservation", () => {
  it("distinguishes null from empty string", () => {
    expect(valueHash(null)).not.toBe(valueHash(""));
    expect(deepEqual(null, "")).toBe(false);
  });

  it("distinguishes empty array from null and from false", () => {
    expect(deepEqual([], null)).toBe(false);
    expect(deepEqual([], false)).toBe(false);
    expect(valueHash([])).not.toBe(valueHash(null));
  });

  it("preserves array element order (does not sort)", () => {
    const a = serializeItemFile(baseRecord({ tags: ["z", "a", "m"] }));
    const parsed = JSON.parse(a);
    expect(parsed.tags).toEqual(["z", "a", "m"]);
  });

  it("preserves multiline HTML/CSS/JS verbatim including CRLF and whitespace", () => {
    const html = "<div>\r\n  <span> keep  spaces </span>\n</div>\n";
    const css = "  .a {\n    color: red;\n}\n\n";
    const js = "function f(){\n\treturn\t1;\n}";
    const rec = baseRecord({ html, css, js });
    const parsed = JSON.parse(serializeItemFile(rec));
    expect(parsed.html).toBe(html);
    expect(parsed.css).toBe(css);
    expect(parsed.js).toBe(js);
  });

  it("preserves unicode", () => {
    const title = "🌊 Underwater — Café — 日本語";
    const parsed = JSON.parse(serializeItemFile(baseRecord({ title })));
    expect(parsed.title).toBe(title);
  });

  it("preserves date-like strings unchanged", () => {
    const parsed = JSON.parse(serializeItemFile(baseRecord({ createdAt: "2025-03-06T19:54:35.002" })));
    expect(parsed.createdAt).toBe("2025-03-06T19:54:35.002");
  });
});

describe("hashing", () => {
  it("record hash ignores schemaVersion and pretty-printing", () => {
    const rec = baseRecord();
    const h1 = recordHash(rec);
    const withVersion = { schemaVersion: 1, ...rec };
    const h2 = recordHash(orderRecord(withVersion));
    expect(h1).toBe(h2);
  });

  it("record hash changes when a code field changes", () => {
    const a = recordHash(baseRecord({ html: "<a/>" }));
    const b = recordHash(baseRecord({ html: "<b/>" }));
    expect(a).not.toBe(b);
  });

  it("canonical string is deterministic across key insertion order", () => {
    const r1 = orderRecord({ id: "1", title: "t", description: "d", html: "h", css: "c", js: null, tags: [], mainCategory: [], secondaryCategory: [], deleted: false, createdAt: "x", updatedAt: "y", reviewed: false, slug: null, shortDescription: null });
    const r2 = orderRecord({ slug: null, reviewed: false, updatedAt: "y", createdAt: "x", deleted: false, secondaryCategory: [], mainCategory: [], tags: [], js: null, css: "c", html: "h", shortDescription: null, description: "d", title: "t", id: "1" });
    expect(canonicalRecordString(r1)).toBe(canonicalRecordString(r2));
  });
});

describe("deepEqual edge cases", () => {
  it("missing property differs from explicit null", () => {
    expect(deepEqual({ a: null }, {})).toBe(false);
    expect(deepEqual({}, { a: null })).toBe(false);
  });
  it("false differs from null and from empty string", () => {
    expect(deepEqual(false, null)).toBe(false);
    expect(deepEqual(false, "")).toBe(false);
  });
});
