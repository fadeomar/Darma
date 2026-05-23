import type { AnimatedBackgroundConfig } from "./types";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const activeColors = (config: AnimatedBackgroundConfig) => config.colors.slice(0, clamp(config.colorCount, 2, config.colors.length));
const colorAt = (config: AnimatedBackgroundConfig, index: number) => activeColors(config)[index % activeColors(config).length];

function base(config: AnimatedBackgroundConfig) {
  return `.darma-animated-background {
  position: relative;
  min-height: 420px;
  overflow: hidden;
  border-radius: 28px;
  background: ${config.backgroundColor};
  isolation: isolate;
}

.darma-animated-background::before,
.darma-animated-background::after {
  content: "";
  position: absolute;
  inset: -20%;
  opacity: ${config.opacity};
  filter: blur(${config.blur}px);
  animation-direction: ${config.direction};
  animation-iteration-count: infinite;
  animation-timing-function: ease-in-out;
}`;
}

export function generateAnimatedBackgroundCss(config: AnimatedBackgroundConfig) {
  const duration = `${config.speed}s`;
  const size = `${config.size}%`;

  switch (config.type) {
    case "gradient-mesh":
      return `${base(config)}

.darma-animated-background::before {
  background:
    radial-gradient(circle at 18% 22%, ${colorAt(config, 0)}, transparent ${size}),
    radial-gradient(circle at 78% 18%, ${colorAt(config, 1)}, transparent ${size}),
    radial-gradient(circle at 52% 82%, ${colorAt(config, 2)}, transparent ${size}),
    radial-gradient(circle at 8% 78%, ${colorAt(config, 3)}, transparent ${size});
  animation-name: darma-mesh-drift;
  animation-duration: ${duration};
}

.darma-animated-background::after {
  background: linear-gradient(135deg, transparent, rgba(255,255,255,0.12), transparent);
  animation-name: darma-soft-sweep;
  animation-duration: ${Math.round(config.speed * 1.3)}s;
}

@keyframes darma-mesh-drift {
  0%, 100% { transform: translate3d(-3%, -2%, 0) scale(1); }
  50% { transform: translate3d(4%, 3%, 0) scale(1.08) rotate(8deg); }
}

@keyframes darma-soft-sweep {
  0%, 100% { transform: translateX(-8%) rotate(0deg); }
  50% { transform: translateX(8%) rotate(10deg); }
}`;
    case "floating-blobs":
      return `${base(config)}

.darma-animated-background::before {
  background:
    radial-gradient(circle, ${colorAt(config, 0)} 0 16%, transparent 17%),
    radial-gradient(circle, ${colorAt(config, 1)} 0 18%, transparent 19%),
    radial-gradient(circle, ${colorAt(config, 2)} 0 15%, transparent 16%),
    radial-gradient(circle, ${colorAt(config, 3)} 0 14%, transparent 15%);
  background-size: ${config.size * 1.7}px ${config.size * 1.7}px;
  animation-name: darma-blob-float;
  animation-duration: ${duration};
}

.darma-animated-background::after {
  inset: 8%;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(255,255,255,0.18), transparent 65%);
  animation-name: darma-blob-pulse;
  animation-duration: ${Math.round(config.speed * 0.75)}s;
}

@keyframes darma-blob-float {
  0%, 100% { transform: translate3d(-5%, 3%, 0) rotate(0deg); }
  50% { transform: translate3d(6%, -4%, 0) rotate(18deg); }
}

@keyframes darma-blob-pulse {
  0%, 100% { transform: scale(0.92); opacity: 0.38; }
  50% { transform: scale(1.08); opacity: 0.75; }
}`;
    case "grid-animation":
      return `.darma-animated-background {
  position: relative;
  min-height: 420px;
  overflow: hidden;
  border-radius: 28px;
  background:
    radial-gradient(circle at 50% 40%, ${colorAt(config, 0)}55, transparent 34%),
    linear-gradient(${colorAt(config, 1)}30 1px, transparent 1px),
    linear-gradient(90deg, ${colorAt(config, 2)}30 1px, transparent 1px),
    ${config.backgroundColor};
  background-size: 100% 100%, ${config.size}px ${config.size}px, ${config.size}px ${config.size}px, 100% 100%;
  animation: darma-grid-slide ${duration} linear infinite ${config.direction};
}

@keyframes darma-grid-slide {
  to { background-position: 0 0, ${config.size}px ${config.size}px, ${config.size}px ${config.size}px, 0 0; }
}`;
    case "particles":
      return `.darma-animated-background {
  position: relative;
  min-height: 420px;
  overflow: hidden;
  border-radius: 28px;
  background:
    radial-gradient(circle at 20% 20%, ${colorAt(config, 0)}66, transparent 24%),
    radial-gradient(circle at 80% 70%, ${colorAt(config, 1)}55, transparent 28%),
    ${config.backgroundColor};
}

.darma-animated-background::before {
  content: "";
  position: absolute;
  inset: 0;
  opacity: ${config.opacity};
  background-image:
    radial-gradient(circle, ${colorAt(config, 0)} 1px, transparent 2px),
    radial-gradient(circle, ${colorAt(config, 1)} 1px, transparent 2px),
    radial-gradient(circle, ${colorAt(config, 2)} 1px, transparent 2px);
  background-size: ${config.size}px ${config.size}px, ${config.size * 1.4}px ${config.size * 1.4}px, ${config.size * 1.9}px ${config.size * 1.9}px;
  animation: darma-particles ${duration} linear infinite ${config.direction};
  filter: blur(${config.blur}px);
}

@keyframes darma-particles {
  to { transform: translate3d(${config.size}px, -${config.size}px, 0) rotate(360deg); }
}`;
    case "aurora":
      return `${base(config)}

.darma-animated-background::before {
  inset: -40% -15%;
  background: linear-gradient(115deg, transparent 10%, ${colorAt(config, 0)} 28%, ${colorAt(config, 1)} 44%, transparent 62%, ${colorAt(config, 2)} 78%, transparent 92%);
  transform-origin: center;
  animation-name: darma-aurora;
  animation-duration: ${duration};
}

.darma-animated-background::after {
  background: radial-gradient(circle at 50% 100%, ${colorAt(config, 3)}66, transparent 55%);
  animation-name: darma-aurora-glow;
  animation-duration: ${Math.round(config.speed * 1.2)}s;
}

@keyframes darma-aurora {
  0%, 100% { transform: translateY(-8%) rotate(-8deg) scale(1); }
  50% { transform: translateY(8%) rotate(8deg) scale(1.12); }
}

@keyframes darma-aurora-glow {
  0%, 100% { transform: translateX(-6%); }
  50% { transform: translateX(6%); }
}`;
    case "noise-overlay":
      return `${base(config)}

.darma-animated-background::before {
  background:
    linear-gradient(135deg, ${activeColors(config).join(", ")}),
    repeating-radial-gradient(circle at 20% 30%, rgba(255,255,255,0.22) 0 1px, transparent 1px 5px);
  background-blend-mode: screen;
  animation-name: darma-noise-drift;
  animation-duration: ${duration};
}

.darma-animated-background::after {
  inset: 0;
  filter: none;
  opacity: 0.28;
  background-image: repeating-linear-gradient(45deg, rgba(255,255,255,0.12) 0 1px, transparent 1px 4px);
  animation-name: darma-grain;
  animation-duration: 1.8s;
  animation-timing-function: steps(3);
}

@keyframes darma-noise-drift {
  0%, 100% { transform: translate3d(-2%, -2%, 0) scale(1); }
  50% { transform: translate3d(2%, 2%, 0) scale(1.04); }
}

@keyframes darma-grain {
  to { transform: translate3d(3%, -3%, 0); }
}`;
    case "radial-glow":
      return `${base(config)}

.darma-animated-background::before {
  background:
    radial-gradient(circle at 25% 30%, ${colorAt(config, 0)}, transparent ${size}),
    radial-gradient(circle at 75% 65%, ${colorAt(config, 1)}, transparent ${size}),
    radial-gradient(circle at 50% 90%, ${colorAt(config, 2)}, transparent ${size});
  animation-name: darma-radial-shift;
  animation-duration: ${duration};
}

.darma-animated-background::after {
  background: radial-gradient(circle at 50% 50%, rgba(255,255,255,0.18), transparent 50%);
  animation-name: darma-glow-pulse;
  animation-duration: ${Math.round(config.speed * 0.7)}s;
}

@keyframes darma-radial-shift {
  0%, 100% { transform: translateX(-4%); }
  50% { transform: translateX(4%); }
}

@keyframes darma-glow-pulse {
  0%, 100% { opacity: 0.22; transform: scale(0.9); }
  50% { opacity: 0.7; transform: scale(1.12); }
}`;
    case "conic-gradient":
      return `${base(config)}

.darma-animated-background::before {
  inset: -45%;
  background: conic-gradient(from 0deg, ${activeColors(config).join(", ")}, ${colorAt(config, 0)});
  animation-name: darma-conic-spin;
  animation-duration: ${duration};
  animation-timing-function: linear;
}

.darma-animated-background::after {
  inset: 8%;
  border-radius: 24px;
  background: ${config.backgroundColor};
  filter: blur(${Math.max(0, config.blur / 2)}px);
  opacity: 0.42;
}

@keyframes darma-conic-spin {
  to { transform: rotate(360deg); }
}`;
    case "css-waves":
      return `.darma-animated-background {
  position: relative;
  min-height: 420px;
  overflow: hidden;
  border-radius: 28px;
  background: ${config.backgroundColor};
}

.darma-animated-background::before,
.darma-animated-background::after {
  content: "";
  position: absolute;
  left: -20%;
  right: -20%;
  height: 55%;
  bottom: -16%;
  opacity: ${config.opacity};
  background:
    radial-gradient(60% 70% at 50% 0%, ${colorAt(config, 0)} 0 36%, transparent 38%),
    radial-gradient(50% 60% at 20% 20%, ${colorAt(config, 1)} 0 34%, transparent 36%),
    radial-gradient(50% 60% at 80% 20%, ${colorAt(config, 2)} 0 34%, transparent 36%);
  filter: blur(${config.blur}px);
  animation: darma-wave ${duration} ease-in-out infinite ${config.direction};
}

.darma-animated-background::after {
  bottom: -26%;
  opacity: ${Math.max(0.2, config.opacity - 0.22)};
  animation-delay: -${Math.round(config.speed / 2)}s;
}

@keyframes darma-wave {
  0%, 100% { transform: translateX(-4%) rotate(-2deg); }
  50% { transform: translateX(4%) rotate(2deg); }
}`;
    case "spotlight":
      return `.darma-animated-background {
  position: relative;
  min-height: 420px;
  overflow: hidden;
  border-radius: 28px;
  background: ${config.backgroundColor};
}

.darma-animated-background::before {
  content: "";
  position: absolute;
  inset: -30%;
  opacity: ${config.opacity};
  filter: blur(${config.blur}px);
  background:
    radial-gradient(circle at 30% 35%, ${colorAt(config, 0)}aa, transparent ${size}),
    radial-gradient(circle at 70% 70%, ${colorAt(config, 1)}77, transparent ${size});
  animation: darma-spotlight ${duration} ease-in-out infinite ${config.direction};
}

.darma-animated-background::after {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 42%, transparent 0 20%, rgba(0,0,0,0.46) 62%);
}

@keyframes darma-spotlight {
  0%, 100% { transform: translate3d(-5%, -4%, 0); }
  50% { transform: translate3d(5%, 4%, 0); }
}`;
    default:
      return `.darma-animated-background { min-height: 420px; border-radius: 28px; background: ${config.backgroundColor}; }`;
  }
}

export function generateAnimatedBackgroundHtml(config: AnimatedBackgroundConfig) {
  return `<div class="darma-animated-background"></div>\n<style>\n${generateAnimatedBackgroundCss(config)}\n</style>`;
}

export function generateTailwindSnippet(config: AnimatedBackgroundConfig) {
  return `<div className="relative min-h-[420px] overflow-hidden rounded-[28px]" style={{ background: "${config.backgroundColor}" }}>\n  <div className="darma-animated-background absolute inset-0" />\n</div>`;
}

export function generateReactStyleSnippet(config: AnimatedBackgroundConfig) {
  return `const backgroundStyle = {\n  minHeight: 420,\n  borderRadius: 28,\n  overflow: "hidden",\n  background: "${config.backgroundColor}",\n};`;
}
