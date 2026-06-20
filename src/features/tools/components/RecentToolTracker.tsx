"use client";

import { useEffect } from "react";
import { recordRecentTool } from "../recentTools";

/**
 * Invisible client island rendered from ToolPage. Records the opened tool to
 * localStorage so the About page can surface "Continue where you left off".
 */
export function RecentToolTracker({ id, title, href }: { id: string; title: string; href: string }) {
  useEffect(() => {
    recordRecentTool({ id, title, href });
  }, [id, title, href]);

  return null;
}
