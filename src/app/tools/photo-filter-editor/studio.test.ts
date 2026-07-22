import { describe, expect, it } from "vitest";
import { createDefaultFilterState } from "./lib/adjustments";
import {
  FULL_CROP,
  clampCrop,
  createCenteredAspectCrop,
  cropToPixels,
  fitAspectCrop,
  getCropAspectRatio,
  remapCropForRotate,
  updateCropFromHandle,
} from "./lib/crop";
import { calculatePreviewDimensions } from "./lib/imageSafety";
import { createExportPlan } from "./lib/exporters";
import { createDefaultEditState, createDefaultPreviewSettings, createPhotoProject, parseProjectJson, projectContainsImageData, serializeProject } from "./lib/project";
import { applyRasterAdjustments, calculateRenderGeometry } from "./lib/renderPipeline";
import { MAX_OUTPUT_EDGE, applyPixelBudget, calculateOutputDimensions, createDefaultExportSettings, setLockedHeight, setLockedWidth } from "./lib/resize";
import { MAX_CUSTOM_PRESETS, MAX_STORAGE_CHARS, createCustomPreset, deleteCustomPreset, parseCustomPresetStore, renameCustomPreset, serializeCustomPresetStore } from "./lib/storage";
import { flipEditState, remapCropBetweenOrientations, resetTransform, rotateEditState } from "./lib/transforms";
import { commitPhotoHistory, PHOTO_HISTORY_LIMIT, photoStateEqual, pushHistoryEntry } from "./lib/history";
import { MAX_PHOTO_ZOOM, MIN_PHOTO_ZOOM, clampZoom, scalePanForZoom } from "./lib/viewport";

describe("crop helpers", () => {
  it("clamps crops and enforces minimum size", () => {
    expect(clampCrop({ x: -2, y: 4, width: 0, height: 5 })).toEqual({ x: 0, y: 0, width: 0.04, height: 1 });
  });

  it("fits fixed and free aspect crops", () => {
    expect(fitAspectCrop({ ...FULL_CROP }, null)).toEqual(FULL_CROP);
    const square = createCenteredAspectCrop(1);
    expect(square.width / square.height).toBeCloseTo(1);
  });

  it("converts physical crop ratios into normalized ratios", () => {
    expect(getCropAspectRatio("1:1", 1600, 900)).toBeCloseTo(9 / 16);
    expect(getCropAspectRatio("original", 1600, 900)).toBeCloseTo(1);
    expect(getCropAspectRatio("free", 1600, 900)).toBeNull();
  });

  it("resizes and moves a crop without leaving bounds", () => {
    const start = { x: 0.2, y: 0.2, width: 0.5, height: 0.5 };
    expect(updateCropFromHandle(start, "move", 0.8, 0.8, null).x).toBeCloseTo(0.5);
    expect(updateCropFromHandle(start, "se", 0.2, 0.2, 1).width).toBeCloseTo(updateCropFromHandle(start, "se", 0.2, 0.2, 1).height);
  });

  it("maps crop coordinates after rotation", () => {
    const crop = { x: 0.1, y: 0.2, width: 0.3, height: 0.4 };
    expect(remapCropForRotate(crop, 1)).toEqual({ x: 0.4, y: 0.1, width: 0.4, height: 0.3 });
    expect(cropToPixels(crop, 1000, 500)).toEqual({ x: 100, y: 100, width: 300, height: 200 });
  });
});

