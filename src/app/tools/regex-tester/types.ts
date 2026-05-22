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
  label: string;
  pattern: string;
  flags: string;
  text: string;
  replacement: string;
  description: string;
};

export type RegexTab = "test" | "matches" | "replace";
