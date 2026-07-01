import type { WordMatchCard, WordMatchCategory, WordMatchDifficulty, WordMatchRound, WordPair } from "./wordMatchTypes";

export const WORD_PAIRS: WordPair[] = [
  { id: "syn-quick", category: "synonyms", left: "quick", right: "fast", hint: "They both describe high speed." },
  { id: "syn-happy", category: "synonyms", left: "happy", right: "joyful", hint: "A positive feeling." },
  { id: "syn-brave", category: "synonyms", left: "brave", right: "courageous", hint: "Someone who faces fear." },
  { id: "syn-small", category: "synonyms", left: "small", right: "tiny", hint: "Very little in size." },
  { id: "syn-smart", category: "synonyms", left: "smart", right: "clever", hint: "Good at understanding things." },
  { id: "syn-ancient", category: "synonyms", left: "ancient", right: "old", hint: "From a very long time ago." },
  { id: "syn-calm", category: "synonyms", left: "calm", right: "peaceful", hint: "Quiet and not stressed." },
  { id: "syn-clear", category: "synonyms", left: "clear", right: "obvious", hint: "Easy to understand." },
  { id: "opp-hot", category: "opposites", left: "hot", right: "cold", hint: "Opposite temperatures." },
  { id: "opp-early", category: "opposites", left: "early", right: "late", hint: "Opposite time arrival." },
  { id: "opp-open", category: "opposites", left: "open", right: "closed", hint: "Door states." },
  { id: "opp-light", category: "opposites", left: "light", right: "heavy", hint: "Opposite weights." },
  { id: "opp-win", category: "opposites", left: "win", right: "lose", hint: "Opposite game outcomes." },
  { id: "opp-empty", category: "opposites", left: "empty", right: "full", hint: "Opposite capacity states." },
  { id: "opp-noisy", category: "opposites", left: "noisy", right: "quiet", hint: "Opposite sound levels." },
  { id: "opp-weak", category: "opposites", left: "weak", right: "strong", hint: "Opposite strength." },
  { id: "cat-apple", category: "categories", left: "apple", right: "fruit", hint: "You can eat it from a tree." },
  { id: "cat-lion", category: "categories", left: "lion", right: "animal", hint: "A living creature." },
  { id: "cat-red", category: "categories", left: "red", right: "color", hint: "It describes appearance." },
  { id: "cat-doctor", category: "categories", left: "doctor", right: "profession", hint: "A job title." },
  { id: "cat-guitar", category: "categories", left: "guitar", right: "instrument", hint: "Used to make music." },
  { id: "cat-rice", category: "categories", left: "rice", right: "food", hint: "Something people eat." },
  { id: "cat-soccer", category: "categories", left: "soccer", right: "sport", hint: "A physical game." },
  { id: "cat-paris", category: "categories", left: "Paris", right: "city", hint: "A place where people live." },
  { id: "ar-book", category: "english-arabic", left: "book", right: "كتاب", hint: "Something you read." },
  { id: "ar-water", category: "english-arabic", left: "water", right: "ماء", hint: "You drink it." },
  { id: "ar-school", category: "english-arabic", left: "school", right: "مدرسة", hint: "Students learn there." },
  { id: "ar-sun", category: "english-arabic", left: "sun", right: "شمس", hint: "It shines in the day." },
  { id: "ar-house", category: "english-arabic", left: "house", right: "بيت", hint: "A place to live." },
  { id: "ar-friend", category: "english-arabic", left: "friend", right: "صديق", hint: "Someone close to you." },
  { id: "ar-computer", category: "english-arabic", left: "computer", right: "حاسوب", hint: "A digital device." },
  { id: "ar-pencil", category: "english-arabic", left: "pencil", right: "قلم رصاص", hint: "Used for writing." },
];

const PAIRS_BY_DIFFICULTY: Record<WordMatchDifficulty, number> = { easy: 4, medium: 6, hard: 8, expert: 10 };

function hashSeed(seed: string) {
  return seed.split("").reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) % 2147483647, 7);
}

function seededRandom(seed: number) {
  let value = seed || 1;
  return () => {
    value = (value * 48271) % 2147483647;
    return value / 2147483647;
  };
}

