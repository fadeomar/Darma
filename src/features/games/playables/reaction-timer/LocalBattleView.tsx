"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, Check, Copy, Crosshair, RotateCcw, Swords, Timer, UserRound, Zap } from "lucide-react";
import { Badge, Button } from "@/components/ui";
import { ReactionInsightPanel } from "./ReactionInsightPanel";
import { ReactionSharePanel } from "./ReactionSharePanel";
import { cn } from "@/lib/cn";
import { isGameplayControlTarget, useActiveGameplayGuards, useVisibilityInterruption } from "./reactionRuntimeGuards";
import { copyTextToClipboard } from "@/lib/copy-to-clipboard";
import { TargetHunterStage } from "./TargetHunterStage";
import { evaluatePrecision, formatSeconds } from "./precisionScoring";
import { randomWaitMs } from "./reactionScoring";
import {
  LOCAL_BATTLE_CLASSIC_ROUNDS,
  LOCAL_BATTLE_PRECISION_TARGET_MS,
  buildClassicBattlePlayerResult,
  buildLocalBattleShareText,
  buildPrecisionBattlePlayerResult,
  buildTargetBattlePlayerResult,
  describePlayerResult,
  finalizeLocalBattle,
  formatBattleType,
  sanitizeBattleName,
} from "./localBattleScoring";
import { buildLocalBattleInsight } from "./reactionInsights";
import { buildLocalBattleShareResult, type ShareActionKind, type ShareableGameResult } from "./reactionShareCard";
import { battleResultFlow } from "./reactionSessionFlow";
import { ReactionSessionFlowPanel } from "./ReactionSessionFlowPanel";
import type { LocalBattlePlayerId, LocalBattlePlayerResult, LocalBattleResult, LocalBattleStats, LocalBattleType } from "./localBattleTypes";
import type { PlayCue } from "./reactionAudio";
import type { Vibrate } from "./reactionHaptics";
import type { TargetHunterResult } from "./targetHunterTypes";

type BattlePhase = "lobby" | "ready" | "classic-turn" | "precision-turn" | "target-turn" | "turn-result" | "battle-result";

const BATTLE_TYPES: { id: LocalBattleType; title: string; description: string; icon: typeof Zap; badges: string[] }[] = [
  {
    id: "classic",
    title: "Classic Battle",
    description: "Each player gets five reaction rounds. Lower average wins.",
    icon: Zap,
    badges: ["5 rounds", "average wins"],
  },
  {
    id: "precision",
    title: "Precision Battle",
    description: "Both players stop the same timer target. Closest to zero wins.",
    icon: Timer,
    badges: ["5.000s", "closest wins"],
  },
  {
    id: "target-hunter",
    title: "Target Hunt Battle",
    description: "Each player gets one quick hunt. Higher score wins.",
    icon: Crosshair,
    badges: ["30s", "score wins"],
  },
];

function playerLabel(player: LocalBattlePlayerId, p1: string, p2: string): string {
  return player === "player1" ? p1 : p2;
}

