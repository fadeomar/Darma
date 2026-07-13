export type RegexFlag = "g" | "i" | "m" | "s" | "u" | "y" | "d";

export type RegexBuildError = {
  ok: false;
  message: string;
};

export type RegexCaptureGroup = {
  index: number;
  value: string | undefined;
};

export type RegexNamedGroup = {
  name: string;
  value: string | undefined;
};

export type RegexMatchResult = {
  match: string;
  index: number;
  endIndex: number;
  line: number;
  column: number;
  captures: RegexCaptureGroup[];
  namedGroups: RegexNamedGroup[];
};

export type FlagInfo = {
  flag: RegexFlag;
  label: string;
  description: string;
  enabled: boolean;
};

export type RegexExample = {
  id: string;
  label: string;
  pattern: string;
  flags: string;
  text: string;
  replacement: string;
  description: string;
  category: "extract" | "validate" | "cleanup" | "transform";
};

export type RegexTab = "highlight" | "matches" | "replace" | "code";

export type RegexHighlightSegment = {
  id: string;
  text: string;
  highlighted: boolean;
  matchIndex?: number;
  zeroLength?: boolean;
};

export type RegexRiskLevel = "low" | "medium" | "high";

export type RegexRiskAssessment = {
  level: RegexRiskLevel;
  reasons: string[];
  blocksLongInput: boolean;
};

export type RegexCheckSeverity = "success" | "info" | "warning" | "danger";

export type RegexProductionCheck = {
  id: string;
  title: string;
  message: string;
  severity: RegexCheckSeverity;
};

export type RegexPatternStats = {
  captureGroups: number;
  namedGroups: string[];
};
