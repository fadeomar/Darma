import { FILTER_CONTROLS, clampFilterState } from "./adjustments";
import type { CustomPreset, PhotoAdjustments } from "../types";

export const CUSTOM_PRESET_STORAGE_KEY = "darma.photo-filter.custom-presets.v1";
export const CUSTOM_PRESET_STORE_VERSION = 1;
export const MAX_CUSTOM_PRESETS = 20;
export const MAX_STORAGE_CHARS = 80_000;

export type CustomPresetStore = { version: 1; items: CustomPreset[] };

function safeName(value: string): string {
  return value.trim().replace(/\s+/g, " ").slice(0, 50) || "Custom preset";
}

function parseAdjustments(value: unknown): PhotoAdjustments | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const next = {} as PhotoAdjustments;
  for (const control of FILTER_CONTROLS) {
    const raw = record[control.key];
    if (typeof raw !== "number" || !Number.isFinite(raw) || raw < control.min || raw > control.max) return null;
    next[control.key] = raw;
  }
  return next;
}

export function createCustomPreset(name: string, adjustments: PhotoAdjustments, now = new Date().toISOString()): CustomPreset {
  return {
    id: `preset-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    name: safeName(name),
    adjustments: clampFilterState(adjustments),
    createdAt: now,
    updatedAt: now,
  };
}

export function parseCustomPresetStore(text: string | null): CustomPresetStore {
  if (!text || text.length > MAX_STORAGE_CHARS) return { version: 1, items: [] };
  try {
    const raw = JSON.parse(text) as unknown;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { version: 1, items: [] };
    const record = raw as Record<string, unknown>;
    if (record.version !== CUSTOM_PRESET_STORE_VERSION || !Array.isArray(record.items)) return { version: 1, items: [] };
    const items = record.items.slice(0, MAX_CUSTOM_PRESETS).flatMap((item): CustomPreset[] => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return [];
      const value = item as Record<string, unknown>;
      const adjustments = parseAdjustments(value.adjustments);
      if (typeof value.id !== "string" || value.id.length > 80 || typeof value.name !== "string" || value.name.length > 50 || !adjustments) return [];
      return [{
        id: value.id,
        name: safeName(value.name),
        adjustments,
        createdAt: typeof value.createdAt === "string" ? value.createdAt : new Date(0).toISOString(),
        updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : new Date(0).toISOString(),
      }];
    });
    return { version: 1, items };
  } catch {
    return { version: 1, items: [] };
  }
}

export function serializeCustomPresetStore(items: CustomPreset[]): string {
  const payload = JSON.stringify({ version: 1, items: items.slice(0, MAX_CUSTOM_PRESETS) } satisfies CustomPresetStore);
  if (payload.length > MAX_STORAGE_CHARS) throw new Error("storage-limit");
  return payload;
}

export function renameCustomPreset(items: CustomPreset[], id: string, name: string, now = new Date().toISOString()): CustomPreset[] {
  return items.map((item) => item.id === id ? { ...item, name: safeName(name), updatedAt: now } : item);
}

export function deleteCustomPreset(items: CustomPreset[], id: string): CustomPreset[] {
  return items.filter((item) => item.id !== id);
}
