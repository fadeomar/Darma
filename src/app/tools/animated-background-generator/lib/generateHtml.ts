import type { ParticleData } from "../types";

export function generateHtml(particles: ParticleData[]) {
  const children = particles.map(() => "  <span></span>").join("\n");
  return `<div class="darma-animated-bg">\n${children}\n</div>`;
}
