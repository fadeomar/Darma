import { createDefaultBorderRadiusState } from "./borderRadius";
import type { AnimationSettings, BorderRadiusExportOptions, BorderRadiusPreset, BorderRadiusState, ShapeStyle } from "./types";

type StateOverrides = Omit<Partial<BorderRadiusState>, "style" | "animation" | "exportOptions"> & {
  style?: Partial<ShapeStyle>;
  animation?: Partial<AnimationSettings>;
  exportOptions?: Partial<BorderRadiusExportOptions>;
};

function withState(overrides: StateOverrides): BorderRadiusState {
  const base = createDefaultBorderRadiusState();
  return {
    ...base,
    ...overrides,
    style: { ...base.style, ...overrides.style },
    animation: { ...base.animation, ...overrides.animation },
    exportOptions: { ...base.exportOptions, ...overrides.exportOptions },
    advancedValues: overrides.advancedValues ?? base.advancedValues,
    simpleValues: overrides.simpleValues ?? base.simpleValues,
  };
}

export const BORDER_RADIUS_PRESETS: BorderRadiusPreset[] = [
  {
    id: "soft-card",
    name: "Soft card",
    category: "ui",
    description: "Balanced rounded card corners for modern UI panels.",
    state: withState({
      mode: "simple",
      previewContext: "card",
      simpleUnit: "px",
      simpleValues: { topLeft: 28, topRight: 28, bottomRight: 28, bottomLeft: 28 },
      style: { width: 360, height: 220, backgroundType: "solid", backgroundColor: "#ffffff", shadowPreset: "soft", borderWidth: 1, borderStyle: "solid", borderColor: "#e2e8f0" },
      exportOptions: { className: "soft-card", componentName: "SoftCard" },
    }),
  },
  {
    id: "pill-button",
    name: "Pill button",
    category: "ui",
    description: "Fully rounded button or badge shape.",
    state: withState({
      mode: "simple",
      previewContext: "button",
      simpleUnit: "px",
      simpleValues: { topLeft: 999, topRight: 999, bottomRight: 999, bottomLeft: 999 },
      style: { width: 260, height: 72, backgroundType: "linear-gradient", gradientFrom: "#2563eb", gradientTo: "#7c3aed", shadowPreset: "soft" },
      exportOptions: { className: "pill-button", componentName: "PillButton" },
    }),
  },
  {
    id: "circle-avatar",
    name: "Circle avatar",
    category: "image",
    description: "Perfect circle for avatars and profile images.",
    state: withState({
      mode: "image",
      previewContext: "avatar",
      simpleUnit: "%",
      simpleValues: { topLeft: 50, topRight: 50, bottomRight: 50, bottomLeft: 50 },
      style: { width: 260, height: 260, backgroundType: "image", imageUrl: "/assets/tools/border-radius-generator/preset-photo.svg", shadowPreset: "medium" },
      exportOptions: { className: "circle-avatar", componentName: "CircleAvatar" },
    }),
  },
  {
    id: "app-icon",
    name: "App icon",
    category: "ui",
    description: "Large smooth radius for icon containers.",
    state: withState({
      mode: "simple",
      previewContext: "blob",
      simpleUnit: "px",
      simpleValues: { topLeft: 72, topRight: 72, bottomRight: 72, bottomLeft: 72 },
      style: { width: 280, height: 280, backgroundType: "radial-gradient", gradientFrom: "#f97316", gradientTo: "#ec4899", shadowPreset: "strong" },
      exportOptions: { className: "app-icon-shape", componentName: "AppIconShape" },
    }),
  },
  {
    id: "organic-blob",
    name: "Organic blob",
    category: "blob",
    description: "Soft organic blob for hero sections and decorations.",
    state: createDefaultBorderRadiusState(),
  },
  {
    id: "lemon",
    name: "Lemon",
    category: "blob",
    description: "Asymmetric lemon-like organic shape.",
    state: withState({
      mode: "blob",
      advancedValues: {
        horizontal: { topLeft: 18, topRight: 82, bottomRight: 22, bottomLeft: 78 },
        vertical: { topLeft: 45, topRight: 55, bottomRight: 45, bottomLeft: 55 },
      },
      style: { width: 340, height: 260, gradientFrom: "#fde047", gradientTo: "#84cc16", shadowPreset: "medium" },
      exportOptions: { className: "lemon-blob", componentName: "LemonBlob" },
    }),
  },
  {
    id: "egg",
    name: "Egg",
    category: "blob",
    description: "Rounded egg-like organic form.",
    state: withState({
      mode: "blob",
      advancedValues: {
        horizontal: { topLeft: 54, topRight: 46, bottomRight: 48, bottomLeft: 52 },
        vertical: { topLeft: 62, topRight: 60, bottomRight: 40, bottomLeft: 38 },
      },
      style: { width: 260, height: 340, gradientFrom: "#f8fafc", gradientTo: "#cbd5e1", shadowPreset: "soft" },
      exportOptions: { className: "egg-shape", componentName: "EggShape" },
    }),
  },
  {
    id: "image-blob",
    name: "Image blob",
    category: "image",
    description: "Organic border radius for profile or product images.",
    state: withState({
      mode: "image",
      previewContext: "image",
      advancedValues: {
        horizontal: { topLeft: 62, topRight: 38, bottomRight: 66, bottomLeft: 34 },
        vertical: { topLeft: 34, topRight: 60, bottomRight: 40, bottomLeft: 66 },
      },
      style: { width: 330, height: 330, backgroundType: "image", imageUrl: "/assets/tools/border-radius-generator/preset-photo.svg", shadowPreset: "strong" },
      exportOptions: { className: "blob-image", componentName: "BlobImage" },
    }),
  },

  {
    id: "compact-dashboard-card",
    name: "Compact dashboard card",
    category: "ui",
    description: "Tighter radius for dense tables, analytics, and admin panels.",
    state: withState({
      mode: "simple",
      previewContext: "card",
      simpleUnit: "px",
      simpleValues: { topLeft: 12, topRight: 12, bottomRight: 12, bottomLeft: 12 },
      style: { width: 360, height: 210, backgroundType: "solid", backgroundColor: "#f8fafc", shadowPreset: "soft", borderWidth: 1, borderStyle: "solid", borderColor: "#cbd5e1" },
      exportOptions: { className: "dashboard-card", componentName: "DashboardCard" },
    }),
  },
  {
    id: "modal-panel",
    name: "Modal panel",
    category: "ui",
    description: "Comfortable medium radius for dialogs and confirmation panels.",
    state: withState({
      mode: "simple",
      previewContext: "card",
      simpleUnit: "px",
      simpleValues: { topLeft: 24, topRight: 24, bottomRight: 24, bottomLeft: 24 },
      style: { width: 420, height: 280, backgroundType: "solid", backgroundColor: "#ffffff", shadowPreset: "strong", borderWidth: 1, borderStyle: "solid", borderColor: "#e2e8f0" },
      exportOptions: { className: "modal-panel", componentName: "ModalPanel" },
    }),
  },
  {
    id: "bottom-sheet",
    name: "Bottom sheet",
    category: "ui",
    description: "Large top corners with subtle bottom corners for mobile sheets.",
    state: withState({
      mode: "simple",
      previewContext: "card",
      simpleUnit: "px",
      simpleValues: { topLeft: 36, topRight: 36, bottomRight: 8, bottomLeft: 8 },
      style: { width: 420, height: 300, backgroundType: "solid", backgroundColor: "#ffffff", shadowPreset: "strong", borderWidth: 1, borderStyle: "solid", borderColor: "#e2e8f0" },
      exportOptions: { className: "bottom-sheet", componentName: "BottomSheet" },
    }),
  },
  {
    id: "chat-bubble",
    name: "Chat bubble",
    category: "ui",
    description: "Asymmetric message bubble with one tighter corner.",
    state: withState({
      mode: "simple",
      previewContext: "card",
      simpleUnit: "px",
      simpleValues: { topLeft: 24, topRight: 24, bottomRight: 8, bottomLeft: 24 },
      style: { width: 330, height: 150, backgroundType: "linear-gradient", gradientFrom: "#2563eb", gradientTo: "#4f46e5", shadowPreset: "soft" },
      exportOptions: { className: "chat-bubble", componentName: "ChatBubble" },
    }),
  },
  {
    id: "filter-chip",
    name: "Filter chip",
    category: "ui",
    description: "Compact pill for tags, filters, statuses, and segmented controls.",
    state: withState({
      mode: "simple",
      previewContext: "button",
      simpleUnit: "px",
      simpleValues: { topLeft: 999, topRight: 999, bottomRight: 999, bottomLeft: 999 },
      style: { width: 180, height: 52, backgroundType: "solid", backgroundColor: "#e0e7ff", shadowPreset: "none", borderWidth: 1, borderStyle: "solid", borderColor: "#a5b4fc" },
      exportOptions: { className: "filter-chip", componentName: "FilterChip" },
    }),
  },
  {
    id: "product-thumbnail",
    name: "Product thumbnail",
    category: "image",
    description: "Practical rounded image mask for ecommerce and content cards.",
    state: withState({
      mode: "image",
      previewContext: "image",
      simpleUnit: "px",
      simpleValues: { topLeft: 20, topRight: 20, bottomRight: 20, bottomLeft: 20 },
      style: { width: 360, height: 280, backgroundType: "image", imageUrl: "/assets/tools/border-radius-generator/preset-photo.svg", shadowPreset: "medium" },
      exportOptions: { className: "product-thumbnail", componentName: "ProductThumbnail" },
    }),
  },
  {
    id: "hero-image",
    name: "Hero image",
    category: "image",
    description: "Large soft corners for editorial and product hero imagery.",
    state: withState({
      mode: "image",
      previewContext: "image",
      simpleUnit: "px",
      simpleValues: { topLeft: 48, topRight: 48, bottomRight: 48, bottomLeft: 48 },
      style: { width: 480, height: 300, backgroundType: "image", imageUrl: "/assets/tools/border-radius-generator/preset-photo.svg", shadowPreset: "strong" },
      exportOptions: { className: "hero-image", componentName: "HeroImage" },
    }),
  },
  {
    id: "squircle",
    name: "Soft squircle",
    category: "blob",
    description: "Balanced percentage curves for app tiles and decorative cards.",
    state: withState({
      mode: "blob",
      previewContext: "blob",
      advancedValues: {
        horizontal: { topLeft: 34, topRight: 66, bottomRight: 64, bottomLeft: 36 },
        vertical: { topLeft: 38, topRight: 36, bottomRight: 62, bottomLeft: 64 },
      },
      style: { width: 300, height: 300, gradientFrom: "#6366f1", gradientTo: "#22d3ee", shadowPreset: "strong" },
      exportOptions: { className: "soft-squircle", componentName: "SoftSquircle" },
    }),
  },
  {
    id: "hero-decoration",
    name: "Hero decoration",
    category: "blob",
    description: "Wide organic shape for landing-page backgrounds and visual accents.",
    state: withState({
      mode: "blob",
      previewContext: "hero-decoration",
      advancedValues: {
        horizontal: { topLeft: 26, topRight: 74, bottomRight: 58, bottomLeft: 42 },
        vertical: { topLeft: 52, topRight: 34, bottomRight: 66, bottomLeft: 48 },
      },
      style: { width: 460, height: 260, gradientFrom: "#8b5cf6", gradientTo: "#ec4899", shadowPreset: "medium" },
      exportOptions: { className: "hero-decoration", componentName: "HeroDecoration" },
    }),
  },
  {
    id: "animated-blob",
    name: "Animated blob",
    category: "animated",
    description: "Morphing blob with generated keyframes.",
    state: withState({
      mode: "animated",
      animation: { enabled: true, duration: 9, includeReducedMotion: true },
      style: { width: 340, height: 340, gradientFrom: "#14b8a6", gradientTo: "#6366f1", shadowPreset: "strong" },
      exportOptions: { className: "animated-blob", componentName: "AnimatedBlob" },
    }),
  },
];
