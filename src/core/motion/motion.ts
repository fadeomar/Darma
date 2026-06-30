export const CORE_MOTION = {
  fast: "120ms",
  normal: "180ms",
  slow: "260ms",
  easeOut: "cubic-bezier(0.16, 1, 0.3, 1)",
  easeInOut: "cubic-bezier(0.65, 0, 0.35, 1)",
} as const;

export const prefersReducedMotionQuery = "(prefers-reduced-motion: reduce)";
