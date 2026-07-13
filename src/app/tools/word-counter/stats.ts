import type {
  GoalProgress,
  ParagraphAnalysis,
  PhraseFrequency,
  SentenceAnalysis,
  SentenceLengthBucket,
  WordCounterCheck,
  WordCounterGoal,
  WordCounterMetric,
  WordCounterOptions,
  WordFrequency,
  WordStats,
} from "./types";

const WORD_RE = /[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu;
const WHITESPACE_RE = /\s/gu;
const ABBREVIATIONS = new Set([
  "mr", "mrs", "ms", "dr", "prof", "sr", "jr", "st", "vs", "etc", "fig", "no",
  "e.g", "i.e", "a.m", "p.m", "u.s", "u.k",
]);
const TITLE_ABBREVIATIONS = new Set(["mr", "mrs", "ms", "dr", "prof", "sr", "jr", "st"]);

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "of", "to", "in", "on", "for", "with", "at", "by", "from",
  "is", "are", "was", "were", "be", "been", "being", "it", "its", "this", "that", "these", "those", "as",
  "i", "you", "he", "she", "we", "they", "them", "his", "her", "their", "our", "my", "your", "not", "no",
  "so", "if", "then", "than", "too", "very", "can", "will", "just", "do", "does", "did", "has", "have", "had",
  "what", "when", "where", "who", "how", "which", "into", "about", "more", "most", "some", "any", "all",
  "في", "من", "إلى", "على", "عن", "مع", "هذا", "هذه", "ذلك", "تلك", "هو", "هي", "هم", "نحن", "أنا",
  "كان", "كانت", "يكون", "تكون", "أن", "إن", "أو", "و", "ثم", "لا", "ما", "كل", "كما", "لكن", "عند",
]);

export const DEFAULT_READING_WPM = 200;
export const DEFAULT_SPEAKING_WPM = 130;

function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function tokenizeWords(text: string): string[] {
  return text.match(WORD_RE) ?? [];
}

function normalizeWord(word: string): string {
  return word.toLocaleLowerCase().normalize("NFKC");
}

