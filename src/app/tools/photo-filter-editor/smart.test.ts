import { describe, expect, it } from "vitest";
import { createBackgroundMask, createDefaultSmartState } from "./smart";

describe("photo filter smart tools", () => {
  it("starts with smart edits disabled", () => {
    const state = createDefaultSmartState();
    expect(state.backgroundEnabled).toBe(false);
    expect(state.backgroundFill).toBe("transparent");
    expect(state.healStrokes).toEqual([]);
  });

  it("normalizes one-channel model output into an alpha mask", () => {
    const mask = createBackgroundMask(2, 2, new Uint8Array([0, 64, 128, 255]));
    expect(mask.width).toBe(2);
    expect(Array.from(mask.alpha)).toEqual([0, 64, 128, 255]);
  });

  it("uses the alpha channel when model output is RGBA-like", () => {
    const mask = createBackgroundMask(1, 2, new Uint8Array([1, 2, 3, 9, 4, 5, 6, 240]));
    expect(Array.from(mask.alpha)).toEqual([9, 240]);
  });
});
