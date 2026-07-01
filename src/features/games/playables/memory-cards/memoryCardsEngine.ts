import type { MemoryCard, MemoryDifficulty, MemorySettings, MemoryState, MemoryTheme } from "./memoryCardsTypes";

export const MEMORY_SYMBOLS: Record<MemoryTheme, string[]> = {
  icons: ["⚡", "🚀", "🎯", "💎", "🔥", "🌙", "⭐", "🧩", "🎲", "🛡️", "🎧", "💡", "🧠", "🏆", "🔔", "🪄", "🧭", "🎨"],
  animals: ["🦊", "🐼", "🐸", "🦁", "🐵", "🐨", "🐯", "🦉", "🐧", "🐳", "🦋", "🐢", "🦄", "🐙", "🦖", "🐝", "🦜", "🐺"],
  food: ["🍕", "🍔", "🍟", "🌮", "🍩", "🍪", "🍉", "🍓", "🍇", "🥝", "🍒", "🥨", "🧁", "🍫", "🍿", "🥐", "🥑", "🍜"],
  sports: ["⚽", "🏀", "🏈", "🎾", "🏐", "🏓", "🥊", "⛳", "🏹", "🎳", "🛼", "🏄", "🚴", "🏆", "🥇", "⛸️", "🏋️", "🤿"],
};

export const MEMORY_PAIR_COUNT: Record<MemoryDifficulty, number> = {
  easy: 6,
  medium: 8,
  hard: 12,
  expert: 18,
};

export const MEMORY_PREVIEW_SECONDS: Record<MemoryDifficulty, number> = {
  easy: 4,
  medium: 3,
  hard: 2,
  expert: 2,
};

export const MEMORY_GRID_COLUMNS: Record<MemoryDifficulty, number> = {
  easy: 4,
  medium: 4,
  hard: 6,
  expert: 6,
};

export function seededRandom(seed: number) {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

export function shuffleMemoryCards<T>(items: T[], seed = Date.now()): T[] {
  const random = seededRandom(seed);
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

export function createMemoryDeck(settings: MemorySettings, seed = Date.now()): MemoryCard[] {
  const symbols = MEMORY_SYMBOLS[settings.theme];
  const pairs = symbols.slice(0, MEMORY_PAIR_COUNT[settings.difficulty]);
  const cards = pairs.flatMap((symbol, index) => [
    { id: `${index}-a`, pairId: `${index}`, symbol, matched: false, flipped: false },
    { id: `${index}-b`, pairId: `${index}`, symbol, matched: false, flipped: false },
  ]);
  return shuffleMemoryCards(cards, seed).map((card, index) => ({ ...card, id: `${card.id}-${index}` }));
}

export function createInitialMemoryState(settings: Partial<MemorySettings> = {}, seed = Date.now()): MemoryState {
  const nextSettings: MemorySettings = {
    difficulty: settings.difficulty ?? "medium",
    theme: settings.theme ?? "icons",
    previewSeconds: settings.previewSeconds ?? MEMORY_PREVIEW_SECONDS[settings.difficulty ?? "medium"],
  };
  return {
    cards: createMemoryDeck(nextSettings, seed),
    openIds: [],
    moves: 0,
    matches: 0,
    streak: 0,
    bestStreak: 0,
    mistakes: 0,
    hintsUsed: 0,
    status: "ready",
    startedAt: null,
    finishedAt: null,
    settings: nextSettings,
    message: "Preview the board, then match every pair with as few moves as possible.",
  };
}

export function startMemoryGame(state: MemoryState, now = Date.now()): MemoryState {
  return {
    ...state,
    status: "playing",
    startedAt: state.startedAt ?? now,
    message: "Game started. Remember positions and protect your streak.",
  };
}

export function setAllCardsVisible(state: MemoryState, flipped: boolean): MemoryState {
  return {
    ...state,
    cards: state.cards.map((card) => (card.matched ? card : { ...card, flipped })),
    openIds: flipped ? state.cards.filter((card) => !card.matched).map((card) => card.id) : [],
    status: flipped ? "preview" : state.status === "preview" ? "playing" : state.status,
  };
}

export function hideUnmatchedOpenCards(state: MemoryState): MemoryState {
  const openUnmatched = state.cards.filter((card) => state.openIds.includes(card.id) && !card.matched).map((card) => card.id);
  if (openUnmatched.length < 2) return state;
  return {
    ...state,
    cards: state.cards.map((card) => (openUnmatched.includes(card.id) ? { ...card, flipped: false } : card)),
    openIds: [],
    message: "Not a match. Reset your mental map and try another pair.",
  };
}

export function flipMemoryCard(state: MemoryState, cardId: string, now = Date.now()): MemoryState {
  if (state.status === "won" || state.status === "preview") return state;
  const card = state.cards.find((item) => item.id === cardId);
  if (!card || card.matched || card.flipped || state.openIds.length >= 2) return state;

  const nextOpenIds = [...state.openIds, cardId];
  let nextCards = state.cards.map((item) => (item.id === cardId ? { ...item, flipped: true } : item));
  let nextState: MemoryState = {
    ...state,
    cards: nextCards,
    openIds: nextOpenIds,
    status: "playing",
    startedAt: state.startedAt ?? now,
    message: "Find the matching card.",
  };

  if (nextOpenIds.length !== 2) return nextState;

  const [firstId, secondId] = nextOpenIds;
  const first = nextCards.find((item) => item.id === firstId);
  const second = nextCards.find((item) => item.id === secondId);
  const isMatch = Boolean(first && second && first.pairId === second.pairId);
  const nextMoves = state.moves + 1;

  if (isMatch && first && second) {
    nextCards = nextCards.map((item) => (item.pairId === first.pairId ? { ...item, matched: true, flipped: true } : item));
    const nextMatches = state.matches + 1;
    const nextStreak = state.streak + 1;
    const won = nextMatches === MEMORY_PAIR_COUNT[state.settings.difficulty];
    nextState = {
      ...nextState,
      cards: nextCards,
      openIds: [],
      moves: nextMoves,
      matches: nextMatches,
      streak: nextStreak,
      bestStreak: Math.max(state.bestStreak, nextStreak),
      status: won ? "won" : "playing",
      finishedAt: won ? now : null,
      message: won ? "Perfect finish. All pairs matched." : `Match found! Streak x${nextStreak}.`,
    };
    return nextState;
  }

  return {
    ...nextState,
    moves: nextMoves,
    streak: 0,
    mistakes: state.mistakes + 1,
    openIds: nextOpenIds,
    message: "Not a match. The cards will turn back over.",
  };
}

export function revealHintPair(state: MemoryState): MemoryState {
  if (state.status === "won" || state.status === "preview") return state;
  const hiddenByPair = new Map<string, string[]>();
  state.cards.forEach((card) => {
    if (!card.matched && !card.flipped) hiddenByPair.set(card.pairId, [...(hiddenByPair.get(card.pairId) ?? []), card.id]);
  });
  const pair = [...hiddenByPair.values()].find((ids) => ids.length >= 2);
  if (!pair) return state;
  const revealIds = pair.slice(0, 2);
  return {
    ...state,
    hintsUsed: state.hintsUsed + 1,
    cards: state.cards.map((card) => (revealIds.includes(card.id) ? { ...card, flipped: true } : card)),
    openIds: revealIds,
    message: "Hint revealed a pair. Memorize it quickly.",
  };
}

export function getMemoryElapsedSeconds(state: MemoryState, now = Date.now()): number {
  if (!state.startedAt) return 0;
  const end = state.finishedAt ?? now;
  return Math.max(0, Math.floor((end - state.startedAt) / 1000));
}
