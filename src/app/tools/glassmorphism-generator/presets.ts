import { createDefaultGlassmorphismState } from "./glass";
import type { GlassComponentType, GlassPreset } from "./types";

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

function withState(id: string, name: string, description: string, componentType: GlassComponentType, patch: DeepPartial<ReturnType<typeof createDefaultGlassmorphismState>> = {}): GlassPreset {
  const base = createDefaultGlassmorphismState();
  return {
    id,
    name,
    description,
    componentType,
    state: {
      ...base,
      ...patch,
      presetId: id,
      shape: { ...base.shape, ...(patch.shape ?? {}), componentType },
      effect: { ...base.effect, ...(patch.effect ?? {}) },
      scene: { ...base.scene, ...(patch.scene ?? {}) },
      content: { ...base.content, ...(patch.content ?? {}) },
      fallback: { ...base.fallback, ...(patch.fallback ?? {}) },
      exportOptions: { ...base.exportOptions, ...(patch.exportOptions ?? {}) },
    },
  };
}

export const GLASS_PRESETS: GlassPreset[] = [
  withState("frosted-card", "Frosted card", "Balanced glass card for modern landing pages.", "card"),
  withState("glass-navbar", "Glass navbar", "Sticky translucent navigation with blur and border.", "navbar", {
    shape: { componentType: "navbar", width: 720, minHeight: 88, padding: 20, borderRadius: 26 },
    content: { eyebrow: "Darma", title: "Logo · Products · Pricing", description: "A translucent navigation bar with readable links and CTA spacing.", actionLabel: "Get started" },
    exportOptions: { className: "glass-navbar", componentName: "GlassNavbar", includeComments: true, includeDemoScene: true, includeNoisePseudoElement: true, quoteStyle: "double" },
  }),
  withState("dark-glass-modal", "Dark glass modal", "High-contrast glass modal for dark interfaces.", "modal", {
    effect: { tintColor: "#020617", opacity: 0.42, blur: 22, saturation: 145, brightness: 95, contrast: 115, borderColor: "#93c5fd", borderOpacity: 0.24, borderWidth: 1, shadowPreset: "strong", customShadow: "0 34px 110px rgb(0 0 0 / 0.36)" },
    scene: { preset: "dark-dashboard", colorA: "#2563eb", colorB: "#7c3aed", colorC: "#06b6d4", animated: false, noiseEnabled: true, noiseOpacity: 0.08 },
    content: { eyebrow: "Modal", title: "Confirm workspace update", description: "A darker glass panel keeps controls readable over dashboard-style backgrounds.", actionLabel: "Confirm", textColor: "#f8fafc", accentColor: "#93c5fd" },
    exportOptions: { className: "glass-modal", componentName: "GlassModal", includeComments: true, includeDemoScene: true, includeNoisePseudoElement: true, quoteStyle: "double" },
  }),
  withState("aurora-panel", "Aurora panel", "Colorful glass over an aurora-style gradient.", "card", {
    effect: { tintColor: "#ffffff", opacity: 0.13, blur: 26, saturation: 190, brightness: 110, contrast: 105, borderColor: "#ffffff", borderOpacity: 0.34, borderWidth: 1, shadowPreset: "strong", customShadow: "0 34px 110px rgb(15 23 42 / 0.28)" },
    scene: { preset: "aurora", colorA: "#8b5cf6", colorB: "#22d3ee", colorC: "#fb7185", animated: true, noiseEnabled: true, noiseOpacity: 0.06 },
    content: { eyebrow: "Aurora", title: "Layered frosted color", description: "A premium glass panel for hero sections, dashboards, and high-impact landing pages.", actionLabel: "Explore" },
  }),
  withState("glass-button", "Glass button", "Compact glass CTA or icon button.", "button", {
    shape: { componentType: "button", width: 260, minHeight: 92, padding: 22, borderRadius: 999 },
    effect: { tintColor: "#ffffff", opacity: 0.18, blur: 14, saturation: 170, brightness: 108, contrast: 105, borderColor: "#ffffff", borderOpacity: 0.38, borderWidth: 1, shadowPreset: "soft", customShadow: "0 16px 48px rgb(15 23 42 / 0.16)" },
    content: { eyebrow: "CTA", title: "Glass button", description: "Compact glass button for hero actions and overlays.", actionLabel: "Click me" },
    exportOptions: { className: "glass-button", componentName: "GlassButton", includeComments: true, includeDemoScene: true, includeNoisePseudoElement: false, quoteStyle: "double" },
  }),
  withState("login-panel", "Login panel", "Glass form panel for authentication screens.", "login-panel", {
    shape: { componentType: "login-panel", width: 420, minHeight: 440, padding: 34, borderRadius: 32 },
    scene: { preset: "mesh", colorA: "#0ea5e9", colorB: "#8b5cf6", colorC: "#f59e0b", animated: true, noiseEnabled: true, noiseOpacity: 0.07 },
    content: { eyebrow: "Welcome back", title: "Sign in securely", description: "Use this style for login panels, newsletter blocks, and account overlays.", actionLabel: "Continue" },
    exportOptions: { className: "glass-login", componentName: "GlassLoginPanel", includeComments: true, includeDemoScene: true, includeNoisePseudoElement: true, quoteStyle: "double" },
  }),
  withState("dashboard-widget", "Dashboard widget", "Glass card for metrics and dashboards.", "dashboard-widget", {
    shape: { componentType: "dashboard-widget", width: 360, minHeight: 220, padding: 28, borderRadius: 24 },
    scene: { preset: "dark-dashboard", colorA: "#2563eb", colorB: "#14b8a6", colorC: "#8b5cf6", animated: false, noiseEnabled: false, noiseOpacity: 0.04 },
    content: { eyebrow: "Revenue", title: "$42.8k", description: "Dashboard widgets need stronger contrast and measured blur for readability.", actionLabel: "Open report", textColor: "#f8fafc", accentColor: "#5eead4" },
    exportOptions: { className: "glass-widget", componentName: "GlassDashboardWidget", includeComments: true, includeDemoScene: true, includeNoisePseudoElement: false, quoteStyle: "double" },
  }),
  withState("hero-overlay", "Hero overlay", "Large glass content block over a hero background.", "hero-overlay", {
    shape: { componentType: "hero-overlay", width: 620, minHeight: 340, padding: 46, borderRadius: 36 },
    effect: { tintColor: "#ffffff", opacity: 0.15, blur: 24, saturation: 180, brightness: 108, contrast: 105, borderColor: "#ffffff", borderOpacity: 0.28, borderWidth: 1, shadowPreset: "strong", customShadow: "0 34px 110px rgb(15 23 42 / 0.32)" },
    content: { eyebrow: "Hero overlay", title: "Readable content over rich scenes", description: "A large frosted block for landing pages, product announcements, and immersive visuals.", actionLabel: "Launch now" },
    exportOptions: { className: "glass-hero", componentName: "GlassHeroOverlay", includeComments: true, includeDemoScene: true, includeNoisePseudoElement: true, quoteStyle: "double" },
  }),
];
