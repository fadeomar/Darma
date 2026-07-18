/**
 * Neon Core Defense — the pointer lifecycle behind hold-to-fire.
 *
 * Aiming and firing are one gesture: press to open fire, drag to re-aim, release to
 * stop. Getting that right is almost entirely a question of *ending* it reliably, so
 * this module exists to keep that logic out of the React component and testable
 * without a DOM. It owns which pointer is the firing pointer and every route by
 * which that pointer can go away; it owns no timing at all — the cadence lives in
 * the engine, advanced by `dt` like every other timer in the game.
 *
 * Listener placement is deliberate. `pointerdown` is on the arena surface, but
 * `pointermove`/`pointerup`/`pointercancel` are on the window, so a release that
 * happens off the canvas — over the HUD, outside the browser, after a drag into
 * another element — still reaches us. That, plus the blur and visibility handlers,
 * is what makes a stuck trigger unreachable rather than merely unlikely.
 *
 * `attachHoldFire` returns a single detach function that removes everything it
 * added, so a remount or a restart can never leave a second set of handlers behind.
 */

/** The slice of a `PointerEvent` this module reads. */
export type FirePointer = Pick<
  PointerEvent,
  "pointerId" | "pointerType" | "button" | "buttons" | "isPrimary" | "clientX" | "clientY"
> & { preventDefault(): void };

/** A point in arena space (CSS pixels relative to the canvas' top-left). */
export type AimPoint = { x: number; y: number };

/** What the component does when the gesture changes. */
export type HoldFireCallbacks = {
  /**
   * A primary press landed on the arena. Return `true` to begin sustained fire.
   *
   * Returning `false` is how the component keeps a press that merely starts or
   * resumes the game from arming the trigger: no firing pointer is recorded, so the
   * matching release is a no-op.
   */
  onPress(point: AimPoint): boolean;
  /** The firing pointer moved; later shots should use this aim. */
  onAim(point: AimPoint): void;
  /** The gesture ended, by any route. Called at most once per press. */
  onRelease(): void;
};

/** Minimal event-target surface, so tests can pass a plain object. */
export type FireEventTarget = Pick<EventTarget, "addEventListener" | "removeEventListener">;

/** The arena element: an event target that may also support pointer capture. */
export type FireSurface = FireEventTarget & {
  setPointerCapture?(pointerId: number): void;
  releasePointerCapture?(pointerId: number): void;
  hasPointerCapture?(pointerId: number): boolean;
};

export type HoldFireDeps = {
  surface: FireSurface;
  window: FireEventTarget;
  document: FireEventTarget;
  /** Client → arena space. Return `null` when the surface can't be measured. */
  toArena(clientX: number, clientY: number): AimPoint | null;
  /** Whether the page is currently hidden; holding through a tab switch must stop. */
  isHidden(): boolean;
  callbacks: HoldFireCallbacks;
};

/**
 * Only the primary button of the primary pointer opens fire.
 *
 * `button === 0` is the left mouse button, the pen tip, and a finger; right-click,
 * middle-click, and browser back/forward buttons all report something else and are
 * ignored. `isPrimary` drops the second and later fingers of a multi-touch, so two
 * thumbs on the glass fire one stream, not two.
 */
export function isPrimaryFirePointer(event: FirePointer): boolean {
  return event.isPrimary && event.button === 0;
}

/**
 * True once the primary button is no longer among the pressed buttons.
 *
 * `pointerup` also fires when a *secondary* button is released while the primary is
 * still down; checking the bitmask rather than `button` keeps that from cutting the
 * player's fire mid-stream.
 */
export function releasesPrimary(event: FirePointer): boolean {
  return (event.buttons & 1) === 0;
}

/**
 * Wire the gesture up. Returns a detach function that removes every listener and
 * releases the trigger if one is still held.
 */
/**
 * Narrow a DOM event to the pointer fields this module needs.
 *
 * Listeners are registered as plain `EventListener`s — the only signature every
 * event target agrees on — so each handler re-checks what it was actually handed
 * rather than asserting it. A non-pointer event is simply ignored.
 */
function asPointer(event: Event): FirePointer | null {
  const candidate = event as Partial<FirePointer>;
  return typeof candidate.pointerId === "number" ? (candidate as FirePointer) : null;
}

export function attachHoldFire(deps: HoldFireDeps): () => void {
  const { surface, window: win, document: doc, toArena, isHidden, callbacks } = deps;

  /** The pointer currently holding the trigger, or null when nothing is held. */
  let activePointerId: number | null = null;

  const release = () => {
    if (activePointerId === null) return;
    const pointerId = activePointerId;
    // Cleared first: `onRelease` must never see a live pointer, and a re-entrant
    // call (capture release can synthesise `lostpointercapture`) becomes a no-op.
    activePointerId = null;
    if (surface.hasPointerCapture?.(pointerId)) {
      try {
        surface.releasePointerCapture?.(pointerId);
      } catch {
        // Already gone — the pointer is released either way.
      }
    }
    callbacks.onRelease();
  };

  const onPointerDown = (raw: Event) => {
    const event = asPointer(raw);
    if (!event) return;
    if (!isPrimaryFirePointer(event)) return;
    if (activePointerId !== null) return; // one firing pointer at a time
    const point = toArena(event.clientX, event.clientY);
    if (!point) return;
    // Stops text selection on drag, and the touch gesture the canvas' own
    // `touch-action: none` doesn't already cover.
    event.preventDefault();

    if (!callbacks.onPress(point)) return; // e.g. the tap that starts the game
    activePointerId = event.pointerId;
    try {
      surface.setPointerCapture?.(event.pointerId);
    } catch {
      // Capture is an optimisation; the window listeners are the real safety net.
    }
  };

  const onPointerMove = (raw: Event) => {
    const event = asPointer(raw);
    if (!event) return;
    if (activePointerId !== event.pointerId) return;
    const point = toArena(event.clientX, event.clientY);
    if (point) callbacks.onAim(point);
  };

  const onPointerUp = (raw: Event) => {
    const event = asPointer(raw);
    if (!event) return;
    if (activePointerId !== event.pointerId) return;
    if (!releasesPrimary(event)) return;
    release();
  };

  const onPointerLost = (raw: Event) => {
    const event = asPointer(raw);
    if (!event) return;
    if (activePointerId !== event.pointerId) return;
    release();
  };

  const onBlur = () => release();
  const onVisibility = () => {
    if (isHidden()) release();
  };

  const bindings: [FireEventTarget, string, EventListener][] = [
    [surface, "pointerdown", onPointerDown],
    // Capture normally routes these to the surface, but the window is where a
    // release that lands outside the canvas is guaranteed to show up.
    [win, "pointermove", onPointerMove],
    [win, "pointerup", onPointerUp],
    [win, "pointercancel", onPointerLost],
    [surface, "lostpointercapture", onPointerLost],
  ];

  for (const [target, type, handler] of bindings) {
    target.addEventListener(type, handler);
  }
  win.addEventListener("blur", onBlur);
  doc.addEventListener("visibilitychange", onVisibility);

  return () => {
    for (const [target, type, handler] of bindings) {
      target.removeEventListener(type, handler);
    }
    win.removeEventListener("blur", onBlur);
    doc.removeEventListener("visibilitychange", onVisibility);
    release();
  };
}
