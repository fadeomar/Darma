import { describe, expect, it } from "vitest";
import { calculateWordMatchAccuracy, chooseWordMatchCard, createWordMatchRound, revealWordMatchHint, shuffleWordMatch } from "./wordMatchEngine";

describe("wordMatchEngine", () => {
  it("creates a deterministic round with requested pair count", () => {
    const round = createWordMatchRound("synonyms", "medium", "seed");
    expect(round.leftCards).toHaveLength(6);
    expect(round.rightCards).toHaveLength(6);
    expect(round.leftCards.every((card) => card.side === "left")).toBe(true);
  });

  it("shuffles deterministically for the same seed", () => {
    expect(shuffleWordMatch([1, 2, 3, 4], "a")).toEqual(shuffleWordMatch([1, 2, 3, 4], "a"));
  });

  it("matches a correct pair and increases score", () => {
    let round = createWordMatchRound("synonyms", "easy", "seed");
    const left = round.leftCards[0];
    const right = round.rightCards.find((card) => card.pairId === left.pairId)!;
    round = chooseWordMatchCard(round, left.id);
    round = chooseWordMatchCard(round, right.id);
    expect(round.leftCards.find((card) => card.id === left.id)?.matched).toBe(true);
    expect(round.score).toBeGreaterThan(100);
    expect(round.streak).toBe(1);
  });

  it("penalizes wrong matches and tracks missed pairs", () => {
    let round = createWordMatchRound("synonyms", "easy", "seed");
    const left = round.leftCards[0];
    const wrongRight = round.rightCards.find((card) => card.pairId !== left.pairId)!;
    round = chooseWordMatchCard(round, left.id);
    round = chooseWordMatchCard(round, wrongRight.id);
    expect(round.mistakes).toBe(1);
    expect(round.streak).toBe(0);
    expect(round.missedPairs).toContain(left.pairId);
  });

  it("reveals hints with a score penalty", () => {
    const round = revealWordMatchHint({ ...createWordMatchRound("categories", "easy", "seed"), score: 100 });
    expect(round.hintsUsed).toBe(1);
    expect(round.score).toBe(50);
    expect(round.lastFeedback).toContain("Hint");
  });

  it("calculates accuracy from matches and mistakes", () => {
    const round = { ...createWordMatchRound("opposites", "easy", "seed"), leftCards: [{ id: "a", pairId: "a", text: "a", side: "left" as const, matched: true }], mistakes: 1 };
    expect(calculateWordMatchAccuracy(round)).toBe(50);
  });
});
