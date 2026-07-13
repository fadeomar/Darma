import type { StatsOptions, StatsPreset } from "./types";

export const DEFAULT_STATS_OPTIONS: StatsOptions = {
  percentileMethod: "linear",
  varianceFocus: "sample",
  histogramBins: "auto",
  precision: 4,
};

export const STATS_PRESETS: StatsPreset[] = [
  {
    id: "classic",
    label: "Classic statistics set",
    description: "A compact data set commonly used to explain variance and standard deviation.",
    value: "2, 4, 4, 4, 5, 5, 7, 9",
  },
  {
    id: "test-scores",
    label: "Test scores",
    description: "A realistic classroom score distribution with a narrow central range.",
    value: "78, 84, 91, 73, 88, 95, 82, 86, 79, 90, 77, 85, 89, 92, 81, 87, 76, 94, 83, 88",
  },
  {
    id: "api-latency",
    label: "API latency with outlier",
    description: "Mostly stable response times with one production spike for outlier review.",
    value: "118, 124, 121, 119, 126, 123, 120, 122, 125, 117, 121, 119, 128, 640",
  },
  {
    id: "skewed-revenue",
    label: "Skewed order values",
    description: "A right-skewed commerce sample where the mean and median tell different stories.",
    value: "12, 15, 18, 19, 21, 22, 24, 25, 27, 31, 36, 44, 68, 120, 260",
  },
  {
    id: "sensor-readings",
    label: "Sensor readings",
    description: "Decimal measurements for checking precision and a tight distribution.",
    value: "20.02, 20.08, 19.97, 20.11, 20.05, 20.01, 19.99, 20.07, 20.04, 20.03, 20.09, 19.96",
  },
  {
    id: "bimodal",
    label: "Bimodal sample",
    description: "Two repeated peaks that demonstrate multiple modes.",
    value: "2, 2, 2, 3, 4, 5, 8, 9, 9, 9, 10, 11",
  },
];
