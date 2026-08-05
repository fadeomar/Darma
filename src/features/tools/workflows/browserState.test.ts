import { describe, expect, it } from "vitest";
import { normalizeHexColor, readableTextColor } from "./browserState";

describe("workflow browser state helpers", () => {
  it("normalizes supported short and long hex values", () => {
    expect(normalizeHexColor("abc")).toBe("#AABBCC");
    expect(normalizeHexColor("#3b82f6")).toBe("#3B82F6");
    expect(normalizeHexColor("not-a-color")).toBeNull();
  });

  it("chooses a readable black or white foreground", () => {
    expect(readableTextColor("#FFFFFF")).toBe("#000000");
    expect(readableTextColor("#111827")).toBe("#ffffff");
  });
});
