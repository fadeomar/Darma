import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  attachHoldFire,
  isPrimaryFirePointer,
  releasesPrimary,
  type AimPoint,
  type FirePointer,
  type FireSurface,
} from "./neonCoreInput";

/**
 * A stand-in for a DOM event target that records exactly what is attached, so the
 * tests can both dispatch events and assert nothing is left behind on detach.
 */
class FakeTarget {
  readonly listeners = new Map<string, Set<EventListener>>();

  addEventListener(type: string, listener: EventListener) {
    const set = this.listeners.get(type) ?? new Set();
    set.add(listener);
    this.listeners.set(type, set);
  }

  removeEventListener(type: string, listener: EventListener) {
    this.listeners.get(type)?.delete(listener);
  }

  /** Number of live listeners across every type. */
  count(): number {
    let total = 0;
    for (const set of this.listeners.values()) total += set.size;
    return total;
  }

  dispatch(type: string, event: Partial<FirePointer> = {}) {
    const full = { ...pointer(), ...event } as FirePointer;
    for (const listener of [...(this.listeners.get(type) ?? [])]) {
      (listener as unknown as (e: FirePointer) => void)(full);
    }
  }
}

/** A fake canvas: a target that also records pointer-capture calls. */
class FakeSurface extends FakeTarget {
  captured: number | null = null;

  setPointerCapture(pointerId: number) {
    this.captured = pointerId;
  }

  releasePointerCapture(pointerId: number) {
    if (this.captured === pointerId) this.captured = null;
  }

  hasPointerCapture(pointerId: number) {
    return this.captured === pointerId;
  }
}

function pointer(overrides: Partial<FirePointer> = {}): FirePointer {
  return {
    pointerId: 1,
    pointerType: "mouse",
    button: 0,
    buttons: 1,
    isPrimary: true,
    clientX: 100,
    clientY: 100,
    preventDefault: () => {},
    ...overrides,
  };
}

type Harness = {
  surface: FakeSurface;
  win: FakeTarget;
  doc: FakeTarget;
  detach: () => void;
  onPress: ReturnType<typeof vi.fn>;
  onAim: ReturnType<typeof vi.fn>;
  onRelease: ReturnType<typeof vi.fn>;
  hidden: { value: boolean };
};

let harness: Harness;

/** Attach the controller to fakes. `press` decides whether a press arms the trigger. */
function setup(press = true): Harness {
  const surface = new FakeSurface();
  const win = new FakeTarget();
  const doc = new FakeTarget();
  const hidden = { value: false };
  const onPress = vi.fn<(point: AimPoint) => boolean>(() => press);
  const onAim = vi.fn();
  const onRelease = vi.fn();

  const detach = attachHoldFire({
    surface: surface as unknown as FireSurface,
    window: win,
    document: doc,
    // Arena origin sits at client (50, 50).
    toArena: (clientX, clientY) => ({ x: clientX - 50, y: clientY - 50 }),
    isHidden: () => hidden.value,
    callbacks: { onPress, onAim, onRelease },
  });

  return { surface, win, doc, detach, onPress, onAim, onRelease, hidden };
}

beforeEach(() => {
  harness = setup();
});

describe("primary-pointer guards", () => {
  it("accepts only the primary button of the primary pointer", () => {
    expect(isPrimaryFirePointer(pointer())).toBe(true);
    expect(isPrimaryFirePointer(pointer({ button: 2 }))).toBe(false); // right-click
    expect(isPrimaryFirePointer(pointer({ button: 1 }))).toBe(false); // middle-click
    expect(isPrimaryFirePointer(pointer({ isPrimary: false }))).toBe(false); // 2nd finger
  });

  it("treats a release as final only once the primary button is up", () => {
    expect(releasesPrimary(pointer({ buttons: 0 }))).toBe(true);
    expect(releasesPrimary(pointer({ buttons: 1 }))).toBe(false); // still held
  });
});

describe("press", () => {
  it("presses once and translates the point into arena space", () => {
    harness.surface.dispatch("pointerdown", { clientX: 250, clientY: 130 });
    expect(harness.onPress).toHaveBeenCalledTimes(1);
    expect(harness.onPress).toHaveBeenCalledWith({ x: 200, y: 80 });
  });

  it("prevents the default gesture so a drag can't select or scroll", () => {
    const preventDefault = vi.fn();
    harness.surface.dispatch("pointerdown", { preventDefault });
    expect(preventDefault).toHaveBeenCalled();
  });

  it("does not fire on a secondary mouse button", () => {
    harness.surface.dispatch("pointerdown", { button: 2, buttons: 2 });
    harness.surface.dispatch("pointerdown", { button: 1, buttons: 4 });
    expect(harness.onPress).not.toHaveBeenCalled();
  });

  it("ignores a second pointer while one is already firing", () => {
    harness.surface.dispatch("pointerdown", { pointerId: 1 });
    harness.surface.dispatch("pointerdown", { pointerId: 2 });
    expect(harness.onPress).toHaveBeenCalledTimes(1);
  });

  it("takes pointer capture when the surface supports it", () => {
    harness.surface.dispatch("pointerdown", { pointerId: 7 });
    expect(harness.surface.captured).toBe(7);
  });

  it("arms nothing when the press is consumed as a start/resume tap", () => {
    const h = setup(false);
    h.surface.dispatch("pointerdown");
    expect(h.onPress).toHaveBeenCalledTimes(1);
    expect(h.surface.captured).toBeNull();

    // No trigger was armed, so the matching release and any drag are no-ops.
    h.win.dispatch("pointermove", { clientX: 300, clientY: 300 });
    h.win.dispatch("pointerup", { buttons: 0 });
    expect(h.onAim).not.toHaveBeenCalled();
    expect(h.onRelease).not.toHaveBeenCalled();
  });
});

