"use client";

import type { ReactNode, RefObject } from "react";
import { Maximize2 } from "lucide-react";
import { enterFullscreen } from "@/lib/tools/screens/fullscreen";

export default function FullscreenButton({
  targetRef,
  children = "Start Fullscreen",
  className = "",
}: {
  targetRef: RefObject<HTMLElement | null>;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        if (targetRef.current) void enterFullscreen(targetRef.current);
      }}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--textColor)] px-5 py-3 text-sm font-black text-[var(--baseColor)] transition hover:opacity-85",
        className,
      ].join(" ")}
    >
      <Maximize2 className="h-4 w-4" />
      {children}
    </button>
  );
}
