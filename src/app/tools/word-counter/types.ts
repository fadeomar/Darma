export type WordCounterCheckLevel = "success" | "info" | "warning" | "danger";

export type WordCounterMetric = "words" | "characters" | "characters-no-spaces";

export type WordCounterGoal = {
  id: string;
  label: string;
  description: string;
  metric: WordCounterMetric;
  min?: number;
  max?: number;
};

export type WordCounterPreset = {
  id: string;
  label: string;
  description: string;
  goalId: string;
  text: string;
};

export type WordFrequency = {
  word: string;
  count: number;
  density: number;
};

export type PhraseFrequency = {
  phrase: string;
  count: number;
  density: number;
};

export type SentenceLengthBucket = {
  id: "short" | "standard" | "long" | "very-long" | "extreme";
  label: string;
  min: number;
  max: number | null;
  count: number;
  percent: number;
};

export type SentenceAnalysis = {
  index: number;
  text: string;
  words: number;
  characters: number;
  flags: Array<"long" | "very-long" | "fragment" | "all-caps">;
};

export type ParagraphAnalysis = {
  index: number;
  text: string;
  words: number;
  sentences: number;
  flags: Array<"long" | "dense" | "single-sentence">;
};

export type WordCounterCheck = {
  id: string;
  level: WordCounterCheckLevel;
  title: string;
  message: string;
};

export type GoalProgress = {
  metric: WordCounterMetric;
  current: number;
  min?: number;
  max?: number;
  status: "empty" | "below" | "within" | "above";
  difference: number;
  percent: number;
};

export type WordStats = {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  sentences: number;
  paragraphs: number;
  lines: number;
  uniqueWords: number;
  lexicalDiversity: number;
  longestWord: string;
  longestWordLength: number;
  averageWordLength: number;
  averageSentenceWords: number;
  averageParagraphWords: number;
  readingTimeSec: number;
  speakingTimeSec: number;
  estimatedPages: number;
  topWords: WordFrequency[];
  topPhrases: PhraseFrequency[];
  sentenceBuckets: SentenceLengthBucket[];
  sentenceAnalysis: SentenceAnalysis[];
  paragraphAnalysis: ParagraphAnalysis[];
  goal: GoalProgress;
  checks: WordCounterCheck[];
};

export type WordCounterOptions = {
  readingWpm: number;
  speakingWpm: number;
  includeStopWords: boolean;
  goal: WordCounterGoal;
};
