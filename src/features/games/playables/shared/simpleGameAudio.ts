export type SimpleGameSound =
  | "start"
  | "click"
  | "flip"
  | "match"
  | "miss"
  | "hint"
  | "win"
  | "lose"
  | "drop"
  | "ai"
  | "move"
  | "eat"
  | "bonus"
  | "crash";

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtor) return null;
  return new AudioCtor();
}

export function createSimpleGameAudio() {
  let ctx: AudioContext | null = null;

  const ensure = () => {
    if (!ctx) ctx = getAudioContext();
    if (ctx?.state === "suspended") void ctx.resume();
    return ctx;
  };

  const tone = (frequency: number, duration: number, type: OscillatorType = "sine", gainValue = 0.035, delay = 0) => {
    const audio = ensure();
    if (!audio) return;
    const now = audio.currentTime + delay;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(gainValue, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.04);
  };

  return {
    unlock() {
      ensure();
    },
    play(sound: SimpleGameSound) {
      if (sound === "click") tone(240, 0.045, "triangle", 0.025);
      if (sound === "start") [330, 392, 523].forEach((f, index) => tone(f, 0.07, "sine", 0.035, index * 0.045));
      if (sound === "flip") tone(520, 0.055, "triangle", 0.028);
      if (sound === "match") [523, 659].forEach((f, index) => tone(f, 0.075, "sine", 0.035, index * 0.045));
      if (sound === "miss") [260, 210].forEach((f, index) => tone(f, 0.08, "triangle", 0.027, index * 0.045));
      if (sound === "hint") [740, 988].forEach((f, index) => tone(f, 0.07, "sine", 0.03, index * 0.04));
      if (sound === "win") [523, 659, 784, 1047].forEach((f, index) => tone(f, 0.1, "sine", 0.04, index * 0.065));
      if (sound === "lose") [260, 196, 147].forEach((f, index) => tone(f, 0.12, "triangle", 0.035, index * 0.075));
      if (sound === "drop") [220, 160].forEach((f, index) => tone(f, 0.065, "triangle", 0.035, index * 0.025));
      if (sound === "ai") tone(360, 0.06, "sine", 0.025);
      if (sound === "move") tone(300, 0.035, "triangle", 0.018);
      if (sound === "eat") [620, 780].forEach((f, index) => tone(f, 0.06, "sine", 0.035, index * 0.035));
      if (sound === "bonus") [660, 880, 1108].forEach((f, index) => tone(f, 0.08, "sine", 0.038, index * 0.05));
      if (sound === "crash") [180, 120].forEach((f, index) => tone(f, 0.12, "sawtooth", 0.025, index * 0.065));
    },
  };
}
