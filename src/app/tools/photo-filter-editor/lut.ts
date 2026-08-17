import type { LutDefinition } from "./types";

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

export function parseCubeLut(source: string, fallbackTitle = "Imported LUT"): LutDefinition {
  let title = fallbackTitle;
  let size = 0;
  let domainMin: [number, number, number] = [0, 0, 0];
  let domainMax: [number, number, number] = [1, 1, 1];
  const entries: number[] = [];

  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const titleMatch = line.match(/^TITLE\s+"(.*)"$/i);
    if (titleMatch) {
      title = titleMatch[1] || fallbackTitle;
      continue;
    }
    const sizeMatch = line.match(/^LUT_3D_SIZE\s+(\d+)$/i);
    if (sizeMatch) {
      size = Number(sizeMatch[1]);
      continue;
    }
    const domainMinMatch = line.match(/^DOMAIN_MIN\s+([\d+\-.eE]+)\s+([\d+\-.eE]+)\s+([\d+\-.eE]+)$/i);
    if (domainMinMatch) {
      domainMin = [Number(domainMinMatch[1]), Number(domainMinMatch[2]), Number(domainMinMatch[3])];
      continue;
    }
    const domainMaxMatch = line.match(/^DOMAIN_MAX\s+([\d+\-.eE]+)\s+([\d+\-.eE]+)\s+([\d+\-.eE]+)$/i);
    if (domainMaxMatch) {
      domainMax = [Number(domainMaxMatch[1]), Number(domainMaxMatch[2]), Number(domainMaxMatch[3])];
      continue;
    }

    const parts = line.split(/\s+/).map(Number);
    if (parts.length >= 3 && parts.slice(0, 3).every(Number.isFinite)) {
      entries.push(parts[0], parts[1], parts[2]);
    }
  }

  if (!Number.isInteger(size) || size < 2 || size > 128) {
    throw new Error("This .cube file does not contain a supported LUT_3D_SIZE (2–128). ");
  }
  const expectedValues = size * size * size * 3;
  if (entries.length < expectedValues) {
    throw new Error(`Incomplete 3D LUT: expected ${size ** 3} color entries, found ${Math.floor(entries.length / 3)}.`);
  }

  return {
    title,
    size,
    domainMin,
    domainMax,
    data: new Float32Array(entries.slice(0, expectedValues)),
  };
}

function readColor(lut: LutDefinition, r: number, g: number, b: number) {
  // IRIDAS .cube convention: red changes fastest, then green, then blue.
  const index = (r + g * lut.size + b * lut.size * lut.size) * 3;
  return [lut.data[index], lut.data[index + 1], lut.data[index + 2]] as const;
}

export function sampleCubeLut(lut: LutDefinition, red: number, green: number, blue: number) {
  const inputs = [red, green, blue] as const;
  const normalized = inputs.map((value, channel) => {
    const min = lut.domainMin[channel];
    const max = lut.domainMax[channel];
    const span = max - min || 1;
    return clamp01((value - min) / span) * (lut.size - 1);
  });

  const r0 = Math.floor(normalized[0]);
  const g0 = Math.floor(normalized[1]);
  const b0 = Math.floor(normalized[2]);
  const r1 = Math.min(lut.size - 1, r0 + 1);
  const g1 = Math.min(lut.size - 1, g0 + 1);
  const b1 = Math.min(lut.size - 1, b0 + 1);
  const tr = normalized[0] - r0;
  const tg = normalized[1] - g0;
  const tb = normalized[2] - b0;

  const c000 = readColor(lut, r0, g0, b0);
  const c100 = readColor(lut, r1, g0, b0);
  const c010 = readColor(lut, r0, g1, b0);
  const c110 = readColor(lut, r1, g1, b0);
  const c001 = readColor(lut, r0, g0, b1);
  const c101 = readColor(lut, r1, g0, b1);
  const c011 = readColor(lut, r0, g1, b1);
  const c111 = readColor(lut, r1, g1, b1);

  const out: [number, number, number] = [0, 0, 0];
  for (let channel = 0; channel < 3; channel += 1) {
    const c00 = c000[channel] * (1 - tr) + c100[channel] * tr;
    const c10 = c010[channel] * (1 - tr) + c110[channel] * tr;
    const c01 = c001[channel] * (1 - tr) + c101[channel] * tr;
    const c11 = c011[channel] * (1 - tr) + c111[channel] * tr;
    const c0 = c00 * (1 - tg) + c10 * tg;
    const c1 = c01 * (1 - tg) + c11 * tg;
    out[channel] = c0 * (1 - tb) + c1 * tb;
  }
  return out;
}