describe("transform helpers", () => {
  it("keeps crop reversible through rotate and reset", () => {
    const state = { ...createDefaultEditState(), crop: { x: 0.1, y: 0.2, width: 0.4, height: 0.5 } };
    const rotated = rotateEditState(state, 1);
    const restored = resetTransform(rotated);
    expect(restored.crop.x).toBeCloseTo(state.crop.x);
    expect(restored.crop.y).toBeCloseTo(state.crop.y);
  });

  it("remaps crop when flipping", () => {
    const state = { ...createDefaultEditState(), crop: { x: 0.1, y: 0.2, width: 0.4, height: 0.5 } };
    expect(flipEditState(state, "horizontal").crop.x).toBeCloseTo(0.5);
  });

  it("keeps crop reversible through combined flips and rotations", () => {
    const state = { ...createDefaultEditState(), crop: { x: 0.12, y: 0.23, width: 0.34, height: 0.41 } };
    const flipped = flipEditState(state, "horizontal");
    const rotated = rotateEditState(flipped, 1);
    const restored = resetTransform(rotated);
    expect(restored.crop.x).toBeCloseTo(state.crop.x);
    expect(restored.crop.y).toBeCloseTo(state.crop.y);
    expect(restored.crop.width).toBeCloseTo(state.crop.width);
    expect(restored.crop.height).toBeCloseTo(state.crop.height);
  });

  it("maps a crop directly between arbitrary orientations", () => {
    const crop = { x: 0.1, y: 0.2, width: 0.3, height: 0.4 };
    const from = { rotate: 90 as const, flipH: true, flipV: false };
    const to = { rotate: 270 as const, flipH: false, flipV: true };
    const mapped = remapCropBetweenOrientations(crop, from, to);
    const restored = remapCropBetweenOrientations(mapped, to, from);
    expect(restored.x).toBeCloseTo(crop.x);
    expect(restored.y).toBeCloseTo(crop.y);
    expect(restored.width).toBeCloseTo(crop.width);
    expect(restored.height).toBeCloseTo(crop.height);
  });
});

describe("resize and render calculations", () => {
  it("keeps locked aspect ratio", () => {
    expect(setLockedWidth(1080, 4 / 5)).toEqual({ width: 1080, height: 1350 });
  });

  it("does not upscale by default", () => {
    const result = calculateOutputDimensions(800, 600, { ...createDefaultExportSettings(), resizeMode: "custom", width: 1600, height: 1200 });
    expect(result.width).toBe(800);
    expect(result.height).toBe(600);
    expect(result.wasDownscaled).toBe(true);
  });

  it("enforces edge and pixel budgets without changing aspect ratio", () => {
    const result = applyPixelBudget(48000, 4000, 24_000_000);
    expect(result.width * result.height).toBeLessThanOrEqual(24_000_000);
    expect(result.width).toBeLessThanOrEqual(MAX_OUTPUT_EDGE);
    expect(result.width / result.height).toBeCloseTo(12, 1);
    expect(result.downscaled).toBe(true);
  });

  it("keeps extreme locked dimensions proportional", () => {
    const fromWidth = setLockedWidth(12000, 0.5);
    const fromHeight = setLockedHeight(12000, 2);
    expect(fromWidth.width / fromWidth.height).toBeCloseTo(0.5, 2);
    expect(fromHeight.width / fromHeight.height).toBeCloseTo(2, 2);
    expect(Math.max(fromWidth.width, fromWidth.height, fromHeight.width, fromHeight.height)).toBeLessThanOrEqual(MAX_OUTPUT_EDGE);
  });


  it("creates format-safe export plans from transformed crop dimensions", () => {
    const photo = { info: { width: 1200, height: 800 }, } as never;
    const edit = { ...createDefaultEditState(), orientation: { rotate: 90 as const, flipH: false, flipV: false }, crop: { x: 0, y: 0, width: 0.5, height: 0.5 } };
    const plan = createExportPlan(photo, edit, { ...createDefaultExportSettings(), format: "jpeg", filename: " My photo.png " });
    expect(plan.cropPixels).toEqual({ x: 0, y: 0, width: 400, height: 600 });
    expect(plan.filename).toBe("My-photo.jpg");
    expect(plan.backgroundColor).toBe("#ffffff");
  });

  it("uses matching preview and export geometry", () => {
    const geometry = calculateRenderGeometry(1200, 800, { rotate: 90, flipH: false, flipV: false }, { x: 0.1, y: 0.2, width: 0.5, height: 0.5 }, 600, 400);
    expect(geometry.orientedWidth).toBe(800);
    expect(geometry.orientedHeight).toBe(1200);
    expect(geometry.scaleX).toBeCloseTo(1.5);
  });

  it("applies raster exposure and temperature to pixel data", () => {
    const data = new Uint8ClampedArray([100, 100, 100, 255]);
    const imageData = { data } as ImageData;
    applyRasterAdjustments(imageData, { ...createDefaultFilterState(), exposure: 1, temperature: 50 });
    expect(data[0]).toBeGreaterThan(data[2]);
    expect(data[0]).toBeGreaterThan(180);
    expect(data[3]).toBe(255);
  });

  it("creates a safe working preview", () => {
    const result = calculatePreviewDimensions(6000, 4000, 4_000_000);
    expect(result.width * result.height).toBeLessThanOrEqual(4_000_000);
    expect(result.scaled).toBe(true);
  });
});

