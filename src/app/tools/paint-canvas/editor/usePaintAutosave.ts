"use client";

import { useCallback, useRef, useState } from "react";
import { AUTOSAVE_DELAY_MS } from "../constants";
import type { LocalSaveState } from "../types";
import { loadPaintAutosave, savePaintAutosave } from "../storage/paintProjectDb";

export function usePaintAutosave() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enabledRef = useRef(false);
  const [saveState, setSaveState] = useState<LocalSaveState>("idle");

  const scheduleAutosave = useCallback((snapshot: string) => {
    if (!enabledRef.current) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    setSaveState("saving");
    timerRef.current = setTimeout(() => {
      void savePaintAutosave(snapshot)
        .then(() => setSaveState("saved"))
        .catch(() => setSaveState(typeof indexedDB === "undefined" ? "unavailable" : "error"));
    }, AUTOSAVE_DELAY_MS);
  }, []);

  const loadRecoverySnapshot = useCallback(async (): Promise<string | undefined> => {
    try {
      const autosave = await loadPaintAutosave();
      if (!autosave?.document) return undefined;
      setSaveState("saved");
      return autosave.document;
    } catch {
      setSaveState(typeof indexedDB === "undefined" ? "unavailable" : "error");
      return undefined;
    }
  }, []);

  const enableAutosave = useCallback(() => {
    enabledRef.current = true;
  }, []);

  const cancelAutosave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  return { saveState, scheduleAutosave, loadRecoverySnapshot, enableAutosave, cancelAutosave };
}
