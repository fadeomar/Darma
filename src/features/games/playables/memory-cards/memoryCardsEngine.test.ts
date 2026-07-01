import { describe, expect, it } from "vitest";
import { createInitialMemoryState, flipMemoryCard, hideUnmatchedOpenCards, revealHintPair } from "./memoryCardsEngine";

describe("memoryCardsEngine", () => {
  it("creates a duplicated deck by pair count", () => {
    const state = createInitialMemoryState({ difficulty: "easy", theme: "icons" }, 10);
    expect(state.cards).toHaveLength(12);
    const pairIds = new Set(state.cards.map((card) => card.pairId));
    expect(pairIds.size).toBe(6);
  });

  it("matches two cards from the same pair", () => {
    let state = createInitialMemoryState({ difficulty: "easy", theme: "icons" }, 1);
    const first = state.cards[0];
    const second = state.cards.find((card) => card.pairId === first.pairId && card.id !== first.id)!;
    state = flipMemoryCard(state, first.id, 1000);
    state = flipMemoryCard(state, second.id, 1001);
    expect(state.matches).toBe(1);
    expect(state.cards.filter((card) => card.pairId === first.pairId).every((card) => card.matched)).toBe(true);
  });

  it("hides unmatched open cards", () => {
    let state = createInitialMemoryState({ difficulty: "easy", theme: "icons" }, 2);
    const first = state.cards[0];
    const second = state.cards.find((card) => card.pairId !== first.pairId)!;
    state = flipMemoryCard(state, first.id, 1000);
    state = flipMemoryCard(state, second.id, 1001);
    expect(state.openIds).toHaveLength(2);
    state = hideUnmatchedOpenCards(state);
    expect(state.openIds).toHaveLength(0);
  });

  it("reveals a hint pair", () => {
    const state = revealHintPair(createInitialMemoryState({ difficulty: "easy", theme: "icons" }, 3));
    expect(state.hintsUsed).toBe(1);
    expect(state.openIds).toHaveLength(2);
  });
});
