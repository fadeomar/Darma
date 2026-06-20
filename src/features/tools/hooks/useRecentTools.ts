"use client";

import { useCallback, useEffect, useState } from "react";
import { RECENTS_EVENT, readRecentTools, recordRecentTool } from "@/features/tools/recentTools";

export function useRecentTools() {
  const [recentTools, setRecentTools] = useState<ReturnType<typeof readRecentTools>>([]);

  useEffect(() => {
    const syncRecentTools = () => setRecentTools(readRecentTools());

    syncRecentTools();
    window.addEventListener(RECENTS_EVENT, syncRecentTools);
    window.addEventListener("storage", syncRecentTools);
    return () => {
      window.removeEventListener(RECENTS_EVENT, syncRecentTools);
      window.removeEventListener("storage", syncRecentTools);
    };
  }, []);

  const recordToolUse = useCallback((entry: { id: string; toolId?: string; title: string; href: string }) => {
    recordRecentTool(entry);
  }, []);

  return {
    recentTools,
    recordToolUse,
  };
}