describe("project files", () => {
  it("round trips safe settings without image data", () => {
    const project = createPhotoProject("Test", createDefaultEditState(), createDefaultExportSettings(), createDefaultPreviewSettings());
    const serialized = serializeProject(project);
    const parsed = parseProjectJson(serialized);
    expect(parsed.ok).toBe(true);
    expect(projectContainsImageData(serialized)).toBe(false);
  });

  it("rejects wrong kind, unsupported version, invalid crop, malformed and embedded image data", () => {
    expect(parseProjectJson("{").ok).toBe(false);
    expect(parseProjectJson(JSON.stringify({ kind: "wrong", version: 1 })).ok).toBe(false);
    expect(parseProjectJson(JSON.stringify({ kind: "darma.photo-filter-project", version: 2 })).ok).toBe(false);
    const project = createPhotoProject("Test", createDefaultEditState(), createDefaultExportSettings(), createDefaultPreviewSettings());
    const invalid = { ...project, edit: { ...project.edit, crop: { x: -1, y: 0, width: 1, height: 1 } } };
    expect(parseProjectJson(JSON.stringify(invalid)).ok).toBe(false);
    expect(projectContainsImageData('{"imageData":"data:image/png;base64,x"}')).toBe(true);
    expect(parseProjectJson("x".repeat(100_001)).ok).toBe(false);
  });
});

describe("custom preset storage", () => {
  it("parses valid data and handles malformed storage", () => {
    const preset = createCustomPreset("  My preset  ", createDefaultFilterState(), "2026-07-21T00:00:00.000Z");
    const serialized = serializeCustomPresetStore([preset]);
    expect(parseCustomPresetStore(serialized).items[0].name).toBe("My preset");
    expect(parseCustomPresetStore("not json").items).toEqual([]);
  });

  it("renames and deletes a preset safely", () => {
    const preset = createCustomPreset("Old", createDefaultFilterState(), "2026-07-21T00:00:00.000Z");
    expect(renameCustomPreset([preset], preset.id, "New")[0].name).toBe("New");
    expect(deleteCustomPreset([preset], preset.id)).toEqual([]);
  });

  it("enforces storage item and payload limits", () => {
    const items = Array.from({ length: MAX_CUSTOM_PRESETS + 5 }, (_, index) => ({ ...createCustomPreset(`Preset ${index}`, createDefaultFilterState()), id: `preset-${index}` }));
    expect(parseCustomPresetStore(serializeCustomPresetStore(items)).items).toHaveLength(MAX_CUSTOM_PRESETS);
    expect(parseCustomPresetStore("x".repeat(MAX_STORAGE_CHARS + 1)).items).toEqual([]);
  });
});

describe("history helpers", () => {
  it("detects no-op transactions and clears redo on edits", () => {
    const state = createDefaultEditState();
    expect(commitPhotoHistory([], [state], state, state).changed).toBe(false);
    const changed = { ...state, adjustments: { ...state.adjustments, exposure: 1 } };
    const result = commitPhotoHistory([], [state], state, changed);
    expect(result.changed).toBe(true);
    expect(result.future).toEqual([]);
  });

  it("bounds history and compares edit states", () => {
    let history: ReturnType<typeof createDefaultEditState>[] = [];
    for (let index = 0; index < PHOTO_HISTORY_LIMIT + 5; index += 1) history = pushHistoryEntry(history, createDefaultEditState());
    expect(history).toHaveLength(PHOTO_HISTORY_LIMIT);
    expect(photoStateEqual(history[0], createDefaultEditState())).toBe(true);
  });
});


describe("viewport helpers", () => {
  it("clamps zoom and scales pan around the same view", () => {
    expect(clampZoom(99)).toBe(MAX_PHOTO_ZOOM);
    expect(clampZoom(0)).toBe(MIN_PHOTO_ZOOM);
    expect(scalePanForZoom({ x: 40, y: -20 }, 2, 1.5)).toEqual({ x: 30, y: -15 });
  });
});
