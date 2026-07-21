import { describe, expect, it } from "vitest";
import { SAMPLE_BACKGROUNDS } from "./sampleImages";

describe("SAMPLE_BACKGROUNDS", () => {
  it("ships a handful of pickable backgrounds", () => {
    expect(SAMPLE_BACKGROUNDS.length).toBeGreaterThanOrEqual(4);
    expect(SAMPLE_BACKGROUNDS.length).toBeLessThanOrEqual(6);
  });

  it("uses unique ids and labels", () => {
    const ids = new Set(SAMPLE_BACKGROUNDS.map((s) => s.id));
    const labels = new Set(SAMPLE_BACKGROUNDS.map((s) => s.label));
    expect(ids.size).toBe(SAMPLE_BACKGROUNDS.length);
    expect(labels.size).toBe(SAMPLE_BACKGROUNDS.length);
  });

  it("exposes self-contained, decodable SVG data URIs", () => {
    for (const sample of SAMPLE_BACKGROUNDS) {
      expect(sample.dataUri.startsWith("data:image/svg+xml,")).toBe(true);
      // Must be percent-encoded (no raw angle brackets that break url()/img src).
      expect(sample.dataUri).not.toMatch(/[<>]/);
      // The encoded payload should round-trip back to real SVG markup.
      const decoded = decodeURIComponent(sample.dataUri.replace("data:image/svg+xml,", ""));
      expect(decoded).toContain("<svg");
      expect(decoded).toContain("</svg>");
    }
  });

  it("stays within the preview pixel budget", () => {
    for (const sample of SAMPLE_BACKGROUNDS) {
      expect(sample.width).toBeGreaterThan(0);
      expect(sample.height).toBeGreaterThan(0);
      expect(sample.width * sample.height).toBeLessThan(40_000_000);
    }
  });
});
