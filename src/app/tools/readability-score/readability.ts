import type {
  ComplexWordAnalysis,
  ReadabilityCheck,
  ReadabilityConfidence,
  ReadabilityLabel,
  ReadabilityResult,
  ReadabilityTarget,
  SentenceAnalysis,
  SentenceIssue,
} from "./types";

const WORD_PATTERN = /[A-Za-z]+(?:['’][A-Za-z]+)*/g;
const ABBREVIATIONS = /\b(?:Mr|Mrs|Ms|Dr|Prof|Sr|Jr|St|vs|etc|e\.g|i\.e|a\.m|p\.m|U\.S|U\.K)\./gi;
const PERIOD_TOKEN = "\uE000";

const SYLLABLE_EXCEPTIONS: Record<string, number> = {
  business: 2,
  camera: 3,
  chocolate: 3,
  comfortable: 4,
  different: 3,
  every: 2,
  family: 3,
  favourite: 3,
  favorite: 3,
  interesting: 4,
  queue: 1,
  restaurant: 3,
  separate: 3,
  several: 3,
  temperature: 4,
  vegetable: 4,
  wednesday: 2,
};

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function protectPeriods(text: string): string {
  return text
    .replace(/(?<=\d)\.(?=\d)/g, PERIOD_TOKEN)
    .replace(ABBREVIATIONS, (match) => match.replaceAll(".", PERIOD_TOKEN));
}

function restorePeriods(text: string): string {
  return text.replaceAll(PERIOD_TOKEN, ".");
}

export function splitSentences(text: string): string[] {
  if (typeof text !== "string" || !text.trim()) return [];

  const paragraphs = text
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n+/)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  return paragraphs.flatMap((paragraph) => {
    const protectedParagraph = protectPeriods(paragraph);
    const chunks = protectedParagraph.match(/[^.!?]+(?:[.!?]+(?=\s|$)|$)/g) ?? [];
    return chunks.map((chunk) => restorePeriods(chunk).trim()).filter(Boolean);
  });
}

export function extractWords(text: string): string[] {
  return Array.from(text.match(WORD_PATTERN) ?? []);
}

export function countSyllables(word: string): number {
  const cleaned = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!cleaned) return 0;
  if (SYLLABLE_EXCEPTIONS[cleaned] !== undefined) return SYLLABLE_EXCEPTIONS[cleaned]!;
  if (cleaned.length <= 3) return 1;

  let count = cleaned.match(/[aeiouy]+/g)?.length ?? 0;

  const consonantLe = /[^aeiouy]le$/.test(cleaned);
  if (/e$/.test(cleaned) && !consonantLe) count -= 1;

  if (/[^aeiouy]ed$/.test(cleaned) && !/(?:ted|ded)$/.test(cleaned)) count -= 1;
  if (/[^aeiouy]es$/.test(cleaned) && !/(?:ches|shes|ses|xes|zes|ges|ces)$/.test(cleaned)) count -= 1;

  if (/(?:io|eo|ia|ua)$/.test(cleaned) && !/(?:tion|sion|cion|gion)$/.test(cleaned)) count += 1;

  return Math.max(1, count);
}

function readingLabel(score: number): ReadabilityLabel {
  if (score >= 90) return "Very Easy";
  if (score >= 80) return "Easy";
  if (score >= 70) return "Fairly Easy";
  if (score >= 60) return "Standard";
  if (score >= 50) return "Fairly Difficult";
  if (score >= 30) return "Difficult";
  return "Very Confusing";
}

function confidenceFor(wordCount: number, sentenceCount: number): ReadabilityConfidence {
  if (wordCount >= 100 && sentenceCount >= 5) return "high";
  if (wordCount >= 50 && sentenceCount >= 3) return "medium";
  return "low";
}

function hasPossiblePassiveVoice(sentence: string): boolean {
  return /\b(?:am|is|are|was|were|be|been|being|gets?|got)\s+(?:(?:\w+ly|not)\s+){0,2}[A-Za-z]+(?:ed|en|wn|lt|nt)\b/i.test(sentence);
}

