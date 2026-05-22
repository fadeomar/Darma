import type { AnimatedBackgroundState, ParticleData } from "@/types/animatedBackgroundTypes";
import { createSeededRandom, randomBetween } from "./seededRandom";

export function generateParticleData(state: AnimatedBackgroundState): ParticleData[] {
  const random = createSeededRandom(state.seed);
  const count = Math.min(Math.max(state.particleCount, 1), 44);

  return Array.from({ length: count }, (_, index) => {
    const baseDuration = randomBetween(random, 18, 34) / Math.max(state.speed, 0.15);
    const drift = 35 + state.intensity * 95;
    return { id: index + 1, x: randomBetween(random, -8, 92), y: randomBetween(random, -10, 92), size: randomBetween(random, state.minSize, state.maxSize), delay: -randomBetween(random, 0, baseDuration), duration: baseDuration, driftX: randomBetween(random, -drift, drift), driftY: randomBetween(random, -drift, drift), rotate: randomBetween(random, -28, 28), color: state.colors[index % state.colors.length] ?? "#ffffff", opacity: Math.min(0.95, randomBetween(random, state.opacity * 0.68, state.opacity * 1.08)) };
  });
}
