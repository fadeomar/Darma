/**
 * Darma Games Engine — generic types shared by reusable game primitives.
 *
 * These types intentionally avoid Reaction Timer specific names. A future game
 * can describe its modes, capabilities, QA state, and local storage health with
 * the same vocabulary without importing any playable-specific code.
 */

export type DarmaGameInputKind = "pointer" | "keyboard" | "touch" | "mouse" | "pen";

export type DarmaGameCapabilityId =
  | "fullscreen"
  | "audio"
  | "haptics"
  | "local-storage"
  | "clipboard"
  | "native-share"
  | "reduced-motion"
  | "high-contrast"
  | "canvas";

export type DarmaGameCapabilityState = "ready" | "optional" | "missing" | "not-applicable";

export type DarmaGameCapability = {
  id: DarmaGameCapabilityId;
  label: string;
  state: DarmaGameCapabilityState;
  note?: string;
};

export type DarmaGameModeSummary = {
  id: string;
  label: string;
  description: string;
  input: DarmaGameInputKind[];
  durationLabel?: string;
  difficultyLabel?: string;
  usesCanvas?: boolean;
  localOnly?: boolean;
};

export type DarmaGameQaStatus = "done" | "needs-check" | "not-started";

export type DarmaGameQaItem = {
  id: string;
  label: string;
  area: "mobile" | "fullscreen" | "timing" | "storage" | "accessibility" | "share" | "performance" | "general";
  status: DarmaGameQaStatus;
  note?: string;
};

export type DarmaGameStorageMigration<TState> = {
  fromVersion: number;
  toVersion: number;
  migrate: (state: unknown) => TState;
};

export type DarmaGameStorageAdapter<TState> = {
  key: string;
  version: number;
  read: () => TState;
  write: (state: TState) => boolean;
  reset: () => boolean;
};
