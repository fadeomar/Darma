export type FloppyBirdSound = "wing" | "point" | "hit" | "die" | "swoosh";

const SOUND_FILES: Record<FloppyBirdSound, string> = {
  wing: "/games/floppy-bird/sounds/wing.ogg",
  point: "/games/floppy-bird/sounds/point.ogg",
  hit: "/games/floppy-bird/sounds/hit.ogg",
  die: "/games/floppy-bird/sounds/die.ogg",
  swoosh: "/games/floppy-bird/sounds/swooshing.ogg",
};

const GAIN: Record<FloppyBirdSound, number> = {
  wing: 0.46,
  point: 0.58,
  hit: 0.55,
  die: 0.52,
  swoosh: 0.48,
};

const cache = new Map<FloppyBirdSound, HTMLAudioElement>();
let unlocked = false;
let lastHitAt = 0;

function getAudio(sound: FloppyBirdSound): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  let audio = cache.get(sound);
  if (!audio) {
    audio = new Audio(SOUND_FILES[sound]);
    audio.preload = "auto";
    audio.volume = GAIN[sound];
    cache.set(sound, audio);
  }
  return audio;
}

export function unlockFloppyBirdAudio(): void {
  if (unlocked || typeof window === "undefined") return;
  unlocked = true;
  for (const sound of Object.keys(SOUND_FILES) as FloppyBirdSound[]) {
    const audio = getAudio(sound);
    if (!audio) continue;
    audio.load();
  }
}

export function playFloppyBirdSound(sound: FloppyBirdSound, muted: boolean): void {
  if (muted || typeof window === "undefined") return;
  if (sound === "hit" || sound === "die") {
    const now = window.performance.now();
    if (now - lastHitAt < 180 && sound === "hit") return;
    lastHitAt = now;
  }
  const source = getAudio(sound);
  if (!source) return;
  try {
    const audio = source.cloneNode(true) as HTMLAudioElement;
    audio.volume = GAIN[sound];
    audio.currentTime = 0;
    void audio.play().catch(() => undefined);
  } catch {
    // Audio can still be blocked by the browser. Never block gameplay.
  }
}
