export type TextActionGroup = "clean" | "arabic" | "extract" | "format" | "case";

export type TransformContext = {
  prefixText?: string;
  suffixText?: string;
};

export type TransformFn = (text: string, context?: TransformContext) => string;

export type TransformDef = {
  id: string;
  group: TextActionGroup;
  label: string;
  title: string;
  fn: TransformFn;
  mono?: boolean;
};

export type TextCleanerPreset = {
  id: string;
  title: string;
  description: string;
  actionIds: string[];
};
