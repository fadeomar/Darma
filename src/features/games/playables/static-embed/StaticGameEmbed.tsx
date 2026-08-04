"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CirclePause,
  ExternalLink,
  LoaderCircle,
  Maximize2,
  Minimize2,
  Moon,
  RefreshCcw,
  ShieldCheck,
  Sun,
} from "lucide-react";
import { Badge, Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { GameDefinition } from "../../domain/game";
import {
  createStaticGameBridgeCommand,
  isStaticGameFrameLoaded,
  isTrustedStaticGameBridgeEvent,
  parseStaticGameBridgeMessage,
  type StaticGameBridgeConfig,
  type StaticGameRuntimeState,
} from "./staticGameBridge";

type StaticGameEmbedVariant = "default" | "immersive";

const INITIAL_RUNTIME_STATE: StaticGameRuntimeState = {
  connected: false,
  started: false,
  paused: false,
};

function getRuntimeLabel({
  frameLoaded,
  bridge,
  bridgeTimedOut,
  runtimeState,
}: {
  frameLoaded: boolean;
  bridge?: StaticGameBridgeConfig;
  bridgeTimedOut: boolean;
  runtimeState: StaticGameRuntimeState;
}) {
  if (!frameLoaded) {
    return { label: "Loading", variant: "outline" as const, icon: LoaderCircle };
  }

  if (bridge && !runtimeState.connected && !bridgeTimedOut) {
    return { label: "Connecting", variant: "outline" as const, icon: LoaderCircle };
  }

  if (runtimeState.paused) {
    return { label: "Paused", variant: "warning" as const, icon: CirclePause };
  }

  if (runtimeState.started && runtimeState.phase === "night") {
    return {
      label: runtimeState.day ? `Night · Day ${runtimeState.day}` : "Night",
      variant: "accent" as const,
      icon: Moon,
    };
  }

  if (runtimeState.started && runtimeState.phase === "day") {
    return {
      label: runtimeState.day ? `Day ${runtimeState.day}` : "Day",
      variant: "success" as const,
      icon: Sun,
    };
  }

  return { label: "Ready", variant: "success" as const, icon: ShieldCheck };
}

export function StaticGameEmbed({
  game,
  src,
  minHeight = 720,
  focusHint = "Click inside the game first, then use its keyboard or touch controls.",
  variant = "default",
  bridge,
  className,
}: {
  game: GameDefinition;
  src: string;
  minHeight?: number;
  focusHint?: string;
  variant?: StaticGameEmbedVariant;
  bridge?: StaticGameBridgeConfig;
  className?: string;
}) {
  const shellRef = useRef<HTMLElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Callers commonly pass `bridge` as an inline object literal. Deriving a
  // value-keyed config keeps the message listener and the connect timeout from
  // being torn down and restarted on every parent render.
  const bridgeSource = bridge?.source;
  const bridgeGameId = bridge?.gameId;
  const bridgeVersion = bridge?.version;
  const bridgeConfig = useMemo(
    () =>
      bridgeSource !== undefined && bridgeGameId !== undefined && bridgeVersion !== undefined
        ? { source: bridgeSource, gameId: bridgeGameId, version: bridgeVersion }
        : undefined,
    [bridgeSource, bridgeGameId, bridgeVersion],
  );
  const [reloadKey, setReloadKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [frameLoaded, setFrameLoaded] = useState(false);
  const [bridgeTimedOut, setBridgeTimedOut] = useState(false);
  const [runtimeState, setRuntimeState] = useState<StaticGameRuntimeState>(INITIAL_RUNTIME_STATE);

  const requestRuntimeState = useCallback(() => {
    if (!bridgeConfig || !iframeRef.current?.contentWindow) return;

    iframeRef.current.contentWindow.postMessage(
      createStaticGameBridgeCommand(bridgeConfig, "request-state"),
      window.location.origin,
    );
  }, [bridgeConfig]);

  useEffect(() => {
    const syncFullscreenState = () => {
      setIsFullscreen(document.fullscreenElement === shellRef.current);
    };

    syncFullscreenState();
    document.addEventListener("fullscreenchange", syncFullscreenState);

    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreenState);
    };
  }, []);

  useEffect(() => {
    setFrameLoaded(false);
    setBridgeTimedOut(false);
    setRuntimeState(INITIAL_RUNTIME_STATE);
  }, [reloadKey, src]);

  // A locally hosted runtime routinely finishes loading before hydration
  // attaches `onLoad`, and that missed event would leave the loading overlay
  // covering a game that is already running. Adopt the frame's real state on
  // mount and after every restart instead of trusting the event alone.
  useEffect(() => {
    if (isStaticGameFrameLoaded(iframeRef.current)) setFrameLoaded(true);
  }, [reloadKey, src]);

  useEffect(() => {
    if (!bridgeConfig) return;

    const handleMessage = (event: MessageEvent<unknown>) => {
      const trusted = isTrustedStaticGameBridgeEvent(event, {
        expectedOrigin: window.location.origin,
        frameWindow: iframeRef.current?.contentWindow,
      });
      if (!trusted) return;

      const message = parseStaticGameBridgeMessage(event.data, bridgeConfig);
      if (!message) return;

      if (message.type === "ready") {
        setRuntimeState((current) => ({ ...current, connected: true }));
        setBridgeTimedOut(false);
        requestRuntimeState();
        return;
      }

      if (message.type === "state") {
        setRuntimeState(message.payload);
        setBridgeTimedOut(false);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [bridgeConfig, requestRuntimeState]);

  useEffect(() => {
    if (!bridgeConfig || !frameLoaded || runtimeState.connected) return;

    const requestTimer = window.setTimeout(requestRuntimeState, 150);
    const fallbackTimer = window.setTimeout(() => setBridgeTimedOut(true), 8000);

    return () => {
      window.clearTimeout(requestTimer);
      window.clearTimeout(fallbackTimer);
    };
  }, [bridgeConfig, frameLoaded, requestRuntimeState, runtimeState.connected]);

  const toggleFullscreen = useCallback(async () => {
    const target = shellRef.current;
    if (!target) return;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }

      if (target.requestFullscreen) {
        await target.requestFullscreen();
      }
    } catch {
      // Browser may deny fullscreen until the next direct user gesture.
    }
  }, []);

  const restart = useCallback(() => {
    setReloadKey((key) => key + 1);
  }, []);

  const status = useMemo(
    () => getRuntimeLabel({ frameLoaded, bridge: bridgeConfig, bridgeTimedOut, runtimeState }),
    [bridgeConfig, bridgeTimedOut, frameLoaded, runtimeState],
  );
  const StatusIcon = status.icon;
  const showHostLoading =
    !frameLoaded || Boolean(bridgeConfig && !runtimeState.connected && !bridgeTimedOut);

  return (
    <section
      ref={shellRef}
      className={cn(
        "static-game-embed overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-card)]",
        variant === "immersive" && "static-game-embed--immersive",
        className,
      )}
      data-runtime-status={status.label.toLowerCase().replaceAll(" ", "-")}
    >
      <div className="static-game-toolbar flex flex-col gap-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="min-w-0">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
              {variant === "immersive" ? "Darma preserved game" : "Darma playable"}
            </p>
            <h2 className="truncate text-base font-black tracking-[-0.02em] text-[var(--color-text-primary)]">
              {game.title}
            </h2>
          </div>
          <Badge variant={status.variant} className="static-game-status" aria-live="polite">
            <StatusIcon
              className={cn("mr-1 h-3 w-3", status.label === "Loading" || status.label === "Connecting" ? "animate-spin" : "")}
              aria-hidden
            />
            {status.label}
          </Badge>
        </div>

        <div className="static-game-actions flex flex-wrap items-center gap-2">
          <Badge variant="soft" className="static-game-meta-badge">Local assets</Badge>
          <Badge variant="outline" className="static-game-meta-badge">Browser game</Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={restart}
            leftIcon={<RefreshCcw className="h-3.5 w-3.5" aria-hidden />}
          >
            Restart
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
            leftIcon={
              isFullscreen ? (
                <Minimize2 className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <Maximize2 className="h-3.5 w-3.5" aria-hidden />
              )
            }
          >
            {isFullscreen ? "Exit full screen" : "Full screen"}
          </Button>
          <a
            href={src}
            target="_blank"
            rel="noreferrer"
            className="static-game-open-link inline-flex min-h-8 items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-transparent px-3 text-xs font-semibold leading-none text-[var(--color-text-primary)] transition hover:border-[var(--color-border-strong)] hover:bg-[var(--color-control-hover)] focus:outline-none focus-visible:shadow-[var(--focus-ring)]"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            Open
          </a>
        </div>
      </div>

      <div className="static-game-frame relative bg-black" style={{ minHeight }}>
        <iframe
          ref={iframeRef}
          key={reloadKey}
          src={src}
          title={`${game.title} playable`}
          className="absolute inset-0 h-full w-full border-0"
          allow="fullscreen; autoplay"
          allowFullScreen
          referrerPolicy="no-referrer"
          onLoad={() => setFrameLoaded(true)}
        />

        <div
          className={cn(
            "static-game-loading pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black transition-opacity duration-300",
            showHostLoading ? "opacity-100" : "opacity-0",
          )}
          aria-hidden={!showHostLoading}
        >
          <div className="flex flex-col items-center gap-3 px-6 text-center text-white">
            <LoaderCircle className="h-7 w-7 animate-spin text-white/85" aria-hidden />
            <div>
              <p className="text-sm font-black">Preparing {game.title}</p>
              <p className="mt-1 text-xs text-white/65">Loading the preserved local runtime</p>
            </div>
          </div>
        </div>
      </div>

      <div className="static-game-footer grid gap-2 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-4 py-3 text-xs font-semibold text-[var(--color-text-secondary)] sm:grid-cols-3 sm:px-5">
        <span className="inline-flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[var(--color-primary-text-strong)]" aria-hidden />
          Original runtime, locally hosted
        </span>
        <span className="sm:col-span-2">{focusHint}</span>
      </div>
    </section>
  );
}
