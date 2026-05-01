"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";
import { useSearchParams } from "next/navigation";
import { Check, Copy, Link2, Maximize2, RotateCcw, SkipBack, SkipForward } from "lucide-react";
import { enterFullscreen } from "@/lib/tools/screens/fullscreen";
import { COLOR_PRESETS, normalizeHex, withBrightness } from "@/lib/tools/screens/colors";
import { buildShareUrl, copyText, readChoiceParam, readNumberParam, readStringParam } from "@/lib/tools/screens/url-state";
import { SCREEN_SAFETY_NOTE } from "@/lib/tools/screens/presets";
import { ToolLayoutFullscreenStudio } from "@/features/tools/layouts";
import { DEFAULT_FAKE_SCREEN_STATE, FAKE_SCREEN_PRESETS, MODE_LABELS } from "./presets";
import type {
  CanvasTemplate,
  ColorMode,
  ErrorTemplate,
  FakeScreenMode,
  FakeScreenPreset,
  FakeScreenState,
  ScreensaverSpeed,
  ScreensaverTemplate,
  UpdateProgressMode,
  UpdateTemplate,
} from "./types";

const COLOR_MODES: { label: string; value: ColorMode; help: string }[] = [
  { label: "Solid color", value: "solid", help: "Pick any custom color." },
  { label: "Dead pixel test", value: "dead-pixel", help: "Fixed white, black, red, green, and blue test screens." },
  { label: "Screen cleaner", value: "cleaning", help: "Bright screen plus timer." },
  { label: "Soft light", value: "soft-light", help: "Warm low-glare light source." },
];

const UPDATE_TEMPLATES: { label: string; value: UpdateTemplate }[] = [
  { label: "Windows 11", value: "win11" },
  { label: "Windows 10", value: "win10" },
  { label: "Windows XP", value: "winxp" },
  { label: "Mac OS X", value: "mac" },
  { label: "Ubuntu", value: "ubuntu" },
  { label: "Chrome OS", value: "chrome" },
  { label: "Android", value: "android" },
  { label: "Terminal", value: "terminal" },
];

const UPDATE_MODES: { label: string; value: UpdateProgressMode }[] = [
  { label: "Linear", value: "linear" },
  { label: "Realistic", value: "realistic" },
  { label: "Stuck 99%", value: "stuck-99" },
  { label: "Loop", value: "loop" },
  { label: "Manual", value: "manual" },
];

const ERROR_TEMPLATES: { label: string; value: ErrorTemplate }[] = [
  { label: "Modern blue", value: "blue-modern" },
  { label: "Classic blue", value: "blue-classic" },
  { label: "Developer", value: "developer" },
  { label: "Kernel", value: "kernel" },
  { label: "No signal", value: "no-signal" },
  { label: "Radar", value: "radar" },
  { label: "Broken", value: "broken" },
  { label: "Hacker", value: "hacker" },
];

const SCREENSAVER_TEMPLATES: { label: string; value: ScreensaverTemplate }[] = [
  { label: "DVD bounce", value: "dvd" },
  { label: "Flip clock", value: "flip-clock" },
  { label: "Quote", value: "quote" },
  { label: "No signal", value: "no-signal" },
  { label: "Matrix", value: "matrix" },
  { label: "Floating text", value: "floating-text" },
];

const CANVAS_TEMPLATES: { label: string; value: CanvasTemplate }[] = [
  { label: "Interactive circles", value: "interactive-circles" },
  { label: "Starfield", value: "starfield" },
  { label: "Particle network", value: "network" },
  { label: "Wave lines", value: "waves" },
  { label: "Aurora glow", value: "aurora" },
  { label: "Fireflies", value: "fireflies" },
  { label: "Bubbles", value: "bubbles" },
  { label: "Snowfall", value: "snow" },
  { label: "Plasma field", value: "plasma" },
  { label: "Confetti", value: "confetti" },
];

const SPEEDS: { label: string; value: ScreensaverSpeed }[] = [
  { label: "Slow", value: "slow" },
  { label: "Medium", value: "medium" },
  { label: "Fast", value: "fast" },
];

const DEAD_PIXEL_COLORS = [
  { label: "White", value: "#ffffff" },
  { label: "Black", value: "#000000" },
  { label: "Red", value: "#ef4444" },
  { label: "Green", value: "#22c55e" },
  { label: "Blue", value: "#2563eb" },
];

const SPEED_MAP: Record<ScreensaverSpeed, number> = { slow: 1.4, medium: 2.6, fast: 4 };
const CANVAS_SPEED_MAP: Record<ScreensaverSpeed, number> = { slow: 0.55, medium: 1, fast: 1.75 };
const MODE_VALUES: FakeScreenMode[] = ["color", "update", "error", "screensaver", "canvas"];
const COLOR_MODE_VALUES = COLOR_MODES.map((item) => item.value);
const UPDATE_TEMPLATE_VALUES = UPDATE_TEMPLATES.map((item) => item.value);
const UPDATE_MODE_VALUES = UPDATE_MODES.map((item) => item.value);
const ERROR_TEMPLATE_VALUES = ERROR_TEMPLATES.map((item) => item.value);
const SCREENSAVER_TEMPLATE_VALUES = SCREENSAVER_TEMPLATES.map((item) => item.value);
const CANVAS_TEMPLATE_VALUES = CANVAS_TEMPLATES.map((item) => item.value);

function calculateProgress(state: FakeScreenState, startedAt: number, now: number): number {
  if (state.updateProgressMode === "manual") return state.manualProgress;
  const durationMs = Math.max(1, state.updateDurationMinutes) * 60 * 1000;
  const elapsedRatio = Math.max(0, (now - startedAt) / durationMs);
  const start = Math.min(99, Math.max(0, state.updateStartPercent));
  if (state.updateProgressMode === "loop") return Math.round(start + (100 - start) * (elapsedRatio % 1));
  const capped = Math.min(1, elapsedRatio);
  if (state.updateProgressMode === "linear") return Math.round(start + (100 - start) * capped);
  if (state.updateProgressMode === "stuck-99") return Math.min(99, Math.round(start + (99 - start) * Math.min(1, capped * 1.7)));
  const realistic = capped < 0.55 ? capped * 1.25 : 0.69 + (1 - Math.exp(-(capped - 0.55) * 4.1)) * 0.3;
  return Math.min(99, Math.round(start + (99 - start) * realistic));
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block text-xs font-black uppercase tracking-[0.18em] text-slate-500">
      {label}
      {hint ? <span className="mt-1 block text-[11px] normal-case tracking-normal text-slate-500">{hint}</span> : null}
      <div className="mt-2">{children}</div>
    </label>
  );
}

function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={["w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-normal tracking-normal text-slate-900 outline-none focus:border-slate-400", props.className ?? ""].join(" ")} />;
}

function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={["min-h-20 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-normal tracking-normal text-slate-900 outline-none focus:border-slate-400", props.className ?? ""].join(" ")} />;
}

