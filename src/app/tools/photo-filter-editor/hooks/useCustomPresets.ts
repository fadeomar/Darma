"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CUSTOM_PRESET_STORAGE_KEY,
  MAX_CUSTOM_PRESETS,
  createCustomPreset,
  deleteCustomPreset,
  parseCustomPresetStore,
  renameCustomPreset,
  serializeCustomPresetStore,
} from "../lib/storage";
import type { CustomPreset, PhotoAdjustments } from "../types";

export function useCustomPresets(onStorageError: (message: string) => void) {
  const [items, setItems] = useState<CustomPreset[]>([]);

  useEffect(() => {
    try {
      setItems(parseCustomPresetStore(window.localStorage.getItem(CUSTOM_PRESET_STORAGE_KEY)).items);
    } catch {
      onStorageError("Saved presets are unavailable in this browser session.");
    }
  }, [onStorageError]);

  const persist = useCallback((next: CustomPreset[]) => {
    try {
      window.localStorage.setItem(CUSTOM_PRESET_STORAGE_KEY, serializeCustomPresetStore(next));
      setItems(next);
      return true;
    } catch {
      onStorageError("Could not save presets in local storage.");
      return false;
    }
  }, [onStorageError]);

  const save = useCallback((name: string, adjustments: PhotoAdjustments) => {
    if (items.length >= MAX_CUSTOM_PRESETS) {
      onStorageError(`You can save up to ${MAX_CUSTOM_PRESETS} custom presets.`);
      return null;
    }
    const preset = createCustomPreset(name, adjustments);
    return persist([preset, ...items]) ? preset : null;
  }, [items, onStorageError, persist]);

  const rename = useCallback((id: string, name: string) => persist(renameCustomPreset(items, id, name)), [items, persist]);
  const remove = useCallback((id: string) => persist(deleteCustomPreset(items, id)), [items, persist]);
  const clear = useCallback(() => persist([]), [persist]);

  return { items, save, rename, remove, clear };
}
