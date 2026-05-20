import type { AnimatedBackgroundState, ParticleData } from "../types";

const bgClass = ".darma-animated-bg";

function backgroundLayers(state: AnimatedBackgroundState) {
  const [c1 = "#38bdf8", c2 = "#8b5cf6", c3 = "#ec4899", c4 = c1] = state.colors;
  const grid = ["cyber-grid", "neon-cyber-grid", "fintech-data-grid"].includes(state.presetId)
    ? `linear-gradient(rgba(255,255,255,.055) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.055) 1px, transparent 1px),`
    : "";

  if (state.gradientStyle === "linear") {
    return `${grid}radial-gradient(circle at 18% 18%, ${c1}42, transparent 30%), radial-gradient(circle at 82% 68%, ${c3}38, transparent 34%), linear-gradient(135deg, ${state.background}, ${c2}22 48%, ${state.background})`;
  }

  if (state.gradientStyle === "mesh") {
    return `${grid}radial-gradient(circle at 18% 22%, ${c1}55, transparent 34%), radial-gradient(circle at 80% 18%, ${c2}4d, transparent 30%), radial-gradient(circle at 52% 84%, ${c3}45, transparent 36%), radial-gradient(circle at 12% 74%, ${c4}34, transparent 32%), ${state.background}`;
  }

  return `${grid}radial-gradient(circle at 24% 22%, ${c1}38, transparent 28%), radial-gradient(circle at 76% 78%, ${c2}32, transparent 32%), ${state.background}`;
}

function shapeCss(state: AnimatedBackgroundState) {
  if (state.shape === "diamond") return `border-radius: ${state.borderRadius}%; transform: rotate(45deg);`;
  if (state.shape === "soft-square") return `border-radius: ${state.borderRadius}%;`;
  return "border-radius: 999px;";
}

function presetExtras(state: AnimatedBackgroundState) {
  if (["neon-waves", "agency-sunset-ribbons"].includes(state.presetId)) {
    return `
${bgClass}::after {
  content: "";
  position: absolute;
  inset: auto -10% -20% -10%;
  height: 55%;
  background: repeating-radial-gradient(ellipse at center, rgba(34,211,238,.35) 0 1px, transparent 2px 22px);
  filter: blur(1px);
  opacity: .45;
  animation: darma-wave-drift ${Math.max(12, 26 / state.speed)}s linear infinite;
  transform: perspective(700px) rotateX(62deg);
}
@keyframes darma-wave-drift {
  to { transform: perspective(700px) rotateX(62deg) translateX(-80px); }
}`;
  }

  if (["cyber-grid", "neon-cyber-grid", "fintech-data-grid"].includes(state.presetId)) {
    return `
${bgClass} {
  background-size: 42px 42px, 42px 42px, auto, auto, auto, auto;
}
${bgClass}::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent, rgba(34,211,238,.08), transparent);
  animation: darma-scan ${Math.max(8, 16 / state.speed)}s ease-in-out infinite;
}
@keyframes darma-scan {
  0%, 100% { transform: translateY(-40%); opacity: .15; }
  50% { transform: translateY(40%); opacity: .65; }
}`;
  }

  if (["matrix-rain", "developer-terminal-matrix"].includes(state.presetId)) {
    return `
${bgClass}::after {
  content: "";
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(90deg, transparent 0 28px, rgba(34,197,94,.16) 29px, transparent 31px), linear-gradient(180deg, transparent, rgba(34,197,94,.16), transparent);
  opacity: .32;
  animation: darma-matrix ${Math.max(6, 13 / state.speed)}s linear infinite;
}
@keyframes darma-matrix {
  to { transform: translateY(140px); }
}`;
  }

  if (["starlight-drift", "galaxy-particle-field"].includes(state.presetId)) {
    return `
${bgClass}::after {
  content: "";
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle, rgba(255,255,255,.75) 0 1px, transparent 1.5px), radial-gradient(circle, rgba(191,219,254,.5) 0 1px, transparent 1.5px);
  background-size: 90px 90px, 140px 140px;
  background-position: 0 0, 30px 45px;
  opacity: .36;
  animation: darma-stars ${Math.max(18, 36 / state.speed)}s linear infinite;
}
@keyframes darma-stars {
  to { transform: translate3d(-80px, 60px, 0); }
}`;
  }

  if (["sunset-ribbons", "agency-sunset-ribbons", "startup-launch-mesh"].includes(state.presetId)) {
    return `
${bgClass}::after {
  content: "";
  position: absolute;
  inset: -20%;
  background: conic-gradient(from 140deg at 50% 50%, transparent, rgba(251,113,133,.24), transparent, rgba(249,115,22,.2), transparent);
  filter: blur(24px);
  opacity: .75;
  animation: darma-ribbons ${Math.max(10, 22 / state.speed)}s ease-in-out infinite alternate;
}
@keyframes darma-ribbons {
  to { transform: rotate(18deg) scale(1.08); }
}`;
  }


  if (state.presetId === "ai-neural-glow") {
    return `
${bgClass}::after {
  content: "";
  position: absolute;
  inset: 0;
  background-image: linear-gradient(rgba(103,232,249,.16) 1px, transparent 1px), linear-gradient(90deg, rgba(129,140,248,.12) 1px, transparent 1px);
  background-size: 84px 84px;
  mask-image: radial-gradient(circle at center, black, transparent 78%);
  opacity: .32;
  animation: darma-neural ${Math.max(12, 24 / state.speed)}s ease-in-out infinite alternate;
}
@keyframes darma-neural {
  to { transform: translate3d(-34px, 22px, 0) scale(1.03); }
}`;
  }

  if (state.presetId === "premium-noise-glow" || state.presetId === "portfolio-minimal-glow") {
    return `
${bgClass}::after {
  content: "";
  position: absolute;
  inset: 0;
  background-image: linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px);
  background-size: 4px 4px;
  opacity: .45;
  mix-blend-mode: overlay;
}`;
  }

  return "";
}