function SelectButtons<T extends string>({ options, value, onChange }: { options: { label: string; value: T }[]; value: T; onChange: (value: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={["rounded-full px-4 py-2 text-xs font-bold transition", value === option.value ? "bg-[var(--textColor)] text-[var(--baseColor)]" : "border border-black/10 bg-white text-[var(--textColor)]/75 hover:bg-black/5"].join(" ")}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function ExitHint() {
  return <div className="absolute right-4 top-4 z-30 rounded-full bg-black/55 px-4 py-2 text-xs font-bold text-white shadow-lg backdrop-blur">Press Esc to exit fullscreen</div>;
}

function WindowsMark({ colorful = false }: { colorful?: boolean }) {
  const colors = colorful ? ["#f25022", "#7fba00", "#00a4ef", "#ffb900"] : ["#fff", "#fff", "#fff", "#fff"];
  return (
    <div className="grid h-16 w-16 rotate-3 grid-cols-2 gap-1.5 drop-shadow-xl" aria-hidden>
      {colors.map((color, index) => <span key={`${color}-${index}`} className="rounded-sm" style={{ backgroundColor: color }} />)}
    </div>
  );
}

function WindowsSpinner({ color = "#fff", small = false }: { color?: string; small?: boolean }) {
  return (
    <div className={small ? "win-spinner is-small" : "win-spinner"} aria-hidden>
      {Array.from({ length: 8 }).map((_, index) => <span key={index} style={{ animationDelay: `${index * 0.1}s`, backgroundColor: color }} />)}
    </div>
  );
}

function AppleLikeMark() {
  return <div className="apple-like-mark" aria-hidden><span /></div>;
}

function ChromeLikeMark() {
  return <div className="chrome-like-mark" aria-hidden><span /></div>;
}

function AndroidLikeMark() {
  return (
    <div className="android-like-mark" aria-hidden>
      <span className="eye left" /><span className="eye right" /><span className="arm left" /><span className="arm right" />
    </div>
  );
}

function ColorPreview({ state, patch }: { state: FakeScreenState; patch: (next: Partial<FakeScreenState>) => void }) {
  const [seconds, setSeconds] = useState(state.timerMinutes * 60);
  useEffect(() => setSeconds(state.timerMinutes * 60), [state.timerMinutes, state.colorMode]);
  useEffect(() => {
    if (state.colorMode !== "cleaning") return;
    const timer = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [state.colorMode]);

  const deadColor = DEAD_PIXEL_COLORS[Math.max(0, Math.min(DEAD_PIXEL_COLORS.length - 1, state.deadPixelIndex))];
  const activeColor = state.colorMode === "dead-pixel" ? deadColor.value : state.color;
  const background = withBrightness(activeColor, state.brightness);
  const dark = activeColor === "#000000" || state.brightness < 35;

  return (
    <div className="relative flex h-full min-h-[520px] items-center justify-center overflow-hidden rounded-[28px] border border-black/10" style={{ backgroundColor: background }}>
      <ExitHint />
      {state.colorMode === "dead-pixel" ? (
        <div className={["rounded-3xl px-6 py-5 text-center shadow-lg backdrop-blur", dark ? "bg-white/80 text-slate-950" : "bg-black/45 text-white"].join(" ")}>
          <p className="text-xs font-black uppercase tracking-[0.2em]">Dead pixel test</p>
          <p className="mt-2 text-4xl font-black">{deadColor.label}</p>
          <p className="mt-2 max-w-sm text-xs leading-5 opacity-80">This mode intentionally ignores custom colors. Use the fixed test screens to inspect stuck or dead pixels.</p>
        </div>
      ) : null}
      {state.colorMode === "cleaning" ? (
        <div className="rounded-3xl bg-black/45 px-6 py-4 text-center text-white backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.2em]">Cleaning timer</p>
          <p className="mt-2 text-5xl font-black">{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}</p>
          <p className="mt-2 text-xs opacity-80">Wipe gently with a microfiber cloth.</p>
        </div>
      ) : null}
      {state.colorMode === "dead-pixel" ? (
        <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/45 p-2 backdrop-blur">
          <button type="button" onClick={() => patch({ deadPixelIndex: (state.deadPixelIndex + DEAD_PIXEL_COLORS.length - 1) % DEAD_PIXEL_COLORS.length })} className="rounded-full bg-white/90 p-2 text-slate-900" aria-label="Previous test color"><SkipBack className="h-4 w-4" /></button>
          {DEAD_PIXEL_COLORS.map((item, index) => (
            <button key={item.value} type="button" onClick={() => patch({ deadPixelIndex: index })} className={["h-8 w-8 rounded-full border-2", index === state.deadPixelIndex ? "border-yellow-300" : "border-white/70"].join(" ")} style={{ backgroundColor: item.value }} aria-label={`Show ${item.label} test color`} />
          ))}
          <button type="button" onClick={() => patch({ deadPixelIndex: (state.deadPixelIndex + 1) % DEAD_PIXEL_COLORS.length })} className="rounded-full bg-white/90 p-2 text-slate-900" aria-label="Next test color"><SkipForward className="h-4 w-4" /></button>
        </div>
      ) : null}
    </div>
  );
}

function UpdatePreview({ state, progress }: { state: FakeScreenState; progress: number }) {
  const p = Math.max(0, Math.min(100, progress));
  const step = Math.max(1, Math.min(117, Math.round((p / 100) * 117)));

  if (state.updateTemplate === "winxp") {
    return (
      <div className="relative flex h-full min-h-[520px] items-center justify-center overflow-hidden rounded-[28px] bg-[#5d83df] text-white">
        <ExitHint />
        <div className="absolute inset-x-0 top-0 h-[76px] bg-[#003399]" />
        <div className="absolute inset-x-0 bottom-0 h-[76px] bg-gradient-to-r from-[#30279d] via-[#2149c7] to-[#003399]" />
        <div className="absolute bottom-[76px] left-0 right-0 h-[3px] bg-[#e89b18]" />
        <div className="z-10 flex flex-col items-center text-center">
          <WindowsMark colorful />
          <div className="mt-4 flex items-end gap-1 drop-shadow-sm"><span className="text-xs">Microsoft</span><span className="text-5xl font-semibold leading-none">Windows</span><span className="pb-1 text-2xl font-black text-orange-500">XP</span></div>
          <div className="mt-8 w-[340px] rounded-sm bg-white/20 p-1 shadow-inner">
            <div className="flex gap-1">{Array.from({ length: 18 }).map((_, i) => <span key={i} className="h-3 flex-1 rounded-[1px]" style={{ backgroundColor: i < Math.round(p / 5.6) ? "#30d158" : "rgba(255,255,255,.22)" }} />)}</div>
          </div>
          <p className="mt-5 text-xl font-semibold">Installing update {step} of 117...</p>
          <p className="mt-3 text-xl">Do not turn off or unplug your computer.</p>
        </div>
      </div>
    );
  }

  if (state.updateTemplate === "win10") {
    return (
      <div className="relative flex h-full min-h-[520px] items-center justify-center rounded-[28px] bg-[#0078d7] text-white">
        <ExitHint />
        <div className="flex flex-col items-center text-center">
          <WindowsSpinner />
          <p className="mt-10 text-2xl font-normal">Working on updates {p}%</p>
          <p className="mt-5 text-xl">Don't turn off your PC. This will take a while.</p>
          <p className="mt-3 text-lg">Your PC will restart several times.</p>
        </div>
      </div>
    );
  }

  if (state.updateTemplate === "win11") {
    return (
      <div className="relative flex h-full min-h-[520px] items-center justify-center rounded-[28px] bg-[#05070c] text-white">
        <ExitHint />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(40,80,180,.25),transparent_45%)]" />
        <div className="relative flex flex-col items-center text-center">
          <WindowsSpinner color="#dbeafe" />
          <p className="mt-10 text-2xl font-light">Updates are underway</p>
          <p className="mt-3 text-xl">{p}% complete</p>
          <p className="mt-8 text-lg text-white/75">Please keep your device on.</p>
        </div>
      </div>
    );
  }

  if (state.updateTemplate === "mac") {
    return (
      <div className="relative flex h-full min-h-[520px] items-center justify-center rounded-[28px] bg-black text-white">
        <ExitHint />
        <div className="flex w-full max-w-md flex-col items-center">
          <AppleLikeMark />
          <div className="mt-12 h-1.5 w-80 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-white" style={{ width: `${p}%` }} /></div>
          <p className="mt-5 text-sm text-white/70">Installing update... {p}%</p>
        </div>
      </div>
    );
  }

  if (state.updateTemplate === "ubuntu") {
    return (
      <div className="relative flex h-full min-h-[520px] items-center justify-center rounded-[28px] bg-[#300a24] text-white">
        <ExitHint />
        <div className="absolute left-0 top-0 h-full w-20 bg-black/25" />
        <div className="flex flex-col items-center text-center">
          <div className="ubuntu-orb"><span /><span /><span /></div>
          <p className="mt-8 text-4xl font-light tracking-tight">ubuntu</p>
          <p className="mt-8 text-xl">Installing system updates</p>
          <div className="mt-6 flex gap-2">{Array.from({ length: 14 }).map((_, i) => <span key={i} className="h-2 w-7 rounded-full" style={{ backgroundColor: i < Math.round(p / 7.2) ? "#e95420" : "rgba(255,255,255,.22)" }} />)}</div>
          <p className="mt-5 text-sm text-white/75">{p}% complete</p>
        </div>
      </div>
    );
  }

  if (state.updateTemplate === "chrome") {
    return (
      <div className="relative flex h-full min-h-[520px] items-center justify-center rounded-[28px] bg-[#202124] text-white">
        <ExitHint />
        <div className="flex flex-col items-center text-center">
          <ChromeLikeMark />
          <p className="mt-8 text-2xl">Applying critical update</p>
          <p className="mt-3 text-sm text-white/60">Do not turn off your device</p>
          <div className="mt-8 h-1.5 w-80 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-blue-400" style={{ width: `${p}%` }} /></div>
        </div>
      </div>
    );
  }

  if (state.updateTemplate === "android") {
    return (
      <div className="relative flex h-full min-h-[520px] items-center justify-center rounded-[28px] bg-[#121212] text-[#a7f3d0]">
        <ExitHint />
        <div className="flex flex-col items-center text-center">
          <AndroidLikeMark />
          <WindowsSpinner color="#3ddc84" small />
          <p className="mt-8 text-2xl text-white">Installing system update</p>
          <p className="mt-2 text-lg text-white/70">Optimizing apps {p}%</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-[520px] overflow-hidden rounded-[28px] bg-black p-8 font-mono text-green-400">
      <ExitHint />
      <p className="text-lg">$ sudo apt update && sudo apt upgrade</p>
      {Array.from({ length: 18 }).map((_, i) => <p key={i} className="mt-2 text-sm opacity-80">[{String(i + 1).padStart(2, "0")}] resolving package-{i * 7 + p}.visual ... done</p>)}
      <p className="absolute bottom-8 left-8 text-xl">Progress: {p}%</p>
    </div>
  );
}

function ErrorPreview({ state }: { state: FakeScreenState }) {
  if (state.errorTemplate === "blue-classic") {
    return (
      <div className="relative h-full min-h-[520px] rounded-[28px] bg-[#0000aa] p-8 font-mono text-sm leading-6 text-white">
        <ExitHint />
        <p className="inline-block bg-white px-3 py-1 font-bold text-[#0000aa]">DEMO_ERROR</p>
        <p className="mt-8 text-base">{state.errorTitle}</p>
        <p className="mt-5">If this is the first time you have seen this screen, relax. It is only a Darma visual simulation.</p>
        <p className="mt-5">Check to make sure any new visual tools are properly installed. If this is a new demo, press Esc to exit fullscreen.</p>
        <p className="mt-5">Technical information:</p>
        <p className="mt-2">*** STOP: 0x0000007B ({state.errorStopCode})</p>
      </div>
    );
  }

  if (state.errorTemplate === "developer" || state.errorTemplate === "kernel") {
    const kernel = state.errorTemplate === "kernel";
    return (
      <div className="relative h-full min-h-[520px] overflow-hidden rounded-[28px] bg-black p-8 font-mono text-sm leading-6 text-red-300">
        <ExitHint />
        <p className="text-xl font-bold text-red-400">{kernel ? "panic(cpu 0 caller 0xffffff): visual kernel demo" : state.errorTitle}</p>
        {Array.from({ length: 18 }).map((_, i) => <p key={i} className="text-white/70">{kernel ? `0xffffff8${i} : com.darma.visual.driver + ${42 + i}` : `at visual.module.${i + 1} (/darma/fake-screen/demo:${42 + i}:13)`}</p>)}
        <p className="mt-6 text-yellow-300">CODE: {state.errorStopCode}</p>
      </div>
    );
  }

  if (state.errorTemplate === "no-signal") {
    return (
      <div className="relative flex h-full min-h-[520px] items-center justify-center overflow-hidden rounded-[28px] bg-black text-white">
        <ExitHint />
        <div className="absolute inset-0 grid grid-cols-8"><span className="bg-white" /><span className="bg-yellow-300" /><span className="bg-cyan-400" /><span className="bg-green-500" /><span className="bg-fuchsia-500" /><span className="bg-red-500" /><span className="bg-blue-600" /><span className="bg-black" /></div>
        <div className="absolute inset-0 opacity-25 tv-noise" />
        <div className="relative rounded-xl bg-black/80 px-10 py-6 text-center"><p className="text-5xl font-black tracking-[0.18em]">{state.errorTitle}</p><p className="mt-3 text-sm opacity-80">{state.errorMessage}</p></div>
      </div>
    );
  }

  if (state.errorTemplate === "radar") {
    return (
      <div className="relative h-full min-h-[520px] overflow-hidden rounded-[28px] bg-emerald-950">
        <ExitHint />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,.18),transparent_55%)]" />
        <div className="radar-grid absolute left-1/2 top-1/2 h-[430px] w-[430px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-400/60" />
        <div className="radar-sweep absolute left-1/2 top-1/2 h-[430px] w-[430px] -translate-x-1/2 -translate-y-1/2 rounded-full" />
        <span className="absolute left-[57%] top-[42%] h-3 w-3 rounded-full bg-red-500 shadow-[0_0_20px_red]" />
        <p className="absolute bottom-10 left-10 font-mono text-2xl text-emerald-300">{state.errorTitle}</p>
      </div>
    );
  }

  if (state.errorTemplate === "broken") {
    return (
      <div className="relative flex h-full min-h-[520px] items-center justify-center overflow-hidden rounded-[28px] bg-zinc-950 text-white">
        <ExitHint />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_48%_43%,rgba(255,255,255,.32),transparent_10%),linear-gradient(135deg,rgba(255,255,255,.12),transparent_40%)]" />
        {Array.from({ length: 30 }).map((_, i) => <span key={i} className="absolute left-1/2 top-1/2 h-px origin-left bg-white/55" style={{ width: `${24 + (i % 7) * 7}%`, transform: `rotate(${i * 19}deg)` }} />)}
        <div className="rounded-3xl bg-black/60 p-6 text-center backdrop-blur"><p className="text-3xl font-black">{state.errorTitle}</p><p className="mt-3 text-sm opacity-80">{state.errorMessage}</p></div>
      </div>
    );
  }

  if (state.errorTemplate === "hacker") {
    const chars = "010101 ACCESS DARMA VISUAL MATRIX SYSTEM READY ROOT /VAR/SCREEN DEMO ";
    return (
      <div className="relative h-full min-h-[520px] overflow-hidden rounded-[28px] bg-black p-6 font-mono text-xs leading-5 text-green-400">
        <ExitHint />
        {Array.from({ length: 28 }).map((_, row) => <p key={row}>{Array.from({ length: 90 }).map((_, i) => chars[(i + row * 7) % chars.length]).join("")}</p>)}
        <div className="absolute inset-x-8 bottom-8 rounded-xl bg-black/70 p-4"><p className="text-lg font-black">{state.errorTitle}</p><p className="mt-2 text-sm">{state.errorMessage}</p></div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-[520px] flex-col justify-center rounded-[28px] bg-[#0078d7] p-8 text-white sm:p-14">
      <ExitHint />
      <div className="max-w-3xl">
        <div className="text-8xl font-light">:(</div>
        <h2 className="mt-8 text-3xl font-semibold leading-tight sm:text-5xl">{state.errorTitle}</h2>
        <p className="mt-6 max-w-2xl text-lg leading-8 opacity-90">{state.errorMessage}</p>
        <div className="mt-8 flex items-end gap-7">
          <QrPlaceholder />
          <div><p className="text-lg font-bold">{state.errorProgress}% complete</p><p className="mt-5 text-sm leading-6 opacity-85">Stop code: <span className="font-bold">{state.errorStopCode}</span><br />Darma visual simulation</p></div>
        </div>
      </div>
    </div>
  );
}

function QrPlaceholder() {
  return <div className="grid h-24 w-24 grid-cols-7 gap-1 bg-white p-2">{Array.from({ length: 49 }).map((_, i) => <span key={i} className={(i % 3 === 0 || i % 7 === 1 || [0, 1, 2, 7, 14, 34, 41, 48].includes(i)) ? "bg-[#0078d7]" : "bg-white"} />)}</div>;
}

function BouncingText({ state, dvdStyle }: { state: FakeScreenState; dvdStyle?: boolean }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const positionRef = useRef({ x: 34, y: 44, dx: SPEED_MAP[state.screensaverSpeed], dy: SPEED_MAP[state.screensaverSpeed] });
  const [position, setPosition] = useState({ x: 34, y: 44 });
  const [cornerHits, setCornerHits] = useState(0);

  useEffect(() => {
    let lastCommit = 0;
    function tick(now: number) {
      const el = containerRef.current;
      if (!el) return;
      const logoWidth = Math.max(150, state.screensaverSize * (dvdStyle ? 3.35 : 2.8));
      const logoHeight = Math.max(70, state.screensaverSize * (dvdStyle ? 1.55 : 1.25));
      const maxX = Math.max(0, el.clientWidth - logoWidth - 12);
      const maxY = Math.max(0, el.clientHeight - logoHeight - 12);
      const next = positionRef.current;
      next.x += next.dx;
      next.y += next.dy;
      let hitX = false;
      let hitY = false;
      if (next.x <= 8 || next.x >= maxX) { next.dx *= -1; next.x = Math.max(8, Math.min(maxX, next.x)); hitX = true; }
      if (next.y <= 8 || next.y >= maxY) { next.dy *= -1; next.y = Math.max(8, Math.min(maxY, next.y)); hitY = true; }
      if (hitX && hitY) setCornerHits((value) => value + 1);
      if (now - lastCommit > 22) { setPosition({ x: next.x, y: next.y }); lastCommit = now; }
      frameRef.current = window.requestAnimationFrame(tick);
    }
    frameRef.current = window.requestAnimationFrame(tick);
    return () => { if (frameRef.current) window.cancelAnimationFrame(frameRef.current); };
  }, [state.screensaverSize, state.screensaverSpeed, dvdStyle]);

  return (
    <div ref={containerRef} className="relative h-full min-h-[520px] overflow-hidden rounded-[28px]" style={{ backgroundColor: state.screensaverBackground }}>
      <ExitHint />
      {state.showCornerCounter ? <div className="absolute bottom-4 left-4 z-20 rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-white backdrop-blur">Corner hits: {cornerHits}</div> : null}
      <div className="absolute select-none text-center font-black leading-none" style={{ left: position.x, top: position.y, color: state.screensaverColor, fontSize: state.screensaverSize }}>
        {dvdStyle ? <DvdLogo text={state.screensaverText || "DVD"} /> : state.screensaverText}
      </div>
    </div>
  );
}

function DvdLogo({ text }: { text: string }) {
  return (
    <div className="dvd-logo min-w-[170px]">
      <div className="-skew-x-12 font-black italic tracking-tighter">{text}</div>
      <div className="mx-auto mt-1 h-4 w-32 rounded-[50%] border-[5px]" />
      <div className="mt-1 text-[0.34em] tracking-[0.5em]">VIDEO</div>
    </div>
  );
}

function ScreensaverPreview({ state }: { state: FakeScreenState }) {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const id = window.setInterval(() => setTime(new Date()), 1000); return () => window.clearInterval(id); }, []);

  if (state.screensaverTemplate === "dvd" || state.screensaverTemplate === "floating-text") return <BouncingText state={state} dvdStyle={state.screensaverTemplate === "dvd"} />;
  if (state.screensaverTemplate === "flip-clock") {
    const parts = time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }).split(":");
    return <div className="relative flex h-full min-h-[520px] items-center justify-center rounded-[28px]" style={{ backgroundColor: state.screensaverBackground, color: state.screensaverColor }}><ExitHint /><div className="flex gap-3">{parts.map((part, index) => <div key={index} className="rounded-2xl bg-black px-5 py-4 text-6xl font-black text-white shadow-lg">{part}</div>)}</div></div>;
  }
  if (state.screensaverTemplate === "quote") return <div className="relative flex h-full min-h-[520px] items-center justify-center rounded-[28px] p-10 text-center" style={{ backgroundColor: state.screensaverBackground, color: state.screensaverColor }}><ExitHint /><blockquote className="max-w-3xl text-4xl font-semibold leading-tight">“{state.screensaverText}”</blockquote></div>;
  if (state.screensaverTemplate === "no-signal") return <div className="relative flex h-full min-h-[520px] items-center justify-center overflow-hidden rounded-[28px] bg-black text-white"><ExitHint /><div className="absolute inset-0 grid grid-cols-8"><span className="bg-white" /><span className="bg-yellow-300" /><span className="bg-cyan-400" /><span className="bg-green-500" /><span className="bg-fuchsia-500" /><span className="bg-red-500" /><span className="bg-blue-600" /><span className="bg-black" /></div><div className="absolute inset-0 opacity-20 tv-noise" /><p className="relative rounded-xl bg-black/75 px-8 py-4 text-4xl font-black tracking-[0.22em]">{state.screensaverText}</p></div>;
  return <div className="relative h-full min-h-[520px] overflow-hidden rounded-[28px] bg-black p-4 font-mono text-green-400"><ExitHint />{Array.from({ length: 32 }).map((_, row) => <p key={row} className="whitespace-nowrap opacity-80 matrix-row" style={{ animationDelay: `${row * 0.08}s` }}>{Array.from({ length: 104 }).map((_, i) => "アイウエオカキクケコサシスセソ01DARMA"[(i + row * 3) % 27]).join("")}</p>)}</div>;
}

