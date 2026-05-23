import type { AnimatedBackgroundPreset } from "./types";

export const DEFAULT_ANIMATED_BACKGROUND_COLORS = ["#6366f1", "#ec4899", "#22d3ee", "#f97316"];

export const animatedBackgroundPresets: AnimatedBackgroundPreset[] = [
  {
    id: "gradient-mesh",
    name: "Gradient mesh",
    description: "Soft layered gradients for SaaS and portfolio hero sections.",
    config: { type: "gradient-mesh", colors: ["#6366f1", "#ec4899", "#22d3ee", "#f97316"], backgroundColor: "#0f172a", speed: 18, blur: 42, opacity: 0.86, colorCount: 4, direction: "alternate", size: 72 },
  },
  {
    id: "floating-blobs",
    name: "Floating blobs",
    description: "Organic blobs moving slowly behind product content.",
    config: { type: "floating-blobs", colors: ["#14b8a6", "#8b5cf6", "#f43f5e", "#facc15"], backgroundColor: "#020617", speed: 24, blur: 34, opacity: 0.76, colorCount: 4, direction: "alternate", size: 62 },
  },
  {
    id: "grid-animation",
    name: "Grid animation",
    description: "Animated grid lines with a subtle radial glow.",
    config: { type: "grid-animation", colors: ["#60a5fa", "#818cf8", "#38bdf8"], backgroundColor: "#08111f", speed: 16, blur: 0, opacity: 0.7, colorCount: 3, direction: "normal", size: 44 },
  },
  {
    id: "particles",
    name: "Particles",
    description: "Small CSS dots orbiting across the background.",
    config: { type: "particles", colors: ["#e879f9", "#22d3ee", "#a3e635", "#fb7185"], backgroundColor: "#111827", speed: 20, blur: 2, opacity: 0.82, colorCount: 4, direction: "normal", size: 52 },
  },
  {
    id: "aurora",
    name: "Aurora",
    description: "Wide northern-light bands for immersive landing pages.",
    config: { type: "aurora", colors: ["#22c55e", "#06b6d4", "#8b5cf6", "#f472b6"], backgroundColor: "#030712", speed: 26, blur: 28, opacity: 0.7, colorCount: 4, direction: "alternate", size: 80 },
  },
  {
    id: "noise-overlay",
    name: "Noise overlay",
    description: "Premium grainy gradient with a lightweight CSS noise layer.",
    config: { type: "noise-overlay", colors: ["#f59e0b", "#ef4444", "#7c3aed"], backgroundColor: "#1f1304", speed: 30, blur: 22, opacity: 0.62, colorCount: 3, direction: "alternate", size: 64 },
  },
  {
    id: "radial-glow",
    name: "Radial glow",
    description: "Layered spotlights for dark dashboards and hero cards.",
    config: { type: "radial-glow", colors: ["#38bdf8", "#a78bfa", "#fb7185"], backgroundColor: "#020617", speed: 22, blur: 20, opacity: 0.74, colorCount: 3, direction: "alternate", size: 70 },
  },
  {
    id: "conic-gradient",
    name: "Conic gradient",
    description: "Rotating conic gradient for visual demos and loading states.",
    config: { type: "conic-gradient", colors: ["#06b6d4", "#8b5cf6", "#ec4899", "#f59e0b"], backgroundColor: "#111827", speed: 14, blur: 16, opacity: 0.78, colorCount: 4, direction: "normal", size: 74 },
  },
  {
    id: "css-waves",
    name: "CSS waves",
    description: "Animated wave layers using gradients only.",
    config: { type: "css-waves", colors: ["#2563eb", "#0ea5e9", "#67e8f9"], backgroundColor: "#082f49", speed: 18, blur: 0, opacity: 0.82, colorCount: 3, direction: "alternate", size: 60 },
  },
  {
    id: "spotlight",
    name: "Spotlight",
    description: "Moving spotlight focus for documentation and app screens.",
    config: { type: "spotlight", colors: ["#ffffff", "#93c5fd", "#c4b5fd"], backgroundColor: "#020617", speed: 20, blur: 18, opacity: 0.72, colorCount: 3, direction: "alternate", size: 68 },
  },
];

export const defaultAnimatedBackgroundConfig = animatedBackgroundPresets[0].config;