export function generateCss(state: AnimatedBackgroundState, particles: ParticleData[], options?: { paused?: boolean }) {
  const paused = options?.paused ?? false;
  const items = particles.map((particle) => `
${bgClass} span:nth-child(${particle.id}) {
  left: ${particle.x.toFixed(2)}%;
  top: ${particle.y.toFixed(2)}%;
  width: ${particle.size.toFixed(0)}px;
  height: ${particle.size.toFixed(0)}px;
  background: radial-gradient(circle at 30% 30%, rgba(255,255,255,.8), ${particle.color} 34%, transparent 72%);
  opacity: ${particle.opacity.toFixed(2)};
  filter: blur(${state.blur}px) drop-shadow(0 0 ${state.glow}px ${particle.color});
  mix-blend-mode: ${state.blendMode};
  animation-duration: ${particle.duration.toFixed(2)}s;
  animation-delay: ${particle.delay.toFixed(2)}s;
  --drift-x: ${particle.driftX.toFixed(1)}px;
  --drift-y: ${particle.driftY.toFixed(1)}px;
  --rotate: ${particle.rotate.toFixed(1)}deg;
}`).join("\n");

  return `${bgClass} {
  position: relative;
  width: 100%;
  min-height: 420px;
  overflow: hidden;
  isolation: isolate;
  background: ${backgroundLayers(state)};
}

${bgClass}::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background: radial-gradient(circle at center, transparent 0 48%, rgba(0,0,0,.36) 100%), linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px);
  background-size: auto, 3px 3px;
  opacity: .72;
}

${bgClass} span {
  position: absolute;
  display: block;
  z-index: 0;
  ${shapeCss(state)}
  animation-name: darma-float;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
  animation-direction: alternate;
  animation-play-state: ${paused ? "paused" : "running"};
  will-change: transform, opacity;
}
${items}

@keyframes darma-float {
  0% { transform: translate3d(0, 0, 0) scale(.92) rotate(0deg); }
  50% { opacity: ${Math.min(0.95, state.opacity + 0.18).toFixed(2)}; }
  100% { transform: translate3d(var(--drift-x), var(--drift-y), 0) scale(1.08) rotate(var(--rotate)); }
}
${presetExtras(state)}

@media (prefers-reduced-motion: reduce) {
  ${bgClass} span,
  ${bgClass}::after {
    animation: none !important;
  }
}`;
}