function previousTokenWithPeriods(text: string, index: number): string {
  let start = index;
  while (start > 0 && !/[\s([{"'“”]/u.test(text[start - 1]!)) start -= 1;
  return text.slice(start, index + 1).toLocaleLowerCase().replace(/[)\]}"'”]+$/u, "");
}

function isSentencePeriod(text: string, index: number): boolean {
  const previous = text[index - 1] ?? "";
  const next = text[index + 1] ?? "";
  if (/\d/u.test(previous) && /\d/u.test(next)) return false;

  const token = previousTokenWithPeriods(text, index);
  const withoutPeriod = token.replace(/\.$/u, "");
  if (ABBREVIATIONS.has(withoutPeriod)) {
    if (TITLE_ABBREVIATIONS.has(withoutPeriod)) return false;
    const nextVisible = text.slice(index + 1).match(/\S/u)?.[0] ?? "";
    return Boolean(nextVisible && /\p{Lu}/u.test(nextVisible));
  }
  if (/^(?:[\p{L}]\.){2,}$/u.test(token)) return false;
  if (/^[A-Z]\.$/u.test(token) && /\s+[A-Z]/u.test(text.slice(index + 1, index + 5))) return false;
  return true;
}

export function splitSentences(text: string): string[] {
  const normalized = text.replace(/\r\n?/g, "\n").trim();
  if (!normalized) return [];

  const sentences: string[] = [];
  let start = 0;
  let index = 0;

  while (index < normalized.length) {
    const char = normalized[index]!;
    let terminal = char === "!" || char === "?" || char === "؟" || char === "…";
    if (char === ".") terminal = isSentencePeriod(normalized, index);

    if (!terminal) {
      index += 1;
      continue;
    }

    while (index + 1 < normalized.length && /[.!?؟…]/u.test(normalized[index + 1]!)) index += 1;
    while (index + 1 < normalized.length && /["'”’)]/u.test(normalized[index + 1]!)) index += 1;

    const next = normalized[index + 1] ?? "";
    if (next && !/\s/u.test(next)) {
      index += 1;
      continue;
    }

    const sentence = normalized.slice(start, index + 1).trim();
    if (sentence) sentences.push(sentence);
    while (index + 1 < normalized.length && /\s/u.test(normalized[index + 1]!)) index += 1;
    start = index + 1;
    index += 1;
  }

  const remainder = normalized.slice(start).trim();
  if (remainder) sentences.push(remainder);
  return sentences;
}

export function splitParagraphs(text: string): string[] {
  const normalized = text.replace(/\r\n?/g, "\n").trim();
  if (!normalized) return [];
  return normalized.split(/\n\s*\n+/u).map((paragraph) => paragraph.trim()).filter(Boolean);
}

export function topWords(text: string, includeStopWords = false, limit = 12): WordFrequency[] {
  const words = tokenizeWords(text).map(normalizeWord);
  const counts = new Map<string, number>();
  for (const word of words) {
    if (!includeStopWords && (word.length < 2 || STOP_WORDS.has(word))) continue;
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([word, count]) => ({ word, count, density: words.length ? round((count / words.length) * 100) : 0 }))
    .sort((left, right) => right.count - left.count || left.word.localeCompare(right.word))
    .slice(0, Math.max(1, limit));
}

export function topPhrases(text: string, includeStopWords = false, limit = 8): PhraseFrequency[] {
  const normalizedWords = tokenizeWords(text).map(normalizeWord);
  if (normalizedWords.length < 2) return [];

  const counts = new Map<string, number>();
  let eligiblePairs = 0;
  for (let index = 0; index < normalizedWords.length - 1; index += 1) {
    const first = normalizedWords[index]!;
    const second = normalizedWords[index + 1]!;
    if (!includeStopWords && (STOP_WORDS.has(first) || STOP_WORDS.has(second))) continue;
    eligiblePairs += 1;
    const phrase = `${first} ${second}`;
    counts.set(phrase, (counts.get(phrase) ?? 0) + 1);
  }
  const total = Math.max(1, eligiblePairs);
  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([phrase, count]) => ({ phrase, count, density: round((count / total) * 100) }))
    .sort((left, right) => right.count - left.count || left.phrase.localeCompare(right.phrase))
    .slice(0, Math.max(1, limit));
}

function analyzeSentences(sentences: string[]): SentenceAnalysis[] {
  return sentences.map((text, index) => {
    const words = tokenizeWords(text).length;
    const letters = Array.from(text).filter((char) => /\p{L}/u.test(char));
    const uppercaseLetters = letters.filter((char) => char === char.toLocaleUpperCase() && char !== char.toLocaleLowerCase()).length;
    const uppercaseRatio = letters.length ? uppercaseLetters / letters.length : 0;
    const flags: SentenceAnalysis["flags"] = [];
    if (words <= 2) flags.push("fragment");
    if (words > 25) flags.push("long");
    if (words > 40) flags.push("very-long");
    if (letters.length >= 8 && uppercaseRatio >= 0.8) flags.push("all-caps");
    return { index, text, words, characters: Array.from(text).length, flags };
  });
}

function analyzeParagraphs(paragraphs: string[]): ParagraphAnalysis[] {
  return paragraphs.map((text, index) => {
    const words = tokenizeWords(text).length;
    const sentences = splitSentences(text).length;
    const flags: ParagraphAnalysis["flags"] = [];
    if (words > 150) flags.push("long");
    if (words > 100 && sentences <= 2) flags.push("dense");
    if (words > 60 && sentences === 1) flags.push("single-sentence");
    return { index, text, words, sentences, flags };
  });
}

function sentenceBuckets(analyses: SentenceAnalysis[]): SentenceLengthBucket[] {
  const definitions: Array<Omit<SentenceLengthBucket, "count" | "percent">> = [
    { id: "short", label: "1–10 words", min: 1, max: 10 },
    { id: "standard", label: "11–20 words", min: 11, max: 20 },
    { id: "long", label: "21–30 words", min: 21, max: 30 },
    { id: "very-long", label: "31–40 words", min: 31, max: 40 },
    { id: "extreme", label: "41+ words", min: 41, max: null },
  ];
  return definitions.map((definition) => {
    const count = analyses.filter((sentence) => sentence.words >= definition.min && (definition.max === null || sentence.words <= definition.max)).length;
    return { ...definition, count, percent: analyses.length ? round((count / analyses.length) * 100) : 0 };
  });
}

function metricValue(metric: WordCounterMetric, values: Pick<WordStats, "words" | "characters" | "charactersNoSpaces">): number {
  if (metric === "characters") return values.characters;
  if (metric === "characters-no-spaces") return values.charactersNoSpaces;
  return values.words;
}

export function computeGoalProgress(goal: WordCounterGoal, current: number): GoalProgress {
  const min = Number.isFinite(goal.min) ? goal.min : undefined;
  const max = Number.isFinite(goal.max) ? goal.max : undefined;
  let status: GoalProgress["status"] = current === 0 ? "empty" : "within";
  let difference = 0;

  if (current > 0 && min !== undefined && current < min) {
    status = "below";
    difference = min - current;
  } else if (max !== undefined && current > max) {
    status = "above";
    difference = current - max;
  }

  const reference = max ?? min ?? Math.max(1, current);
  return {
    metric: goal.metric,
    current,
    min,
    max,
    status,
    difference,
    percent: clamp(reference > 0 ? round((current / reference) * 100) : 0, 0, 200),
  };
}

function buildChecks(
  text: string,
  stats: Omit<WordStats, "checks">,
  options: WordCounterOptions,
): WordCounterCheck[] {
  const checks: WordCounterCheck[] = [];
  if (!text.trim()) {
    return [{ id: "empty", level: "info", title: "Add text to begin", message: "Paste or type a draft to generate a writing audit." }];
  }

  if (options.goal.min !== undefined && options.goal.max !== undefined && options.goal.min > options.goal.max) {
    checks.push({ id: "goal-range", level: "danger", title: "Invalid custom target", message: "The minimum target is greater than the maximum. Update the custom range before using the goal status." });
  }

  if (stats.goal.status === "within") checks.push({ id: "goal", level: "success", title: "Goal is on target", message: `${stats.goal.current.toLocaleString()} ${options.goal.metric.replace(/-/g, " ")} fits the selected ${options.goal.label.toLowerCase()} target.` });
  if (stats.goal.status === "below") checks.push({ id: "goal", level: "warning", title: "Below the selected goal", message: `Add about ${stats.goal.difference.toLocaleString()} more ${options.goal.metric.replace(/-/g, " ")} to reach the minimum.` });
  if (stats.goal.status === "above") checks.push({ id: "goal", level: "danger", title: "Selected limit exceeded", message: `Trim about ${stats.goal.difference.toLocaleString()} ${options.goal.metric.replace(/-/g, " ")} to return to the selected maximum.` });

  const longestSentence = Math.max(0, ...stats.sentenceAnalysis.map((sentence) => sentence.words));
  const longSentences = stats.sentenceAnalysis.filter((sentence) => sentence.words > 25).length;
  if (longestSentence > 40) checks.push({ id: "sentence-length", level: "danger", title: "Very long sentence detected", message: `The longest sentence is ${longestSentence} words. Consider splitting it into two or more sentences.` });
  else if (longSentences > 0) checks.push({ id: "sentence-length", level: "warning", title: "Long sentences need review", message: `${longSentences} sentence${longSentences === 1 ? " is" : "s are"} longer than 25 words.` });
  else checks.push({ id: "sentence-length", level: "success", title: "Sentence length is controlled", message: "No sentence exceeds 25 words." });

  const longParagraphs = stats.paragraphAnalysis.filter((paragraph) => paragraph.words > 150).length;
  if (longParagraphs > 0) checks.push({ id: "paragraph-length", level: "warning", title: "Long paragraph detected", message: `${longParagraphs} paragraph${longParagraphs === 1 ? " is" : "s are"} longer than 150 words and may be difficult to scan.` });
  else checks.push({ id: "paragraph-length", level: "success", title: "Paragraphs are scannable", message: "No paragraph exceeds 150 words." });

  const leadingKeyword = stats.topWords[0];
  if (leadingKeyword && leadingKeyword.count >= 4 && leadingKeyword.density >= 4) {
    checks.push({ id: "keyword-density", level: leadingKeyword.density >= 7 ? "danger" : "warning", title: "High keyword repetition", message: `“${leadingKeyword.word}” appears ${leadingKeyword.count} times (${leadingKeyword.density.toFixed(1)}% of words). Review whether the repetition is natural.` });
  } else {
    checks.push({ id: "keyword-density", level: "success", title: "No obvious keyword stuffing", message: "The most frequent meaningful word stays below the repetition threshold." });
  }

  const repeatedPhrase = stats.topPhrases[0];
  if (repeatedPhrase && repeatedPhrase.count >= 3) checks.push({ id: "phrase-repeat", level: "warning", title: "Repeated phrase detected", message: `“${repeatedPhrase.phrase}” appears ${repeatedPhrase.count} times.` });

  const allCaps = stats.sentenceAnalysis.filter((sentence) => sentence.flags.includes("all-caps")).length;
  if (allCaps > 0) checks.push({ id: "all-caps", level: "warning", title: "All-caps sentence detected", message: `${allCaps} sentence${allCaps === 1 ? " uses" : "s use"} mostly uppercase letters.` });

  if (stats.words < 50) checks.push({ id: "sample-size", level: "info", title: "Small sample", message: "Frequency and style signals become more stable with at least 50 words." });
  if (stats.words > 100_000) checks.push({ id: "large-input", level: "warning", title: "Very large document", message: "For faster editing, consider auditing this document by section." });
  return checks;
}

export function computeWordStats(text: string, options: WordCounterOptions): WordStats {
  const words = tokenizeWords(text);
  const normalizedWords = words.map(normalizeWord);
  const sentencesText = splitSentences(text);
  const paragraphsText = splitParagraphs(text);
  const sentenceAnalysis = analyzeSentences(sentencesText);
  const paragraphAnalysis = analyzeParagraphs(paragraphsText);
  const characters = Array.from(text).length;
  const charactersNoSpaces = Array.from(text.replace(WHITESPACE_RE, "")).length;
  const uniqueWords = new Set(normalizedWords).size;
  const totalWordCharacters = words.reduce((sum, word) => sum + Array.from(word).length, 0);
  const longestWord = words.reduce((longest, word) => Array.from(word).length > Array.from(longest).length ? word : longest, "");
  const base = {
    words: words.length,
    characters,
    charactersNoSpaces,
    sentences: sentencesText.length,
    paragraphs: paragraphsText.length,
    lines: text ? text.replace(/\r\n?/g, "\n").split("\n").length : 0,
    uniqueWords,
    lexicalDiversity: words.length ? round((uniqueWords / words.length) * 100) : 0,
    longestWord,
    longestWordLength: Array.from(longestWord).length,
    averageWordLength: words.length ? round(totalWordCharacters / words.length) : 0,
    averageSentenceWords: sentencesText.length ? round(words.length / sentencesText.length) : 0,
    averageParagraphWords: paragraphsText.length ? round(words.length / paragraphsText.length) : 0,
    readingTimeSec: words.length ? Math.max(1, Math.round((words.length / Math.max(1, options.readingWpm)) * 60)) : 0,
    speakingTimeSec: words.length ? Math.max(1, Math.round((words.length / Math.max(1, options.speakingWpm)) * 60)) : 0,
    estimatedPages: words.length ? round(words.length / 250, 1) : 0,
    topWords: topWords(text, options.includeStopWords),
    topPhrases: topPhrases(text, options.includeStopWords),
    sentenceBuckets: sentenceBuckets(sentenceAnalysis),
    sentenceAnalysis,
    paragraphAnalysis,
    goal: computeGoalProgress(options.goal, metricValue(options.goal.metric, { words: words.length, characters, charactersNoSpaces })),
  };
  return { ...base, checks: buildChecks(text, base, options) };
}

export function formatDuration(seconds: number): string {
  if (seconds <= 0) return "0 sec";
  if (seconds < 60) return `${seconds} sec`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return remainder ? `${minutes} min ${remainder} sec` : `${minutes} min`;
}

function goalStatusLabel(goal: GoalProgress): string {
  if (goal.status === "within") return "Within target";
  if (goal.status === "below") return `Below target by ${goal.difference}`;
  if (goal.status === "above") return `Above target by ${goal.difference}`;
  return "No content";
}

export function buildMarkdownReport(stats: WordStats, goal: WordCounterGoal): string {
  const checks = stats.checks.map((check) => `- **${check.level.toUpperCase()} — ${check.title}:** ${check.message}`).join("\n");
  const keywords = stats.topWords.length ? stats.topWords.map((item) => `- ${item.word}: ${item.count} (${item.density.toFixed(1)}%)`).join("\n") : "- No keywords detected";
  return `# Word Counter Audit\n\n## Goal\n\n- Target: ${goal.label}\n- Metric: ${goal.metric}\n- Status: ${goalStatusLabel(stats.goal)}\n\n## Core statistics\n\n- Words: ${stats.words}\n- Characters: ${stats.characters}\n- Characters without whitespace: ${stats.charactersNoSpaces}\n- Sentences: ${stats.sentences}\n- Paragraphs: ${stats.paragraphs}\n- Lines: ${stats.lines}\n- Unique words: ${stats.uniqueWords}\n- Lexical diversity: ${stats.lexicalDiversity.toFixed(1)}%\n- Average sentence length: ${stats.averageSentenceWords.toFixed(1)} words\n- Reading time: ${formatDuration(stats.readingTimeSec)}\n- Speaking time: ${formatDuration(stats.speakingTimeSec)}\n\n## Top words\n\n${keywords}\n\n## Production checks\n\n${checks}\n`;
}

export function buildJsonReport(stats: WordStats, goal: WordCounterGoal): string {
  return JSON.stringify({ generatedAt: new Date().toISOString(), goal, stats }, null, 2);
}

export function buildKeywordCsv(stats: WordStats): string {
  return ["rank,word,count,density_percent", ...stats.topWords.map((item, index) => [index + 1, csvCell(item.word), item.count, item.density].join(","))].join("\n");
}

export function buildSentenceCsv(stats: WordStats): string {
  return [
    "sentence,words,characters,flags,text",
    ...stats.sentenceAnalysis.map((item) => [item.index + 1, item.words, item.characters, csvCell(item.flags.join("|")), csvCell(item.text)].join(",")),
  ].join("\n");
}
