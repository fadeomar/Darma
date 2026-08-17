import { describe, expect, it } from "vitest";
import {
  detectTrackKind,
  expandFixedTrackTemplate,
  resizeTrackTemplate,
  splitGridTrackList,
  updateTrackAt,
} from "./tracks";

describe("grid track utilities", () => {
  it("splits tracks without breaking function arguments", () => {
    expect(splitGridTrackList("240px minmax(0, 1fr) 2fr")).toEqual([
      "240px",
      "minmax(0, 1fr)",
      "2fr",
    ]);
  });

  it("expands numeric repeat templates for visual editing", () => {
    expect(
      expandFixedTrackTemplate("repeat(3, minmax(0, 1fr))", 3, "1fr"),
    ).toEqual({
      tracks: ["minmax(0, 1fr)", "minmax(0, 1fr)", "minmax(0, 1fr)"],
      editable: true,
    });
  });

  it("keeps auto-fit templates in raw mode", () => {
    const result = expandFixedTrackTemplate(
      "repeat(auto-fit, minmax(220px, 1fr))",
      4,
      "1fr",
    );
    expect(result.editable).toBe(false);
    expect(result.reason).toContain("Dynamic repeat");
  });

  it("preserves explicit tracks when changing the track count", () => {
    expect(
      resizeTrackTemplate({
        template: "240px 1fr 2fr",
        currentCount: 3,
        nextCount: 4,
        fallback: "1fr",
      }),
    ).toBe("240px 1fr 2fr 1fr");
  });

  it("supports taller responsive row editors without raising the column cap", () => {
    expect(
      resizeTrackTemplate({
        template: "repeat(12, 1fr)",
        currentCount: 12,
        nextCount: 18,
        fallback: "1fr",
        maxCount: 24,
      }).split(" ").length,
    ).toBe(18);
  });

  it("updates a single explicit track", () => {
    expect(updateTrackAt("1fr 1fr 1fr", 3, 1, "240px", "1fr")).toBe(
      "1fr 240px 1fr",
    );
  });

  it("detects common track types", () => {
    expect(detectTrackKind("2fr")).toBe("fr");
    expect(detectTrackKind("240px")).toBe("px");
    expect(detectTrackKind("minmax(0, 1fr)")).toBe("minmax");
    expect(detectTrackKind("fit-content(20rem)")).toBe("fit-content");
  });
});
