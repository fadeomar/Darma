export type PercentileMethod = "linear" | "nearest-rank";

export type VarianceFocus = "sample" | "population";

export type HistogramBinSetting = "auto" | 5 | 10 | 20;

export type StatsOptions = {
  percentileMethod: PercentileMethod;
  varianceFocus: VarianceFocus;
  histogramBins: HistogramBinSetting;
  precision: number;
};

export type InvalidToken = {
  token: string;
  position: number;
};

export type ParsedDataset = {
  values: number[];
  tokenCount: number;
  invalidCount: number;
  invalidTokens: InvalidToken[];
  truncatedCount: number;
};

export type DescriptiveStats = {
  count: number;
  uniqueCount: number;
  sum: number;
  mean: number;
  median: number;
  modes: number[];
  modeFrequency: number;
  min: number;
  max: number;
  range: number;
  q1: number;
  q3: number;
  iqr: number;
  p10: number;
  p90: number;
  p95: number;
  lowerFence: number;
  upperFence: number;
  lowerWhisker: number;
  upperWhisker: number;
  outliers: number[];
  variancePopulation: number;
  varianceSample: number;
  stdDevPopulation: number;
  stdDevSample: number;
  coefficientOfVariation: number | null;
  skewness: number | null;
  sorted: number[];
};

export type HistogramBin = {
  index: number;
  start: number;
  end: number;
  count: number;
  percentage: number;
};

export type StatsCheckLevel = "success" | "info" | "warning" | "danger";

export type StatsCheck = {
  id: string;
  level: StatsCheckLevel;
  title: string;
  message: string;
};

export type StatsPreset = {
  id: string;
  label: string;
  description: string;
  value: string;
};
