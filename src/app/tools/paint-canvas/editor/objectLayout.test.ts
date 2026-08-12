import { describe, expect, it } from "vitest";
import { alignmentDeltas, distributionDeltas, type BoundsRect } from "./objectLayout";

const rects: BoundsRect[] = [
  { left: 10, top: 20, width: 20, height: 10 },
  { left: 50, top: 50, width: 10, height: 20 },
  { left: 90, top: 80, width: 30, height: 10 },
];

describe("alignmentDeltas", () => {
  it("aligns bounding boxes to the selection left edge", () => {
    expect(alignmentDeltas(rects, "left")).toEqual([
      { x: 0, y: 0 },
      { x: -40, y: 0 },
      { x: -80, y: 0 },
    ]);
  });

  it("centers objects vertically inside the selection bounds", () => {
    expect(alignmentDeltas(rects, "center-y")).toEqual([
      { x: 0, y: 30 },
      { x: 0, y: -5 },
      { x: 0, y: -30 },
    ]);
  });
});

describe("distributionDeltas", () => {
  it("distributes three objects evenly across the horizontal span", () => {
    expect(distributionDeltas(rects, "horizontal")).toEqual([
      { x: 0, y: 0 },
      { x: 5, y: 0 },
      { x: 0, y: 0 },
    ]);
  });

  it("does nothing with fewer than three objects", () => {
    expect(distributionDeltas(rects.slice(0, 2), "vertical")).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 0 },
    ]);
  });
});
