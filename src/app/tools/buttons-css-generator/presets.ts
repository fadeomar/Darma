import type { ButtonGeneratorConfig, ButtonPreset } from "./types";

export const defaultButtonConfig: ButtonGeneratorConfig = {
  variant: "solid",
  text: "Get started",
  fontSize: 16,
  fontWeight: 700,
  radius: 14,
  paddingX: 22,
  paddingY: 12,
  shadow: 18,
  background: "#4f46e5",
  background2: "#ec4899",
  textColor: "#ffffff",
  borderColor: "#4f46e5",
  hoverEffect: "lift",
  activeEffect: true,
  disabled: false,
  iconPosition: "right",
  fullWidth: false,
};

export const buttonPresets: ButtonPreset[] = [
  { id: "primary", name: "Primary CTA", description: "Bold main action button.", config: defaultButtonConfig },
  { id: "secondary", name: "Secondary button", description: "Subtle outline button.", config: { ...defaultButtonConfig, variant: "outline", text: "Learn more", background: "#ffffff", textColor: "#111827", borderColor: "#d1d5db", shadow: 4 } },
  { id: "danger", name: "Danger button", description: "Destructive action with clear color.", config: { ...defaultButtonConfig, text: "Delete", background: "#dc2626", background2: "#991b1b", borderColor: "#dc2626" } },
  { id: "success", name: "Success button", description: "Positive confirmation button.", config: { ...defaultButtonConfig, text: "Confirm", background: "#16a34a", background2: "#22c55e", borderColor: "#16a34a" } },
  { id: "glass", name: "Glass button", description: "Frosted glass interface button.", config: { ...defaultButtonConfig, variant: "glass", text: "Open menu", background: "#ffffff", background2: "#60a5fa", textColor: "#0f172a", borderColor: "#ffffff", shadow: 12 } },
  { id: "gradient", name: "Gradient CTA", description: "Colorful marketing button.", config: { ...defaultButtonConfig, variant: "gradient", text: "Start free", background: "#06b6d4", background2: "#8b5cf6", borderColor: "#06b6d4", radius: 999 } },
  { id: "soft", name: "Soft shadow button", description: "Friendly rounded button with depth.", config: { ...defaultButtonConfig, variant: "neumorphic", text: "Continue", background: "#e5e7eb", textColor: "#111827", borderColor: "#e5e7eb", shadow: 22 } },
  { id: "minimal", name: "Minimal text button", description: "Text-first ghost button.", config: { ...defaultButtonConfig, variant: "ghost", text: "View details", background: "#ffffff", textColor: "#334155", borderColor: "#ffffff", shadow: 0, paddingX: 12 } },
];