function LocalBattleLobby({
  stats,
  hydrated,
  player1Name,
  player2Name,
  battleType,
  onPlayer1Name,
  onPlayer2Name,
  onBattleType,
  onStart,
  onBack,
}: {
  stats: LocalBattleStats;
  hydrated: boolean;
  player1Name: string;
  player2Name: string;
  battleType: LocalBattleType;
  onPlayer1Name: (value: string) => void;
  onPlayer2Name: (value: string) => void;
  onBattleType: (value: LocalBattleType) => void;
  onStart: () => void;
  onBack: () => void;
}) {
  return (
    <div className="rtp-battle-lobby">
      <span className="rtp-eyebrow">Local Battle</span>
      <h2 className="rtp-lobby-title">Two players, one device</h2>
      <p className="rtp-lobby-text">
        Take turns on the same browser. No account, no network, no global ranking — just a quick local duel.
      </p>

      <div className="rtp-battle-namegrid">
        <label className="rtp-battle-namefield">
          <span><UserRound className="h-4 w-4" aria-hidden /> Player 1 name</span>
          <input value={player1Name} onChange={(event) => onPlayer1Name(event.target.value)} maxLength={24} placeholder="Player 1" />
        </label>
        <label className="rtp-battle-namefield">
          <span><UserRound className="h-4 w-4" aria-hidden /> Player 2 name</span>
          <input value={player2Name} onChange={(event) => onPlayer2Name(event.target.value)} maxLength={24} placeholder="Player 2" />
        </label>
      </div>

      <div className="rtp-battle-typegrid" role="radiogroup" aria-label="Choose local battle type">
        {BATTLE_TYPES.map((type, index) => {
          const Icon = type.icon;
          const selected = battleType === type.id;
          return (
            <button
              key={type.id}
              type="button"
              className={cn("rtp-battle-type", selected && "rtp-battle-type--active")}
              onClick={() => onBattleType(type.id)}
              onKeyDown={(event) => {
                if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"].includes(event.key)) return;
                event.preventDefault();
                const nextIndex = event.key === "Home"
                  ? 0
                  : event.key === "End"
                    ? BATTLE_TYPES.length - 1
                    : event.key === "ArrowRight" || event.key === "ArrowDown"
                      ? (index + 1) % BATTLE_TYPES.length
                      : (index - 1 + BATTLE_TYPES.length) % BATTLE_TYPES.length;
                const nextType = BATTLE_TYPES[nextIndex];
                if (nextType) onBattleType(nextType.id);
              }}
              role="radio"
              aria-checked={selected}
              aria-posinset={index + 1}
              aria-setsize={BATTLE_TYPES.length}
            >
              <span className="rtp-battle-type-icon" aria-hidden><Icon className="h-5 w-5" /></span>
              <span className="rtp-battle-type-title">{type.title}</span>
              <span className="rtp-battle-type-desc">{type.description}</span>
              <span className="rtp-battle-type-badges">
                {type.badges.map((badge) => <span key={badge}>{badge}</span>)}
              </span>
            </button>
          );
        })}
      </div>

      <div className="rtp-lobby-stats" aria-live="polite">
        <div className="rtp-lobby-stat">
          <span className="rtp-lobby-stat-label">Battles</span>
          <span className="rtp-lobby-stat-value">{hydrated ? stats.localBattleRuns : "—"}</span>
        </div>
        <div className="rtp-lobby-stat">
          <span className="rtp-lobby-stat-label">Last winner</span>
          <span className="rtp-lobby-stat-value">{hydrated ? stats.lastWinner ?? "—" : "—"}</span>
        </div>
        <div className="rtp-lobby-stat">
          <span className="rtp-lobby-stat-label">Classic best avg</span>
          <span className="rtp-lobby-stat-value">{stats.bestBattleClassicAverage ? `${stats.bestBattleClassicAverage} ms` : "—"}</span>
        </div>
        <div className="rtp-lobby-stat">
          <span className="rtp-lobby-stat-label">Target best</span>
          <span className="rtp-lobby-stat-value">{stats.bestBattleTargetScore ? stats.bestBattleTargetScore.toLocaleString() : "—"}</span>
        </div>
      </div>

      <div className="rtp-lobby-actions">
        <Button size="lg" onClick={onStart} leftIcon={<Swords className="h-5 w-5" aria-hidden />}>
          Start Battle
        </Button>
        <Button size="lg" variant="ghost" onClick={onBack} leftIcon={<ArrowLeft className="h-5 w-5" aria-hidden />}>
          Back to modes
        </Button>
      </div>

      <p className="rtp-battle-local-note">Names and results are stored only on this device. They are optional display labels.</p>
    </div>
  );
}

function BattleReady({
  battleType,
  player,
  playerName,
  onStart,
  onCancel,
}: {
  battleType: LocalBattleType;
  player: LocalBattlePlayerId;
  playerName: string;
  onStart: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="rtp-battle-ready">
      <span className="rtp-eyebrow">{formatBattleType(battleType)}</span>
      <div className="rtp-summary-trophy" aria-hidden>{player === "player1" ? "①" : "②"}</div>
      <h2 className="rtp-lobby-title">{playerName}, get ready</h2>
      <p className="rtp-lobby-text">
        {player === "player1" ? "Player 1 starts first." : "Pass the device to Player 2 before starting this turn."}
      </p>
      <div className="rtp-summary-actions">
        <Button size="lg" onClick={onStart} leftIcon={<PlayIcon />}>
          Start {playerName}'s turn
        </Button>
        <Button size="lg" variant="ghost" onClick={onCancel} leftIcon={<ArrowLeft className="h-5 w-5" aria-hidden />}>
          Back to lobby
        </Button>
      </div>
    </div>
  );
}

