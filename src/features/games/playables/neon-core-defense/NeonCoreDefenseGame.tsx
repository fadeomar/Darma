"use client";

/**
 * Neon Core Defense — the production player for `/games/neon-core-defense`.
 *
 * An original neon reskin of the classic "defend the centre" arcade shooter. The
 * simulation lives in `neonCoreEngine.ts` (delta-time, frame-rate independent) and
 * is held in a ref; a single requestAnimationFrame loop advances physics and
 * renders to a high-DPI canvas.
 *
 * React state never changes per frame. The loop rebuilds a small `HudSnapshot`
 * each tick and pushes it into state only when a field actually differs, so a
 * quiet arena costs zero renders. Anything that *would* change every frame — the
 * weapon cooldown meter, effect auras — is drawn on the canvas instead, and
 * effect countdowns are quantised to 0.1s so the chips tick rather than churn.
 *
 * There are no DOM timers: every countdown (spawn cadence, wave break, fire
 * cooldown, power-up duration) is a number inside the model, which is what makes
 * pause exact and leaves nothing to leak on unmount. React owns only the menus,
 * HUD, overlays, and the upgrade choice; the engine owns the game.
 *
 * The arena is whatever size the canvas is rendered at, so `resizeWorld` keeps the
 * simulation and the backing store in step on layout changes. All artwork is drawn
 * procedurally — no third-party assets.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Coins,
  Crosshair,
  Gamepad2,
  Gauge,
  Heart,
  Keyboard,
  Layers,
  Lock,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Settings2,
  Shield,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { Badge, Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { GameDefinition } from "../../domain/game";
import { useGameExperience, useGameExperienceControls } from "../../engine/GameExperienceProvider";
import {
  accuracyPercent,
  activeThreats,
  aimHoldFire,
  applyLoadout,
  applyUpgrade,
  beginHoldFire,
  createGame,
  DEFAULT_CONFIG,
  derivedWeapon,
  endHoldFire,
  endRun,
  favouriteWeapon,
  POWER_UP_ORDER,
  resetGame,
  resizeWorld,
  setParticleCap,
  setWeapon,
  update,
  WEAPON_ORDER,
} from "./neonCoreEngine";
import {
  activeTheme,
  claimMission,
  defaultProgress,
  deriveConfig,
  equipTheme,
  equipWeapon,
  evaluateRun,
  levelForXp,
  purchase,
  refreshDaily,
  toggleModifier,
  unlockedWeapons,
  updateSettings,
  type GameSettings,
  type MissionId,
  type ModifierId,
  type ProgressState,
  type RunRewards,
  type RunResult,
  type ThemeId,
  type ThemePalette,
} from "./neonCoreProgression";
import {
  exportProgress,
  importProgress,
  readProgress,
  resetProgress,
  writeProgress,
} from "./neonCoreStorage";
import { attachHoldFire, type AimPoint } from "./neonCoreInput";
import { getNeonAudio, vibrate, type SfxId } from "./neonCoreAudio";
import { NeonCoreSettingsPanel } from "./NeonCoreSettingsPanel";
import { NeonCoreProgressionScreen } from "./NeonCoreProgressionScreen";
import type {
  Drop,
  Enemy,
  EnemyKind,
  HudSnapshot,
  NeonCoreModel,
  NeonCorePhase,
  PowerUpId,
  RunStats,
  UpgradeId,
  WeaponId,
} from "./neonCoreTypes";

const CONTROLS: { keys: string; label: string }[] = [
  { keys: "Click / Tap", label: "Fire toward the pointer" },
  { keys: "Hold", label: "Sustained fire — rate climbs as you hold" },
  { keys: "1 / 2 / 3", label: "Switch weapon · pick upgrade" },
  { keys: "Enter", label: "Start / Restart" },
  { keys: "P · Esc", label: "Pause" },
];

const ENEMY_GUIDE: { kind: EnemyKind; label: string; blurb: string }[] = [
  { kind: "basic", label: "Drone", blurb: "Standard speed and armour." },
  { kind: "fast", label: "Dart", blurb: "Small and quick, but fragile." },
  { kind: "tank", label: "Hulk", blurb: "Slow, heavily armoured, hits hard." },
  { kind: "splitter", label: "Splitter", blurb: "Breaks into two smaller drones." },
];

const UPGRADE_ICONS: Record<UpgradeId, React.ReactNode> = {
  damage: <Zap className="h-5 w-5" aria-hidden />,
  fireRate: <Gauge className="h-5 w-5" aria-hidden />,
  projectileSpeed: <Crosshair className="h-5 w-5" aria-hidden />,
  coreHealth: <Heart className="h-5 w-5" aria-hidden />,
  scoreMultiplier: <Sparkles className="h-5 w-5" aria-hidden />,
};

const POWER_UP_ICONS: Record<PowerUpId, React.ReactNode> = {
  shield: <Shield className="h-3.5 w-3.5" aria-hidden />,
  slowTime: <Gauge className="h-3.5 w-3.5" aria-hidden />,
  multiShot: <Layers className="h-3.5 w-3.5" aria-hidden />,
  explosive: <Sparkles className="h-3.5 w-3.5" aria-hidden />,
};

const EMPTY_HUD: HudSnapshot = {
  score: 0,
  combo: 0,
  multiplier: 1,
  wave: 1,
  waveState: "spawning",
  health: DEFAULT_CONFIG.coreMaxHealth,
  maxHealth: DEFAULT_CONFIG.coreMaxHealth,
  threats: 0,
  breakSeconds: 0,
  weapon: "pulse",
  effects: [],
  pendingUpgrades: [],
  upgradeLevels: { damage: 0, fireRate: 0, projectileSpeed: 0, coreHealth: 0, scoreMultiplier: 0 },
};

/** Everything the game-over card shows, frozen at the moment the core fell. */
type RunSummary = RunStats & {
  score: number;
  accuracy: number;
};

function readHud(model: NeonCoreModel): HudSnapshot {
  const effects = POWER_UP_ORDER.filter((id) => model.effects[id] > 0).map((id) => {
    // Quantised to 0.1s: enough for a smooth chip, far short of a per-frame render.
    const remaining = Math.ceil(model.effects[id] * 10) / 10;
    return { id, remaining, ratio: Math.min(1, remaining / model.config.powerUps.types[id].maxDuration) };
  });
  return {
    score: model.score,
    combo: model.combo,
    multiplier: model.multiplier,
    wave: model.wave,
    waveState: model.waveState,
    health: model.core.health,
    maxHealth: model.core.maxHealth,
    threats: activeThreats(model),
    breakSeconds: model.waveState === "break" ? Math.max(0, Math.ceil(model.breakTimer)) : 0,
    weapon: model.weapon,
    effects,
    pendingUpgrades: model.pendingUpgrades,
    upgradeLevels: { ...model.upgrades },
  };
}

/** Field-wise compare, so the loop can skip the setState when nothing moved. */
function sameHud(a: HudSnapshot, b: HudSnapshot): boolean {
  if (
    a.score !== b.score ||
    a.combo !== b.combo ||
    a.multiplier !== b.multiplier ||
    a.wave !== b.wave ||
    a.waveState !== b.waveState ||
    a.health !== b.health ||
    a.maxHealth !== b.maxHealth ||
    a.threats !== b.threats ||
    a.breakSeconds !== b.breakSeconds ||
    a.weapon !== b.weapon
  ) {
    return false;
  }
  if (a.effects.length !== b.effects.length) return false;
  for (let i = 0; i < a.effects.length; i += 1) {
    if (a.effects[i].id !== b.effects[i].id || a.effects[i].remaining !== b.effects[i].remaining) return false;
  }
  if (a.pendingUpgrades.length !== b.pendingUpgrades.length) return false;
  for (let i = 0; i < a.pendingUpgrades.length; i += 1) {
    if (a.pendingUpgrades[i] !== b.pendingUpgrades[i]) return false;
  }
  if (
    a.upgradeLevels.damage !== b.upgradeLevels.damage ||
    a.upgradeLevels.fireRate !== b.upgradeLevels.fireRate ||
    a.upgradeLevels.projectileSpeed !== b.upgradeLevels.projectileSpeed ||
    a.upgradeLevels.coreHealth !== b.upgradeLevels.coreHealth ||
    a.upgradeLevels.scoreMultiplier !== b.upgradeLevels.scoreMultiplier
  ) {
    return false;
  }
  return true;
}

