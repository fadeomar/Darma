import { describe, expect, it } from "vitest";
import {
  createStaticGameBridgeCommand,
  isStaticGameFrameLoaded,
  isTrustedStaticGameBridgeEvent,
  parseStaticGameBridgeMessage,
  type StaticGameBridgeConfig,
} from "./staticGameBridge";

const config: StaticGameBridgeConfig = {
  source: "darma-gridland-runtime",
  gameId: "gridland",
  version: 1,
};

describe("static game bridge protocol", () => {
  it("accepts and normalizes matching runtime state messages", () => {
    const parsed = parseStaticGameBridgeMessage(
      {
        source: "darma-gridland-runtime",
        game: "gridland",
        version: 1,
        type: "state",
        payload: {
          started: true,
          paused: false,
          phase: "night",
          day: 4.9,
        },
      },
      config,
    );

    expect(parsed).toEqual({
      type: "state",
      payload: {
        connected: true,
        started: true,
        paused: false,
        phase: "night",
        day: 4,
      },
    });
  });

  it("rejects messages from another runtime or protocol version", () => {
    expect(
      parseStaticGameBridgeMessage(
        {
          source: "another-runtime",
          game: "gridland",
          version: 1,
          type: "ready",
        },
        config,
      ),
    ).toBeNull();

    expect(
      parseStaticGameBridgeMessage(
        {
          source: "darma-gridland-runtime",
          game: "gridland",
          version: 2,
          type: "ready",
        },
        config,
      ),
    ).toBeNull();
  });

  it("creates a host request-state command", () => {
    expect(createStaticGameBridgeCommand(config, "request-state")).toEqual({
      source: "darma-static-game-host",
      game: "gridland",
      version: 1,
      type: "command",
      command: "request-state",
    });
  });
});

function envelope(type: string, payload?: unknown) {
  return { source: "darma-gridland-runtime", game: "gridland", version: 1, type, payload };
}

describe("static game bridge lifecycle payloads", () => {
  it("accepts a ready event", () => {
    expect(parseStaticGameBridgeMessage(envelope("ready", { capabilities: ["state"] }), config)).toEqual({
      type: "ready",
      payload: { capabilities: ["state"] },
    });
  });

  it("reports the day phase and day number", () => {
    expect(
      parseStaticGameBridgeMessage(envelope("state", { started: true, paused: false, phase: "day", day: 3 }), config),
    ).toEqual({
      type: "state",
      payload: { connected: true, started: true, paused: false, phase: "day", day: 3 },
    });
  });

  it("reports the night phase", () => {
    const parsed = parseStaticGameBridgeMessage(
      envelope("state", { started: true, paused: false, phase: "night", day: 7 }),
      config,
    );
    expect(parsed).toMatchObject({ payload: { phase: "night", day: 7 } });
  });

  it("reports paused and resumed transitions", () => {
    expect(
      parseStaticGameBridgeMessage(envelope("state", { started: true, paused: true, phase: "day", day: 2 }), config),
    ).toMatchObject({ payload: { paused: true } });

    expect(
      parseStaticGameBridgeMessage(envelope("state", { started: true, paused: false, phase: "day", day: 2 }), config),
    ).toMatchObject({ payload: { paused: false } });
  });

  it("ignores unknown message types", () => {
    expect(parseStaticGameBridgeMessage(envelope("shutdown", {}), config)).toBeNull();
    expect(parseStaticGameBridgeMessage(envelope("command", { command: "start" }), config)).toBeNull();
  });

  it("ignores malformed payloads and non-object values", () => {
    for (const value of [null, undefined, 42, "state", [], envelope("state", "not-an-object"), envelope("state")]) {
      expect(parseStaticGameBridgeMessage(value, config)).toBeNull();
    }
  });

  it("does not trust unexpected field types inside a state payload", () => {
    const parsed = parseStaticGameBridgeMessage(
      envelope("state", { started: "yes", paused: 1, phase: "dusk", day: Number.NaN }),
      config,
    );

    // Non-boolean truthy values must not be coerced into a started/paused state,
    // and an unknown phase or non-finite day must be dropped rather than shown.
    expect(parsed).toEqual({
      type: "state",
      payload: { connected: true, started: false, paused: false, phase: undefined, day: undefined },
    });
  });

  it("clamps day numbers to a sane floor", () => {
    expect(parseStaticGameBridgeMessage(envelope("state", { day: 0 }), config)).toMatchObject({
      payload: { day: 1 },
    });
  });
});

describe("embedded frame load detection", () => {
  it("detects a frame that finished loading before the load handler attached", () => {
    // The regression this guards: a local runtime completes before hydration,
    // the onLoad event is missed, and the loading overlay hides a running game.
    expect(
      isStaticGameFrameLoaded({
        contentDocument: { readyState: "complete", URL: "http://localhost:3000/darma-games/gridland/index.html" },
      }),
    ).toBe(true);
  });

  it("does not mistake a fresh about:blank frame for a loaded runtime", () => {
    expect(isStaticGameFrameLoaded({ contentDocument: { readyState: "complete", URL: "about:blank" } })).toBe(false);
    expect(isStaticGameFrameLoaded({ contentDocument: { readyState: "complete", URL: "" } })).toBe(false);
  });

  it("reports a still-loading or missing frame as not loaded", () => {
    expect(isStaticGameFrameLoaded({ contentDocument: { readyState: "loading", URL: "http://x/y.html" } })).toBe(false);
    expect(isStaticGameFrameLoaded({ contentDocument: null })).toBe(false);
    expect(isStaticGameFrameLoaded(null)).toBe(false);
    expect(isStaticGameFrameLoaded(undefined)).toBe(false);
  });

  it("falls back to the load event when the frame is cross-origin", () => {
    const crossOrigin = {
      get contentDocument(): never {
        throw new DOMException("Blocked a frame from accessing a cross-origin frame.", "SecurityError");
      },
    };

    expect(isStaticGameFrameLoaded(crossOrigin)).toBe(false);
  });
});

describe("static game bridge transport trust", () => {
  const frameWindow = { id: "frame" };
  const origin = "https://darma.test";

  it("accepts an event from the embedded frame on the expected origin", () => {
    expect(
      isTrustedStaticGameBridgeEvent({ origin, source: frameWindow }, { expectedOrigin: origin, frameWindow }),
    ).toBe(true);
  });

  it("rejects a cross-origin event", () => {
    expect(
      isTrustedStaticGameBridgeEvent(
        { origin: "https://evil.test", source: frameWindow },
        { expectedOrigin: origin, frameWindow },
      ),
    ).toBe(false);
  });

  it("rejects an event from a window that is not the embedded frame", () => {
    expect(
      isTrustedStaticGameBridgeEvent({ origin, source: { id: "other" } }, { expectedOrigin: origin, frameWindow }),
    ).toBe(false);
  });

  it("rejects stale events once the frame is detached", () => {
    // A restarted/unmounted iframe reports a null contentWindow. A null-sourced
    // message must not slip through by matching that null.
    expect(
      isTrustedStaticGameBridgeEvent({ origin, source: null }, { expectedOrigin: origin, frameWindow: null }),
    ).toBe(false);
    expect(
      isTrustedStaticGameBridgeEvent({ origin, source: undefined }, { expectedOrigin: origin, frameWindow: undefined }),
    ).toBe(false);
  });
});
