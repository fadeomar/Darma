export type ReadabilityResult = {
  fleschReadingEase: number;
  fleschKincaidGrade: number;
  gunningFog: number;
  label: "Very Easy" | "Easy" | "Fairly Easy" | "Standard" | "Fairly Difficult" | "Difficult" | "Very Confusing";
  wordCount: number;
  sentenceCount: number;
  syllableCount: number;
  averageSyllablesPerWord: number;
  averageWordsPerSentence: number;
  complexWordCount: number;
};

function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function countSyllables(word: string): number {
  const cleaned = word.replace(/[^a-z]/gi, "");
  if (!cleaned) return 0;
  let count = cleaned.match(/[aeiou]+/gi)?.length ?? 0;
  if (cleaned.length > 2 && /e$/i.test(cleaned)) count -= 1;
  if (cleaned.length > 3 && /ed$/i.test(cleaned)) count -= 1;
  return Math.max(1, count);
}

function readingLabel(score: number): ReadabilityResult["label"] {
  if (score >= 90) return "Very Easy";
  if (score >= 80) return "Easy";
  if (score >= 70) return "Fairly Easy";
  if (score >= 60) return "Standard";
  if (score >= 50) return "Fairly Difficult";
  if (score >= 30) return "Difficult";
  return "Very Confusing";
}

export function computeReadability(text: string): ReadabilityResult | null {
  if (typeof text !== "string") return null;
  const sentences = text.split(/[.!?]+/).map((item) => item.trim()).filter(Boolean);
  if (sentences.length < 3) return null;

  const words: string[] = Array.from(text.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g) ?? []);
  if (!words.length) return null;

  const syllablesByWord = words.map(countSyllables);
  const syllableCount = syllablesByWord.reduce((sum, count) => sum + count, 0);
  const complexWordCount = words.reduce<number>((count, word, index) => count + ((syllablesByWord[index] ?? 0) >= 3 && !/^[A-Z]/.test(word) ? 1 : 0), 0);
  const averageWordsPerSentence = words.length / sentences.length;
  const averageSyllablesPerWord = syllableCount / words.length;
  const fleschReadingEase = 206.835 - (1.015 * averageWordsPerSentence) - (84.6 * averageSyllablesPerWord);
  const fleschKincaidGrade = (0.39 * averageWordsPerSentence) + (11.8 * averageSyllablesPerWord) - 15.59;
  const gunningFog = 0.4 * (averageWordsPerSentence + 100 * (complexWordCount / words.length));
  const boundedEase = Math.max(0, Math.min(100, fleschReadingEase));

  return {
    fleschReadingEase: round2(boundedEase),
    fleschKincaidGrade: round2(Math.max(0, fleschKincaidGrade)),
    gunningFog: round2(Math.max(0, gunningFog)),
    label: readingLabel(boundedEase),
    wordCount: words.length,
    sentenceCount: sentences.length,
    syllableCount,
    averageSyllablesPerWord: round2(averageSyllablesPerWord),
    averageWordsPerSentence: round2(averageWordsPerSentence),
    complexWordCount,
  };
}
