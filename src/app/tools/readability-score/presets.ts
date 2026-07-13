import type { ReadabilityPreset, ReadabilityTarget } from "./types";

export const READABILITY_TARGETS: ReadabilityTarget[] = [
  {
    id: "plain-language",
    label: "Plain language",
    description: "Public instructions, forms, and essential service information.",
    maxGrade: 6,
    minReadingEase: 70,
    maxSentenceWords: 16,
    maxComplexWordPercent: 8,
  },
  {
    id: "general-web",
    label: "General web",
    description: "Articles, landing pages, support content, and broad audiences.",
    maxGrade: 8,
    minReadingEase: 60,
    maxSentenceWords: 20,
    maxComplexWordPercent: 12,
  },
  {
    id: "middle-school",
    label: "Middle school",
    description: "Learning material intended for readers around grades 7–9.",
    maxGrade: 9,
    minReadingEase: 55,
    maxSentenceWords: 22,
    maxComplexWordPercent: 14,
  },
  {
    id: "professional",
    label: "Professional",
    description: "Business reports, policies, and technical communication.",
    maxGrade: 11,
    minReadingEase: 45,
    maxSentenceWords: 25,
    maxComplexWordPercent: 18,
  },
  {
    id: "academic",
    label: "Academic",
    description: "Research summaries and specialist writing where complexity is expected.",
    maxGrade: 14,
    minReadingEase: 30,
    maxSentenceWords: 30,
    maxComplexWordPercent: 24,
  },
];

export const READABILITY_PRESETS: ReadabilityPreset[] = [
  {
    id: "support-article",
    label: "Support article",
    description: "Clear troubleshooting steps for a broad web audience.",
    targetId: "general-web",
    text: `If the app will not open, restart your device first. Open the app again and check whether the problem remains. If it does, confirm that your internet connection is working. You can test the connection by opening another website. Next, install any available app update. Updates often fix known crashes and loading problems. If the issue continues, contact support and include the error message you saw.`,
  },
  {
    id: "public-notice",
    label: "Public notice",
    description: "Short plain-language instructions for an essential service.",
    targetId: "plain-language",
    text: `The water supply will stop on Tuesday from 9:00 a.m. to 1:00 p.m. Store enough water before the work begins. Keep taps closed during the outage. When service returns, let the cold water run for two minutes. Call the service desk if the water stays cloudy for more than one hour.`,
  },
  {
    id: "product-documentation",
    label: "Product documentation",
    description: "A technical explanation with a few sentences worth reviewing.",
    targetId: "professional",
    text: `The synchronization service stores pending changes in a local queue before it contacts the remote API. When connectivity returns, the worker processes each queued operation in chronological order and records the server response. Administrators can configure the retry interval, but an excessively aggressive interval may increase request volume and trigger upstream rate limits. Failed operations remain visible in the activity log so that an operator can inspect the payload and retry the request manually.`,
  },
  {
    id: "academic-abstract",
    label: "Academic abstract",
    description: "Dense research prose intended for a specialist audience.",
    targetId: "academic",
    text: `This study evaluates the relationship between retrieval practice and delayed recall in undergraduate learners. Participants completed three instructional conditions and returned after seven days for an unannounced assessment. The retrieval group demonstrated a statistically meaningful improvement in long-term retention, although the observed effect varied across prior-knowledge levels. These findings support the integration of low-stakes retrieval opportunities within introductory courses while highlighting the importance of differentiated instructional design.`,
  },
  {
    id: "dense-policy",
    label: "Dense policy draft",
    description: "A deliberately difficult paragraph that exposes review flags.",
    targetId: "general-web",
    text: `Notwithstanding any previously communicated implementation schedule, organizational representatives who anticipate requiring supplementary authorization documentation must, before initiating the applicable reimbursement procedure, coordinate with the designated administrative facilitator so that all prerequisite verification materials can be comprehensively evaluated and subsequently transmitted to the appropriate departmental authority. Requests that are submitted without the aforementioned documentation may be delayed, returned, or otherwise excluded from the current processing cycle.`,
  },
  {
    id: "release-notes",
    label: "Release notes",
    description: "Scannable product changes written for customers.",
    targetId: "general-web",
    text: `This release makes search faster and easier to understand. Results now show why an item matched your query. We also fixed a bug that could hide recently edited documents. Team owners can now export an activity report as a CSV file. No action is required after the update.`,
  },
];

export function getReadabilityTarget(id: ReadabilityTarget["id"]): ReadabilityTarget {
  return READABILITY_TARGETS.find((target) => target.id === id) ?? READABILITY_TARGETS[1]!;
}