describe("aim while held", () => {
  it("tracks the pointer, including outside the arena", () => {
    harness.surface.dispatch("pointerdown", { clientX: 100, clientY: 100 });
    harness.win.dispatch("pointermove", { clientX: 400, clientY: 220 });
    expect(harness.onAim).toHaveBeenLastCalledWith({ x: 350, y: 170 });

    harness.win.dispatch("pointermove", { clientX: 0, clientY: 0 });
    expect(harness.onAim).toHaveBeenLastCalledWith({ x: -50, y: -50 });
  });

  it("ignores movement before a press and from other pointers", () => {
    harness.win.dispatch("pointermove", { clientX: 200, clientY: 200 });
    expect(harness.onAim).not.toHaveBeenCalled();

    harness.surface.dispatch("pointerdown", { pointerId: 1 });
    harness.win.dispatch("pointermove", { pointerId: 9, clientX: 200, clientY: 200 });
    expect(harness.onAim).not.toHaveBeenCalled();
  });
});

describe("every route out of a hold releases it exactly once", () => {
  it("releases on pointerup", () => {
    harness.surface.dispatch("pointerdown");
    harness.win.dispatch("pointerup", { buttons: 0 });
    expect(harness.onRelease).toHaveBeenCalledTimes(1);
    expect(harness.surface.captured).toBeNull();
  });

  it("releases on a pointerup that happens outside the arena", () => {
    harness.surface.dispatch("pointerdown");
    // The window listener is what makes this reachable at all.
    harness.win.dispatch("pointerup", { clientX: 5000, clientY: 5000, buttons: 0 });
    expect(harness.onRelease).toHaveBeenCalledTimes(1);
  });

  it("keeps firing when a secondary button is released mid-hold", () => {
    harness.surface.dispatch("pointerdown");
    harness.win.dispatch("pointerup", { button: 2, buttons: 1 }); // primary still down
    expect(harness.onRelease).not.toHaveBeenCalled();

    harness.win.dispatch("pointerup", { button: 0, buttons: 0 });
    expect(harness.onRelease).toHaveBeenCalledTimes(1);
  });

  it("releases on pointercancel", () => {
    harness.surface.dispatch("pointerdown");
    harness.win.dispatch("pointercancel");
    expect(harness.onRelease).toHaveBeenCalledTimes(1);
  });

  it("releases on lostpointercapture", () => {
    harness.surface.dispatch("pointerdown");
    harness.surface.dispatch("lostpointercapture");
    expect(harness.onRelease).toHaveBeenCalledTimes(1);
  });

  it("releases when the window loses focus", () => {
    harness.surface.dispatch("pointerdown");
    harness.win.dispatch("blur");
    expect(harness.onRelease).toHaveBeenCalledTimes(1);
  });

  it("releases when the page is hidden, but not when it becomes visible", () => {
    harness.surface.dispatch("pointerdown");
    harness.doc.dispatch("visibilitychange");
    expect(harness.onRelease).not.toHaveBeenCalled(); // still visible

    harness.hidden.value = true;
    harness.doc.dispatch("visibilitychange");
    expect(harness.onRelease).toHaveBeenCalledTimes(1);
  });

  it("releases on detach, so unmount can't leave a stuck trigger", () => {
    harness.surface.dispatch("pointerdown");
    harness.detach();
    expect(harness.onRelease).toHaveBeenCalledTimes(1);
  });

  it("never double-releases, whatever order the end events arrive in", () => {
    harness.surface.dispatch("pointerdown");
    harness.win.dispatch("pointerup", { buttons: 0 });
    harness.win.dispatch("pointercancel");
    harness.surface.dispatch("lostpointercapture");
    harness.win.dispatch("blur");
    harness.detach();
    expect(harness.onRelease).toHaveBeenCalledTimes(1);
  });

  it("is inert when nothing is held", () => {
    harness.win.dispatch("blur");
    harness.win.dispatch("pointerup", { buttons: 0 });
    harness.detach();
    expect(harness.onRelease).not.toHaveBeenCalled();
  });
});

describe("listener lifecycle", () => {
  it("removes every listener on detach", () => {
    const { surface, win, doc, detach } = setup();
    expect(surface.count() + win.count() + doc.count()).toBeGreaterThan(0);
    detach();
    expect(surface.count()).toBe(0);
    expect(win.count()).toBe(0);
    expect(doc.count()).toBe(0);
  });

  it("does not accumulate listeners across attach/detach cycles (remount, restart)", () => {
    const surface = new FakeSurface();
    const win = new FakeTarget();
    const doc = new FakeTarget();
    const attach = () =>
      attachHoldFire({
        surface: surface as unknown as FireSurface,
        window: win,
        document: doc,
        toArena: (clientX, clientY) => ({ x: clientX, y: clientY }),
        isHidden: () => false,
        callbacks: { onPress: () => true, onAim: () => {}, onRelease: () => {} },
      });

    const first = attach();
    const baseline = surface.count() + win.count() + doc.count();
    first();

    for (let i = 0; i < 5; i += 1) {
      const detach = attach();
      expect(surface.count() + win.count() + doc.count()).toBe(baseline);
      detach();
    }
  });

  it("stops responding after detach", () => {
    harness.detach();
    harness.surface.dispatch("pointerdown");
    expect(harness.onPress).not.toHaveBeenCalled();
  });

  it("can be pressed again after a full release cycle", () => {
    harness.surface.dispatch("pointerdown");
    harness.win.dispatch("pointerup", { buttons: 0 });
    harness.surface.dispatch("pointerdown");
    expect(harness.onPress).toHaveBeenCalledTimes(2);
    expect(harness.onRelease).toHaveBeenCalledTimes(1);
  });
});
