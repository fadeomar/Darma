import type { BackgroundMask, HealStroke, SmartEditState } from "./types";

export const BACKGROUND_MODEL_ID = "onnx-community/BiRefNet_lite-ONNX";

export function createDefaultSmartState(): SmartEditState {
  return {
    backgroundEnabled: false,
    backgroundFill: "transparent",
    backgroundColor: "#ffffff",
    maskFeather: 1.5,
    healStrokes: [],
  };
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const clampByte = (value: number) => Math.max(0, Math.min(255, Math.round(value)));

export function createBackgroundMask(width: number, height: number, source: ArrayLike<number>): BackgroundMask {
  const pixelCount = Math.max(1, width * height);
  const channels = Math.max(1, Math.round(source.length / pixelCount));
  const alpha = new Uint8ClampedArray(pixelCount);
  for (let index = 0; index < pixelCount; index += 1) {
    const offset = index * channels;
    // BiRefNet's mask is one channel. The fallback makes this helper robust to
    // RGBA-like RawImage outputs from future compatible model revisions.
    const value = channels >= 4 ? source[offset + 3] : source[offset];
    alpha[index] = clampByte(Number(value ?? 0));
  }
  return { width, height, alpha };
}

export function backgroundModelBackend(): "webgpu" | "wasm" {
  if (typeof navigator === "undefined") return "wasm";
  const browserNavigator = navigator as Navigator & { gpu?: unknown };
  return browserNavigator.gpu ? "webgpu" : "wasm";
}

/**
 * Small-object cleanup that stays deterministic and local. For each brush
 * stamp we pick the neighboring patch whose boundary best matches the target
 * boundary, then feather that patch into the selected circle. This is not
 * generative fill; it is intentionally optimized for dust, blemishes and
 * small distractions.
 */
export function applySpotHealToImageData(imageData: ImageData, strokes: HealStroke[]) {
  if (!strokes.length) return imageData;
  const { width, height } = imageData;
  const output = new Uint8ClampedArray(imageData.data);
  const minEdge = Math.max(1, Math.min(width, height));

  const pixelAt = (data: Uint8ClampedArray, x: number, y: number) => {
    const safeX = Math.max(0, Math.min(width - 1, Math.round(x)));
    const safeY = Math.max(0, Math.min(height - 1, Math.round(y)));
    const offset = (safeY * width + safeX) * 4;
    return [data[offset], data[offset + 1], data[offset + 2], data[offset + 3]] as const;
  };

  for (const stroke of strokes) {
    const source = new Uint8ClampedArray(output);
    const cx = clamp01(stroke.x) * (width - 1);
    const cy = clamp01(stroke.y) * (height - 1);
    const radius = Math.max(2, Math.min(minEdge * 0.18, clamp01(stroke.radius) * minEdge));
    const sampleDistance = radius * 2.15;
    const candidates = [
      [sampleDistance, 0], [-sampleDistance, 0], [0, sampleDistance], [0, -sampleDistance],
      [sampleDistance * 0.72, sampleDistance * 0.72], [-sampleDistance * 0.72, sampleDistance * 0.72],
      [sampleDistance * 0.72, -sampleDistance * 0.72], [-sampleDistance * 0.72, -sampleDistance * 0.72],
    ];

    let best: [number, number] | null = null;
    let bestScore = Number.POSITIVE_INFINITY;
    for (const [dx, dy] of candidates) {
      const sx = cx + dx;
      const sy = cy + dy;
      if (sx - radius < 0 || sy - radius < 0 || sx + radius >= width || sy + radius >= height) continue;
      let score = 0;
      let samples = 0;
      for (let index = 0; index < 16; index += 1) {
        const angle = (index / 16) * Math.PI * 2;
        const ring = radius * 1.03;
        const tx = cx + Math.cos(angle) * ring;
        const ty = cy + Math.sin(angle) * ring;
        const px = sx + Math.cos(angle) * ring;
        const py = sy + Math.sin(angle) * ring;
        const target = pixelAt(source, tx, ty);
        const patch = pixelAt(source, px, py);
        score += Math.abs(target[0] - patch[0]) + Math.abs(target[1] - patch[1]) + Math.abs(target[2] - patch[2]);
        samples += 1;
      }
      score /= Math.max(1, samples);
      if (score < bestScore) {
        bestScore = score;
        best = [dx, dy];
      }
    }
    if (!best) continue;

    const [bestDx, bestDy] = best;
    const x0 = Math.max(0, Math.floor(cx - radius));
    const x1 = Math.min(width - 1, Math.ceil(cx + radius));
    const y0 = Math.max(0, Math.floor(cy - radius));
    const y1 = Math.min(height - 1, Math.ceil(cy + radius));
    for (let y = y0; y <= y1; y += 1) {
      for (let x = x0; x <= x1; x += 1) {
        const distance = Math.hypot(x - cx, y - cy);
        if (distance > radius) continue;
        const edge = clamp01((radius - distance) / Math.max(1, radius * 0.28));
        const blend = edge * edge * (3 - 2 * edge);
        const patch = pixelAt(source, x + bestDx, y + bestDy);
        const offset = (y * width + x) * 4;
        output[offset] = clampByte(source[offset] * (1 - blend) + patch[0] * blend);
        output[offset + 1] = clampByte(source[offset + 1] * (1 - blend) + patch[1] * blend);
        output[offset + 2] = clampByte(source[offset + 2] * (1 - blend) + patch[2] * blend);
        output[offset + 3] = clampByte(source[offset + 3] * (1 - blend) + patch[3] * blend);
      }
    }
  }

  return new ImageData(output, width, height);
}