function formatTime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/** Cosmetic render toggles derived from settings + `prefers-reduced-motion`. */
type RenderFlags = {
  reducedMotion: boolean;
  shake: boolean;
  trails: boolean;
  /** Rich projectile/enemy glow; dropped in performance mode. */
  glow: boolean;
};

const FULL_MOTION: RenderFlags = { reducedMotion: false, shake: true, trails: true, glow: true };

/** A transient on-screen notification. */
type Notice = { id: number; kind: "wave" | "danger" | "reward"; text: string };

/**
 * Fold settings + the OS motion preference into concrete render flags and a live
 * particle cap. The engine never reads settings; the component pushes the cap in.
 */
function resolveRenderFlags(settings: GameSettings, prefersReducedMotion: boolean): RenderFlags {
  const reduced = settings.reducedMotion || prefersReducedMotion;
  const perf = settings.performanceMode;
  return {
    reducedMotion: reduced,
    shake: settings.screenShake && !reduced,
    trails: !reduced && !perf,
    glow: !perf,
  };
}

function resolveParticleCap(settings: GameSettings, prefersReducedMotion: boolean, max: number): number {
  if (!settings.particles) return 0;
  const reduced = settings.reducedMotion || prefersReducedMotion;
  if (settings.performanceMode) return Math.min(max, 80);
  if (reduced) return Math.min(max, 120);
  return max;
}

/** New dangerous enemy type introduced on this wave, if any. */
function dangerForWave(wave: number): string | null {
  if (wave === DEFAULT_CONFIG.enemies.tank.unlockWave) return "Hulks incoming — slow but heavy hitters";
  if (wave === DEFAULT_CONFIG.enemies.splitter.unlockWave) return "Splitters incoming — they break apart";
  if (wave === DEFAULT_CONFIG.enemies.fast.unlockWave) return "Darts incoming — fast and fragile";
  return null;
}

