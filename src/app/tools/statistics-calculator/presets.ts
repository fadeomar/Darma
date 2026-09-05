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
  {
    id: "daily-signups",
    label: "Daily signups",
    description: "Two weeks of product signups for mean, median, spread, and trend review.",
    value: "42, 51, 47, 58, 63, 55, 49, 67, 72, 61, 59, 75, 69, 81",
  },
  {
    id: "page-load-times",
    label: "Page load times",
    description: "Frontend load times in milliseconds with a few slow sessions.",
    value: "840, 910, 875, 930, 895, 860, 920, 980, 1020, 870, 890, 905, 1480, 1720",
  },
  {
    id: "order-fulfillment",
    label: "Fulfillment minutes",
    description: "Warehouse completion times with a compact center and long tail.",
    value: "18, 19, 21, 20, 22, 24, 19, 20, 23, 21, 18, 25, 31, 38, 44",
  },
  {
    id: "weekly-revenue",
    label: "Weekly revenue",
    description: "Twelve weekly revenue values for variability and percentile checks.",
    value: "12400, 13150, 12820, 13900, 14250, 13680, 14720, 15100, 14980, 15840, 16220, 17150",
  },
  {
    id: "support-resolution",
    label: "Support resolution hours",
    description: "Ticket resolution times with several high-duration cases.",
    value: "1.2, 1.8, 2.1, 1.5, 3.2, 2.6, 1.9, 2.4, 2.0, 4.8, 6.5, 1.7, 2.2, 9.1",
  },
  {
    id: "employee-tenure",
    label: "Employee tenure",
    description: "Tenure in years for quartile and distribution review.",
    value: "0.5, 0.8, 1.1, 1.6, 2.0, 2.4, 2.8, 3.1, 3.9, 4.5, 5.2, 6.8, 8.1, 11.4",
  },
  {
    id: "conversion-funnel",
    label: "Funnel conversion %",
    description: "Daily conversion percentages with a tight operational range.",
    value: "3.8, 4.1, 4.0, 4.3, 3.9, 4.4, 4.2, 4.1, 4.6, 4.5, 4.2, 4.0, 4.7, 4.3",
  },
  {
    id: "cpu-utilization",
    label: "CPU utilization",
    description: "Infrastructure utilization values for capacity planning and outlier detection.",
    value: "42, 45, 47, 51, 49, 53, 55, 48, 50, 52, 57, 61, 64, 88",
  },
  {
    id: "ratings-discrete",
    label: "Product ratings",
    description: "Discrete 1–5 ratings where mode frequency is especially useful.",
    value: "5, 4, 5, 5, 3, 4, 5, 4, 4, 5, 2, 4, 5, 3, 4, 5, 5, 4, 3, 5",
  },
  {
    id: "negative-values",
    label: "Profit and loss sample",
    description: "A mixed-sign set for checking statistics across gains and losses.",
    value: "-12, 8, -4, 16, 21, -7, 3, 11, -2, 19, 24, -9, 5, 13",
  },
  {
    id: "large-scale",
    label: "Large-value sample",
    description: "Large magnitudes to verify formatting and dispersion calculations.",
    value: "1250000, 1320000, 1295000, 1410000, 1385000, 1500000, 1475000, 1620000, 1580000, 1710000",
  },
  {
    id: "near-constant",
    label: "Near-constant readings",
    description: "Almost identical measurements that demonstrate very low variance.",
    value: "99.98, 100.01, 100.00, 99.99, 100.02, 100.01, 99.97, 100.00, 99.99, 100.01",
  },

];