function CanvasBackground({ state }: { state: FakeScreenState }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let width = 0;
    let height = 0;
    let t = 0;
    const mouse = { x: -9999, y: -9999 };
    const speed = CANVAS_SPEED_MAP[state.canvasSpeed];
    type Particle = { x: number; y: number; vx: number; vy: number; r: number; color: string; a: number; z: number; life: number };
    let particles: Particle[] = [];
    const palette = [state.canvasPrimaryColor, "#ff5d70", "#fffa77", "#7dd3fc", "#f97316", "#ffffff"];

    function randomColor() { return palette[Math.floor(Math.random() * palette.length)]; }

    function resize() {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
      seed();
    }

    function seed() {
      const countByTemplate: Record<CanvasTemplate, number> = {
        "interactive-circles": Math.min(1300, Math.max(180, state.canvasDensity)),
        starfield: Math.min(1500, Math.max(260, state.canvasDensity * 2)),
        network: Math.min(240, Math.max(70, state.canvasDensity)),
        waves: Math.min(28, Math.max(6, state.canvasDensity)),
        aurora: 10,
        fireflies: Math.min(260, Math.max(70, state.canvasDensity)),
        bubbles: Math.min(180, Math.max(40, state.canvasDensity)),
        snow: Math.min(700, Math.max(140, state.canvasDensity)),
        plasma: 1,
        confetti: Math.min(400, Math.max(90, state.canvasDensity)),
      };
      const count = countByTemplate[state.canvasTemplate];
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * speed,
        vy: (Math.random() - 0.5) * speed,
        r: Math.random() * 4 + 1,
        color: randomColor(),
        a: Math.random() * Math.PI * 2,
        z: Math.random() * width + 1,
        life: Math.random(),
      }));
    }

    function clear(alpha = 1) {
      ctx.fillStyle = alpha >= 1 ? state.canvasBackground : hexToRgba(state.canvasBackground, alpha);
      ctx.fillRect(0, 0, width, height);
    }

    function drawWaves() {
      clear();
      for (let j = 0; j < Math.min(28, Math.max(6, state.canvasDensity)); j++) {
        ctx.beginPath();
        ctx.strokeStyle = hexToRgba(state.canvasPrimaryColor, Math.max(0.16, 0.72 - j * 0.03));
        ctx.lineWidth = 1.5 + (j % 3);
        for (let x = 0; x <= width; x += 8) {
          const y = height * 0.5 + Math.sin(x / (70 + j * 4) + t + j * 0.35) * (22 + j * 2.5) + (j - 13) * 12;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }

    function drawAurora() {
      clear();
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < 7; i++) {
        const g = ctx.createRadialGradient(width * (0.25 + 0.45 * Math.sin(t * 0.45 + i)), height * (0.28 + 0.36 * Math.cos(t * 0.35 + i)), 10, width * 0.5, height * 0.45, Math.max(width, height) * 0.72);
        g.addColorStop(0, hexToRgba(palette[i % palette.length], 0.48));
        g.addColorStop(0.46, hexToRgba(palette[(i + 2) % palette.length], 0.16));
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, width, height);
      }
      ctx.globalCompositeOperation = "source-over";
    }

    function drawPlasma() {
      const image = ctx.createImageData(width, height);
      const data = image.data;
      for (let y = 0; y < height; y += 2) {
        for (let x = 0; x < width; x += 2) {
          const v = Math.sin(x * 0.025 + t) + Math.sin(y * 0.028 + t * 1.2) + Math.sin((x + y) * 0.018 + t * 0.8);
          const r = Math.floor(128 + 127 * Math.sin(v + t));
          const g = Math.floor(128 + 127 * Math.sin(v + 2.1));
          const b = Math.floor(128 + 127 * Math.sin(v + 4.2));
          for (let oy = 0; oy < 2; oy++) for (let ox = 0; ox < 2; ox++) {
            const idx = ((y + oy) * width + x + ox) * 4;
            data[idx] = r; data[idx + 1] = g; data[idx + 2] = b; data[idx + 3] = 255;
          }
        }
      }
      ctx.putImageData(image, 0, 0);
    }

    function drawParticles() {
      clear(state.canvasTemplate === "starfield" ? 0.35 : 1);
      if (state.canvasTemplate === "starfield") {
        particles.forEach((p) => {
          p.z -= 7 * speed;
          if (p.z <= 1) { p.x = Math.random() * width - width / 2; p.y = Math.random() * height - height / 2; p.z = width; }
          const sx = (p.x / p.z) * width + width / 2;
          const sy = (p.y / p.z) * width + height / 2;
          const radius = Math.max(0.7, (1 - p.z / width) * 3);
          ctx.fillStyle = p.color;
          ctx.beginPath(); ctx.arc(sx, sy, radius, 0, Math.PI * 2); ctx.fill();
        });
        return;
      }

      particles.forEach((p, index) => {
        if (state.canvasTemplate === "snow") {
          p.y += (0.55 + p.r * 0.2) * speed;
          p.x += Math.sin(t * 2 + p.a) * 0.45;
          if (p.y > height + 12) { p.y = -12; p.x = Math.random() * width; }
          ctx.fillStyle = hexToRgba("#ffffff", 0.62 + p.life * 0.35);
          ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(1.2, p.r * 0.75), 0, Math.PI * 2); ctx.fill();
          return;
        }

        if (state.canvasTemplate === "bubbles") {
          p.y -= (0.35 + p.r * 0.12) * speed;
          p.x += Math.sin(t + p.a) * 0.35;
          if (p.y < -20) { p.y = height + 20; p.x = Math.random() * width; }
          ctx.strokeStyle = hexToRgba("#ecfeff", 0.42);
          ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 3.2, 0, Math.PI * 2); ctx.stroke();
          ctx.fillStyle = hexToRgba("#ffffff", 0.2);
          ctx.beginPath(); ctx.arc(p.x - p.r, p.y - p.r, Math.max(1, p.r * 0.6), 0, Math.PI * 2); ctx.fill();
          return;
        }

        if (state.canvasTemplate === "confetti") {
          p.y += (1.4 + p.r * 0.18) * speed;
          p.x += Math.sin(t * 2 + p.a) * 1.3;
          p.a += 0.06 * speed;
          if (p.y > height + 20) { p.y = -20; p.x = Math.random() * width; p.color = randomColor(); }
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.color; ctx.fillRect(-p.r * 2, -p.r, p.r * 4, p.r * 1.6); ctx.restore();
          return;
        }

        if (state.canvasTemplate === "fireflies") {
          p.x += Math.sin(t + p.a) * 0.55 * speed + p.vx * 0.4;
          p.y += Math.cos(t * 0.8 + p.a) * 0.45 * speed + p.vy * 0.4;
          if (p.x < -20) p.x = width + 20; if (p.x > width + 20) p.x = -20;
          if (p.y < -20) p.y = height + 20; if (p.y > height + 20) p.y = -20;
          const glow = 0.45 + Math.sin(t * 4 + p.a) * 0.32;
          const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 7);
          gradient.addColorStop(0, hexToRgba(state.canvasPrimaryColor, Math.max(0.25, glow)));
          gradient.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = gradient; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 7, 0, Math.PI * 2); ctx.fill();
          return;
        }

        p.x += p.vx; p.y += p.vy;
        if (p.x + p.r > width || p.x - p.r < 0) p.vx *= -1;
        if (p.y + p.r > height || p.y - p.r < 0) p.vy *= -1;

        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const near = Math.abs(dx) < 65 && Math.abs(dy) < 65;
        const radius = state.canvasTemplate === "interactive-circles" && near ? Math.min(40, p.r + 18) : p.r;
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, radius, 0, Math.PI * 2); ctx.fill();
        if (state.canvasTemplate === "network") {
          for (let j = index + 1; j < particles.length; j++) {
            const q = particles[j];
            const d = Math.hypot(p.x - q.x, p.y - q.y);
            if (d < 110) { ctx.strokeStyle = hexToRgba(state.canvasPrimaryColor, (1 - d / 110) * 0.45); ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); }
          }
        }
      });
    }

    function draw() {
      t += 0.016 * speed;
      if (state.canvasTemplate === "waves") drawWaves();
      else if (state.canvasTemplate === "aurora") drawAurora();
      else if (state.canvasTemplate === "plasma") drawPlasma();
      else drawParticles();
      raf = requestAnimationFrame(draw);
    }

    const onMove = (event: MouseEvent) => { const rect = canvas.getBoundingClientRect(); mouse.x = event.clientX - rect.left; mouse.y = event.clientY - rect.top; };
    canvas.addEventListener("mousemove", onMove);
    window.addEventListener("resize", resize);
    resize(); draw();
    return () => { cancelAnimationFrame(raf); canvas.removeEventListener("mousemove", onMove); window.removeEventListener("resize", resize); };
  }, [state.canvasTemplate, state.canvasDensity, state.canvasSpeed, state.canvasPrimaryColor, state.canvasBackground]);

  return <div className="relative h-full min-h-[520px] overflow-hidden rounded-[28px]"><ExitHint /><canvas ref={ref} className="h-full min-h-[520px] w-full" /></div>;
}