function PlayIcon() {
  return <Swords className="h-5 w-5" aria-hidden />;
}

function ClassicBattleTurn({
  playerName,
  play,
  vibrate,
  onComplete,
  onRestart,
  onQuit,
}: {
  playerName: string;
  play: PlayCue;
  vibrate: Vibrate;
  onComplete: (result: LocalBattlePlayerResult) => void;
  onRestart: () => void;
  onQuit: () => void;
}) {
  const [phase, setPhase] = useState<"countdown" | "waiting" | "signal" | "too-early" | "round-result" | "interrupted">("countdown");
  const [countdown, setCountdown] = useState(3);
  const [rounds, setRounds] = useState<number[]>([]);
  const [earlyPresses, setEarlyPresses] = useState(0);
  const [lastMs, setLastMs] = useState<number | null>(null);
  const signalShownAtRef = useRef(0);
  const lockRef = useRef(false);
  const roundsRef = useRef<number[]>([]);
  const earlyRef = useRef(0);

  useEffect(() => { roundsRef.current = rounds; }, [rounds]);
  useEffect(() => { earlyRef.current = earlyPresses; }, [earlyPresses]);

  const classicActive = ["countdown", "waiting", "signal", "too-early"].includes(phase);
  const interruptClassic = useCallback(() => {
    if (!classicActive) return;
    setPhase("interrupted");
    play("level.fail");
  }, [classicActive, play]);
  useActiveGameplayGuards(classicActive);
  useVisibilityInterruption(classicActive, interruptClassic);

  useEffect(() => {
    lockRef.current = false;
    let timer: number | null = null;
    if (phase === "countdown") {
      play("countdown.tick");
      timer = window.setTimeout(() => {
        if (countdown > 1) setCountdown((c) => c - 1);
        else setPhase("waiting");
      }, 650);
    } else if (phase === "waiting") {
      timer = window.setTimeout(() => {
        signalShownAtRef.current = performance.now();
        play("level.start");
        vibrate("signal");
        setPhase("signal");
      }, randomWaitMs());
    } else if (phase === "too-early") {
      timer = window.setTimeout(() => {
        setLastMs(null);
        setCountdown(1);
        setPhase("countdown");
      }, 1000);
    } else if (phase === "round-result") {
      timer = window.setTimeout(() => {
        if (roundsRef.current.length >= LOCAL_BATTLE_CLASSIC_ROUNDS) {
          onComplete(buildClassicBattlePlayerResult(roundsRef.current, earlyRef.current));
        } else {
          setCountdown(2);
          setPhase("countdown");
        }
      }, 950);
    }
    return () => { if (timer !== null) window.clearTimeout(timer); };
  }, [phase, countdown, onComplete, play, vibrate]);

  const press = useCallback(() => {
    if (lockRef.current) return;
    if (phase === "signal") {
      lockRef.current = true;
      const reactionMs = Math.max(0, Math.round(performance.now() - signalShownAtRef.current));
      setLastMs(reactionMs);
      setRounds((items) => [...items, reactionMs]);
      play(reactionMs < 300 ? "result.success" : "result.average");
      vibrate("tap");
      setPhase("round-result");
    } else if (phase === "waiting") {
      lockRef.current = true;
      setEarlyPresses((n) => n + 1);
      play("tooEarly.error");
      vibrate("tooEarly");
      setPhase("too-early");
    }
  }, [phase, play, vibrate]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (phase === "interrupted") return;
      if (event.code === "Space" || event.code === "Enter") {
        event.preventDefault();
        press();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [press]);

  if (phase === "interrupted") {
    return (
      <div className="rtp-battle-active" data-rtp-active-stage="true">
        <div className="rtp-run-interrupted" role="status" aria-live="assertive">
          <span className="rtp-eyebrow">Battle turn interrupted</span>
          <h2 className="rtp-pause-title">Restart {playerName}'s turn</h2>
          <p className="rtp-play-sub">The tab or app changed during this turn, so it was not scored.</p>
          <div className="rtp-summary-actions" data-rtp-control="true">
            <Button size="lg" onClick={onRestart}>Restart turn</Button>
            <Button size="lg" variant="ghost" onClick={onQuit}>Back to lobby</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rtp-battle-active"
      data-rtp-active-stage="true"
      onPointerDown={(event) => {
        if (isGameplayControlTarget(event.target, event.currentTarget)) return;
        event.preventDefault();
        press();
      }}
      role="button"
      tabIndex={0}
      aria-label={`${playerName} classic battle turn`}
    >
      <div className="rtp-battle-hud" data-rtp-control="true">
        <Badge variant="soft">{playerName}</Badge>
        <Badge variant="outline">Round {Math.min(rounds.length + 1, LOCAL_BATTLE_CLASSIC_ROUNDS)} / {LOCAL_BATTLE_CLASSIC_ROUNDS}</Badge>
        <Badge variant="outline">Early {earlyPresses}</Badge>
      </div>
      <span className="rtp-eyebrow">Classic Battle</span>
      <div className={cn("rtp-battle-signal", phase === "signal" && "rtp-battle-signal--go", phase === "too-early" && "rtp-battle-signal--error")} aria-live="assertive">
        {phase === "countdown" ? countdown : phase === "waiting" ? "Wait…" : phase === "signal" ? "GO" : phase === "too-early" ? "Too early" : `${lastMs} ms`}
      </div>
      <p className="rtp-lobby-text">Tap the arena or press Space/Enter. Controls do not count as input.</p>
    </div>
  );
}

function RunningPrecision({ startedAt }: { startedAt: number }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    let raf = 0;
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      setElapsed(performance.now() - startedAt);
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => { cancelled = true; window.cancelAnimationFrame(raf); };
  }, [startedAt]);
  return <>{(elapsed / 1000).toFixed(3)}s</>;
}

