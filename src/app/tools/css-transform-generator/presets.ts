import { createDefaultTransformState } from "./transform";
import type { TransformGeneratorState, TransformPreset } from "./types";

function makeState(overrides: Partial<TransformGeneratorState>): TransformGeneratorState {
  return { ...createDefaultTransformState(), ...overrides };
}

export const TRANSFORM_PRESETS: readonly TransformPreset[] = [
  {
    id: "lift-hover",
    name: "Lift on hover",
    category: "hover",
    description: "Subtle upward movement for cards and buttons.",
    state: makeState({ presetId: "lift-hover", mode: "hover", transform2d: { ...createDefaultTransformState().transform2d, translateY: 0, scaleX: 1, scaleY: 1 }, hover2d: { ...createDefaultTransformState().hover2d, translateY: -12, scaleX: 1.03, scaleY: 1.03 } }),
  },
  {
    id: "pressed-button",
    name: "Pressed button",
    category: "hover",
    description: "Small scale-down interaction for buttons.",
    state: makeState({ presetId: "pressed-button", mode: "hover", style: { ...createDefaultTransformState().style, previewObject: "button", width: 220, height: 72, borderRadius: 999 }, hover2d: { ...createDefaultTransformState().hover2d, translateY: 2, scaleX: 0.97, scaleY: 0.97 } }),
  },
  {
    id: "image-zoom",
    name: "Image zoom",
    category: "hover",
    description: "Smooth scale effect for image cards.",
    state: makeState({ presetId: "image-zoom", mode: "hover", style: { ...createDefaultTransformState().style, previewObject: "image", width: 360, height: 240, borderRadius: 24 }, hover2d: { ...createDefaultTransformState().hover2d, translateY: 0, scaleX: 1.1, scaleY: 1.1 } }),
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
    state: makeState({ presetId: "modal-enter", mode: "entrance", style: { ...createDefaultTransformState().style, previewObject: "modal", background: "linear-gradient(135deg, #ffffff, #e0f2fe)", textColor: "#0f172a" } }),
  },
  {
    id: "drawer-slide",
    name: "Drawer slide",
    category: "animation",
    description: "Slide-in panel transform.",
    state: makeState({ presetId: "drawer-slide", mode: "entrance", transform2d: { ...createDefaultTransformState().transform2d, translateX: -56, translateY: 0, scaleX: 1, scaleY: 1 }, style: { ...createDefaultTransformState().style, previewObject: "panel", width: 300, height: 280 } }),
  },
  {
    id: "flip-card-starter",
    name: "Flip card starter",
    category: "3d",
    description: "Base 3D flip card transform setup.",
    state: makeState({ presetId: "flip-card-starter", mode: "3d", transform3d: { ...createDefaultTransformState().transform3d, rotateX: 0, rotateY: 180, perspective: 1000 } }),
  },
  {
    id: "skewed-label",
    name: "Skewed label",
    category: "2d",
    description: "Angled ribbon or label effect.",
    state: makeState({ presetId: "skewed-label", mode: "2d", transform2d: { ...createDefaultTransformState().transform2d, translateY: 0, rotate: -2, skewX: -14, skewY: 0, scaleX: 1, scaleY: 1 }, style: { ...createDefaultTransformState().style, previewObject: "badge", width: 260, height: 86, borderRadius: 18 } }),
  },
  {
    id: "center-translate",
    name: "Center with translate",
    category: "utility",
    description: "Classic translate-based centering helper.",
    state: makeState({ presetId: "center-translate", mode: "2d", transform2d: { ...createDefaultTransformState().transform2d, translateX: -50, translateY: -50, translateUnit: "%", rotate: 0, scaleX: 1, scaleY: 1 } }),
  },
] as const;
