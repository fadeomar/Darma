import { createDefaultTransformState } from "./transform";
import type { TransformGeneratorState, TransformPreset } from "./types";

function makeState(overrides: Partial<TransformGeneratorState>): TransformGeneratorState {
  return { ...createDefaultTransformState(), ...overrides };
}

const base = createDefaultTransformState();

export const TRANSFORM_PRESETS: readonly TransformPreset[] = [
  {
    id: "lift-hover",
    name: "Lift on hover",
    category: "hover",
    description: "Subtle upward movement for cards and buttons.",
    state: makeState({ presetId: "lift-hover", mode: "hover", transform2d: { ...base.transform2d, translateY: 0, scaleX: 1, scaleY: 1 }, hover2d: { ...base.hover2d, translateY: -12, scaleX: 1.03, scaleY: 1.03 } }),
  },
  {
    id: "pressed-button",
    name: "Pressed button",
    category: "hover",
    description: "Small scale-down interaction for buttons.",
    state: makeState({ presetId: "pressed-button", mode: "hover", style: { ...base.style, previewObject: "button", width: 220, height: 72, borderRadius: 999 }, hover2d: { ...base.hover2d, translateY: 2, scaleX: 0.97, scaleY: 0.97 } }),
  },
  {
    id: "image-zoom",
    name: "Image zoom",
    category: "hover",
    description: "Smooth scale effect for image cards.",
    state: makeState({ presetId: "image-zoom", mode: "hover", style: { ...base.style, previewObject: "image", width: 360, height: 240, borderRadius: 24 }, hover2d: { ...base.hover2d, translateY: 0, scaleX: 1.1, scaleY: 1.1 } }),
  },
  {
    id: "product-card-tilt",
    name: "Product card tilt",
    category: "3d",
    description: "Perspective 3D card tilt effect.",
    state: createDefaultTransformState(),
  },
  {
    id: "modal-enter",
    name: "Modal entrance",
    category: "animation",
    description: "Fade and scale entrance animation.",
    state: makeState({ presetId: "modal-enter", mode: "entrance", style: { ...base.style, previewObject: "modal", background: "linear-gradient(135deg, #ffffff, #e0f2fe)", textColor: "#0f172a" } }),
  },
  {
    id: "drawer-slide",
    name: "Drawer slide",
    category: "animation",
    description: "Slide-in panel transform starter.",
    state: makeState({ presetId: "drawer-slide", mode: "entrance", transform2d: { ...base.transform2d, translateX: -56, translateY: 0, scaleX: 1, scaleY: 1 }, style: { ...base.style, previewObject: "panel", width: 300, height: 280 } }),
  },
  {
    id: "flip-card-starter",
    name: "Flip card starter",
    category: "3d",
    description: "Base 3D flip card transform setup.",
    state: makeState({ presetId: "flip-card-starter", mode: "3d", transform3d: { ...base.transform3d, rotateX: 0, rotateY: 180, perspective: 1000 } }),
  },
  {
    id: "skewed-label",
    name: "Skewed label",
    category: "2d",
    description: "Angled ribbon or label effect.",
    state: makeState({ presetId: "skewed-label", mode: "2d", transform2d: { ...base.transform2d, translateY: 0, rotate: -2, skewX: -14, skewY: 0, scaleX: 1, scaleY: 1 }, style: { ...base.style, previewObject: "badge", width: 260, height: 86, borderRadius: 18 } }),
  },
  {
    id: "center-translate",
    name: "Center with translate",
    category: "utility",
    description: "Classic translate-based centering helper.",
    state: makeState({ presetId: "center-translate", mode: "2d", transform2d: { ...base.transform2d, translateX: -50, translateY: -50, translateUnit: "%", rotate: 0, scaleX: 1, scaleY: 1 } }),
  },
  {
    id: "floating-action",
    name: "Floating action hover",
    category: "hover",
    description: "Lift and scale feedback for a floating circular action.",
    state: makeState({ presetId: "floating-action", mode: "hover", style: { ...base.style, previewObject: "button", width: 92, height: 92, borderRadius: 999, background: "linear-gradient(135deg, #4f46e5, #7c3aed)", shadow: "strong" }, transform2d: { ...base.transform2d, translateY: 0, scaleX: 1, scaleY: 1 }, hover2d: { ...base.hover2d, translateY: -8, rotate: 0, scaleX: 1.08, scaleY: 1.08 } }),
  },
  {
    id: "rotate-icon",
    name: "Rotate icon",
    category: "hover",
    description: "Small rotation for refresh, settings, and expandable controls.",
    state: makeState({ presetId: "rotate-icon", mode: "hover", style: { ...base.style, previewObject: "button", width: 96, height: 96, borderRadius: 24 }, transform2d: { ...base.transform2d, translateY: 0, rotate: 0, scaleX: 1, scaleY: 1 }, hover2d: { ...base.hover2d, translateY: 0, rotate: 18, scaleX: 1.04, scaleY: 1.04 } }),
  },
  {
    id: "thumbnail-nudge",
    name: "Thumbnail nudge",
    category: "hover",
    description: "Gentle movement for clickable gallery and product thumbnails.",
    state: makeState({ presetId: "thumbnail-nudge", mode: "hover", style: { ...base.style, previewObject: "image", width: 340, height: 230, borderRadius: 20, shadow: "medium" }, transform2d: { ...base.transform2d, translateY: 0, scaleX: 1, scaleY: 1 }, hover2d: { ...base.hover2d, translateY: -5, scaleX: 1.04, scaleY: 1.04 } }),
  },
  {
    id: "tooltip-pop",
    name: "Tooltip pop",
    category: "hover",
    description: "Compact scale-and-lift effect for hints, badges, and tooltips.",
    state: makeState({ presetId: "tooltip-pop", mode: "hover", style: { ...base.style, previewObject: "badge", width: 220, height: 76, borderRadius: 14, shadow: "medium" }, transform2d: { ...base.transform2d, translateY: 0, scaleX: 1, scaleY: 1 }, hover2d: { ...base.hover2d, translateY: -4, scaleX: 1.06, scaleY: 1.06 } }),
  },
  {
    id: "dropdown-hinge",
    name: "Dropdown hinge",
    category: "3d",
    description: "Top-origin perspective rotation for menus and dropdown panels.",
    state: makeState({ presetId: "dropdown-hinge", mode: "3d", style: { ...base.style, previewObject: "panel", width: 320, height: 220, borderRadius: 18, background: "linear-gradient(135deg, #ffffff, #e2e8f0)", textColor: "#0f172a", shadow: "strong" }, origin: { preset: "top center", x: "50%", y: "0%", z: "0px" }, transform3d: { ...base.transform3d, perspective: 1100, rotateX: -12, rotateY: 0, rotateZ: 0, translateZ: 0 } }),
  },
  {
    id: "subtle-card-tilt",
    name: "Subtle card tilt",
    category: "3d",
    description: "Lower-intensity perspective for professional dashboard cards.",
    state: makeState({ presetId: "subtle-card-tilt", mode: "card-tilt", transform3d: { ...base.transform3d, perspective: 1200, rotateX: 3, rotateY: -5, translateZ: 0 }, hover3d: { ...base.hover3d, perspective: 1200, rotateX: 5, rotateY: -8, translateZ: 12 }, style: { ...base.style, previewObject: "card", background: "linear-gradient(135deg, #0f172a, #334155)", shadow: "medium" } }),
  },
  {
    id: "image-tilt",
    name: "Image tilt",
    category: "3d",
    description: "Perspective hover treatment for portfolio and product images.",
    state: makeState({ presetId: "image-tilt", mode: "card-tilt", transform3d: { ...base.transform3d, perspective: 1000, rotateX: 4, rotateY: 7, translateZ: 0 }, hover3d: { ...base.hover3d, perspective: 1000, rotateX: 7, rotateY: 12, translateZ: 18 }, style: { ...base.style, previewObject: "image", width: 360, height: 240, borderRadius: 24, shadow: "strong" } }),
  },
  {
    id: "offset-badge",
    name: "Offset badge",
    category: "2d",
    description: "Translate and rotate a badge into a corner-accent position.",
    state: makeState({ presetId: "offset-badge", mode: "2d", transform2d: { ...base.transform2d, translateX: 18, translateY: -16, translateUnit: "px", rotate: 6, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 }, style: { ...base.style, previewObject: "badge", width: 230, height: 82, borderRadius: 999 } }),
  },
  {
    id: "zoom-modal",
    name: "Modal hover emphasis",
    category: "hover",
    description: "Very small scale emphasis for interactive dialog demos and previews.",
    state: makeState({ presetId: "zoom-modal", mode: "hover", style: { ...base.style, previewObject: "modal", width: 380, height: 260, borderRadius: 28, background: "linear-gradient(135deg, #ffffff, #ede9fe)", textColor: "#0f172a", shadow: "strong" }, transform2d: { ...base.transform2d, translateY: 0, scaleX: 1, scaleY: 1 }, hover2d: { ...base.hover2d, translateY: -3, scaleX: 1.025, scaleY: 1.025 } }),
  },
] as const;