function PrecisionBattleTurn({
  playerName,
  play,
  vibrate,
  onComplete,
  onRestart,
  onQuit,
}: {
  playerName: string;
  play: PlayCue;
  vibrate: Vibrate;
  onComplete: (result: LocalBattlePlayerResult) => void;
  onRestart: () => void;
  onQuit: () => void;
}) {
  const [phase, setPhase] = useState<"countdown" | "running" | "interrupted">("countdown");
  const [countdown, setCountdown] = useState(3);
  const startedAtRef = useRef(0);
  const lockRef = useRef(false);
  const precisionActive = phase === "countdown" || phase === "running";
  const interruptPrecision = useCallback(() => {
    if (!precisionActive) return;
    lockRef.current = true;
    setPhase("interrupted");
    play("level.fail");
  }, [precisionActive, play]);
  useActiveGameplayGuards(precisionActive);
  useVisibilityInterruption(precisionActive, interruptPrecision);

  useEffect(() => {
    if (phase !== "countdown") return;
    play("countdown.tick");
    const timer = window.setTimeout(() => {
      if (countdown > 1) setCountdown((c) => c - 1);
      else {
        startedAtRef.current = performance.now();
        play("precision.start");
        vibrate("signal");
        setPhase("running");
      }
    }, 650);
    return () => window.clearTimeout(timer);
  }, [phase, countdown, play, vibrate]);

  const stop = useCallback(() => {
    if (phase !== "running" || lockRef.current) return;
    lockRef.current = true;
    const elapsed = performance.now() - startedAtRef.current;
    const result = evaluatePrecision(LOCAL_BATTLE_PRECISION_TARGET_MS, elapsed);
    play(result.absDifferenceMs <= 120 ? "precision.perfect" : "precision.stop");
    vibrate(result.absDifferenceMs <= 120 ? "victory" : "tap");
    onComplete(buildPrecisionBattlePlayerResult(LOCAL_BATTLE_PRECISION_TARGET_MS, elapsed));
  }, [phase, onComplete, play, vibrate]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (phase === "interrupted") return;
      if (event.code === "Space" || event.code === "Enter") {
        event.preventDefault();
        stop();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stop]);

  if (phase === "interrupted") {
    return (
      <div className="rtp-battle-active" data-rtp-active-stage="true">
        <div className="rtp-run-interrupted" role="status" aria-live="assertive">
          <span className="rtp-eyebrow">Battle turn interrupted</span>
          <h2 className="rtp-pause-title">Restart {playerName}'s turn</h2>
          <p className="rtp-play-sub">The tab or app changed during this timing attempt, so it was not scored.</p>
          <div className="rtp-summary-actions" data-rtp-control="true">
            <Button size="lg" onClick={onRestart}>Restart turn</Button>
            <Button size="lg" variant="ghost" onClick={onQuit}>Back to lobby</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rtp-battle-active"
      data-rtp-active-stage="true"
      onPointerDown={(event) => {
        if (isGameplayControlTarget(event.target, event.currentTarget)) return;
        event.preventDefault();
        stop();
      }}
      role="button"
      tabIndex={0}
      aria-label={`${playerName} precision battle turn`}
    >
      <div className="rtp-battle-hud" data-rtp-control="true">
        <Badge variant="soft">{playerName}</Badge>
        <Badge variant="outline">Target {formatSeconds(LOCAL_BATTLE_PRECISION_TARGET_MS)}</Badge>
      </div>
      <span className="rtp-eyebrow">Precision Battle</span>
      <div className={cn("rtp-battle-signal", phase === "running" && "rtp-battle-signal--go")} aria-live="assertive">
        {phase === "countdown" ? countdown : <RunningPrecision startedAt={startedAtRef.current} />}
      </div>
      <p className="rtp-lobby-text">Stop as close as possible to {formatSeconds(LOCAL_BATTLE_PRECISION_TARGET_MS)}.</p>
    </div>
  );
}

function TurnResultGate({
  activePlayer,
  player1Name,
  player2Name,
  latestResult,
  onNext,
  onBack,
}: {
  activePlayer: LocalBattlePlayerId;
  player1Name: string;
  player2Name: string;
  latestResult: LocalBattlePlayerResult | null;
  onNext: () => void;
  onBack: () => void;
}) {
  const nextPlayer = activePlayer === "player1" ? player2Name : "results";
  return (
    <div className="rtp-battle-ready">
      <span className="rtp-eyebrow">Turn complete</span>
      <h2 className="rtp-lobby-title">{playerLabel(activePlayer, player1Name, player2Name)} finished</h2>
      {latestResult ? <p className="rtp-battle-turn-summary">{describePlayerResult(latestResult)}</p> : null}
      <p className="rtp-lobby-text">
        {activePlayer === "player1" ? `Pass the device to ${nextPlayer}. They should start only when ready.` : "Both turns are complete."}
      </p>
      <div className="rtp-summary-actions">
        <Button size="lg" onClick={onNext} leftIcon={<Swords className="h-5 w-5" aria-hidden />}>
          {activePlayer === "player1" ? `Ready for ${player2Name}` : "Show winner"}
        </Button>
        <Button size="lg" variant="ghost" onClick={onBack} leftIcon={<ArrowLeft className="h-5 w-5" aria-hidden />}>
          Back to lobby
        </Button>
      </div>
    </div>
  );
}

function BattleResultCard({ result, onRematch, onChangeMode, onBack, onShareAction }: { result: LocalBattleResult; onRematch: () => void; onChangeMode: () => void; onBack: () => void; onShareAction?: (action: ShareActionKind, result: ShareableGameResult) => void }) {
  const [copied, setCopied] = useState(false);
  const insight = buildLocalBattleInsight(result);
  const shareResult = buildLocalBattleShareResult(result);
  const flow = battleResultFlow(result.winner === "draw");
  const handleCopy = async () => {
    const ok = await copyTextToClipboard(buildLocalBattleShareText(result));
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    }
  };
  return (
    <div className="rtp-battle-result">
      <div className="rtp-summary-trophy" aria-hidden>{result.winner === "draw" ? "🤝" : "🏆"}</div>
      <span className="rtp-eyebrow">{formatBattleType(result.battleType)}</span>
      <h2 className="rtp-lobby-title">{result.primaryMetric}</h2>
      <div className="rtp-rank-badge">
        <span aria-hidden>{result.winner === "draw" ? "🤝" : "⚔️"}</span>
        <span>{result.marginLabel}</span>
      </div>
      <div className="rtp-battle-compare">
        <div className={cn("rtp-battle-player-card", result.winner === "player1" && "rtp-battle-player-card--winner")}>
          <span className="rtp-battle-player-name">{result.player1Name}</span>
          <span>{describePlayerResult(result.player1Result)}</span>
        </div>
        <div className={cn("rtp-battle-player-card", result.winner === "player2" && "rtp-battle-player-card--winner")}>
          <span className="rtp-battle-player-name">{result.player2Name}</span>
          <span>{describePlayerResult(result.player2Result)}</span>
        </div>
      </div>
      <p className="rtp-result-tip">{result.summary}</p>
      <ReactionInsightPanel insight={insight} compact />
      <ReactionSharePanel result={shareResult} onShareAction={onShareAction} compact />
      <ReactionSessionFlowPanel flow={flow} compact />
      <div className="rtp-summary-actions" data-rtp-control="true">
        <Button size="lg" onClick={onRematch} leftIcon={<RotateCcw className="h-5 w-5" aria-hidden />}>Rematch</Button>
        <Button size="lg" variant="secondary" onClick={handleCopy} leftIcon={copied ? <Check className="h-5 w-5" aria-hidden /> : <Copy className="h-5 w-5" aria-hidden />}>{copied ? "Copied" : "Copy result"}</Button>
        <Button size="lg" variant="outline" onClick={onChangeMode}>Change battle</Button>
        <Button size="lg" variant="ghost" onClick={onBack} leftIcon={<ArrowLeft className="h-5 w-5" aria-hidden />}>Back to modes</Button>
      </div>
    </div>
  );
}

