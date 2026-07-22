import { describe, expect, it } from "vitest";

import {
  parseExplorerAdminContentSource,
  parseExplorerPublicContentSource,
} from "./explorerContentSource";

describe("Explorer content source configuration", () => {
  it("defaults empty public and admin sources to database", () => {
    expect(parseExplorerPublicContentSource(undefined)).toBe("database");
    expect(parseExplorerPublicContentSource(" ")).toBe("database");
    expect(parseExplorerAdminContentSource(undefined)).toBe("database");
    expect(parseExplorerAdminContentSource("")).toBe("database");
  });

  it("normalizes supported values", () => {
    expect(parseExplorerPublicContentSource(" JSON ")).toBe("json");
    expect(parseExplorerAdminContentSource(" GitHub ")).toBe("github");
  });

  it("rejects unsupported values", () => {
    expect(() => parseExplorerPublicContentSource("filesystem")).toThrow(
      "Unsupported EXPLORER_CONTENT_SOURCE: filesystem",
    );
    expect(() => parseExplorerAdminContentSource("json")).toThrow(
      "Unsupported EXPLORER_ADMIN_CONTENT_SOURCE: json",
    );
  });
});
