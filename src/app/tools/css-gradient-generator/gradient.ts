export type GradientType = "linear" | "radial";

export type GradientStop = {
  id: string;
  color: string;
  position: number;
};

export type GradientState = {
  type: GradientType;
  angle: number;
  shape: "circle" | "ellipse";
  stops: GradientStop[];
};

export type GradientValidation = {
  ok: boolean;
  errors: string[];
};

export type GradientPreset = {
  label: string;
  state: GradientState;
};

const HEX_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function normalizeHexColor(value: string) {
  const trimmed = value.trim();
  if (!HEX_COLOR_PATTERN.test(trimmed)) return value;

  const raw = trimmed.replace("#", "");
  if (raw.length === 3) {
    return `#${raw
      .split("")
      .map((char) => char + char)
      .join("")}`.toLowerCase();
  }

  return `#${raw}`.toLowerCase();
}

export function validateGradient(state: GradientState): GradientValidation {
  const errors: string[] = [];

  if (state.stops.length < 2) {
    errors.push("Add at least two color stops to create a gradient.");
  }

  state.stops.forEach((stop, index) => {
    if (!HEX_COLOR_PATTERN.test(stop.color.trim())) {
      errors.push(`Color stop ${index + 1} needs a valid HEX color like #3b82f6.`);
    }

    if (!Number.isFinite(stop.position) || stop.position < 0 || stop.position > 100) {
      errors.push(`Color stop ${index + 1} position must be between 0 and 100.`);
    }
  });

  if (state.type === "linear" && (!Number.isFinite(state.angle) || state.angle < 0 || state.angle > 360)) {
    errors.push("Linear gradient angle must be between 0 and 360 degrees.");
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

export function sortStops(stops: GradientStop[]) {
  return [...stops].sort((a, b) => a.position - b.position);
}

export function buildGradientCss(state: GradientState) {
  const stops = sortStops(state.stops)
    .map((stop) => `${normalizeHexColor(stop.color)} ${clamp(stop.position, 0, 100)}%`)
    .join(", ");

  if (state.type === "radial") {
    return `radial-gradient(${state.shape} at center, ${stops})`;
  }

  return `linear-gradient(${clamp(Math.round(state.angle), 0, 360)}deg, ${stops})`;
}

export function buildCssSnippet(state: GradientState) {
  const gradient = buildGradientCss(state);
  return `.gradient-background {\n  background: ${gradient};\n}`;
}

export function buildTailwindArbitraryClass(state: GradientState) {
  const gradient = buildGradientCss(state)
    .replace(/ /g, "_")
    .replace(/,/g, ",");

  return `bg-[${gradient}]`;
}

export function reverseStops(stops: GradientStop[]) {
  return stops.map((stop) => ({
    ...stop,
    position: 100 - stop.position,
  }));
}

export function createStop(color = "#ffffff", position = 50): GradientStop {
  return {
    id: `stop-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    color,
    position: clamp(Math.round(position), 0, 100),
  };
}

export const DEFAULT_GRADIENT: GradientState = {
  type: "linear",
  angle: 135,
  shape: "circle",
  stops: [
    { id: "default-1", color: "#3b82f6", position: 0 },
    { id: "default-2", color: "#8b5cf6", position: 50 },
    { id: "default-3", color: "#ec4899", position: 100 },
  ],
};

export const GRADIENT_PRESETS: GradientPreset[] = [
  {
    label: "Darma glow",
    state: DEFAULT_GRADIENT,
  },
  {
    label: "Ocean",
    state: {
      type: "linear",
      angle: 120,
      shape: "circle",
      stops: [
        { id: "ocean-1", color: "#06b6d4", position: 0 },
        { id: "ocean-2", color: "#2563eb", position: 100 },
      ],
    },
  },
  {
    label: "Sunset",
    state: {
      type: "linear",
      angle: 45,
      shape: "circle",
      stops: [
        { id: "sunset-1", color: "#f97316", position: 0 },
        { id: "sunset-2", color: "#ef4444", position: 50 },
        { id: "sunset-3", color: "#7c3aed", position: 100 },
      ],
    },
  },
  {
    label: "Mint",
    state: {
      type: "linear",
      angle: 160,
      shape: "circle",
      stops: [
        { id: "mint-1", color: "#d9f99d", position: 0 },
        { id: "mint-2", color: "#22c55e", position: 100 },
      ],
    },
  },
  {
    label: "Radial pulse",
    state: {
      type: "radial",
      angle: 90,
      shape: "circle",
      stops: [
        { id: "radial-1", color: "#fdf2f8", position: 0 },
        { id: "radial-2", color: "#ec4899", position: 55 },
        { id: "radial-3", color: "#4c1d95", position: 100 },
      ],
    },
  },
  {
    label: "Dark UI",
    state: {
      type: "linear",
      angle: 135,
      shape: "ellipse",
      stops: [
        { id: "dark-1", color: "#020617", position: 0 },
        { id: "dark-2", color: "#1e293b", position: 55 },
        { id: "dark-3", color: "#334155", position: 100 },
      ],
    },
  },
];

const RANDOM_COLORS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#d946ef",
  "#ec4899",
  "#f43f5e",
  "#0f172a",
];

function randomItem<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

export function createRandomGradient(): GradientState {
  const first = randomItem(RANDOM_COLORS);
  let second = randomItem(RANDOM_COLORS);
  while (second === first) second = randomItem(RANDOM_COLORS);

  const useThird = Math.random() > 0.45;
  let third = randomItem(RANDOM_COLORS);
  while (third === first || third === second) third = randomItem(RANDOM_COLORS);

  return {
    type: Math.random() > 0.25 ? "linear" : "radial",
    angle: Math.round(Math.random() * 360),
    shape: Math.random() > 0.5 ? "circle" : "ellipse",
    stops: useThird
      ? [
          createStop(first, 0),
          createStop(second, 50),
          createStop(third, 100),
        ]
      : [createStop(first, 0), createStop(second, 100)],
  };
}
