import type { PercentPreset } from "./types";

export const DEFAULT_PERCENT_PRESET_ID = "sale-discount";

export const PERCENT_PRESETS: PercentPreset[] = [
  {
    id: "sale-discount",
    name: "Sale discount",
    description: "Find the final price and savings after a 25% discount.",
    mode: "discount",
    a: 120,
    b: 25,
  },
  {
    id: "growth-rate",
    name: "Growth rate",
    description: "Measure a metric moving from 1,200 to 1,560.",
    mode: "change",
    a: 1200,
    b: 1560,
  },
  {
    id: "reverse-raise",
    name: "Reverse a raise",
    description: "Recover the original salary before an 8% increase.",
    mode: "reverseChange",
    a: 54000,
    b: 8,
  },
  {
    id: "conversion-rate",
    name: "Conversion rate",
    description: "Calculate what percent 186 conversions are of 4,250 visits.",
    mode: "isWhatPercent",
    a: 186,
    b: 4250,
  },
  {
    id: "markup-margin",
    name: "Markup & margin",
    description: "Compare a 45 cost with a 72 selling price.",
    mode: "markupMargin",
    a: 45,
    b: 72,
  },
  {
    id: "measurement-gap",
    name: "Percent difference",
    description: "Compare two peer measurements without a baseline.",
    mode: "percentDifference",
    a: 98.4,
    b: 103.1,
  },
];
