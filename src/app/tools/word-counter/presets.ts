import type { WordCounterGoal, WordCounterPreset } from "./types";

export const WORD_COUNTER_GOALS: WordCounterGoal[] = [
  {
    id: "assignment-500",
    label: "500-word assignment",
    description: "A short essay or written response with a practical tolerance range.",
    metric: "words",
    min: 450,
    max: 550,
  },
  {
    id: "blog-post",
    label: "Blog article",
    description: "A focused article target suitable for tutorials and explainers.",
    metric: "words",
    min: 900,
    max: 1400,
  },
  {
    id: "seo-title",
    label: "SEO title",
    description: "A concise page title measured by characters.",
    metric: "characters",
    min: 30,
    max: 60,
  },
  {
    id: "meta-description",
    label: "Meta description",
    description: "A search-result description with a conventional character range.",
    metric: "characters",
    min: 120,
    max: 160,
  },
  {
    id: "social-post",
    label: "Short social post",
    description: "A compact post that stays within 280 characters.",
    metric: "characters",
    max: 280,
  },
  {
    id: "speech-five-minutes",
    label: "Five-minute speech",
    description: "A speaking script based on roughly 130 words per minute.",
    metric: "words",
    min: 575,
    max: 700,
  },
  {
    id: "custom",
    label: "Custom target",
    description: "Set your own minimum, maximum, and measurement unit.",
    metric: "words",
    min: 0,
    max: 1000,
  },
];

export const WORD_COUNTER_PRESETS: WordCounterPreset[] = [
  {
    id: "student-essay",
    label: "Student essay",
    description: "A short academic response with varied sentence lengths.",
    goalId: "assignment-500",
    text: `Digital tools have changed how students find information, organize ideas, and submit their work. A search that once required several books can now begin in seconds. This speed is useful, but it also creates a new responsibility: students must judge whether a source is accurate, current, and relevant.

Good research therefore depends on more than access. A student should compare sources, identify the author, check the publication date, and look for evidence that supports each claim. Notes should clearly separate direct quotations from personal summaries. These habits reduce accidental plagiarism and make the final argument easier to defend.

Technology is most valuable when it strengthens careful thinking rather than replacing it. The best digital workflow combines fast discovery with slow verification. Students who learn that balance can work efficiently while still producing reliable and original writing.`,
  },
  {
    id: "seo-description",
    label: "SEO description",
    description: "A meta description near the recommended character range.",
    goalId: "meta-description",
    text: "Analyze words, characters, sentence length, keyword density, and writing goals locally with Darma's private Word Counter Studio.",
  },
  {
    id: "product-update",
    label: "Product update",
    description: "Scannable release copy with a repeated product keyword.",
    goalId: "social-post",
    text: `Darma now makes project exports faster. The new export flow groups reports, source files, and CSV data into one ZIP pack. Darma also remembers your last workspace view, so returning to a long review takes fewer clicks.`,
  },
  {
    id: "speech-script",
    label: "Speech opening",
    description: "A spoken introduction for estimating delivery time.",
    goalId: "speech-five-minutes",
    text: `Good morning, and thank you for being here. Today I want to talk about a simple idea: progress becomes easier when a large goal is turned into a small action that can be repeated. We often wait for perfect conditions, more confidence, or a complete plan. In practice, momentum usually begins before any of those things arrive. It begins when we choose one useful step and complete it consistently.`,
  },
  {
    id: "keyword-heavy",
    label: "Keyword-heavy draft",
    description: "A deliberately repetitive sample that exposes density warnings.",
    goalId: "blog-post",
    text: `Project management software helps teams manage projects. Good project management software makes project planning easier, and project management software can improve project communication. When choosing project management software, compare the project management features, project management reports, and project management integrations carefully.`,
  },
  {
    id: "arabic-sample",
    label: "Arabic sample",
    description: "A multilingual counting example with Arabic punctuation.",
    goalId: "assignment-500",
    text: `تساعد الأدوات الرقمية الكتّاب على مراجعة النص بسرعة، لكنها لا تغني عن القراءة المتأنية. يمكن لعداد الكلمات أن يوضح طول المقال، وعدد الجمل، وزمن القراءة المتوقع. هل النص واضح ومباشر؟ وهل تتكرر بعض الكلمات أكثر من اللازم؟

عندما تظهر هذه المؤشرات أمام الكاتب يصبح التحرير أكثر دقة. الهدف ليس تقليل الكلمات دائمًا، بل استخدام العدد المناسب منها لشرح الفكرة دون حشو أو غموض.`,
  },
];

export function getWordCounterGoal(id: string): WordCounterGoal {
  return WORD_COUNTER_GOALS.find((goal) => goal.id === id) ?? WORD_COUNTER_GOALS[0]!;
}
