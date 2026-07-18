export type StaticGameBridgeConfig = {
  source: string;
  gameId: string;
  version: number;
};

export type StaticGameRuntimePhase = "day" | "night";

export type StaticGameRuntimeState = {
  connected: boolean;
  started: boolean;
  paused: boolean;
  phase?: StaticGameRuntimePhase;
  day?: number;
};

type BridgeEnvelope = {
  source?: unknown;
  game?: unknown;
  version?: unknown;
  type?: unknown;
  payload?: unknown;
};

type RuntimeStatePayload = {
  started?: unknown;
  paused?: unknown;
  phase?: unknown;
  day?: unknown;
};

export type StaticGameBridgeMessage =
  | {
      type: "ready";
      payload?: Record<string, unknown>;
    }
  | {
      type: "state";
      payload: StaticGameRuntimeState;
    }
  | {
      type: "event";
      payload?: Record<string, unknown>;
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeState(payload: RuntimeStatePayload): StaticGameRuntimeState {
  const phase = payload.phase === "day" || payload.phase === "night" ? payload.phase : undefined;
  const day = typeof payload.day === "number" && Number.isFinite(payload.day)
    ? Math.max(1, Math.floor(payload.day))
    : undefined;

  return {
    connected: true,
    started: payload.started === true,
    paused: payload.paused === true,
    phase,
    day,
  };
}

export function parseStaticGameBridgeMessage(
  value: unknown,
  config: StaticGameBridgeConfig,
): StaticGameBridgeMessage | null {
  if (!isRecord(value)) return null;

  const envelope = value as BridgeEnvelope;
  if (
    envelope.source !== config.source ||
    envelope.game !== config.gameId ||
    envelope.version !== config.version
  ) {
    return null;
  }

  if (envelope.type === "ready") {
    return {
      type: "ready",
      payload: isRecord(envelope.payload) ? envelope.payload : undefined,
    };
  }

  if (envelope.type === "state" && isRecord(envelope.payload)) {
    return {
      type: "state",
      payload: normalizeState(envelope.payload as RuntimeStatePayload),
    };
  }

  if (envelope.type === "event") {
    return {
      type: "event",
      payload: isRecord(envelope.payload) ? envelope.payload : undefined,
    };
  }

  return null;
}

type FrameLoadProbe = {
  contentDocument?: { readyState?: string; URL?: string } | null;
};

/**
 * True when an embedded frame has already finished loading real content.
 *
 * A freshly created iframe exposes an `about:blank` document that is itself
 * "complete", so readyState alone would report a load that never happened.
 * Cross-origin frames throw on access and are reported as not-yet-loaded so the
 * caller falls back to the `load` event.
 */
export function isStaticGameFrameLoaded(frame: FrameLoadProbe | null | undefined): boolean {
  if (!frame) return false;

  try {
    const doc = frame.contentDocument;
    if (!doc || doc.readyState !== "complete") return false;
    return typeof doc.URL === "string" && doc.URL !== "" && doc.URL !== "about:blank";
  } catch {
    return false;
  }
}

/**
 * Transport-level guard applied before any payload parsing.
 *
 * `frameWindow` must be truthy: a detached iframe reports a null/undefined
 * contentWindow, and a bare `event.source !== frameWindow` comparison would
 * accept a same-origin message whose source is also null.
 */
export function isTrustedStaticGameBridgeEvent(
  event: { origin: string; source: unknown },
  context: { expectedOrigin: string; frameWindow: unknown },
): boolean {
  if (!context.frameWindow) return false;
  if (event.origin !== context.expectedOrigin) return false;
  return event.source === context.frameWindow;
}

export function createStaticGameBridgeCommand(
  config: StaticGameBridgeConfig,
  command: "request-state",
) {
  return {
    source: "darma-static-game-host",
    game: config.gameId,
    version: config.version,
    type: "command",
    command,
  } as const;
}