function isLikelyProperNoun(word: string, wordIndex: number): boolean {
  return wordIndex > 0 && /^[A-Z][a-z]/.test(word);
}

function analyzeSentence(sentence: string, index: number, target: ReadabilityTarget): SentenceAnalysis {
  const words = extractWords(sentence);
  const syllables = words.map(countSyllables);
  const complexWordCount = words.reduce((total, word, wordIndex) => {
    const complex = (syllables[wordIndex] ?? 0) >= 3 && !isLikelyProperNoun(word, wordIndex);
    return total + (complex ? 1 : 0);
  }, 0);
  const wordCount = words.length;
  const complexWordPercent = wordCount > 0 ? (complexWordCount / wordCount) * 100 : 0;
  const possiblePassiveVoice = hasPossiblePassiveVoice(sentence);
  const issues: SentenceIssue[] = [];

  if (wordCount > target.maxSentenceWords * 1.5) issues.push("very-long");
  else if (wordCount > target.maxSentenceWords) issues.push("long");
  if (wordCount >= 6 && complexWordPercent > target.maxComplexWordPercent) issues.push("complex");
  if (possiblePassiveVoice) issues.push("possible-passive");

  return {
    id: `sentence-${index + 1}`,
    index,
    text: sentence,
    wordCount,
    syllableCount: syllables.reduce((sum, value) => sum + value, 0),
    complexWordCount,
    complexWordPercent: round2(complexWordPercent),
    possiblePassiveVoice,
    issues,
  };
}

function collectComplexWords(sentences: string[]): ComplexWordAnalysis[] {
  const map = new Map<string, ComplexWordAnalysis>();

  sentences.forEach((sentence, sentenceIndex) => {
    const words = extractWords(sentence);
    words.forEach((word, wordIndex) => {
      const syllables = countSyllables(word);
      if (syllables < 3 || isLikelyProperNoun(word, wordIndex)) return;
      const normalized = word.toLowerCase();
      const current = map.get(normalized);
      if (current) {
        current.occurrences += 1;
        if (!current.sentenceIndexes.includes(sentenceIndex)) current.sentenceIndexes.push(sentenceIndex);
        return;
      }
      map.set(normalized, {
        word,
        normalized,
        syllables,
        occurrences: 1,
        sentenceIndexes: [sentenceIndex],
      });
    });
  });

  return Array.from(map.values()).sort((a, b) => b.occurrences - a.occurrences || b.syllables - a.syllables || a.normalized.localeCompare(b.normalized));
}

