import { describe, expect, it } from "vitest";
import {
  IMAGE_CONVERTER_PRESETS,
  buildOutputFilename,
  calculateDrawRect,
  calculateResizeDimensions,
} from "./utils";

describe("calculateResizeDimensions", () => {
  it("scales by percentage when no dimensions are set", () => {
    expect(calculateResizeDimensions({ originalWidth: 2000, originalHeight: 1000, keepAspectRatio: true, scalePercent: 50 })).toEqual({ width: 1000, height: 500 });
  });

  it("keeps aspect ratio from width", () => {
    expect(calculateResizeDimensions({ originalWidth: 1600, originalHeight: 900, width: 800, keepAspectRatio: true, scalePercent: 100 })).toEqual({ width: 800, height: 450 });
  });

  it("allows stretch dimensions when aspect ratio is unlocked", () => {
    expect(calculateResizeDimensions({ originalWidth: 1600, originalHeight: 900, width: 800, height: 800, keepAspectRatio: false, scalePercent: 100 })).toEqual({ width: 800, height: 800 });
  });
});

describe("calculateDrawRect", () => {
  it("contains inside the target box", () => {
    expect(calculateDrawRect({ sourceWidth: 1600, sourceHeight: 900, targetWidth: 1000, targetHeight: 1000, fitMode: "contain" })).toMatchObject({ dx: 0, dy: 218.75, dw: 1000, dh: 562.5 });
  });

  it("covers the target box", () => {
    expect(calculateDrawRect({ sourceWidth: 1600, sourceHeight: 900, targetWidth: 1000, targetHeight: 1000, fitMode: "cover" })).toMatchObject({ dx: -388.8888888888889, dy: 0, dw: 1777.7777777777778, dh: 1000 });
  });
});

describe("buildOutputFilename", () => {
  it("replaces the extension for explicit formats", () => {
    expect(buildOutputFilename("hero.photo.png", "image/webp", "image/png")).toBe("hero.photo.webp");
  });

  it("keeps original supported format", () => {
    expect(buildOutputFilename("photo.jpeg", "original", "image/jpeg")).toBe("photo.jpg");
  });
});

describe("IMAGE_CONVERTER_PRESETS", () => {
  it("includes requested preset configurations", () => {
    expect(IMAGE_CONVERTER_PRESETS.map((preset) => preset.id)).toEqual(
      expect.arrayContaining(["youtube-thumbnail", "instagram-square", "website-hero", "blog-image", "product-image", "profile-picture", "compress-website", "small-email"]),
    );
  });
});
