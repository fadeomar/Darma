import type { TipPreset, TipScenarioInput } from "./types";

function guests(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: `guest-${index + 1}`,
    name: `Guest ${index + 1}`,
    weight: 1,
  }));
}

export const DEFAULT_TIP_INPUT: TipScenarioInput = {
  subtotal: 86.4,
  taxPercent: 8.25,
  servicePercent: 0,
  tipPercent: 18,
  people: 3,
  currency: "USD",
  tipBasis: "subtotal-tax",
  roundMode: "fair",
  splitMode: "equal",
  guests: guests(3),
};

export const DEFAULT_TIP_PRESET_ID = "casual-dinner";

export const TIP_PRESETS: TipPreset[] = [
  {
    id: "casual-dinner",
    name: "Casual dinner",
    description: "Three people, local sales tax, and an 18% tip after tax.",
    input: { ...DEFAULT_TIP_INPUT, guests: guests(3) },
  },
  {
    id: "large-group",
    name: "Large group",
    description: "Eight guests with a restaurant service charge already included.",
    input: {
      subtotal: 420,
      taxPercent: 9,
      servicePercent: 20,
      tipPercent: 0,
      people: 8,
      currency: "USD",
      tipBasis: "subtotal",
      roundMode: "up-whole",
      splitMode: "equal",
      guests: guests(8),
    },
  },
  {
    id: "weighted-family",
    name: "Weighted family split",
    description: "Two adults and two children using weighted shares.",
    input: {
      subtotal: 145,
      taxPercent: 7.5,
      servicePercent: 0,
      tipPercent: 18,
      people: 4,
      currency: "USD",
      tipBasis: "subtotal-tax",
      roundMode: "fair",
      splitMode: "weighted",
      guests: [
        { id: "adult-1", name: "Adult 1", weight: 1 },
        { id: "adult-2", name: "Adult 2", weight: 1 },
        { id: "child-1", name: "Child 1", weight: 0.5 },
        { id: "child-2", name: "Child 2", weight: 0.5 },
      ],
    },
  },
  {
    id: "cafe-no-tax",
    name: "Quick cafe",
    description: "A simple two-person cafe bill with no entered tax or service fee.",
    input: {
      subtotal: 27.8,
      taxPercent: 0,
      servicePercent: 0,
      tipPercent: 15,
      people: 2,
      currency: "EUR",
      tipBasis: "subtotal",
      roundMode: "up-050",
      splitMode: "equal",
      guests: guests(2),
    },
  },
  {
    id: "shekel-takeaway",
    name: "Takeaway order",
    description: "Four-way ILS split with a small service fee and no extra tip.",
    input: {
      subtotal: 168,
      taxPercent: 0,
      servicePercent: 5,
      tipPercent: 0,
      people: 4,
      currency: "ILS",
      tipBasis: "subtotal",
      roundMode: "fair",
      splitMode: "equal",
      guests: guests(4),
    },
  },
  {
    id: "yen-group",
    name: "JPY group meal",
    description: "Zero-decimal currency example with five equal guests.",
    input: {
      subtotal: 12800,
      taxPercent: 10,
      servicePercent: 0,
      tipPercent: 0,
      people: 5,
      currency: "JPY",
      tipBasis: "subtotal",
      roundMode: "up-whole",
      splitMode: "equal",
      guests: guests(5),
    },
  },
];
