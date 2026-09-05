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
  withState("glass-sidebar", "Glass sidebar", "Persistent translucent navigation for dashboards and creative apps.", "sidebar", {
    shape: { componentType: "sidebar", width: 300, minHeight: 520, padding: 28, borderRadius: 30 },
    effect: { tintColor: "#0f172a", opacity: 0.3, blur: 20, saturation: 150, brightness: 96, contrast: 112, borderColor: "#ffffff", borderOpacity: 0.16, borderWidth: 1, shadowPreset: "strong", customShadow: "0 30px 90px rgb(2 6 23 / 0.32)" },
    scene: { preset: "neon", colorA: "#22d3ee", colorB: "#e879f9", colorC: "#a3e635", animated: false, noiseEnabled: true, noiseOpacity: 0.05 },
    content: { eyebrow: "Workspace", title: "Navigation", description: "A stronger dark tint keeps a persistent glass sidebar legible over colorful scenes.", actionLabel: "New project", textColor: "#f8fafc", accentColor: "#67e8f9" },
    exportOptions: { className: "glass-sidebar", componentName: "GlassSidebar", includeComments: true, includeDemoScene: true, includeNoisePseudoElement: true, quoteStyle: "double" },
  }),
  withState("pricing-card", "Pricing card", "Premium plan card with stronger edge definition and depth.", "pricing-card", {
    shape: { componentType: "pricing-card", width: 380, minHeight: 430, padding: 34, borderRadius: 32 },
    effect: { tintColor: "#ffffff", opacity: 0.2, blur: 22, saturation: 165, brightness: 108, contrast: 108, borderColor: "#ffffff", borderOpacity: 0.42, borderWidth: 1, shadowPreset: "strong", customShadow: "0 34px 100px rgb(49 46 129 / 0.28)" },
    scene: { preset: "abstract-blobs", colorA: "#4f46e5", colorB: "#ec4899", colorC: "#06b6d4", animated: false, noiseEnabled: true, noiseOpacity: 0.04 },
    content: { eyebrow: "Most popular", title: "Pro · $24/month", description: "Pricing panels benefit from clear borders, readable tint, and a stronger shadow than decorative glass.", actionLabel: "Choose Pro" },
    exportOptions: { className: "glass-pricing", componentName: "GlassPricingCard", includeComments: true, includeDemoScene: true, includeNoisePseudoElement: true, quoteStyle: "double" },
  }),
  withState("toast", "Toast notification", "Compact glass notification that stays readable over app content.", "toast", {
    shape: { componentType: "toast", width: 420, minHeight: 126, padding: 22, borderRadius: 22 },
    effect: { tintColor: "#0f172a", opacity: 0.38, blur: 16, saturation: 145, brightness: 98, contrast: 112, borderColor: "#ffffff", borderOpacity: 0.2, borderWidth: 1, shadowPreset: "medium", customShadow: "0 24px 80px rgb(2 6 23 / 0.28)" },
    scene: { preset: "grid", colorA: "#0f172a", colorB: "#334155", colorC: "#2563eb", animated: false, noiseEnabled: false, noiseOpacity: 0.04 },
    content: { eyebrow: "Saved", title: "Changes published", description: "A compact toast should use less blur and a stronger tint than a decorative hero panel.", actionLabel: "View", textColor: "#f8fafc", accentColor: "#86efac" },
    exportOptions: { className: "glass-toast", componentName: "GlassToast", includeComments: true, includeDemoScene: true, includeNoisePseudoElement: false, quoteStyle: "double" },
  }),
  withState("command-palette", "Command palette", "Focused glass command/search surface for keyboard-first interfaces.", "modal", {
    shape: { componentType: "modal", width: 560, minHeight: 310, padding: 28, borderRadius: 28 },
    effect: { tintColor: "#0f172a", opacity: 0.46, blur: 18, saturation: 135, brightness: 96, contrast: 116, borderColor: "#c4b5fd", borderOpacity: 0.22, borderWidth: 1, shadowPreset: "strong", customShadow: "0 34px 110px rgb(2 6 23 / 0.4)" },
    scene: { preset: "dark-dashboard", colorA: "#312e81", colorB: "#0f766e", colorC: "#7c3aed", animated: false, noiseEnabled: false, noiseOpacity: 0.04 },
    content: { eyebrow: "⌘ K", title: "Search commands", description: "Use a darker translucent surface when a command palette needs attention over application content.", actionLabel: "Run", textColor: "#f8fafc", accentColor: "#c4b5fd" },
    exportOptions: { className: "glass-command", componentName: "GlassCommandPalette", includeComments: true, includeDemoScene: true, includeNoisePseudoElement: false, quoteStyle: "double" },
  }),
  withState("profile-card", "Profile card", "Friendly frosted identity card for account and social surfaces.", "card", {
    shape: { componentType: "card", width: 380, minHeight: 260, padding: 30, borderRadius: 34 },
    effect: { tintColor: "#ffffff", opacity: 0.19, blur: 20, saturation: 175, brightness: 108, contrast: 104, borderColor: "#ffffff", borderOpacity: 0.34, borderWidth: 1, shadowPreset: "medium", customShadow: "0 24px 80px rgb(15 23 42 / 0.2)" },
    scene: { preset: "light-pastel", colorA: "#fbcfe8", colorB: "#bfdbfe", colorC: "#ddd6fe", animated: false, noiseEnabled: true, noiseOpacity: 0.03 },
    content: { eyebrow: "Designer", title: "Maya Chen", description: "Soft pastel glass works well for profiles and lightweight account cards when text contrast stays strong.", actionLabel: "View profile", textColor: "#0f172a", accentColor: "#7c3aed" },
    exportOptions: { className: "glass-profile", componentName: "GlassProfileCard", includeComments: true, includeDemoScene: true, includeNoisePseudoElement: true, quoteStyle: "double" },
  }),
  withState("floating-toolbar", "Floating toolbar", "Compact translucent action strip above media or canvas content.", "button", {
    shape: { componentType: "button", width: 330, minHeight: 84, padding: 18, borderRadius: 999 },
    effect: { tintColor: "#111827", opacity: 0.34, blur: 18, saturation: 150, brightness: 98, contrast: 110, borderColor: "#ffffff", borderOpacity: 0.2, borderWidth: 1, shadowPreset: "medium", customShadow: "0 22px 70px rgb(2 6 23 / 0.3)" },
    scene: { preset: "mesh", colorA: "#0ea5e9", colorB: "#8b5cf6", colorC: "#f59e0b", animated: false, noiseEnabled: false, noiseOpacity: 0.04 },
    content: { eyebrow: "Toolbar", title: "Edit · Share · More", description: "A compact glass strip for photo, video, map, or canvas controls.", actionLabel: "Done", textColor: "#f8fafc", accentColor: "#93c5fd" },
    exportOptions: { className: "glass-toolbar", componentName: "GlassToolbar", includeComments: true, includeDemoScene: true, includeNoisePseudoElement: false, quoteStyle: "double" },
  }),
  withState("media-overlay", "Media overlay", "Glass caption block over photography or video.", "hero-overlay", {
    shape: { componentType: "hero-overlay", width: 560, minHeight: 260, padding: 34, borderRadius: 30 },
    effect: { tintColor: "#020617", opacity: 0.32, blur: 16, saturation: 140, brightness: 96, contrast: 112, borderColor: "#ffffff", borderOpacity: 0.18, borderWidth: 1, shadowPreset: "medium", customShadow: "0 24px 80px rgb(2 6 23 / 0.3)" },
    scene: { preset: "custom-gradient", colorA: "#0f766e", colorB: "#1d4ed8", colorC: "#7c3aed", animated: false, noiseEnabled: false, noiseOpacity: 0.04 },
    content: { eyebrow: "Featured story", title: "Caption over rich media", description: "A darker tint and moderate blur keep captions readable without hiding the scene behind them.", actionLabel: "Read story", textColor: "#f8fafc", accentColor: "#a5f3fc" },
    exportOptions: { className: "glass-media-overlay", componentName: "GlassMediaOverlay", includeComments: true, includeDemoScene: true, includeNoisePseudoElement: false, quoteStyle: "double" },
  }),
];
