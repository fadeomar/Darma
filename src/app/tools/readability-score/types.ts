export type ReadabilityLabel =
  | "Very Easy"
  | "Easy"
  | "Fairly Easy"
  | "Standard"
  | "Fairly Difficult"
  | "Difficult"
  | "Very Confusing";

export type ReadabilityConfidence = "low" | "medium" | "high";

export type ReadabilityTargetId =
  | "plain-language"
  | "general-web"
  | "middle-school"
  | "professional"
  | "academic";

export type ReadabilityTarget = {
  id: ReadabilityTargetId;
  label: string;
  description: string;
  maxGrade: number;
  minReadingEase: number;
  maxSentenceWords: number;
  maxComplexWordPercent: number;
};

export type SentenceIssue = "long" | "very-long" | "complex" | "possible-passive";

export type SentenceAnalysis = {
  id: string;
  index: number;
  text: string;
  wordCount: number;
  syllableCount: number;
  complexWordCount: number;
  complexWordPercent: number;
  possiblePassiveVoice: boolean;
  issues: SentenceIssue[];
};

export type ComplexWordAnalysis = {
  word: string;
  normalized: string;
  syllables: number;
  occurrences: number;
  sentenceIndexes: number[];
};

export type ReadabilityCheckLevel = "success" | "info" | "warning" | "danger";

export type ReadabilityCheck = {
  id: string;
  level: ReadabilityCheckLevel;
  title: string;
  message: string;
};

export type ReadabilityResult = {
  target: ReadabilityTarget;
  label: ReadabilityLabel;
  confidence: ReadabilityConfidence;
  fleschReadingEase: number;
  fleschKincaidGrade: number;
  gunningFog: number;
  smogIndex: number;
  colemanLiauIndex: number;
  consensusGrade: number;
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  characterCount: number;
  letterCount: number;
  syllableCount: number;
  complexWordCount: number;
  uniqueComplexWordCount: number;
  longSentenceCount: number;
  possiblePassiveSentenceCount: number;
  averageSyllablesPerWord: number;
  averageWordsPerSentence: number;
  complexWordPercent: number;
  estimatedReadingMinutes: number;
  sentences: SentenceAnalysis[];
  complexWords: ComplexWordAnalysis[];
  checks: ReadabilityCheck[];
  recommendations: string[];
};

export type ReadabilityPreset = {
  id: string;
  label: string;
  description: string;
  targetId: ReadabilityTargetId;
  text: string;
};
