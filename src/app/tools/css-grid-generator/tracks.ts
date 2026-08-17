export type TrackAxis = "columns" | "rows";

export type EditableTrackTemplate = {
  tracks: string[];
  editable: boolean;
  reason?: string;
};

const NUMERIC_REPEAT = /^repeat\(\s*(\d+)\s*,([\s\S]+)\)$/i;
const DYNAMIC_REPEAT = /repeat\(\s*(auto-fit|auto-fill)\s*,/i;

export function splitGridTrackList(template: string): string[] {
  const value = template.trim();
  if (!value) return [];

  const tokens: string[] = [];
  let current = "";
  let parentheses = 0;
  let brackets = 0;
  let quote: "\"" | "'" | null = null;

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];

    if (quote) {
      current += char;
      if (char === quote && value[index - 1] !== "\\") quote = null;
      continue;
    }

    if (char === "\"" || char === "'") {
      quote = char;
      current += char;
      continue;
    }

    if (char === "(") parentheses += 1;
    else if (char === ")") parentheses = Math.max(0, parentheses - 1);
    else if (char === "[") brackets += 1;
    else if (char === "]") brackets = Math.max(0, brackets - 1);

    if (/\s/.test(char) && parentheses === 0 && brackets === 0) {
      if (current.trim()) tokens.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  if (current.trim()) tokens.push(current.trim());
  return tokens;
}

export function expandFixedTrackTemplate(
  template: string,
  expectedCount: number,
  fallback: string,
): EditableTrackTemplate {
  const trimmed = template.trim();
  if (!trimmed) {
    return {
      tracks: Array.from({ length: expectedCount }, () => fallback),
      editable: true,
    };
  }

  if (DYNAMIC_REPEAT.test(trimmed)) {
    return {
      tracks: [trimmed],
      editable: false,
      reason: "Dynamic repeat() decides its track count from the available width.",
    };
  }

  const expanded: string[] = [];
  for (const token of splitGridTrackList(trimmed)) {
    const repeat = token.match(NUMERIC_REPEAT);
    if (!repeat) {
      expanded.push(token);
      continue;
    }

    const repeatCount = Math.max(0, Number.parseInt(repeat[1], 10));
    const innerTracks = splitGridTrackList(repeat[2]);
    if (!repeatCount || !innerTracks.length) {
      return {
        tracks: [trimmed],
        editable: false,
        reason: "This repeat() expression cannot be expanded safely.",
      };
    }

    for (let index = 0; index < repeatCount; index += 1) {
      expanded.push(...innerTracks);
    }
  }

  if (expanded.length !== expectedCount) {
    return {
      tracks: expanded.length ? expanded : [trimmed],
      editable: false,
      reason: `The template resolves to ${expanded.length} track${expanded.length === 1 ? "" : "s"}, but the visual grid is configured for ${expectedCount}.`,
    };
  }

  return { tracks: expanded, editable: true };
}

export function serializeTracks(tracks: string[]): string {
  return tracks.map((track) => track.trim()).filter(Boolean).join(" ");
}

export function resizeTrackTemplate({
  template,
  currentCount,
  nextCount,
  fallback,
  maxCount = 12,
}: {
  template: string;
  currentCount: number;
  nextCount: number;
  fallback: string;
  maxCount?: number;
}): string {
  const safeCount = Math.max(1, Math.min(maxCount, Math.round(nextCount)));
  const parsed = expandFixedTrackTemplate(template, currentCount, fallback);

  if (!parsed.editable) {
    return `repeat(${safeCount}, ${fallback})`;
  }

  const tracks = parsed.tracks.slice(0, safeCount);
  while (tracks.length < safeCount) tracks.push(fallback);
  return serializeTracks(tracks);
}

export function updateTrackAt(
  template: string,
  count: number,
  index: number,
  nextValue: string,
  fallback: string,
): string {
  const parsed = expandFixedTrackTemplate(template, count, fallback);
  if (!parsed.editable) return template;
  const tracks = [...parsed.tracks];
  if (!tracks[index]) return template;
  tracks[index] = nextValue.trim() || fallback;
  return serializeTracks(tracks);
}


export function removeTrackAt(
  template: string,
  count: number,
  index: number,
  fallback: string,
): { template: string; count: number } {
  if (count <= 1) return { template, count };
  const parsed = expandFixedTrackTemplate(template, count, fallback);
  if (!parsed.editable) {
    const nextCount = count - 1;
    return { template: `repeat(${nextCount}, ${fallback})`, count: nextCount };
  }
  const tracks = parsed.tracks.filter((_, trackIndex) => trackIndex !== index);
  return { template: serializeTracks(tracks), count: tracks.length };
}

export function appendTrack(
  template: string,
  count: number,
  fallback: string,
  maxCount = 12,
): { template: string; count: number } {
  if (count >= maxCount) return { template, count };
  const nextCount = count + 1;
  return {
    template: resizeTrackTemplate({ template, currentCount: count, nextCount, fallback, maxCount }),
    count: nextCount,
  };
}

export function getTrackPreset(axis: TrackAxis, kind: string): string {
  if (kind === "auto") return "auto";
  if (kind === "minmax")
    return axis === "columns" ? "minmax(0, 1fr)" : "minmax(120px, auto)";
  if (kind === "fit-content") return axis === "columns" ? "fit-content(320px)" : "fit-content(180px)";
  if (kind === "px") return axis === "columns" ? "240px" : "120px";
  if (kind === "%") return "25%";
  if (kind === "rem") return axis === "columns" ? "16rem" : "8rem";
  if (kind === "em") return axis === "columns" ? "16em" : "8em";
  return "1fr";
}

export type SimpleTrackKind = "fr" | "px" | "%" | "rem" | "em" | "auto" | "minmax" | "fit-content" | "custom";

export function detectTrackKind(value: string): SimpleTrackKind {
  const track = value.trim();
  if (track === "auto") return "auto";
  if (/^-?(?:\d+\.?\d*|\.\d+)fr$/i.test(track)) return "fr";
  if (/^-?(?:\d+\.?\d*|\.\d+)px$/i.test(track)) return "px";
  if (/^-?(?:\d+\.?\d*|\.\d+)%$/i.test(track)) return "%";
  if (/^-?(?:\d+\.?\d*|\.\d+)rem$/i.test(track)) return "rem";
  if (/^-?(?:\d+\.?\d*|\.\d+)em$/i.test(track)) return "em";
  if (/^minmax\(/i.test(track)) return "minmax";
  if (/^fit-content\(/i.test(track)) return "fit-content";
  return "custom";
}

export function readSimpleTrackNumber(value: string): string {
  const match = value.trim().match(/^-?((?:\d+\.?\d*)|(?:\.\d+))(?:fr|px|%|rem|em)$/i);
  return match?.[1] ?? "1";
}
