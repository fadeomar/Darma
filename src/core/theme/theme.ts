export type CoreAccent = "orange" | "teal" | "violet" | "blue" | "emerald" | "amber" | "rose" | "cyan";

export type CoreThemeTokens = {
  accent: CoreAccent;
  className: string;
};

export const CORE_ACCENT_CLASS: Record<CoreAccent, string> = {
  orange: "core-accent-orange",
  teal: "core-accent-teal",
  violet: "core-accent-violet",
  blue: "core-accent-blue",
  emerald: "core-accent-emerald",
  amber: "core-accent-amber",
  rose: "core-accent-rose",
  cyan: "core-accent-cyan",
};

export const getCoreAccentClass = (accent: CoreAccent = "orange") => CORE_ACCENT_CLASS[accent];