function hexToRgba(hex: string, alpha: number) {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((char) => char + char).join("") : clean.padEnd(6, "0").slice(0, 6);
  const num = parseInt(full, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function PresetThumbnail({ preset }: { preset: FakeScreenPreset }) {
  const s = preset.state;
  if (preset.mode === "update") {
    const template = s.updateTemplate;
    if (template === "winxp") return <span className="preview-art bg-[#5d83df]"><i className="absolute inset-x-0 top-0 h-3 bg-[#003399]" /><i className="absolute inset-x-0 bottom-0 h-3 bg-[#1b38b4]" /><WindowsMark colorful /></span>;
    if (template === "mac") return <span className="preview-art bg-black"><AppleLikeMark /></span>;
    if (template === "ubuntu") return <span className="preview-art bg-[#300a24]"><b className="text-[11px] font-light text-white">ubuntu</b></span>;
    if (template === "chrome") return <span className="preview-art bg-[#202124]"><ChromeLikeMark /></span>;
    if (template === "android") return <span className="preview-art bg-[#121212]"><AndroidLikeMark /></span>;
    if (template === "terminal") return <span className="preview-art bg-black p-2 font-mono text-[9px] leading-3 text-green-400">$ update<br />pkg done<br />pkg done</span>;
    return <span className={template === "win10" ? "preview-art bg-[#0078d7]" : "preview-art bg-[#05070c]"}><WindowsSpinner small /></span>;
  }
  if (preset.mode === "error") {
    if (s.errorTemplate === "blue-modern") return <span className="preview-art bg-[#0078d7] p-3 text-white"><b className="text-2xl font-light">:(</b><QrPlaceholder /></span>;
    if (s.errorTemplate === "radar") return <span className="preview-art bg-emerald-950"><i className="radar-sweep h-14 w-14 rounded-full border border-emerald-400/60" /></span>;
    if (s.errorTemplate === "no-signal") return <span className="preview-art grid grid-cols-7"><i className="bg-white" /><i className="bg-yellow-300" /><i className="bg-cyan-400" /><i className="bg-green-500" /><i className="bg-fuchsia-500" /><i className="bg-red-500" /><i className="bg-blue-600" /></span>;
    if (s.errorTemplate === "broken") return <span className="preview-art bg-zinc-950"><i className="h-px w-20 rotate-45 bg-white/70" /><i className="absolute h-px w-16 -rotate-12 bg-white/70" /></span>;
    return <span className="preview-art bg-black p-2 font-mono text-[9px] leading-3 text-green-400">0101<br />ACCESS<br />READY</span>;
  }
  if (preset.mode === "screensaver") {
    if (s.screensaverTemplate === "dvd") return <span className="preview-art bg-black text-red-500"><DvdLogo text="DVD" /></span>;
    if (s.screensaverTemplate === "matrix") return <span className="preview-art bg-black font-mono text-[9px] leading-3 text-green-400">アイ01<br />0101<br />DARMA</span>;
    if (s.screensaverTemplate === "no-signal") return <span className="preview-art grid grid-cols-7"><i className="bg-white" /><i className="bg-yellow-300" /><i className="bg-cyan-400" /><i className="bg-green-500" /><i className="bg-fuchsia-500" /><i className="bg-red-500" /><i className="bg-blue-600" /></span>;
    if (s.screensaverTemplate === "flip-clock") return <span className="preview-art bg-white"><b className="rounded bg-black px-1.5 py-1 text-xs text-white">15:31</b></span>;
  }
  if (preset.mode === "canvas") return <CanvasMini template={s.canvasTemplate ?? "interactive-circles"} />;
  return <span className={["preview-art", preset.previewClassName].join(" ")} />;
}

function CanvasMini({ template }: { template: CanvasTemplate }) {
  if (template === "snow") return <span className="preview-art bg-slate-800">{Array.from({ length: 16 }).map((_, i) => <i key={i} className="absolute h-1 w-1 rounded-full bg-white" style={{ left: `${(i * 19) % 96}%`, top: `${(i * 31) % 82}%` }} />)}</span>;
  if (template === "bubbles") return <span className="preview-art bg-cyan-700">{Array.from({ length: 8 }).map((_, i) => <i key={i} className="absolute rounded-full border border-cyan-100/70" style={{ left: `${(i * 17) % 88}%`, top: `${(i * 23) % 75}%`, width: 8 + (i % 3) * 5, height: 8 + (i % 3) * 5 }} />)}</span>;
  if (template === "confetti") return <span className="preview-art bg-white">{Array.from({ length: 14 }).map((_, i) => <i key={i} className="absolute h-1.5 w-4 rotate-45" style={{ left: `${(i * 13) % 90}%`, top: `${(i * 29) % 80}%`, backgroundColor: ["#f97316", "#22c55e", "#3b82f6", "#ef4444"][i % 4] }} />)}</span>;
  if (template === "starfield") return <span className="preview-art bg-black">{Array.from({ length: 26 }).map((_, i) => <i key={i} className="absolute h-0.5 w-0.5 rounded-full bg-white" style={{ left: `${(i * 23) % 96}%`, top: `${(i * 41) % 88}%` }} />)}</span>;
  if (template === "network") return <span className="preview-art bg-slate-950"><i className="h-px w-24 rotate-12 bg-sky-300/70" /><i className="absolute h-px w-20 -rotate-45 bg-sky-300/60" /><i className="absolute h-2 w-2 rounded-full bg-sky-300" /></span>;
  if (template === "waves") return <span className="preview-art bg-blue-950"><i className="h-6 w-full rounded-[50%] border-t-2 border-sky-300" /><i className="absolute mt-5 h-6 w-full rounded-[50%] border-t-2 border-sky-300/60" /></span>;
  if (template === "fireflies") return <span className="preview-art bg-stone-950">{Array.from({ length: 9 }).map((_, i) => <i key={i} className="absolute h-1.5 w-1.5 rounded-full bg-yellow-200 shadow-[0_0_10px_#fde68a]" style={{ left: `${(i * 17) % 88}%`, top: `${(i * 23) % 82}%` }} />)}</span>;
  return <span className="preview-art bg-gradient-to-br from-emerald-400 via-purple-500 to-slate-950" />;
}

function Preview({ state, progress, patch }: { state: FakeScreenState; progress: number; patch: (next: Partial<FakeScreenState>) => void }) {
  if (state.mode === "color") return <ColorPreview state={state} patch={patch} />;
  if (state.mode === "update") return <UpdatePreview state={state} progress={progress} />;
  if (state.mode === "error") return <ErrorPreview state={state} />;
  if (state.mode === "canvas") return <CanvasBackground state={state} />;
  return <ScreensaverPreview state={state} />;
}

export default function FakeScreenClient() {
  const params = useSearchParams();
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState(Date.now());
  const [now, setNow] = useState(Date.now());
  const [state, setState] = useState<FakeScreenState>(() => ({
    ...DEFAULT_FAKE_SCREEN_STATE,
    mode: readChoiceParam(params, "mode", DEFAULT_FAKE_SCREEN_STATE.mode, MODE_VALUES),
    colorMode: readChoiceParam(params, "colorMode", DEFAULT_FAKE_SCREEN_STATE.colorMode, COLOR_MODE_VALUES),
    color: normalizeHex(readStringParam(params, "color", DEFAULT_FAKE_SCREEN_STATE.color), DEFAULT_FAKE_SCREEN_STATE.color),
    brightness: readNumberParam(params, "brightness", DEFAULT_FAKE_SCREEN_STATE.brightness, 10, 100),
    deadPixelIndex: readNumberParam(params, "test", DEFAULT_FAKE_SCREEN_STATE.deadPixelIndex, 0, DEAD_PIXEL_COLORS.length - 1),
    updateTemplate: readChoiceParam(params, "update", DEFAULT_FAKE_SCREEN_STATE.updateTemplate, UPDATE_TEMPLATE_VALUES),
    updateProgressMode: readChoiceParam(params, "progress", DEFAULT_FAKE_SCREEN_STATE.updateProgressMode, UPDATE_MODE_VALUES),
    updateDurationMinutes: readNumberParam(params, "duration", DEFAULT_FAKE_SCREEN_STATE.updateDurationMinutes, 1, 90),
    updateStartPercent: readNumberParam(params, "start", DEFAULT_FAKE_SCREEN_STATE.updateStartPercent, 0, 99),
    errorTemplate: readChoiceParam(params, "error", DEFAULT_FAKE_SCREEN_STATE.errorTemplate, ERROR_TEMPLATE_VALUES),
    screensaverTemplate: readChoiceParam(params, "saver", DEFAULT_FAKE_SCREEN_STATE.screensaverTemplate, SCREENSAVER_TEMPLATE_VALUES),
    screensaverText: readStringParam(params, "text", DEFAULT_FAKE_SCREEN_STATE.screensaverText),
    screensaverSpeed: readChoiceParam(params, "speed", DEFAULT_FAKE_SCREEN_STATE.screensaverSpeed, ["slow", "medium", "fast"]),
    canvasTemplate: readChoiceParam(params, "canvas", DEFAULT_FAKE_SCREEN_STATE.canvasTemplate, CANVAS_TEMPLATE_VALUES),
  }));

  useEffect(() => { const id = window.setInterval(() => setNow(Date.now()), 500); return () => window.clearInterval(id); }, []);
  const progress = useMemo(() => calculateProgress(state, startedAt, now), [state, startedAt, now]);
  const activePresets = FAKE_SCREEN_PRESETS.filter((preset) => preset.mode === state.mode);

  function patch(next: Partial<FakeScreenState>) { setState((current) => ({ ...current, ...next })); }

  async function copyShareLink() {
    const url = buildShareUrl("/tools/fake-screen", {
      mode: state.mode,
      colorMode: state.colorMode,
      color: state.color,
      brightness: state.brightness,
      test: state.deadPixelIndex,
      update: state.updateTemplate,
      duration: state.updateDurationMinutes,
      start: state.updateStartPercent,
      progress: state.updateProgressMode,
      error: state.errorTemplate,
      saver: state.screensaverTemplate,
      text: state.screensaverText,
      speed: state.screensaverSpeed,
      canvas: state.canvasTemplate,
    });
    if (await copyText(url)) { setCopied("share"); window.setTimeout(() => setCopied(null), 1400); }
  }

  async function copyColor() {
    if (await copyText(state.color)) { setCopied("color"); window.setTimeout(() => setCopied(null), 1400); }
  }

  return (
    <div className="space-y-6">
      <style>{styles}</style>
      <ToolLayoutFullscreenStudio
        categorySlot={
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {(Object.keys(MODE_LABELS) as FakeScreenMode[]).map((mode) => (
              <button key={mode} type="button" onClick={() => patch({ mode })} className={["rounded-3xl border p-5 text-left transition hover:-translate-y-0.5 hover:shadow-sm", state.mode === mode ? "border-slate-900 bg-slate-900 text-white" : "border-black/10 bg-white text-slate-800"].join(" ")}>
                <span className="text-xs font-black uppercase tracking-[0.18em] opacity-70">Category</span>
                <span className="mt-2 block text-lg font-black">{MODE_LABELS[mode]}</span>
              </button>
            ))}
          </div>
        }
        previewSlot={
          <div ref={stageRef} className="h-full overflow-hidden rounded-[30px] bg-slate-100 shadow-sm">
            <Preview state={state} progress={progress} patch={patch} />
          </div>
        }
        actionBarSlot={
          <>
            <button type="button" onClick={() => stageRef.current && void enterFullscreen(stageRef.current)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--textColor)] px-5 py-3 text-sm font-black text-[var(--baseColor)] transition hover:opacity-85"><Maximize2 className="h-4 w-4" /> Start Fullscreen</button>
            <button type="button" onClick={copyShareLink} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-bold text-slate-800 transition hover:bg-black/5">{copied === "share" ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />} {copied === "share" ? "Copied" : "Copy Link"}</button>
            {state.mode === "color" && state.colorMode !== "dead-pixel" ? <button type="button" onClick={copyColor} className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-bold"><Copy className="h-4 w-4" /> {copied === "color" ? "Copied" : "Copy Hex"}</button> : null}
            <button type="button" onClick={() => { setState(DEFAULT_FAKE_SCREEN_STATE); setStartedAt(Date.now()); }} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-bold text-slate-800 transition hover:bg-black/5"><RotateCcw className="h-4 w-4" /> Reset</button>
            <span className="ml-auto text-xs font-bold text-slate-500">Fullscreen starts manually. Press Esc to exit.</span>
          </>
        }
        examplesSlot={
          <>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Examples</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">Choose a ready-made screen, then fine-tune it in the controls.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activePresets.map((preset) => {
              const selected = preset.state.mode === state.mode && (
                preset.state.updateTemplate === state.updateTemplate || preset.state.errorTemplate === state.errorTemplate || preset.state.screensaverTemplate === state.screensaverTemplate || preset.state.canvasTemplate === state.canvasTemplate || preset.state.colorMode === state.colorMode
              );
              return (
                <button key={preset.id} type="button" onClick={() => { patch({ ...preset.state, mode: preset.mode }); setStartedAt(Date.now()); }} className={["rounded-3xl border bg-slate-50 p-3 text-left transition hover:-translate-y-0.5 hover:bg-slate-100 hover:shadow-sm", selected ? "border-slate-900 ring-2 ring-slate-900/10" : "border-black/10"].join(" ")}>
                  <PresetThumbnail preset={preset} />
                  <span className="mt-3 block text-sm font-black text-slate-900">{preset.title}</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-600">{preset.description}</span>
                </button>
              );
            })}
          </div>
          </>
        }
        controlsSlot={
          <>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Controls</p>
          <div className="mt-4">
            {state.mode === "color" ? <ColorControls state={state} patch={patch} /> : null}
            {state.mode === "update" ? <UpdateControls state={state} patch={patch} restart={() => setStartedAt(Date.now())} /> : null}
            {state.mode === "error" ? <ErrorControls state={state} patch={patch} /> : null}
            {state.mode === "screensaver" ? <ScreensaverControls state={state} patch={patch} /> : null}
            {state.mode === "canvas" ? <CanvasControls state={state} patch={patch} /> : null}
          </div>
          <p className="mt-5 rounded-2xl bg-amber-50 p-3 text-xs leading-5 text-amber-900">{SCREEN_SAFETY_NOTE}</p>
          </>
        }
      />
    </div>
  );
}