function buildChecks(params: {
  target: ReadabilityTarget;
  confidence: ReadabilityConfidence;
  consensusGrade: number;
  fleschReadingEase: number;
  sentences: SentenceAnalysis[];
  complexWordPercent: number;
  paragraphWordCounts: number[];
}): ReadabilityCheck[] {
  const { target, confidence, consensusGrade, fleschReadingEase, sentences, complexWordPercent, paragraphWordCounts } = params;
  const longSentences = sentences.filter((sentence) => sentence.issues.includes("long") || sentence.issues.includes("very-long"));
  const veryLongSentences = sentences.filter((sentence) => sentence.issues.includes("very-long"));
  const passiveSentences = sentences.filter((sentence) => sentence.possiblePassiveVoice);
  const oversizedParagraphs = paragraphWordCounts.filter((count) => count > 120);
  const checks: ReadabilityCheck[] = [];

  checks.push(confidence === "high"
    ? { id: "sample-size", level: "success", title: "Strong sample size", message: "The text is long enough for a more stable readability estimate." }
    : confidence === "medium"
      ? { id: "sample-size", level: "info", title: "Moderate sample size", message: "The score is useful, but a longer sample would make comparisons more stable." }
      : { id: "sample-size", level: "warning", title: "Short sample", message: "Treat the scores as directional until the text contains about 100 words and five sentences." });

  const gradeGap = consensusGrade - target.maxGrade;
  checks.push(gradeGap <= 0
    ? { id: "target-grade", level: "success", title: "Grade target met", message: `The consensus grade ${consensusGrade.toFixed(1)} is within the ${target.label.toLowerCase()} target of grade ${target.maxGrade} or below.` }
    : { id: "target-grade", level: gradeGap > 3 ? "danger" : "warning", title: "Grade target exceeded", message: `The consensus grade is ${gradeGap.toFixed(1)} level${gradeGap >= 1.5 ? "s" : ""} above the selected target.` });

  checks.push(fleschReadingEase >= target.minReadingEase
    ? { id: "reading-ease", level: "success", title: "Reading ease on target", message: `The reading-ease score meets the target minimum of ${target.minReadingEase}.` }
    : { id: "reading-ease", level: fleschReadingEase < target.minReadingEase - 20 ? "danger" : "warning", title: "Reading ease below target", message: `The score is ${round2(target.minReadingEase - fleschReadingEase)} points below the selected target.` });

  checks.push(longSentences.length === 0
    ? { id: "sentence-length", level: "success", title: "Sentence length controlled", message: `No sentence exceeds the ${target.maxSentenceWords}-word target.` }
    : { id: "sentence-length", level: veryLongSentences.length > 0 ? "danger" : "warning", title: "Long sentences detected", message: `${longSentences.length} sentence${longSentences.length === 1 ? "" : "s"} exceed the target; ${veryLongSentences.length} exceed 150% of it.` });

  checks.push(complexWordPercent <= target.maxComplexWordPercent
    ? { id: "complex-words", level: "success", title: "Word complexity on target", message: `Complex words account for ${complexWordPercent.toFixed(1)}% of the text.` }
    : { id: "complex-words", level: complexWordPercent > target.maxComplexWordPercent * 1.5 ? "danger" : "warning", title: "High complex-word density", message: `${complexWordPercent.toFixed(1)}% of words have three or more syllables, above the ${target.maxComplexWordPercent}% target.` });

  checks.push(passiveSentences.length === 0
    ? { id: "passive-voice", level: "success", title: "No obvious passive constructions", message: "The heuristic did not flag any likely passive-voice sentence." }
    : { id: "passive-voice", level: passiveSentences.length / Math.max(1, sentences.length) > 0.25 ? "warning" : "info", title: "Possible passive voice", message: `${passiveSentences.length} sentence${passiveSentences.length === 1 ? "" : "s"} may use passive voice. Review manually because this is a heuristic.` });

  checks.push(oversizedParagraphs.length === 0
    ? { id: "paragraph-length", level: "success", title: "Paragraphs are scannable", message: "No paragraph exceeds 120 words." }
    : { id: "paragraph-length", level: "warning", title: "Dense paragraphs", message: `${oversizedParagraphs.length} paragraph${oversizedParagraphs.length === 1 ? "" : "s"} exceed 120 words and may be difficult to scan.` });

  return checks;
}

function buildRecommendations(result: Omit<ReadabilityResult, "recommendations">): string[] {
  const recommendations: string[] = [];
  const target = result.target;

  if (result.consensusGrade > target.maxGrade) {
    recommendations.push(`Reduce the consensus grade from ${result.consensusGrade.toFixed(1)} toward ${target.maxGrade} by shortening sentences and simplifying only the terms your audience does not need.`);
  }
  if (result.longSentenceCount > 0) {
    recommendations.push(`Review the ${result.longSentenceCount} flagged sentence${result.longSentenceCount === 1 ? "" : "s"}; split each around one main idea or action.`);
  }
  if (result.complexWordPercent > target.maxComplexWordPercent) {
    recommendations.push(`Review repeated complex words first. Replace them only when a shorter term keeps the same meaning and precision.`);
  }
  if (result.possiblePassiveSentenceCount > 0) {
    recommendations.push(`Check the ${result.possiblePassiveSentenceCount} possible passive construction${result.possiblePassiveSentenceCount === 1 ? "" : "s"} and name the actor when that improves clarity.`);
  }
  if (result.confidence !== "high") {
    recommendations.push("Analyze at least 100 words and five sentences before treating small score changes as meaningful.");
  }
  if (recommendations.length === 0) {
    recommendations.push(`The draft meets the selected ${target.label.toLowerCase()} targets. Preserve the current sentence length and terminology during editing.`);
  }

  return recommendations.slice(0, 5);
}