export function shuffleWordMatch<T>(items: T[], seed: string): T[] {
  const result = [...items];
  const random = seededRandom(hashSeed(seed));
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function createWordMatchRound(category: WordMatchCategory, difficulty: WordMatchDifficulty, seed = `${Date.now()}`): WordMatchRound {
  const pool = WORD_PAIRS.filter((pair) => category === "mixed" || pair.category === category);
  const selected = shuffleWordMatch(pool, `${category}-${difficulty}-${seed}`).slice(0, PAIRS_BY_DIFFICULTY[difficulty]);
  const leftCards: WordMatchCard[] = selected.map((pair) => ({ id: `left-${pair.id}`, pairId: pair.id, text: pair.left, side: "left", matched: false }));
  const rightCards: WordMatchCard[] = shuffleWordMatch(selected, `${seed}-right`).map((pair) => ({ id: `right-${pair.id}`, pairId: pair.id, text: pair.right, side: "right", matched: false }));
  return {
    id: `${category}-${difficulty}-${seed}`,
    category,
    difficulty,
    leftCards,
    rightCards,
    startedAt: null,
    elapsedSeconds: 0,
    score: 0,
    streak: 0,
    bestStreak: 0,
    mistakes: 0,
    hintsUsed: 0,
    selectedLeftId: null,
    selectedRightId: null,
    status: "ready",
    missedPairs: [],
    lastFeedback: "Tap a word, then tap its match.",
  };
}

export function getPairById(pairId: string): WordPair | undefined {
  return WORD_PAIRS.find((pair) => pair.id === pairId);
}

export function chooseWordMatchCard(round: WordMatchRound, cardId: string): WordMatchRound {
  if (round.status === "won") return round;
  const allCards = [...round.leftCards, ...round.rightCards];
  const card = allCards.find((item) => item.id === cardId);
  if (!card || card.matched) return round;

  const next: WordMatchRound = { ...round, status: "playing", startedAt: round.startedAt ?? Date.now() };
  if (card.side === "left") next.selectedLeftId = card.id;
  if (card.side === "right") next.selectedRightId = card.id;

  if (!next.selectedLeftId || !next.selectedRightId) return { ...next, lastFeedback: "Now choose the matching card." };

  const left = next.leftCards.find((item) => item.id === next.selectedLeftId);
  const right = next.rightCards.find((item) => item.id === next.selectedRightId);
  if (!left || !right) return next;

  if (left.pairId === right.pairId) {
    const streak = next.streak + 1;
    const score = next.score + 100 + streak * 20;
    const leftCards = next.leftCards.map((item) => item.pairId === left.pairId ? { ...item, matched: true } : item);
    const rightCards = next.rightCards.map((item) => item.pairId === right.pairId ? { ...item, matched: true } : item);
    const won = leftCards.every((item) => item.matched);
    return {
      ...next,
      leftCards,
      rightCards,
      selectedLeftId: null,
      selectedRightId: null,
      streak,
      bestStreak: Math.max(next.bestStreak, streak),
      score,
      status: won ? "won" : "playing",
      lastFeedback: won ? "Perfect! You cleared the board." : "Correct match. Keep the streak alive.",
    };
  }

  return {
    ...next,
    selectedLeftId: null,
    selectedRightId: null,
    score: Math.max(0, next.score - 25),
    streak: 0,
    mistakes: next.mistakes + 1,
    missedPairs: Array.from(new Set([...next.missedPairs, left.pairId, right.pairId])),
    lastFeedback: "Not a match. Try again and watch the meaning.",
  };
}

export function revealWordMatchHint(round: WordMatchRound): WordMatchRound {
  const unresolved = round.leftCards.find((card) => !card.matched);
  if (!unresolved) return round;
  const pair = getPairById(unresolved.pairId);
  return {
    ...round,
    hintsUsed: round.hintsUsed + 1,
    score: Math.max(0, round.score - 50),
    lastFeedback: pair ? `Hint for “${pair.left}”: ${pair.hint}` : "Look for the closest meaning.",
  };
}

export function calculateWordMatchAccuracy(round: WordMatchRound): number {
  const matched = round.leftCards.filter((card) => card.matched).length;
  const attempts = matched + round.mistakes;
  if (attempts === 0) return 100;
  return Math.round((matched / attempts) * 100);
}

export function createWordMatchSummary(round: WordMatchRound): string {
  return [
    "Word Match Pro result",
    `Category: ${round.category}`,
    `Difficulty: ${round.difficulty}`,
    `Score: ${round.score}`,
    `Accuracy: ${calculateWordMatchAccuracy(round)}%`,
    `Mistakes: ${round.mistakes}`,
    `Best streak: ${round.bestStreak}`,
    `Time: ${round.elapsedSeconds}s`,
  ].join("\n");
}
