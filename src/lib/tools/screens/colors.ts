export const COLOR_PRESETS = [
  { label: "White", value: "#ffffff" },
  { label: "Black", value: "#000000" },
  { label: "Red", value: "#ef4444" },
  { label: "Green", value: "#22c55e" },
  { label: "Blue", value: "#2563eb" },
  { label: "Yellow", value: "#facc15" },
  { label: "Pink", value: "#ec4899" },
  { label: "Purple", value: "#8b5cf6" },
  { label: "Orange", value: "#f97316" },
  { label: "Gray", value: "#64748b" },
  { label: "Warm Light", value: "#ffd7a8" },
  { label: "Soft Reading", value: "#fff3d6" },
];

export function normalizeHex(input: string, fallback = "#ffffff"): string {
  const value = input.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(value)) return value.toLowerCase();
  if (/^[0-9a-fA-F]{6}$/.test(value)) return `#${value.toLowerCase()}`;
  return fallback;
}

export function withBrightness(hex: string, brightness: number): string {
  const clean = normalizeHex(hex).replace("#", "");
  const factor = Math.max(10, Math.min(100, brightness)) / 100;
  const r = Math.round(parseInt(clean.slice(0, 2), 16) * factor);
  const g = Math.round(parseInt(clean.slice(2, 4), 16) * factor);
  const b = Math.round(parseInt(clean.slice(4, 6), 16) * factor);
  return `rgb(${r}, ${g}, ${b})`;
}
