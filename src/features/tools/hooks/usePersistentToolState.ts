"use client";

import { type Dispatch, type SetStateAction, useEffect, useRef, useState } from "react";

type Options = {
  version?: number;
  debounceMs?: number;
  storage?: "localStorage" | "sessionStorage";
};

type StoredValue<T> = {
  version: number;
  value: T;
};

function getStorage(type: "localStorage" | "sessionStorage") {
  if (typeof window === "undefined") return null;
  try {
    return window[type];
  } catch {
    return null;
  }
}

export function usePersistentToolState<T>(key: string, initialValue: T, options: Options = {}): [T, Dispatch<SetStateAction<T>>, () => void] {
  const { version = 1, debounceMs = 250, storage = "localStorage" } = options;
  const [value, setValue] = useState<T>(initialValue);
  const hasHydrated = useRef(false);

  useEffect(() => {
    const target = getStorage(storage);
    if (!target) return;
    try {
      const raw = target.getItem(key);
      if (!raw) return;
      const parsed = JSON.parse(raw) as StoredValue<T>;
      if (parsed.version === version && "value" in parsed) setValue(parsed.value);
    } catch {
      target.removeItem(key);
    } finally {
      hasHydrated.current = true;
    }
  }, [key, storage, version]);

  useEffect(() => {
    const target = getStorage(storage);
    if (!target || !hasHydrated.current) return;
    const handle = window.setTimeout(() => {
      try {
        target.setItem(key, JSON.stringify({ version, value } satisfies StoredValue<T>));
      } catch {
        // Ignore quota or private-mode failures.
      }
    }, debounceMs);
    return () => window.clearTimeout(handle);
  }, [debounceMs, key, storage, value, version]);

  function reset() {
    const target = getStorage(storage);
    try {
      target?.removeItem(key);
    } catch {
      // Ignore storage failures.
    }
    setValue(initialValue);
  }

  return [value, setValue, reset];
}
