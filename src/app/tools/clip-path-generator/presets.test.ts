import { describe, expect, it } from "vitest";
import { movePoint } from "./clipPath";
import { findMatchingPresetId, getPresetById, PRESET_MATCH_TOLERANCE } from "./presets";

describe("preset matching", () => {
  it("matches a known preset", () => {
    const hexagon = getPresetById("hexagon");
    expect(hexagon).toBeDefined();
    expect(findMatchingPresetId(hexagon!.points)).toBe("hexagon");
  });

  it("returns Custom semantics after a manual modification", () => {
    const triangle = getPresetById("triangle")!;
    const changed = movePoint(triangle.points, 0, { x: triangle.points[0].x + 1, y: triangle.points[0].y });
    expect(findMatchingPresetId(changed)).toBeNull();
  });

  it("matches within the coordinate tolerance but not beyond it", () => {
    const triangle = getPresetById("triangle")!;
    const within = triangle.points.map((point, index) =>
      index === 0 ? { x: point.x + PRESET_MATCH_TOLERANCE / 2, y: point.y } : { ...point },
    );
    const outside = triangle.points.map((point, index) =>
      index === 0 ? { x: point.x + PRESET_MATCH_TOLERANCE * 2, y: point.y } : { ...point },
    );
    expect(findMatchingPresetId(within)).toBe("triangle");
    expect(findMatchingPresetId(outside)).toBeNull();
  });
});