export function NeonCoreDefenseGame({ game }: { game: GameDefinition }) {
  const router = useRouter();
  const {
    hydrated: sharedExperienceHydrated,
    preferences: sharedPreferences,
    updatePreference: updateSharedPreference,
    startSession: startSharedSession,
    pauseSession: pauseSharedSession,
    resumeSession: resumeSharedSession,
    completeSession: completeSharedSession,
    abandonSession: abandonSharedSession,
  } = useGameExperience();

  const [phase, setPhase] = useState<NeonCorePhase>("intro");
  const [hud, setHud] = useState<HudSnapshot>(EMPTY_HUD);
  const [progress, setProgress] = useState<ProgressState>(() => defaultProgress());
  const [hydrated, setHydrated] = useState(false);
  const [summary, setSummary] = useState<RunSummary | null>(null);
  const [rewards, setRewards] = useState<RunRewards | null>(null);
  const [showProgress, setShowProgress] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [notices, setNotices] = useState<Notice[]>([]);

  const shellRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const modelRef = useRef<NeonCoreModel>(createGame());
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const elapsedRef = useRef(0);
  const phaseRef = useRef<NeonCorePhase>("intro");
  const hudRef = useRef<HudSnapshot>(EMPTY_HUD);
  const progressRef = useRef<ProgressState>(progress);
  const themeRef = useRef<ThemePalette>(activeTheme(progress));
  const settingsRef = useRef<GameSettings>(progress.settings);
  const flagsRef = useRef<RenderFlags>(FULL_MOTION);
  const reducedMotionRef = useRef(false);
  const dprRef = useRef(1);

  // Audio is a process-wide singleton; grab it once and keep the handle stable.
  const audioRef = useRef(getNeonAudio());
  // Debounced storage write for continuous settings changes (volume sliders).
  const persistTimerRef = useRef<number | null>(null);
  // Auto-dismiss timers for notices, plus the id source and a short dedupe cache.
  const noticeTimersRef = useRef<Map<number, number>>(new Map());
  const noticeIdRef = useRef(0);
  const lastNoticeRef = useRef<Map<string, number>>(new Map());

  // Keep refs in sync with state the RAF loop / handlers read without re-subscribing.
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  useEffect(() => {
    progressRef.current = progress;
    themeRef.current = activeTheme(progress);
  }, [progress]);

  /** Persist a new progress value and mirror it into state + ref. One write per call. */
  const commitProgress = useCallback((next: ProgressState) => {
    progressRef.current = next;
    themeRef.current = activeTheme(next);
    writeProgress(next);
    setProgress(next);
  }, []);

  /**
   * Apply settings to the running simulation/audio without persisting. Declared
   * before the effects that depend on it so its identity is available to their
   * dependency arrays.
   */
  const applyRuntimeSettings = useCallback((s: GameSettings) => {
    settingsRef.current = s;
    flagsRef.current = resolveRenderFlags(s, reducedMotionRef.current);
    setParticleCap(modelRef.current, resolveParticleCap(s, reducedMotionRef.current, modelRef.current.config.maxParticles));
    audioRef.current.applySettings({ music: s.music, sfx: s.sfx, musicVolume: s.musicVolume, sfxVolume: s.sfxVolume });
  }, []);

  // Hydrate stored progress after mount so SSR and client markup agree. `readProgress`
  // resolves the local date, so daily challenges reset here if the day rolled over.
  useEffect(() => {
    const loaded = readProgress();
    progressRef.current = loaded;
    themeRef.current = activeTheme(loaded);
    setProgress(loaded);
    setHydrated(true);
  }, []);

  // Track reduced-motion preference; re-derive render flags + particle cap when it
  // changes so the OS setting is honoured live, on top of the in-game toggle.
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      reducedMotionRef.current = query.matches;
      applyRuntimeSettings(settingsRef.current);
    };
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, [applyRuntimeSettings]);

  // Mirror settings into the runtime whenever progress (hence settings) changes —
  // covers hydration, import, and reset as well as direct toggles.
  useEffect(() => {
    applyRuntimeSettings(progress.settings);
  }, [progress.settings, applyRuntimeSettings]);

  // Keep the fullscreen flag honest even when the browser exits fullscreen on its
  // own (Esc, gesture), so the control never shows a stale state.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // Tear audio down and clear every pending timer on unmount / route exit, so no
  // loop, oscillator, or setTimeout survives the component.
  useEffect(() => {
    const audio = audioRef.current;
    const noticeTimers = noticeTimersRef.current;
    return () => {
      audio.stopMusic();
      audio.teardown();
      if (persistTimerRef.current) {
        window.clearTimeout(persistTimerRef.current);
        writeProgress(progressRef.current);
      }
      noticeTimers.forEach((timer) => window.clearTimeout(timer));
      noticeTimers.clear();
    };
  }, []);

  /** Push the model's HUD slice into state right now (used off the RAF path). */
  const syncHud = useCallback(() => {
    const next = readHud(modelRef.current);
    hudRef.current = next;
    setHud(next);
  }, []);

  const playSfx = useCallback((id: SfxId) => {
    audioRef.current.playSfx(id);
  }, []);

  const haptic = useCallback((pattern: number | number[]) => {
    vibrate(pattern, settingsRef.current.haptics);
  }, []);

  /**
   * Queue a transient notice. Deduped by `key` within 1.5 s so a repeated event
   * (e.g. two dailies completing) can't spam the same banner, and the visible list
   * is capped so notices can't pile up. Only ever called on discrete events.
   */
  const notify = useCallback((kind: Notice["kind"], key: string, text: string, ttl = 2000) => {
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    const last = lastNoticeRef.current.get(key) ?? -Infinity;
    if (now - last < 1500) return;
    lastNoticeRef.current.set(key, now);
    const id = (noticeIdRef.current += 1);
    setNotices((prev) => [...prev.slice(-3), { id, kind, text }]);
    const timer = window.setTimeout(() => {
      setNotices((prev) => prev.filter((n) => n.id !== id));
      noticeTimersRef.current.delete(id);
    }, ttl);
    noticeTimersRef.current.set(id, timer);
  }, []);

  /**
   * Change settings. The runtime updates immediately, but the storage write is
   * debounced 400 ms so dragging a volume slider can't write on every step.
   */
  const handleSettingsChange = useCallback(
    (patch: Partial<GameSettings>) => {
      audioRef.current.unlock(); // a settings interaction is a trusted gesture
      const next = updateSettings(progressRef.current, patch);
      progressRef.current = next;
      applyRuntimeSettings(next.settings);
      setProgress(next);
      if ("music" in patch || "sfx" in patch) {
        updateSharedPreference("muted", !next.settings.music && !next.settings.sfx);
      }
      if ("reducedMotion" in patch) {
        updateSharedPreference("reducedMotion", next.settings.reducedMotion);
      }
      if (persistTimerRef.current) window.clearTimeout(persistTimerRef.current);
      persistTimerRef.current = window.setTimeout(() => {
        writeProgress(progressRef.current);
        persistTimerRef.current = null;
      }, 400);
    },
    [applyRuntimeSettings, updateSharedPreference],
  );

  /** Flush any pending debounced settings write immediately. */
  const flushSettings = useCallback(() => {
    if (persistTimerRef.current) {
      window.clearTimeout(persistTimerRef.current);
      persistTimerRef.current = null;
      writeProgress(progressRef.current);
    }
  }, []);

  // The shared Darma preference remains the cross-game source of truth.
  useEffect(() => {
    if (!hydrated || !sharedExperienceHydrated) return;
    const patch: Partial<GameSettings> = {};
    const locallyMuted = !progress.settings.music && !progress.settings.sfx;
    if (locallyMuted !== sharedPreferences.muted) {
      patch.music = !sharedPreferences.muted;
      patch.sfx = !sharedPreferences.muted;
    }
    if (progress.settings.reducedMotion !== sharedPreferences.reducedMotion) {
      patch.reducedMotion = sharedPreferences.reducedMotion;
      if (sharedPreferences.reducedMotion) patch.screenShake = false;
    }
    if (Object.keys(patch).length > 0) handleSettingsChange(patch);
  }, [handleSettingsChange, hydrated, progress.settings.music, progress.settings.reducedMotion, progress.settings.sfx, sharedExperienceHydrated, sharedPreferences.muted, sharedPreferences.reducedMotion]);

  const toggleFullscreen = useCallback(() => {
    const el = shellRef.current;
    if (typeof document === "undefined" || !el) return;
    audioRef.current.unlock();
    try {
      if (document.fullscreenElement) void document.exitFullscreen?.();
      else void el.requestFullscreen?.();
    } catch {
      // Some browsers reject fullscreen outside a gesture — ignore.
    }
  }, []);

  const endGame = useCallback(() => {
    if (phaseRef.current === "over") return;
    phaseRef.current = "over";
    setPhase("over");

    const model = modelRef.current;
    // Freeze the run's numbers into state now — the model is reused on restart.
    const finished: RunSummary = {
      ...model.stats,
      shotsByWeapon: { ...model.stats.shotsByWeapon },
      powerUpsByKind: { ...model.stats.powerUpsByKind },
      score: model.score,
      accuracy: accuracyPercent(model),
    };
    setSummary(finished);

    // Fold the run into persistent progression — the single write-through for a run.
    // `evaluateRun` handles XP, level-up cores, achievements, dailies, and the daily
    // date-rollover reset; it is called exactly once per game-over, never per frame.
    const runResult: RunResult = {
      score: finished.score,
      wave: finished.waveReached,
      combo: finished.highestCombo,
      accuracy: finished.accuracy,
      shotsFired: finished.shotsFired,
      shotsHit: finished.shotsHit,
      enemiesDestroyed: finished.enemiesDestroyed,
      survivalTime: finished.survivalTime,
      powerUpsCollected: finished.powerUpsCollected,
      flawlessWaves: finished.flawlessWaves,
      damageTaken: finished.damageTaken,
      shotsByWeapon: finished.shotsByWeapon,
      powerUpsByKind: finished.powerUpsByKind,
    };
    const { state: nextProgress, rewards: runRewards } = evaluateRun(progressRef.current, runResult, new Date());
    commitProgress(nextProgress);
    setRewards(runRewards);

    // Feedback: game-over cue, a heavier achievement sting if any unlocked, a long
    // haptic buzz, and one notice per reward class (each deduped by key).
    playSfx("gameOver");
    haptic([40, 60, 120]);
    if (runRewards.achievementsUnlocked.length > 0) {
      window.setTimeout(() => playSfx("achievement"), 380);
      for (const a of runRewards.achievementsUnlocked) notify("reward", `ach:${a.id}`, `Achievement: ${a.label}`, 3200);
    }
    for (const daily of runRewards.dailiesCompleted) notify("reward", `daily:${daily.key}`, "Daily challenge complete!", 3200);
    if (runRewards.leveledUp) notify("reward", `lvl:${runRewards.levelAfter}`, `Level ${runRewards.levelAfter} reached!`, 3200);

    completeSharedSession({
      score: finished.score,
      scoreLabel: `Wave ${finished.waveReached} · ${finished.accuracy}% accuracy`,
      summary: `${finished.score} points across ${finished.waveReached} waves.`,
      outcome: "lost",
      stats: {
        Wave: finished.waveReached,
        Accuracy: `${finished.accuracy}%`,
        Destroyed: finished.enemiesDestroyed,
        "Best combo": `${finished.highestCombo}×`,
        Survived: `${Math.round(finished.survivalTime)}s`,
      },
      trackBestScore: true,
    });

    // Drop live effects, drops, and in-flight rounds so nothing survives the run.
    endRun(model);
    syncHud();
  }, [syncHud, commitProgress, playSfx, haptic, notify, completeSharedSession]);

  const startGame = useCallback(() => {
    const model = modelRef.current;
    // Apply the equipped loadout before resetting: modifiers reshape the config the
    // engine reads, and the run opens with the equipped (unlocked) weapon.
    const current = progressRef.current;
    const startWeapon = unlockedWeapons(current).has(current.loadout.weapon) ? current.loadout.weapon : "pulse";
    applyLoadout(model, deriveConfig(current), startWeapon);
    resetGame(model);
    // Re-apply the particle cap: resetGame doesn't know about settings.
    applyRuntimeSettings(settingsRef.current);
    syncHud();
    setSummary(null);
    setRewards(null);
    setShowProgress(false);
    setShowSettings(false);
    setNotices([]);
    // Starting is a trusted gesture: unlock audio, resume the context, start music.
    audioRef.current.unlock();
    audioRef.current.resume();
    if (settingsRef.current.music) audioRef.current.startMusic();
    // Drop the stale timestamp so the first frame of a new run gets dt = 0
    // instead of a huge jump that would teleport enemies into the core.
    lastTimeRef.current = null;
    if (phaseRef.current === "playing" || phaseRef.current === "paused") abandonSharedSession();
    phaseRef.current = "playing";
    setPhase("playing");
    startSharedSession({ mode: "defense-run" });
  }, [syncHud, applyRuntimeSettings, abandonSharedSession, startSharedSession]);

  const togglePause = useCallback(() => {
    setPhase((current) => {
      if (current === "playing") {
        phaseRef.current = "paused";
        // Drop the trigger: pausing mid-hold must not resume into a burst, and the
        // ramp restarts from the next press rather than from where it froze.
        endHoldFire(modelRef.current);
        // Freeze audio with the simulation so no loop keeps running while paused.
        audioRef.current.suspend();
        return "paused";
      }
      if (current === "paused") {
        phaseRef.current = "playing";
        lastTimeRef.current = null;
        audioRef.current.resume();
        return "playing";
      }
      return current;
    });
  }, []);

  useEffect(() => {
    if (phase === "paused") pauseSharedSession();
    else if (phase === "playing") resumeSharedSession();
  }, [pauseSharedSession, phase, resumeSharedSession]);

  useGameExperienceControls({
    pause: togglePause,
    resume: togglePause,
    restart: startGame,
    canPause: phase === "playing",
    canResume: phase === "paused",
    canRestart: phase === "over" || phase === "paused",
  });

  const chooseWeapon = useCallback(
    (weapon: WeaponId) => {
      // Locked weapons can't be selected — the guard lives here and in the disabled
      // button, so neither a click nor a number-key press can equip an unowned one.
      if (!unlockedWeapons(progressRef.current).has(weapon)) return;
      if (setWeapon(modelRef.current, weapon)) {
        playSfx("powerUp");
        haptic(12);
        syncHud();
      }
    },
    [syncHud, playSfx, haptic],
  );

  /**
   * Bank an upgrade. `applyUpgrade` is the guard: it only fires while the engine
   * is parked with that option pending, so a double-click can't bank it twice.
   */
  const chooseUpgrade = useCallback(
    (id: UpgradeId) => {
      if (applyUpgrade(modelRef.current, id)) {
        playSfx("upgrade");
        haptic([20, 30, 20]);
        syncHud();
      }
    },
    [syncHud, playSfx, haptic],
  );

  /* Progression handlers. Each is a meaningful event, so each persists exactly once
     through `commitProgress` (or the storage helper) — never on an animation frame.
     Every mutating call goes through the pure progression module, which rejects
     unaffordable buys, duplicate claims, and locked equips before anything is saved. */
  const adoptProgress = useCallback((next: ProgressState) => {
    progressRef.current = next;
    themeRef.current = activeTheme(next);
    setProgress(next);
  }, []);

  const openProgress = useCallback(() => {
    if (phaseRef.current === "playing") togglePause();
    // Catch a midnight rollover that happened while the tab stayed open: refresh
    // the daily block and persist only if it actually changed.
    const refreshed = refreshDaily(progressRef.current, new Date());
    if (refreshed !== progressRef.current) commitProgress(refreshed);
    setShowProgress(true);
  }, [togglePause, commitProgress]);

  const openSettings = useCallback(() => {
    if (phaseRef.current === "playing") togglePause();
    setShowSettings(true);
  }, [togglePause]);

  const closeSettings = useCallback(() => {
    flushSettings(); // commit any debounced volume change on the way out
    setShowSettings(false);
  }, [flushSettings]);

  const handlePurchase = useCallback(
    (itemId: string) => {
      const { state, ok } = purchase(progressRef.current, itemId);
      if (ok) commitProgress(state);
    },
    [commitProgress],
  );

  const handleEquipWeapon = useCallback(
    (weapon: WeaponId) => commitProgress(equipWeapon(progressRef.current, weapon)),
    [commitProgress],
  );

  const handleEquipTheme = useCallback(
    (theme: ThemeId) => commitProgress(equipTheme(progressRef.current, theme)),
    [commitProgress],
  );

  const handleToggleModifier = useCallback(
    (id: ModifierId) => commitProgress(toggleModifier(progressRef.current, id)),
    [commitProgress],
  );

  const handleClaimMission = useCallback(
    (id: string) => {
      const { state, claimed } = claimMission(progressRef.current, id as MissionId);
      if (claimed) commitProgress(state);
    },
    [commitProgress],
  );

  const handleImport = useCallback(
    (json: string): boolean => {
      const state = importProgress(json); // persists on success
      if (!state) return false;
      adoptProgress(state);
      return true;
    },
    [adoptProgress],
  );

  const handleReset = useCallback(() => {
    adoptProgress(resetProgress()); // persists the fresh default
  }, [adoptProgress]);

  /**
   * A primary press on the arena. Outside a live run the press is a shortcut
   * (start / resume) and returns `false`, so no trigger is armed; while playing it
   * fires the opening round immediately and returns `true` to begin sustained fire.
   */
  const handlePress = useCallback(
    (point: AimPoint): boolean => {
      const current = phaseRef.current;
      if (current === "intro") {
        startGame();
        return false;
      }
      if (current === "paused") {
        togglePause();
        return false;
      }
      // "over" intentionally ignores taps; restart is via the button / Enter.
      if (current !== "playing") return false;

      canvasRef.current?.focus({ preventScroll: true });
      // `beginHoldFire` shoots through the same `fire` the engine has always used,
      // so cooldown, the upgrade park, multi-shot, and the stats all still apply.
      // Only a shot that actually left the core plays a cue.
      if (beginHoldFire(modelRef.current, point.x, point.y)) {
        playSfx("shoot");
        haptic(8);
      }
      return true;
    },
    [startGame, togglePause, playSfx, haptic],
  );

  /** The held pointer moved — later rounds follow it. */
  const handleAim = useCallback((point: AimPoint) => {
    aimHoldFire(modelRef.current, point.x, point.y);
  }, []);

  /** The gesture ended, by any route. Safe to call when nothing is held. */
  const handleRelease = useCallback(() => {
    endHoldFire(modelRef.current);
  }, []);

  // Keyboard controls (window-level so the game responds without focusing the canvas).
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;

      switch (event.code) {
        case "Digit1":
        case "Digit2":
        case "Digit3": {
          event.preventDefault();
          const slot = Number(event.code.slice(-1)) - 1;
          const model = modelRef.current;
          // While parked, the number row picks the upgrade instead of the weapon.
          if (model.waveState === "upgrade") {
            const id = model.pendingUpgrades[slot];
            if (id) chooseUpgrade(id);
            return;
          }
          const weapon = WEAPON_ORDER[slot];
          if (weapon) chooseWeapon(weapon);
          return;
        }
        case "KeyP":
        case "Escape":
          event.preventDefault();
          togglePause();
          return;
        case "Enter":
        case "Space":
          event.preventDefault();
          if (phaseRef.current === "intro" || phaseRef.current === "over") startGame();
          return;
        default:
          return;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [togglePause, startGame, chooseWeapon, chooseUpgrade]);

  // Auto-pause when the tab is hidden so enemies don't close in unseen, and freeze
  // audio too. `togglePause` already resets `lastTime`, so nothing jumps on return.
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        if (phaseRef.current === "playing") togglePause();
        else audioRef.current.suspend();
      } else if (phaseRef.current !== "paused") {
        audioRef.current.resume();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [togglePause]);

  /**
   * Aiming and firing, mouse/pen/touch alike, through one pointer-event gesture.
   *
   * A single effect owns every listener and its cleanup removes all of them, so a
   * remount or a Fast Refresh cannot leave a second set attached. All three
   * callbacks are stable, so this subscribes once for the component's lifetime.
   * The canvas' `touch-action: none` is what keeps a held finger from scrolling the
   * page, so touch needs no separate non-passive listener any more.
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    return attachHoldFire({
      surface: canvas,
      window,
      document,
      toArena: (clientX, clientY) => {
        const rect = canvas.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return null;
        return { x: clientX - rect.left, y: clientY - rect.top };
      },
      isHidden: () => document.hidden,
      callbacks: { onPress: handlePress, onAim: handleAim, onRelease: handleRelease },
    });
  }, [handlePress, handleAim, handleRelease]);

  // High-DPI sizing: keep the backing store matched to the displayed size, and tell
  // the simulation the arena changed so the core stays centred. Shared so the
  // ResizeObserver, orientation changes, and DPR changes all use one code path.
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const cssWidth = canvas.clientWidth;
    const cssHeight = canvas.clientHeight;
    if (cssWidth <= 0 || cssHeight <= 0) return;
    canvas.width = Math.round(cssWidth * dpr);
    canvas.height = Math.round(cssHeight * dpr);
    dprRef.current = dpr;
    resizeWorld(modelRef.current, cssWidth, cssHeight);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    resizeCanvas();
    // ResizeObserver covers layout/orientation/fullscreen size changes.
    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(canvas);
    // Orientation changes on mobile don't always resize the element immediately.
    const onOrient = () => window.setTimeout(resizeCanvas, 150);
    window.addEventListener("orientationchange", onOrient);

    // A DPR change (e.g. dragging the window between monitors, browser zoom) may not
    // resize the element, so watch it explicitly and re-subscribe on each change.
    let dprQuery: MediaQueryList | null = null;
    const watchDpr = () => {
      dprQuery?.removeEventListener("change", onDprChange);
      if (!window.matchMedia) return;
      dprQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      dprQuery.addEventListener("change", onDprChange);
    };
    const onDprChange = () => {
      resizeCanvas();
      watchDpr();
    };
    watchDpr();

    return () => {
      observer.disconnect();
      window.removeEventListener("orientationchange", onOrient);
      dprQuery?.removeEventListener("change", onDprChange);
    };
  }, [resizeCanvas]);

  // The single animation loop. Runs for the component's lifetime; advances physics
  // only while playing, and always renders so overlays sit on a live scene.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d") ?? null;
    if (!canvas || !ctx) return;

    const frame = (time: number) => {
      const last = lastTimeRef.current;
      lastTimeRef.current = time;
      // Clamp dt so an alt-tab or a slow frame can't tunnel enemies through the core.
      const dt = last === null ? 0 : Math.min((time - last) / 1000, 0.1);
      elapsedRef.current += dt;

      const model = modelRef.current;
      const current = phaseRef.current;

      if (current === "playing" && dt > 0) {
        // A no-op while the engine is parked for an upgrade choice.
        const events = update(model, dt);

        // Sustained fire: one cue per frame however many rounds left the core, so a
        // held trigger sounds like a stream instead of stacking oscillators.
        if (events.shots > 0) {
          playSfx("shoot");
          haptic(8);
        }

        // Audio/haptic feedback from discrete events. `events.hit`/`killed` are one
        // boolean per step, so each cue fires at most once per frame — no stacking.
        if (events.coreDamaged) {
          playSfx("coreDamage");
          haptic([30, 40, 30]);
        }
        if (events.killed) {
          playSfx("kill");
          haptic(14);
        } else if (events.hit) {
          playSfx("hit");
        }
        if (events.powerUpCollected) {
          playSfx("powerUp");
          haptic([12, 20, 12]);
          notify("reward", `pu:${events.powerUpCollected}`, "Power-up collected!", 1600);
        }
        if (events.waveStarted) {
          playSfx("wave");
          notify("wave", `wave:${model.wave}`, `Wave ${model.wave}`, 1800);
          const danger = dangerForWave(model.wave);
          if (danger) notify("danger", `danger:${model.wave}`, danger, 2400);
        }

        // One state push per frame at most, and only when the HUD actually moved.
        const next = readHud(model);
        if (!sameHud(hudRef.current, next)) {
          hudRef.current = next;
          setHud(next);
        }
        if (events.coreDestroyed) endGame();
      }

      drawScene(ctx, model, current, elapsedRef.current, dprRef.current, flagsRef.current, themeRef.current);
      rafRef.current = window.requestAnimationFrame(frame);
    };

    rafRef.current = window.requestAnimationFrame(frame);
    return () => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [endGame, playSfx, haptic, notify]);

  const displayProgress = hydrated ? progress : defaultProgress();
  const lifetime = displayProgress.lifetime;
  const level = levelForXp(displayProgress.xp);
  const ownedWeapons = unlockedWeapons(displayProgress);
  const healthPercent = hud.maxHealth > 0 ? (hud.health / hud.maxHealth) * 100 : 0;
  const healthTone = healthPercent <= 30 ? "critical" : healthPercent <= 60 ? "warn" : "ok";
  const inBreak = hud.waveState === "break" && phase === "playing";
  const choosing = hud.waveState === "upgrade" && phase === "playing";
  const lifetimeFavourite = favouriteWeapon(lifetime.weaponShots);
  const runFavourite = summary ? favouriteWeapon(summary.shotsByWeapon) : null;
  const live = phase === "playing" || phase === "paused";

  return (
    <div
      ref={shellRef}
      className={cn("dncd-shell", isFullscreen && "dncd-shell--fullscreen")}
      data-darma-game-shell="true"
      data-darma-game-fullscreen={isFullscreen ? "true" : undefined}
      data-darma-game-active={live ? "true" : undefined}
    >
      <div className="dncd-topbar">
        <div className="dncd-topbar-id">
          <span className="dncd-eyebrow">Arcade shooter</span>
          <h2 className="dncd-topbar-title">{game.title}</h2>
        </div>
        <div className="dncd-topbar-controls">
          <Badge variant="soft">Lv {level.level}</Badge>
          <Badge variant="outline">
            <Coins className="mr-1 inline h-3 w-3" aria-hidden />
            {displayProgress.currency}
          </Badge>
          {live ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePause}
              leftIcon={phase === "paused" ? <Play className="h-4 w-4" aria-hidden /> : <Pause className="h-4 w-4" aria-hidden />}
            >
              {phase === "paused" ? "Resume" : "Pause"}
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="sm"
            onClick={openSettings}
            aria-label="Settings"
            leftIcon={<Settings2 className="h-4 w-4" aria-hidden />}
          >
            <span className="dncd-btn-label">Settings</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={openProgress} aria-label="Progression" leftIcon={<Trophy className="h-4 w-4" aria-hidden />}>
            <span className="dncd-btn-label">Progress</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? "Exit focus mode" : "Focus mode"}
            aria-pressed={isFullscreen}
            leftIcon={isFullscreen ? <Minimize2 className="h-4 w-4" aria-hidden /> : <Maximize2 className="h-4 w-4" aria-hidden />}
          >
            <span className="dncd-btn-label">{isFullscreen ? "Exit" : "Focus"}</span>
          </Button>
          {phase !== "intro" ? (
            <Button variant="secondary" size="sm" onClick={startGame} aria-label="Restart" leftIcon={<RotateCcw className="h-4 w-4" aria-hidden />}>
              <span className="dncd-btn-label">Restart</span>
            </Button>
          ) : null}
        </div>
      </div>

      {notices.length > 0 ? (
        <div className="dncd-notices" role="status" aria-live="polite">
          {notices.map((notice) => (
            <div key={notice.id} className={cn("dncd-notice", `dncd-notice--${notice.kind}`)}>
              {notice.kind === "danger" ? <AlertTriangle className="h-4 w-4" aria-hidden /> : null}
              <span>{notice.text}</span>
            </div>
          ))}
        </div>
      ) : null}

      <div className="dncd-stage">
        <div className="dncd-layout">
          <div className="dncd-board-wrap">
            <div className="dncd-board">
              <canvas
                ref={canvasRef}
                className="dncd-canvas"
                role="application"
                tabIndex={0}
                aria-label={`${game.title} play area. Click or tap in the direction of an enemy to fire from the core, or hold to keep firing.`}
              />

              {/* Live HUD (kept out of the canvas for crispness + a11y). */}
              {live ? (
                <div className="dncd-hud" aria-live="off">
                  <div className="dncd-hud-score">
                    <span className="dncd-hud-score-value">{hud.score}</span>
                    {hud.combo > 0 ? (
                      <span className="dncd-hud-combo">
                        {hud.combo}× combo · {hud.multiplier.toFixed(1)}× score
                      </span>
                    ) : null}
                  </div>
                  <div className={cn("dncd-hud-health", `dncd-hud-health--${healthTone}`)}>
                    <Heart className="h-3.5 w-3.5" aria-hidden />
                    <div
                      className="dncd-health-track"
                      role="meter"
                      aria-valuenow={hud.health}
                      aria-valuemin={0}
                      aria-valuemax={hud.maxHealth}
                      aria-label="Core integrity"
                    >
                      <div className="dncd-health-fill" style={{ width: `${healthPercent}%` }} />
                    </div>
                    <span className="dncd-hud-health-value">
                      {hud.health}/{hud.maxHealth}
                    </span>
                  </div>
                </div>
              ) : null}

              {/* Active power-up chips with their remaining duration. */}
              {live && hud.effects.length > 0 ? (
                <ul className="dncd-effects" aria-label="Active power-ups">
                  {hud.effects.map((effect) => (
                    <li key={effect.id} className={cn("dncd-effect", `dncd-effect--${effect.id}`)}>
                      <span className="dncd-effect-head">
                        {POWER_UP_ICONS[effect.id]}
                        <span>{DEFAULT_CONFIG.powerUps.types[effect.id].label}</span>
                        <strong>{effect.remaining.toFixed(1)}s</strong>
                      </span>
                      <span className="dncd-effect-track">
                        <span className="dncd-effect-fill" style={{ width: `${effect.ratio * 100}%` }} />
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}

              {inBreak ? (
                <div className="dncd-wave-banner" role="status">
                  <span className="dncd-wave-banner-title">Wave {hud.wave} cleared</span>
                  <span className="dncd-wave-banner-sub">Wave {hud.wave + 1} in {hud.breakSeconds}s</span>
                </div>
              ) : null}

              {/* Upgrade choice. The engine is parked while this is up. */}
              {choosing ? (
                <Overlay wide>
                  <span className="dncd-overlay-eyebrow">
                    <Sparkles className="h-4 w-4" aria-hidden /> Wave {hud.wave} cleared
                  </span>
                  <h3 className="dncd-overlay-title">Choose an upgrade</h3>
                  <p className="dncd-overlay-text">Everything is frozen until you pick. This one is permanent for the run.</p>
                  <ul className="dncd-upgrade-grid">
                    {hud.pendingUpgrades.map((id, index) => {
                      const config = DEFAULT_CONFIG.upgrades[id];
                      const level = hud.upgradeLevels[id];
                      return (
                        <li key={id}>
                          <button type="button" className="dncd-upgrade-card" onClick={() => chooseUpgrade(id)}>
                            <span className="dncd-upgrade-key">{index + 1}</span>
                            <span className="dncd-upgrade-icon">{UPGRADE_ICONS[id]}</span>
                            <strong className="dncd-upgrade-title">{config.label}</strong>
                            <span className="dncd-upgrade-blurb">{config.blurb}</span>
                            <span className="dncd-upgrade-level">
                              Level {level} → {level + 1} of {config.maxLevel}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  <p className="dncd-overlay-hint">Press 1, 2, or 3 to choose</p>
                </Overlay>
              ) : null}

              {phase === "intro" ? (
                <Overlay>
                  <span className="dncd-overlay-eyebrow">
                    <Shield className="h-4 w-4" aria-hidden /> Ready?
                  </span>
                  <h3 className="dncd-overlay-title">Defend the core</h3>
                  <p className="dncd-overlay-text">
                    Waves of drones converge on your core. Click or tap in their direction to fire — hold to keep firing,
                    and the rate climbs the longer you hold. Switch weapons with 1, 2, and 3. Kills sometimes drop power-ups — shoot them to collect. Every third wave you pick
                    a permanent upgrade.
                  </p>
                  <Button size="lg" onClick={startGame} leftIcon={<Play className="h-5 w-5" aria-hidden />}>
                    Start game
                  </Button>
                  <p className="dncd-overlay-hint">Press Enter to start</p>
                </Overlay>
              ) : null}

              {phase === "paused" ? (
                <Overlay>
                  <span className="dncd-overlay-eyebrow">Paused</span>
                  <h3 className="dncd-overlay-title">Hold the line</h3>
                  <p className="dncd-overlay-text">Wave {hud.wave} is frozen exactly where you left it.</p>
                  <div className="dncd-overlay-actions">
                    <Button size="lg" onClick={togglePause} leftIcon={<Play className="h-5 w-5" aria-hidden />}>
                      Resume
                    </Button>
                    <Button size="lg" variant="outline" onClick={startGame} leftIcon={<RotateCcw className="h-5 w-5" aria-hidden />}>
                      Restart
                    </Button>
                  </div>
                  <p className="dncd-overlay-hint">Press P to resume</p>
                </Overlay>
              ) : null}

              {phase === "over" && summary ? (
                <Overlay wide>
                  <span className="dncd-overlay-eyebrow">Core breached</span>
                  <h3 className="dncd-overlay-title">You held {summary.waveReached} waves</h3>

                  <div className="dncd-result-grid">
                    <ResultStat label="Score" value={summary.score} highlight />
                    <ResultStat label="Best" value={lifetime.bestScore} />
                    <ResultStat label="Wave" value={summary.waveReached} />
                    <ResultStat label="Survived" value={formatTime(summary.survivalTime)} />
                    <ResultStat label="Destroyed" value={summary.enemiesDestroyed} />
                    <ResultStat label="Accuracy" value={`${summary.accuracy}%`} />
                    <ResultStat label="Best combo" value={`${summary.highestCombo}×`} />
                    <ResultStat label="Flawless" value={summary.flawlessWaves} />
                    <ResultStat label="Power-ups" value={summary.powerUpsCollected} />
                    <ResultStat
                      label="Favourite"
                      value={runFavourite ? DEFAULT_CONFIG.weapons[runFavourite].label : "—"}
                    />
                  </div>

                  {rewards ? <RewardSummary rewards={rewards} /> : null}

                  <div className="dncd-overlay-actions">
                    <Button size="lg" onClick={startGame} leftIcon={<RotateCcw className="h-5 w-5" aria-hidden />}>
                      Play again
                    </Button>
                    <Button size="lg" variant="secondary" onClick={openProgress} leftIcon={<Trophy className="h-5 w-5" aria-hidden />}>
                      Progression
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => router.push("/games")}
                      leftIcon={<ArrowLeft className="h-5 w-5" aria-hidden />}
                    >
                      Back to games
                    </Button>
                  </div>
                  <p className="dncd-overlay-hint">Press Enter to play again</p>
                </Overlay>
              ) : null}
            </div>

            {/* Weapon bar — big touch targets, kept under the arena on every size.
                Locked weapons are disabled here and rejected in `chooseWeapon`. */}
            <div className="dncd-weapons" role="group" aria-label="Weapon">
              {WEAPON_ORDER.map((id, index) => {
                const weapon = DEFAULT_CONFIG.weapons[id];
                const active = hud.weapon === id;
                const locked = !ownedWeapons.has(id);
                return (
                  <button
                    key={id}
                    type="button"
                    className={cn(
                      "dncd-weapon",
                      `dncd-weapon--${id}`,
                      active && "dncd-weapon--active",
                      locked && "dncd-weapon--locked",
                    )}
                    aria-pressed={active}
                    disabled={locked}
                    onClick={() => chooseWeapon(id)}
                  >
                    <span className="dncd-weapon-key">{locked ? <Lock className="h-3 w-3" aria-hidden /> : index + 1}</span>
                    <span className="dncd-weapon-body">
                      <strong>{weapon.label}</strong>
                      <span className="dncd-weapon-blurb">{locked ? "Unlock in the store" : weapon.blurb}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <aside className="dncd-panel" aria-label="Neon Core Defense stats and controls">
            <div className="dncd-stat-grid">
              <div className="dncd-stat dncd-stat--highlight">
                <span className="dncd-stat-label">Score</span>
                <span className="dncd-stat-value">{phase === "intro" ? 0 : hud.score}</span>
              </div>
              <div className="dncd-stat">
                <span className="dncd-stat-label">Wave</span>
                <span className="dncd-stat-value">{phase === "intro" ? 1 : hud.wave}</span>
              </div>
              <div className="dncd-stat">
                <span className="dncd-stat-label">Threats</span>
                <span className="dncd-stat-value">{phase === "intro" ? 0 : hud.threats}</span>
              </div>
              <div className="dncd-stat">
                <span className="dncd-stat-label">Combo</span>
                <span className="dncd-stat-value">{phase === "intro" ? 0 : `${hud.combo}×`}</span>
              </div>
              <div className="dncd-stat">
                <span className="dncd-stat-label">Multiplier</span>
                <span className="dncd-stat-value">{phase === "intro" ? "1.0×" : `${hud.multiplier.toFixed(1)}×`}</span>
              </div>
              <div className="dncd-stat">
                <span className="dncd-stat-label">Core</span>
                <span className="dncd-stat-value">{phase === "intro" ? hud.maxHealth : hud.health}</span>
              </div>
            </div>

            <div className="dncd-panel-card">
              <span className="dncd-panel-kicker">
                <Trophy className="h-4 w-4" aria-hidden /> Level {level.level}
              </span>
              <div className="dncd-level-bar" role="meter" aria-valuenow={Math.round(level.ratio * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Level progress">
                <div className="dncd-level-fill" style={{ width: `${level.ratio * 100}%` }} />
              </div>
              <ul className="dncd-best-list">
                <li className="dncd-best-item">
                  <Target className="h-3.5 w-3.5" aria-hidden />
                  <span>Best score</span>
                  <strong>{lifetime.bestScore}</strong>
                </li>
                <li className="dncd-best-item">
                  <Layers className="h-3.5 w-3.5" aria-hidden />
                  <span>Best wave</span>
                  <strong>{lifetime.bestWave}</strong>
                </li>
                <li className="dncd-best-item">
                  <Zap className="h-3.5 w-3.5" aria-hidden />
                  <span>Best combo</span>
                  <strong>{lifetime.bestCombo}×</strong>
                </li>
                <li className="dncd-best-item">
                  <Crosshair className="h-3.5 w-3.5" aria-hidden />
                  <span>Favourite</span>
                  <strong>{lifetimeFavourite ? DEFAULT_CONFIG.weapons[lifetimeFavourite].label : "—"}</strong>
                </li>
                <li className="dncd-best-item">
                  <Coins className="h-3.5 w-3.5" aria-hidden />
                  <span>Cores</span>
                  <strong>{displayProgress.currency}</strong>
                </li>
              </ul>
              <Button variant="outline" size="sm" onClick={openProgress} leftIcon={<Trophy className="h-4 w-4" aria-hidden />}>
                Progression & store
              </Button>
            </div>

            <div className="dncd-panel-card">
              <span className="dncd-panel-kicker">
                <Sparkles className="h-4 w-4" aria-hidden /> Power-ups
              </span>
              <ul className="dncd-enemy-list">
                {POWER_UP_ORDER.map((id) => (
                  <li key={id} className="dncd-enemy-item">
                    <span className={cn("dncd-enemy-dot", `dncd-power-dot--${id}`)} aria-hidden />
                    <span className="dncd-enemy-copy">
                      <strong>{DEFAULT_CONFIG.powerUps.types[id].label}</strong>
                      <span>{DEFAULT_CONFIG.powerUps.types[id].blurb}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="dncd-panel-card">
              <span className="dncd-panel-kicker">
                <Crosshair className="h-4 w-4" aria-hidden /> Enemies
              </span>
              <ul className="dncd-enemy-list">
                {ENEMY_GUIDE.map((entry) => (
                  <li key={entry.kind} className="dncd-enemy-item">
                    <span className={cn("dncd-enemy-dot", `dncd-enemy-dot--${entry.kind}`)} aria-hidden />
                    <span className="dncd-enemy-copy">
                      <strong>{entry.label}</strong>
                      <span>{entry.blurb}</span>
                    </span>
                    <span className="dncd-enemy-wave">W{DEFAULT_CONFIG.enemies[entry.kind].unlockWave}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="dncd-panel-card">
              <span className="dncd-panel-kicker">
                <Keyboard className="h-4 w-4" aria-hidden /> Controls
              </span>
              <ul className="dncd-guide-list">
                {CONTROLS.map((control) => (
                  <li key={`${control.keys}-${control.label}`} className="dncd-guide-item">
                    <kbd className="dncd-kbd">{control.keys}</kbd>
                    <span>{control.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>

      <div className="dncd-guide">
        <span className="dncd-guide-title">
          <Gamepad2 className="h-4 w-4" aria-hidden /> How to play
        </span>
        <span>
          Shots launch from the core toward where you clicked, so aim past a drone rather than at it. Hold the button
          down for sustained fire and drag to keep aiming — the cadence tightens for about a second, then holds. Every third wave
          you pick a permanent upgrade — your level, unlocks, and stats are saved on this device.
        </span>
      </div>

      {showProgress ? (
        <div className="dncd-prog-scrim">
          <NeonCoreProgressionScreen
            progress={displayProgress}
            handlers={{
              onClose: () => setShowProgress(false),
              onPurchase: handlePurchase,
              onEquipWeapon: handleEquipWeapon,
              onEquipTheme: handleEquipTheme,
              onToggleModifier: handleToggleModifier,
              onClaimMission: handleClaimMission,
              onImport: handleImport,
              onReset: handleReset,
              exportText: exportProgress(displayProgress),
            }}
          />
        </div>
      ) : null}

      {showSettings ? (
        <div className="dncd-prog-scrim">
          <NeonCoreSettingsPanel settings={displayProgress.settings} onChange={handleSettingsChange} onClose={closeSettings} />
        </div>
      ) : null}
    </div>
  );
}

/** Compact run-end tally of XP, cores, and any newly unlocked rewards. */
function RewardSummary({ rewards }: { rewards: RunRewards }) {
  return (
    <div className="dncd-reward" role="status">
      <div className="dncd-reward-row">
        <span className="dncd-reward-chip">
          <Sparkles className="h-3.5 w-3.5" aria-hidden /> +{rewards.xpGained} XP
        </span>
        <span className="dncd-reward-chip">
          <Coins className="h-3.5 w-3.5" aria-hidden /> +{rewards.currencyGained} cores
        </span>
        {rewards.leveledUp ? (
          <span className="dncd-reward-chip dncd-reward-chip--hot">
            <Trophy className="h-3.5 w-3.5" aria-hidden /> Level {rewards.levelAfter}!
          </span>
        ) : null}
      </div>
      {rewards.achievementsUnlocked.length > 0 ? (
        <p className="dncd-reward-line">
          New achievement{rewards.achievementsUnlocked.length > 1 ? "s" : ""}:{" "}
          {rewards.achievementsUnlocked.map((a) => a.label).join(", ")}
        </p>
      ) : null}
      {rewards.dailiesCompleted.length > 0 ? (
        <p className="dncd-reward-line">Daily challenge complete ×{rewards.dailiesCompleted.length}</p>
      ) : null}
      {rewards.missionsNowClaimable.length > 0 ? (
        <p className="dncd-reward-line">Mission ready to claim — open Progression.</p>
      ) : null}
    </div>
  );
}

function Overlay({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="dncd-overlay">
      <div className={cn("dncd-overlay-card", wide && "dncd-overlay-card--wide")}>{children}</div>
    </div>
  );
}

function ResultStat({ label, value, highlight }: { label: string; value: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={cn("dncd-result-stat", highlight && "dncd-result-stat--highlight")}>
      <span className="dncd-stat-label">{label}</span>
      <span className="dncd-result-value">{value}</span>
    </div>
  );
}

/* ------------------------------------------------------------------------- */
/* Canvas rendering (all original, procedural artwork)                        */
/* ------------------------------------------------------------------------- */

/** Parse a `#rrggbb` string into an `rgba()` at the given alpha. */
function withAlpha(hex: string, alpha: number): string {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16) || 0;
  const g = parseInt(value.slice(2, 4), 16) || 0;
  const b = parseInt(value.slice(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function drawScene(
  ctx: CanvasRenderingContext2D,
  model: NeonCoreModel,
  phase: NeonCorePhase,
  elapsed: number,
  dpr: number,
  flags: RenderFlags,
  theme: ThemePalette,
): void {
  const { width, height } = model.world;
  const { reducedMotion } = flags;

  // Screen shake on core damage, expressed as a transform offset so no entity
  // positions are touched. Gated by the shake setting (and reduced motion).
  let shakeX = 0;
  let shakeY = 0;
  if (flags.shake && model.shake > 0) {
    const power = (model.shake / model.config.shakeTime) * model.config.shakeMagnitude;
    shakeX = Math.sin(elapsed * 90) * power;
    shakeY = Math.cos(elapsed * 77) * power;
  }
  ctx.setTransform(dpr, 0, 0, dpr, shakeX * dpr, shakeY * dpr);

  // Motion trail: when enabled, veil the previous frame so projectiles and
  // particles leave streaks; otherwise (reduced motion / performance) wipe clean.
  ctx.fillStyle = flags.trails ? withAlpha(theme.bg, 0.18) : theme.bg;
  ctx.fillRect(-20, -20, width + 40, height + 40);

  // Slow-field wash, so the effect is legible without reading the HUD.
  if (model.effects.slowTime > 0) {
    ctx.fillStyle = "rgba(56, 189, 248, 0.06)";
    ctx.fillRect(0, 0, width, height);
  }

  // Damage vignette — a red wash that fades with the flash timer.
  if (model.core.damageFlash > 0) {
    const strength = model.core.damageFlash / model.config.coreFlashTime;
    const vignette = ctx.createRadialGradient(
      model.core.x,
      model.core.y,
      Math.min(width, height) * 0.2,
      model.core.x,
      model.core.y,
      Math.max(width, height) * 0.7,
    );
    vignette.addColorStop(0, "rgba(244, 63, 94, 0)");
    vignette.addColorStop(1, `rgba(244, 63, 94, ${0.42 * strength})`);
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
  }

  drawWarnings(ctx, model, elapsed, reducedMotion);
  drawCore(ctx, model, elapsed, reducedMotion, phase, theme);

  // Particles.
  for (const p of model.particles) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
    ctx.fillStyle = `hsl(${p.hue}, 90%, 62%)`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  for (const drop of model.drops) drawDrop(ctx, model, drop, elapsed, reducedMotion);
  for (const enemy of model.enemies) drawEnemy(ctx, enemy);

  // Projectiles, tinted by the weapon that fired them. The soft glow is skipped in
  // performance mode; the solid core of the round always draws.
  for (const p of model.projectiles) {
    const weapon = model.config.weapons[p.weapon];
    if (flags.glow) {
      const glowRadius = p.radius * weapon.glow;
      const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowRadius);
      glow.addColorStop(0, "rgba(255, 255, 255, 0.9)");
      glow.addColorStop(1, `hsla(${weapon.hue}, 100%, 70%, 0)`);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(p.x, p.y, glowRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = p.explosive ? "#ffd9a8" : "#eafcff";
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();

    // Explosive rounds wear a ring so the loaded state is obvious mid-flight.
    if (p.explosive) {
      ctx.strokeStyle = `hsla(${model.config.powerUps.types.explosive.hue}, 100%, 65%, 0.9)`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius + 2.5, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

/** Uncollected power-up token. Fades and shrinks as it nears expiry. */
function drawDrop(
  ctx: CanvasRenderingContext2D,
  model: NeonCoreModel,
  drop: Drop,
  elapsed: number,
  reducedMotion: boolean,
): void {
  const type = model.config.powerUps.types[drop.id];
  const life = Math.max(0, drop.timer) / drop.duration;
  const bob = reducedMotion ? 0 : Math.sin(elapsed * 4 + drop.x) * 2;
  const y = drop.y + bob;
  // Blink out over the last second so an about-to-expire drop is unmistakable.
  const alpha = life < 0.15 && !reducedMotion ? 0.35 + Math.abs(Math.sin(elapsed * 14)) * 0.65 : 1;

  ctx.save();
  ctx.globalAlpha = alpha;

  const glow = ctx.createRadialGradient(drop.x, y, 1, drop.x, y, drop.radius * 2.4);
  glow.addColorStop(0, `hsla(${type.hue}, 100%, 70%, 0.55)`);
  glow.addColorStop(1, `hsla(${type.hue}, 100%, 70%, 0)`);
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(drop.x, y, drop.radius * 2.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = `hsl(${type.hue}, 90%, 62%)`;
  ctx.beginPath();
  ctx.arc(drop.x, y, drop.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(drop.x, y, drop.radius, 0, Math.PI * 2);
  ctx.stroke();

  // Remaining-life arc around the token.
  ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(drop.x, y, drop.radius + 4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * life);
  ctx.stroke();
  ctx.restore();
}

/**
 * Edge telegraphs. The ring fills as the timer runs out, so the player can read
 * both *where* and *how soon* an enemy will appear.
 */
function drawWarnings(
  ctx: CanvasRenderingContext2D,
  model: NeonCoreModel,
  elapsed: number,
  reducedMotion: boolean,
): void {
  for (const warning of model.warnings) {
    const progress = 1 - Math.max(0, warning.timer) / warning.duration;
    const hue = model.config.enemies[warning.kind].hue;
    const pulse = reducedMotion ? 0.7 : 0.55 + Math.sin(elapsed * 16) * 0.25;
    const radius = warning.radius + 6;

    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.strokeStyle = `hsla(${hue}, 95%, 70%, 0.9)`;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(warning.x, warning.y, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Fill arc showing time-to-spawn.
    ctx.setLineDash([]);
    ctx.globalAlpha = 0.95;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(warning.x, warning.y, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
    ctx.stroke();
    ctx.restore();
  }
}

function enemyPath(ctx: CanvasRenderingContext2D, enemy: Enemy): void {
  const { x, y, radius, kind } = enemy;
  if (kind === "fast") {
    // A dart, nose-first along its heading.
    const angle = Math.atan2(enemy.vy, enemy.vx);
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(angle) * radius * 1.6, y + Math.sin(angle) * radius * 1.6);
    ctx.lineTo(x + Math.cos(angle + 2.5) * radius, y + Math.sin(angle + 2.5) * radius);
    ctx.lineTo(x + Math.cos(angle - 2.5) * radius, y + Math.sin(angle - 2.5) * radius);
    ctx.closePath();
    return;
  }
  if (kind === "tank") {
    // A hexagon reads as heavier than a disc at the same radius.
    ctx.beginPath();
    for (let i = 0; i < 6; i += 1) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    return;
  }
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
}

function drawEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy): void {
  const { x, y, radius, hue } = enemy;
  const healthRatio = enemy.maxHealth > 0 ? enemy.health / enemy.maxHealth : 1;

  const fill = ctx.createRadialGradient(x, y, 1, x, y, Math.max(1, radius));
  fill.addColorStop(0, `hsla(${hue}, 95%, 74%, 0.95)`);
  fill.addColorStop(1, `hsla(${hue}, 85%, 45%, 0.85)`);
  ctx.fillStyle = fill;
  enemyPath(ctx, enemy);
  ctx.fill();

  // The rim dims as the enemy loses health, doubling the shrink cue.
  ctx.strokeStyle = `hsla(${hue}, 100%, 80%, ${0.35 + 0.6 * healthRatio})`;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  if (enemy.kind === "splitter") {
    // A seam hinting that this one comes apart.
    ctx.save();
    ctx.strokeStyle = `hsla(${hue}, 100%, 90%, 0.7)`;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(x, y - radius);
    ctx.lineTo(x, y + radius);
    ctx.stroke();
    ctx.restore();
  }

  // Hit flash: a brief white overlay so a landed shot reads even mid-swarm — a
  // shape/brightness cue that never depends on colour alone.
  if (enemy.flash > 0) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, enemy.flash / 0.09) * 0.85;
    ctx.fillStyle = "#ffffff";
    enemyPath(ctx, enemy);
    ctx.fill();
    ctx.restore();
  }
}

function drawCore(
  ctx: CanvasRenderingContext2D,
  model: NeonCoreModel,
  elapsed: number,
  reducedMotion: boolean,
  phase: NeonCorePhase,
  theme: ThemePalette,
): void {
  const { core, config } = model;
  const healthRatio = core.maxHealth > 0 ? Math.max(0, core.health / core.maxHealth) : 0;
  const hurt = core.damageFlash > 0;
  const pulse = reducedMotion || phase !== "playing" ? 0 : Math.sin(elapsed * 3) * 0.5 + 0.5;
  const haloRadius = core.radius * (2.6 + pulse * 0.5);

  // Halo + body take the equipped theme's core hue (still red while hurt).
  const halo = ctx.createRadialGradient(core.x, core.y, core.radius * 0.4, core.x, core.y, haloRadius);
  halo.addColorStop(0, hurt ? "rgba(244, 63, 94, 0.42)" : `hsla(${theme.coreHue}, 90%, 72%, 0.42)`);
  halo.addColorStop(1, hurt ? "rgba(244, 63, 94, 0)" : `hsla(${theme.coreHue}, 90%, 72%, 0)`);
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(core.x, core.y, haloRadius, 0, Math.PI * 2);
  ctx.fill();

  // Shield bubble, when the effect is up.
  if (model.effects.shield > 0) {
    const shieldHue = config.powerUps.types.shield.hue;
    const wobble = reducedMotion ? 0 : Math.sin(elapsed * 6) * 1.5;
    ctx.save();
    ctx.strokeStyle = `hsla(${shieldHue}, 90%, 65%, 0.9)`;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.arc(core.x, core.y, core.radius * 2.5 + wobble, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Integrity ring: a green→red arc around the core, so health is readable
  // without looking away from the arena.
  const ringRadius = core.radius + 7;
  ctx.save();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
  ctx.beginPath();
  ctx.arc(core.x, core.y, ringRadius, 0, Math.PI * 2);
  ctx.stroke();

  const ringHue = 120 * healthRatio;
  ctx.strokeStyle = `hsl(${ringHue}, 90%, 60%)`;
  ctx.beginPath();
  ctx.arc(core.x, core.y, ringRadius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * healthRatio);
  ctx.stroke();
  ctx.restore();

  // Weapon cooldown, drawn just inside the integrity ring. This lives on the
  // canvas precisely because it changes every frame — in React it would be a
  // per-frame re-render.
  const weapon = model.config.weapons[model.weapon];
  const cooldown = derivedWeapon(model).cooldown;
  const ready = model.fireCooldown <= 0;
  const chargeRatio = ready ? 1 : 1 - model.fireCooldown / Math.max(cooldown, 0.0001);
  ctx.save();
  ctx.lineWidth = 2;
  ctx.strokeStyle = ready ? `hsla(${weapon.hue}, 100%, 70%, 0.95)` : `hsla(${weapon.hue}, 100%, 70%, 0.5)`;
  ctx.beginPath();
  ctx.arc(core.x, core.y, core.radius + 3, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * chargeRatio);
  ctx.stroke();
  ctx.restore();

  const body = ctx.createRadialGradient(core.x - 3, core.y - 3, 1, core.x, core.y, core.radius);
  body.addColorStop(0, "#ffffff");
  body.addColorStop(0.6, hurt ? "#ffc9d4" : `hsl(${theme.coreHue}, 90%, 78%)`);
  body.addColorStop(1, hurt ? "#f43f5e" : `hsl(${theme.coreHue}, 70%, 58%)`);
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(core.x, core.y, core.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
}
