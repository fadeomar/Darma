// ─── Word Counter logic ───────────────────────────────────────────────────────
// Pure, dependency-free text measurement helpers. Everything runs locally.

export type WordStats = {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  sentences: number;
  paragraphs: number;
  lines: number;
  uniqueWords: number;
  longestWordLength: number;
  averageWordLength: number;
  readingTimeSec: number;
  speakingTimeSec: number;
};

export type WordFrequency = {
  word: string;
  count: number;
};

// Average adult reading / speaking rates (words per minute).
export const READING_WPM = 200;
export const SPEAKING_WPM = 130;

// Match word characters across Latin digits/letters and Arabic.
const WORD_CHAR = "0-9A-Za-z\\u00C0-\\u024F\\u0600-\\u06FF";
const WORD_RE = new RegExp(`[${WORD_CHAR}]+(?:['’-][${WORD_CHAR}]+)*`, "g");

// Sentence terminators including Arabic question mark and ellipsis.
const SENTENCE_RE = /[^.!?؟…]*[.!?؟…]+|[^.!?؟…]+$/g;

// Small English stop-word set so "top words" surfaces meaningful terms.
const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "of", "to", "in", "on", "for", "with",
  "at", "by", "from", "is", "are", "was", "were", "be", "been", "being", "it",
  "its", "this", "that", "these", "those", "as", "i", "you", "he", "she", "we",
  "they", "them", "his", "her", "their", "our", "my", "your", "not", "no", "so",
  "if", "then", "than", "too", "very", "can", "will", "just", "do", "does", "did",
]);

export function tokenizeWords(text: string): string[] {
  return text.match(WORD_RE) ?? [];
}

export function computeWordStats(text: string): WordStats {
  const words = tokenizeWords(text);
  const wordCount = words.length;

  const sentences = text.trim()
    ? (text.match(SENTENCE_RE) ?? ([] as string[])).filter((s) => s.trim().length > 0).length
    : 0;

  const paragraphs = text.trim()
    ? text.split(/\n\s*\n/).filter((block) => block.trim().length > 0).length
    : 0;

  const lines = text ? text.split(/\r\n|\r|\n/).length : 0;

  const uniqueWords = new Set(words.map((w) => w.toLowerCase())).size;

  let longestWordLength = 0;
  let totalWordLength = 0;
  for (const word of words) {
    totalWordLength += word.length;
    if (word.length > longestWordLength) longestWordLength = word.length;
  }
  const averageWordLength = wordCount ? totalWordLength / wordCount : 0;

  return {
    words: wordCount,
    characters: text.length,
    charactersNoSpaces: text.replace(/\s/g, "").length,
    sentences,
    paragraphs,
    lines,
    uniqueWords,
    longestWordLength,
    averageWordLength,
    readingTimeSec: wordCount ? Math.max(1, Math.round((wordCount / READING_WPM) * 60)) : 0,
    speakingTimeSec: wordCount ? Math.max(1, Math.round((wordCount / SPEAKING_WPM) * 60)) : 0,
  };
}

export function topWords(text: string, limit = 6): WordFrequency[] {
  const counts = new Map<string, number>();
  for (const raw of tokenizeWords(text)) {
    const word = raw.toLowerCase();
    if (word.length < 2 || STOP_WORDS.has(word)) continue;
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word))
    .slice(0, limit);
}

export function formatDuration(seconds: number): string {
  if (seconds <= 0) return "0s";
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest ? `${minutes}m ${rest}s` : `${minutes}m`;
}

// Common platform character limits writers and creators care about.
export type PlatformLimit = {
  id: string;
  label: string;
  max: number;
};

export const PLATFORM_LIMITS: PlatformLimit[] = [
  { id: "seo-title", label: "SEO title", max: 60 },
  { id: "meta-description", label: "Meta description", max: 160 },
  { id: "tweet", label: "Post / X", max: 280 },
  { id: "youtube-title", label: "YouTube title", max: 100 },
  { id: "instagram", label: "Instagram caption", max: 2200 },
];

export function buildStatsSummary(stats: WordStats): string {
  return [
    `Words: ${stats.words}`,
    `Characters: ${stats.characters}`,
    `Characters (no spaces): ${stats.charactersNoSpaces}`,
    `Sentences: ${stats.sentences}`,
    `Paragraphs: ${stats.paragraphs}`,
    `Lines: ${stats.lines}`,
    `Unique words: ${stats.uniqueWords}`,
    `Reading time: ${formatDuration(stats.readingTimeSec)}`,
    `Speaking time: ${formatDuration(stats.speakingTimeSec)}`,
  ].join("\n");
}

export const SAMPLE_TEXT = `Writing for the web is different from writing for print. Readers scan, they don't read every word, and they decide in seconds whether to stay.

Keep your sentences short. Use plain language. Break long ideas into smaller paragraphs so they are easy to follow on a small screen.

A good word counter helps you stay within limits: a tweet, a meta description, a YouTube title, or an assignment with a strict word count. Measure first, then trim with intention.`;