export function computeReadability(text: string, target: ReadabilityTarget): ReadabilityResult | null {
  if (typeof text !== "string" || !text.trim()) return null;

  const sentencesText = splitSentences(text);
  const words = extractWords(text);
  if (sentencesText.length === 0 || words.length < 3) return null;

  const sentences = sentencesText.map((sentence, index) => analyzeSentence(sentence, index, target));
  const paragraphTexts = text.replace(/\r\n?/g, "\n").split(/\n\s*\n+/).map((item) => item.trim()).filter(Boolean);
  const paragraphWordCounts = paragraphTexts.map((paragraph) => extractWords(paragraph).length);
  const syllableCount = words.reduce((sum, word) => sum + countSyllables(word), 0);
  const letterCount = Array.from(text.match(/[A-Za-z]/g) ?? []).length;
  const complexWords = collectComplexWords(sentencesText);
  const complexWordCount = complexWords.reduce((sum, item) => sum + item.occurrences, 0);
  const averageWordsPerSentence = words.length / sentences.length;
  const averageSyllablesPerWord = syllableCount / words.length;
  const complexWordPercent = (complexWordCount / words.length) * 100;
  const fleschReadingEaseRaw = 206.835 - (1.015 * averageWordsPerSentence) - (84.6 * averageSyllablesPerWord);
  const fleschKincaidGradeRaw = (0.39 * averageWordsPerSentence) + (11.8 * averageSyllablesPerWord) - 15.59;
  const gunningFogRaw = 0.4 * (averageWordsPerSentence + complexWordPercent);
  const smogRaw = 1.043 * Math.sqrt(complexWordCount * (30 / sentences.length)) + 3.1291;
  const lettersPerHundredWords = (letterCount / words.length) * 100;
  const sentencesPerHundredWords = (sentences.length / words.length) * 100;
  const colemanLiauRaw = (0.0588 * lettersPerHundredWords) - (0.296 * sentencesPerHundredWords) - 15.8;

  const fleschReadingEase = round2(clamp(fleschReadingEaseRaw, 0, 100));
  const fleschKincaidGrade = round2(clamp(fleschKincaidGradeRaw, 0, 20));
  const gunningFog = round2(clamp(gunningFogRaw, 0, 20));
  const smogIndex = round2(clamp(smogRaw, 0, 20));
  const colemanLiauIndex = round2(clamp(colemanLiauRaw, 0, 20));
  const consensusGrade = round2((fleschKincaidGrade + gunningFog + smogIndex + colemanLiauIndex) / 4);
  const confidence = confidenceFor(words.length, sentences.length);
  const longSentenceCount = sentences.filter((sentence) => sentence.issues.includes("long") || sentence.issues.includes("very-long")).length;
  const possiblePassiveSentenceCount = sentences.filter((sentence) => sentence.possiblePassiveVoice).length;
  const checks = buildChecks({ target, confidence, consensusGrade, fleschReadingEase, sentences, complexWordPercent, paragraphWordCounts });

  const resultWithoutRecommendations: Omit<ReadabilityResult, "recommendations"> = {
    target,
    label: readingLabel(fleschReadingEase),
    confidence,
    fleschReadingEase,
    fleschKincaidGrade,
    gunningFog,
    smogIndex,
    colemanLiauIndex,
    consensusGrade,
    wordCount: words.length,
    sentenceCount: sentences.length,
    paragraphCount: Math.max(1, paragraphTexts.length),
    characterCount: text.length,
    letterCount,
    syllableCount,
    complexWordCount,
    uniqueComplexWordCount: complexWords.length,
    longSentenceCount,
    possiblePassiveSentenceCount,
    averageSyllablesPerWord: round2(averageSyllablesPerWord),
    averageWordsPerSentence: round2(averageWordsPerSentence),
    complexWordPercent: round2(complexWordPercent),
    estimatedReadingMinutes: round2(words.length / 200),
    sentences,
    complexWords,
    checks,
  };

  return {
    ...resultWithoutRecommendations,
    recommendations: buildRecommendations(resultWithoutRecommendations),
  };
}

