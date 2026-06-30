"use client";

import { useMemo } from "react";
import { buildAccessibilityStatus, type AccessibilityStatusInput } from "./reactionAccessibility";

export function ReactionScreenReaderStatus({ status }: { status: AccessibilityStatusInput }) {
  const message = useMemo(() => buildAccessibilityStatus(status), [status]);
  return (
    <div className="rtp-sr-status sr-only" role="status" aria-live="polite" aria-atomic="true">
      {message}
    </div>
  );
}
