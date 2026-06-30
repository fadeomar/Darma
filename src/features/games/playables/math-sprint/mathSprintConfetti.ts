/**
 * Math Sprint — confetti.
 *
 * Thin wrapper around `canvas-confetti`, used only for meaningful celebrations
 * (a new best, a streak milestone, or a strong Sprint finish) — never on every
 * correct answer. It is a no-op when the user prefers reduced motion or on the
 * server, and it loads the library lazily so it never blocks first paint.
 */

type ConfettiFn = (options?: Record<string, unknown>) => void;

let confettiFn: ConfettiFn | null = null;
let loading: Promise<void> | null = null;

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

async function ensureLoaded(): Promise<void> {
  if (confettiFn || typeof window === "undefined") return;
  if (!loading) {
    loading = import("canvas-confetti")
      .then((module) => {
        confettiFn = module.default as unknown as ConfettiFn;
      })
      .catch(() => {
        confettiFn = null;
      });
  }
  await loading;
}

export type ConfettiKind = "newbest" | "milestone" | "finish";

const PRESETS: Record<ConfettiKind, Record<string, unknown>> = {
  newbest: { particleCount: 120, spread: 70, startVelocity: 45, origin: { y: 0.6 } },
  milestone: { particleCount: 60, spread: 55, startVelocity: 35, origin: { y: 0.65 } },
  finish: { particleCount: 90, spread: 80, startVelocity: 40, origin: { y: 0.6 } },
};

export function celebrate(kind: ConfettiKind): void {
  if (typeof window === "undefined" || prefersReducedMotion()) return;
  void ensureLoaded().then(() => {
    if (!confettiFn) return;
    confettiFn({ ...PRESETS[kind], disableForReducedMotion: true });
  });
}