function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function buildSentenceCsv(result: ReadabilityResult): string {
  const rows = [
    ["sentence", "words", "complex_words", "complex_percent", "possible_passive", "issues", "text"],
    ...result.sentences.map((sentence) => [
      sentence.index + 1,
      sentence.wordCount,
      sentence.complexWordCount,
      sentence.complexWordPercent,
      sentence.possiblePassiveVoice ? "yes" : "no",
      sentence.issues.join(" | "),
      sentence.text,
    ]),
  ];
  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

export function buildMarkdownReport(result: ReadabilityResult): string {
  const reviewChecks = result.checks.filter((check) => check.level === "warning" || check.level === "danger");
  return [
    "# Readability audit",
    "",
    `- Target: ${result.target.label}`,
    `- Consensus grade: ${result.consensusGrade.toFixed(1)}`,
    `- Flesch Reading Ease: ${result.fleschReadingEase.toFixed(1)} (${result.label})`,
    `- Confidence: ${result.confidence}`,
    `- Words / sentences / paragraphs: ${result.wordCount} / ${result.sentenceCount} / ${result.paragraphCount}`,
    `- Average words per sentence: ${result.averageWordsPerSentence.toFixed(1)}`,
    `- Complex words: ${result.complexWordCount} (${result.complexWordPercent.toFixed(1)}%)`,
    "",
    "## Score breakdown",
    "",
    `- Flesch-Kincaid Grade: ${result.fleschKincaidGrade.toFixed(1)}`,
    `- Gunning Fog: ${result.gunningFog.toFixed(1)}`,
    `- SMOG: ${result.smogIndex.toFixed(1)}`,
    `- Coleman-Liau: ${result.colemanLiauIndex.toFixed(1)}`,
    "",
    "## Recommendations",
    "",
    ...result.recommendations.map((recommendation) => `- ${recommendation}`),
    "",
    "## Checks requiring review",
    "",
    ...(reviewChecks.length > 0 ? reviewChecks.map((check) => `- **${check.title}:** ${check.message}`) : ["- No warning or danger checks."]),
    "",
    "## Flagged sentences",
    "",
    ...result.sentences
      .filter((sentence) => sentence.issues.length > 0)
      .map((sentence) => `- Sentence ${sentence.index + 1} (${sentence.issues.join(", ")}): ${sentence.text}`),
    "",
    "> Readability formulas are estimates. Review accuracy, tone, terminology, and accessibility with the intended audience.",
  ].join("\n");
}

export function buildReadabilityJson(result: ReadabilityResult, sourceText: string): string {
  return JSON.stringify({
    generatedAt: new Date().toISOString(),
    sourceText,
    target: result.target,
    summary: {
      label: result.label,
      confidence: result.confidence,
      consensusGrade: result.consensusGrade,
      readingEase: result.fleschReadingEase,
      wordCount: result.wordCount,
      sentenceCount: result.sentenceCount,
      paragraphCount: result.paragraphCount,
      estimatedReadingMinutes: result.estimatedReadingMinutes,
    },
    scores: {
      fleschReadingEase: result.fleschReadingEase,
      fleschKincaidGrade: result.fleschKincaidGrade,
      gunningFog: result.gunningFog,
      smog: result.smogIndex,
      colemanLiau: result.colemanLiauIndex,
    },
    diagnostics: {
      averageWordsPerSentence: result.averageWordsPerSentence,
      averageSyllablesPerWord: result.averageSyllablesPerWord,
      complexWordCount: result.complexWordCount,
      complexWordPercent: result.complexWordPercent,
      longSentenceCount: result.longSentenceCount,
      possiblePassiveSentenceCount: result.possiblePassiveSentenceCount,
    },
    checks: result.checks,
    recommendations: result.recommendations,
    sentences: result.sentences,
    complexWords: result.complexWords,
  }, null, 2);
}