function ColorControls({ state, patch }: { state: FakeScreenState; patch: (next: Partial<FakeScreenState>) => void }) {
  const selectedDeadColor = DEAD_PIXEL_COLORS[state.deadPixelIndex] ?? DEAD_PIXEL_COLORS[0];
  return (
    <div className="space-y-4">
      <Field label="Color mode"><div className="grid gap-2">{COLOR_MODES.map((mode) => <button key={mode.value} type="button" onClick={() => patch({ colorMode: mode.value })} className={["rounded-2xl border p-3 text-left transition", state.colorMode === mode.value ? "border-slate-900 bg-slate-900 text-white" : "border-black/10 bg-white text-slate-700 hover:bg-slate-50"].join(" ")}><span className="block text-sm font-black">{mode.label}</span><span className="mt-1 block text-xs opacity-75">{mode.help}</span></button>)}</div></Field>
      {state.colorMode === "dead-pixel" ? (
        <Field label="Test color" hint="Dead pixel mode intentionally ignores the custom color picker."><div className="flex flex-wrap gap-2">{DEAD_PIXEL_COLORS.map((item, index) => <button key={item.value} type="button" onClick={() => patch({ deadPixelIndex: index })} className={["rounded-2xl border px-3 py-2 text-xs font-bold", index === state.deadPixelIndex ? "border-slate-900 bg-slate-900 text-white" : "border-black/10 bg-white text-slate-700"].join(" ")}><span className="mr-2 inline-block h-3 w-3 rounded-full border border-black/20 align-middle" style={{ backgroundColor: item.value }} />{item.label}</button>)}</div><p className="mt-2 text-xs font-bold normal-case tracking-normal text-slate-500">Currently showing: {selectedDeadColor.label}</p></Field>
      ) : (
        <><Field label="Quick color presets"><div className="flex flex-wrap gap-2">{COLOR_PRESETS.map((preset) => <button key={preset.value} type="button" onClick={() => patch({ color: preset.value })} className="h-10 w-10 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: preset.value }} title={preset.label} aria-label={preset.label} />)}</div></Field><Field label="Custom color"><div className="flex gap-2"><input type="color" value={state.color} onChange={(e) => patch({ color: e.target.value })} className="h-10 w-14 rounded-xl border border-black/10 bg-white" /><TextInput value={state.color} onChange={(e) => patch({ color: normalizeHex(e.target.value, state.color) })} /></div></Field></>
      )}
      <Field label={`Brightness: ${state.brightness}%`}><input type="range" min="10" max="100" value={state.brightness} onChange={(e) => patch({ brightness: Number(e.target.value) })} className="w-full" /></Field>
      {state.colorMode === "cleaning" ? <Field label="Cleaning timer minutes"><TextInput type="number" min={1} max={30} value={state.timerMinutes} onChange={(e) => patch({ timerMinutes: Number(e.target.value) })} /></Field> : null}
    </div>
  );
}

function UpdateControls({ state, patch, restart }: { state: FakeScreenState; patch: (next: Partial<FakeScreenState>) => void; restart: () => void }) {
  return <div className="space-y-4"><Field label="Update example"><SelectButtons options={UPDATE_TEMPLATES} value={state.updateTemplate} onChange={(updateTemplate) => { patch({ updateTemplate }); restart(); }} /></Field><Field label="Progress mode"><SelectButtons options={UPDATE_MODES} value={state.updateProgressMode} onChange={(updateProgressMode) => patch({ updateProgressMode })} /></Field><div className="grid gap-3 sm:grid-cols-2"><Field label="Duration minutes"><TextInput type="number" min={1} max={90} value={state.updateDurationMinutes} onChange={(e) => patch({ updateDurationMinutes: Number(e.target.value) })} /></Field><Field label="Start percent"><TextInput type="number" min={0} max={99} value={state.updateStartPercent} onChange={(e) => patch({ updateStartPercent: Number(e.target.value) })} /></Field></div>{state.updateProgressMode === "manual" ? <Field label={`Manual progress: ${state.manualProgress}%`}><input type="range" min="0" max="100" value={state.manualProgress} onChange={(e) => patch({ manualProgress: Number(e.target.value) })} className="w-full" /></Field> : null}<Field label="Main message"><TextInput value={state.updateTitle} onChange={(e) => patch({ updateTitle: e.target.value })} /></Field><Field label="Secondary message"><TextArea value={state.updateSubtitle} onChange={(e) => patch({ updateSubtitle: e.target.value })} /></Field><button type="button" onClick={restart} className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-bold">Start / Restart Progress</button></div>;
}

function ErrorControls({ state, patch }: { state: FakeScreenState; patch: (next: Partial<FakeScreenState>) => void }) {
  return <div className="space-y-4"><Field label="Error example"><SelectButtons options={ERROR_TEMPLATES} value={state.errorTemplate} onChange={(errorTemplate) => patch({ errorTemplate })} /></Field><Field label="Error title"><TextArea value={state.errorTitle} onChange={(e) => patch({ errorTitle: e.target.value })} /></Field><Field label="Message"><TextArea value={state.errorMessage} onChange={(e) => patch({ errorMessage: e.target.value })} /></Field><Field label="Stop code"><TextInput value={state.errorStopCode} onChange={(e) => patch({ errorStopCode: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "") })} /></Field><Field label={`Progress: ${state.errorProgress}%`}><input type="range" min="0" max="100" value={state.errorProgress} onChange={(e) => patch({ errorProgress: Number(e.target.value) })} className="w-full" /></Field></div>;
}

function ScreensaverControls({ state, patch }: { state: FakeScreenState; patch: (next: Partial<FakeScreenState>) => void }) {
  return <div className="space-y-4"><Field label="Screensaver example"><SelectButtons options={SCREENSAVER_TEMPLATES} value={state.screensaverTemplate} onChange={(screensaverTemplate) => patch({ screensaverTemplate, screensaverText: screensaverTemplate === "dvd" ? "DVD" : state.screensaverText })} /></Field><Field label="Text"><TextInput value={state.screensaverText} maxLength={state.screensaverTemplate === "quote" ? 120 : 28} onChange={(e) => patch({ screensaverText: e.target.value })} /></Field><Field label="Speed"><SelectButtons options={SPEEDS} value={state.screensaverSpeed} onChange={(screensaverSpeed) => patch({ screensaverSpeed })} /></Field><Field label={`Text size: ${state.screensaverSize}px`}><input type="range" min="24" max="110" value={state.screensaverSize} onChange={(e) => patch({ screensaverSize: Number(e.target.value) })} className="w-full" /></Field><div className="grid gap-3 sm:grid-cols-2"><Field label="Background"><input type="color" value={state.screensaverBackground} onChange={(e) => patch({ screensaverBackground: e.target.value })} className="h-10 w-full rounded-xl border border-black/10 bg-white" /></Field><Field label="Text color"><input type="color" value={state.screensaverColor} onChange={(e) => patch({ screensaverColor: e.target.value })} className="h-10 w-full rounded-xl border border-black/10 bg-white" /></Field></div><label className="flex items-center gap-3 rounded-2xl border border-black/10 bg-slate-50 p-3 text-sm font-bold text-slate-700"><input type="checkbox" checked={state.showCornerCounter} onChange={(e) => patch({ showCornerCounter: e.target.checked })} /> Show corner hit counter</label></div>;
}

function CanvasControls({ state, patch }: { state: FakeScreenState; patch: (next: Partial<FakeScreenState>) => void }) {
  return <div className="space-y-4"><Field label="Canvas example"><SelectButtons options={CANVAS_TEMPLATES} value={state.canvasTemplate} onChange={(canvasTemplate) => patch({ canvasTemplate })} /></Field><Field label={`Density: ${state.canvasDensity}`}><input type="range" min="12" max="1300" value={state.canvasDensity} onChange={(e) => patch({ canvasDensity: Number(e.target.value) })} className="w-full" /></Field><Field label="Animation speed"><SelectButtons options={SPEEDS} value={state.canvasSpeed} onChange={(canvasSpeed) => patch({ canvasSpeed })} /></Field><div className="grid gap-3 sm:grid-cols-2"><Field label="Background"><input type="color" value={state.canvasBackground} onChange={(e) => patch({ canvasBackground: e.target.value })} className="h-10 w-full rounded-xl border border-black/10 bg-white" /></Field><Field label="Main color"><input type="color" value={state.canvasPrimaryColor} onChange={(e) => patch({ canvasPrimaryColor: e.target.value })} className="h-10 w-full rounded-xl border border-black/10 bg-white" /></Field></div><p className="text-xs leading-5 text-slate-500">Each canvas example has a different drawing system: snow flakes fall, bubbles float upward, fireflies glow, starfield uses depth, and network links only nearby particles.</p></div>;
}

const styles = `
.win-spinner{position:relative;width:78px;height:78px;animation:winOrbit 1.32s cubic-bezier(.55,.05,.35,1) infinite}.win-spinner.is-small{width:50px;height:50px;margin-top:22px}.win-spinner span{position:absolute;left:50%;top:50%;width:7px;height:7px;border-radius:999px;transform-origin:0 0;opacity:0;animation:winDot 1.32s ease-in-out infinite}.win-spinner.is-small span{width:5px;height:5px}.win-spinner span:nth-child(1){transform:rotate(0deg) translateX(34px)}.win-spinner span:nth-child(2){transform:rotate(45deg) translateX(34px)}.win-spinner span:nth-child(3){transform:rotate(90deg) translateX(34px)}.win-spinner span:nth-child(4){transform:rotate(135deg) translateX(34px)}.win-spinner span:nth-child(5){transform:rotate(180deg) translateX(34px)}.win-spinner span:nth-child(6){transform:rotate(225deg) translateX(34px)}.win-spinner span:nth-child(7){transform:rotate(270deg) translateX(34px)}.win-spinner span:nth-child(8){transform:rotate(315deg) translateX(34px)}@keyframes winOrbit{to{transform:rotate(360deg)}}@keyframes winDot{0%,100%{opacity:.14}45%{opacity:1}}
.apple-like-mark{position:relative;width:78px;height:88px}.apple-like-mark:before{content:"";position:absolute;left:12px;top:24px;width:56px;height:58px;border-radius:45% 45% 50% 50%;background:white}.apple-like-mark:after{content:"";position:absolute;right:8px;top:32px;width:24px;height:28px;border-radius:50%;background:black}.apple-like-mark span{position:absolute;left:44px;top:4px;width:26px;height:16px;border-radius:90% 0 90% 0;background:white;transform:rotate(-28deg)}
.chrome-like-mark{position:relative;width:72px;height:72px;border-radius:50%;background:conic-gradient(#ea4335 0 34%,#fbbc05 34% 66%,#34a853 66% 100%)}.chrome-like-mark:before{content:"";position:absolute;inset:17px;border-radius:50%;background:#4285f4;border:7px solid #202124}.chrome-like-mark span{position:absolute;inset:0;border-radius:50%;box-shadow:inset 0 0 0 1px rgba(255,255,255,.22)}
.android-like-mark{position:relative;width:86px;height:70px;border-radius:18px 18px 22px 22px;background:#3ddc84}.android-like-mark:before,.android-like-mark:after{content:"";position:absolute;top:-18px;width:3px;height:22px;background:#3ddc84;border-radius:999px}.android-like-mark:before{left:25px;transform:rotate(-30deg)}.android-like-mark:after{right:25px;transform:rotate(30deg)}.android-like-mark .eye{position:absolute;top:21px;width:7px;height:7px;border-radius:50%;background:#121212}.android-like-mark .eye.left{left:25px}.android-like-mark .eye.right{right:25px}.android-like-mark .arm{position:absolute;top:20px;width:10px;height:44px;border-radius:999px;background:#3ddc84}.android-like-mark .arm.left{left:-16px}.android-like-mark .arm.right{right:-16px}
.ubuntu-orb{position:relative;width:72px;height:72px;border:7px solid #e95420;border-radius:50%}.ubuntu-orb span{position:absolute;width:16px;height:16px;border-radius:50%;background:#e95420}.ubuntu-orb span:nth-child(1){left:50%;top:-12px;transform:translateX(-50%)}.ubuntu-orb span:nth-child(2){right:-10px;bottom:9px}.ubuntu-orb span:nth-child(3){left:-10px;bottom:9px}
@keyframes spin{to{transform:rotate(360deg)}}.radar-sweep:before{content:"";position:absolute;inset:0;border-radius:inherit;background:conic-gradient(from 0deg,rgba(52,211,153,.72),transparent 38deg,transparent);animation:spin 2.4s linear infinite}.radar-grid{background:radial-gradient(circle,transparent 0 23%,rgba(52,211,153,.16) 24% 25%,transparent 26% 48%,rgba(52,211,153,.16) 49% 50%,transparent 51% 73%,rgba(52,211,153,.16) 74% 75%,transparent 76%),linear-gradient(rgba(52,211,153,.12) 1px,transparent 1px),linear-gradient(90deg,rgba(52,211,153,.12) 1px,transparent 1px);background-size:100% 100%,36px 36px,36px 36px}.dvd-logo{filter:drop-shadow(0 0 10px currentColor)}.dvd-logo div:nth-child(2){border-color:currentColor}.matrix-row{animation:matrixDrift 2.8s linear infinite}@keyframes matrixDrift{50%{opacity:.35;transform:translateY(3px)}}.tv-noise{background-image:radial-gradient(circle,rgba(255,255,255,.8) 1px,transparent 1px);background-size:3px 3px;animation:noise .25s steps(2) infinite}@keyframes noise{50%{transform:translate(3px,-2px)}}
.preview-art{position:relative;display:flex;height:88px;align-items:center;justify-content:center;overflow:hidden;border-radius:18px;border:1px solid rgba(0,0,0,.1);box-shadow:inset 0 0 0 1px rgba(255,255,255,.08)}.preview-art .win-spinner{transform:scale(.45)}.preview-art .win-spinner.is-small{margin:0}.preview-art .apple-like-mark{transform:scale(.55)}.preview-art .chrome-like-mark{transform:scale(.58)}.preview-art .android-like-mark{transform:scale(.52)}.preview-art .dvd-logo{transform:scale(.5)}.preview-art .ubuntu-orb{transform:scale(.55)}.preview-art .grid{height:100%;width:100%}.preview-art .grid span{display:block}
`;