export function LocalBattleView({
  stats,
  hydrated,
  reducedMotion,
  highContrast,
  play,
  vibrate,
  onComplete,
  onRunStart,
  onBack,
  topControls,
  modal,
  onModalBackdrop,
  onShareAction,
}: {
  stats: LocalBattleStats;
  hydrated: boolean;
  reducedMotion: boolean;
  highContrast?: boolean;
  play: PlayCue;
  vibrate: Vibrate;
  onComplete: (result: LocalBattleResult) => void;
  onRunStart?: () => void;
  onBack: () => void;
  topControls?: ReactNode;
  modal?: ReactNode;
  onModalBackdrop?: () => void;
  onShareAction?: (action: ShareActionKind, result: ShareableGameResult) => void;
}) {
  const [phase, setPhase] = useState<BattlePhase>("lobby");
  const [battleType, setBattleType] = useState<LocalBattleType>("classic");
  const [player1Name, setPlayer1Name] = useState(stats.defaultPlayer1Name || "Player 1");
  const [player2Name, setPlayer2Name] = useState(stats.defaultPlayer2Name || "Player 2");
  const [activePlayer, setActivePlayer] = useState<LocalBattlePlayerId>("player1");
  const [player1Result, setPlayer1Result] = useState<LocalBattlePlayerResult | null>(null);
  const [player2Result, setPlayer2Result] = useState<LocalBattlePlayerResult | null>(null);
  const [result, setResult] = useState<LocalBattleResult | null>(null);
  const [runKey, setRunKey] = useState(0);
  const [isRematch, setIsRematch] = useState(false);

  useEffect(() => {
    if (phase === "lobby") {
      setPlayer1Name(stats.defaultPlayer1Name || "Player 1");
      setPlayer2Name(stats.defaultPlayer2Name || "Player 2");
    }
  }, [stats.defaultPlayer1Name, stats.defaultPlayer2Name, phase]);

  const cleanP1 = useMemo(() => sanitizeBattleName(player1Name, "Player 1"), [player1Name]);
  const cleanP2 = useMemo(() => sanitizeBattleName(player2Name, "Player 2"), [player2Name]);

  const startBattle = useCallback((rematch = false) => {
    onRunStart?.();
    setIsRematch(rematch);
    setResult(null);
    setPlayer1Result(null);
    setPlayer2Result(null);
    setActivePlayer("player1");
    setPhase("ready");
  }, [onRunStart]);

  const startTurn = useCallback(() => {
    setRunKey((k) => k + 1);
    if (battleType === "classic") setPhase("classic-turn");
    else if (battleType === "precision") setPhase("precision-turn");
    else setPhase("target-turn");
  }, [battleType]);

  const finalizeIfReady = useCallback((p1: LocalBattlePlayerResult, p2: LocalBattlePlayerResult) => {
    const finalResult = finalizeLocalBattle({
      battleType,
      player1Name: cleanP1,
      player2Name: cleanP2,
      player1Result: p1,
      player2Result: p2,
      rematch: isRematch,
    });
    onComplete(finalResult);
    setResult(finalResult);
    setPhase("battle-result");
  }, [battleType, cleanP1, cleanP2, isRematch, onComplete]);

  const handleTurnComplete = useCallback((turnResult: LocalBattlePlayerResult) => {
    play("ui.click");
    vibrate("tap");
    if (activePlayer === "player1") {
      setPlayer1Result(turnResult);
      setPhase("turn-result");
    } else {
      setPlayer2Result(turnResult);
      if (player1Result) finalizeIfReady(player1Result, turnResult);
      else setPhase("turn-result");
    }
  }, [activePlayer, finalizeIfReady, play, player1Result, vibrate]);

  const continueAfterTurn = () => {
    if (activePlayer === "player1") {
      setActivePlayer("player2");
      setPhase("ready");
    } else if (player1Result && player2Result) {
      finalizeIfReady(player1Result, player2Result);
    }
  };

  const backToLobby = () => {
    setPhase("lobby");
    setResult(null);
    setPlayer1Result(null);
    setPlayer2Result(null);
    setActivePlayer("player1");
  };

  const handleTargetComplete = (targetResult: TargetHunterResult) => {
    handleTurnComplete(buildTargetBattlePlayerResult(targetResult));
  };

  return (
    <div className={cn("rtp-stage rtp-stage--idle rtp-battle-shell", highContrast && "rtp-battle-shell--contrast")}>
      {topControls ? (
        <div className="rtp-stage-top" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()}>
          {topControls}
        </div>
      ) : null}

      {phase === "classic-turn" ? (
        <ClassicBattleTurn key={runKey} playerName={playerLabel(activePlayer, cleanP1, cleanP2)} play={play} vibrate={vibrate} onComplete={handleTurnComplete} onRestart={() => setRunKey((k) => k + 1)} onQuit={backToLobby} />
      ) : phase === "precision-turn" ? (
        <PrecisionBattleTurn key={runKey} playerName={playerLabel(activePlayer, cleanP1, cleanP2)} play={play} vibrate={vibrate} onComplete={handleTurnComplete} onRestart={() => setRunKey((k) => k + 1)} onQuit={backToLobby} />
      ) : phase === "target-turn" ? (
        <TargetHunterStage key={runKey} reducedMotion={reducedMotion} play={play} vibrate={vibrate} onComplete={handleTargetComplete} onQuit={backToLobby} onRestart={() => setRunKey((k) => k + 1)} />
      ) : (
        <div className="rtp-stage-overlay">
          {phase === "lobby" ? (
            <LocalBattleLobby
              stats={stats}
              hydrated={hydrated}
              player1Name={player1Name}
              player2Name={player2Name}
              battleType={battleType}
              onPlayer1Name={setPlayer1Name}
              onPlayer2Name={setPlayer2Name}
              onBattleType={setBattleType}
              onStart={() => startBattle(false)}
              onBack={onBack}
            />
          ) : phase === "ready" ? (
            <BattleReady
              battleType={battleType}
              player={activePlayer}
              playerName={playerLabel(activePlayer, cleanP1, cleanP2)}
              onStart={startTurn}
              onCancel={backToLobby}
            />
          ) : phase === "turn-result" ? (
            <TurnResultGate
              activePlayer={activePlayer}
              player1Name={cleanP1}
              player2Name={cleanP2}
              latestResult={activePlayer === "player1" ? player1Result : player2Result}
              onNext={continueAfterTurn}
              onBack={backToLobby}
            />
          ) : result ? (
            <BattleResultCard result={result} onRematch={() => startBattle(true)} onChangeMode={backToLobby} onBack={onBack} onShareAction={onShareAction} />
          ) : null}
        </div>
      )}

      {modal ? (
        <div
          className="rtp-stage-modal"
          onPointerDown={(event) => {
            event.stopPropagation();
            if (event.target === event.currentTarget) onModalBackdrop?.();
          }}
          onClick={(event) => event.stopPropagation()}
        >
          {modal}
        </div>
      ) : null}
    </div>
  );
}
