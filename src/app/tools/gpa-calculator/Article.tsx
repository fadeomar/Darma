import { ChevronDown } from "lucide-react";

const SECTIONS = [
  {
    title: "What this GPA studio calculates",
    content: (
      <p>
        Add semester courses with letter grades and credit hours to calculate a credit-weighted term GPA. You can also enter your current cumulative GPA and completed credits to project the new cumulative result, then set a target GPA to see the semester average required to reach it.
      </p>
    ),
  },
  {
    title: "How semester and cumulative GPA work",
    content: (
      <p>
        Each included course contributes grade points multiplied by credit hours. The semester GPA is total semester quality points divided by semester credits. A projected cumulative GPA combines the quality points represented by your existing record with the quality points from the entered semester. A longer academic history therefore changes more slowly than a first-year record.
      </p>
    ),
  },
  {
    title: "Target GPA planning",
    content: (
      <p>
        The target planner solves for the semester GPA needed across the entered credit load. A required result above 4.00 means the target cannot be reached in one term under this scale, although it may remain reachable over additional semesters. The what-if table compares several semester averages and their effect on the projected cumulative GPA.
      </p>
    ),
  },
  {
    title: "Common 4.0 scale used",
    content: (
      <ul className="list-inside list-disc space-y-2">
        <li>A+ / A = 4.0 and A- = 3.7</li>
        <li>B+ = 3.3, B = 3.0, and B- = 2.7</li>
        <li>C+ = 2.3, C = 2.0, and C- = 1.7</li>
        <li>D+ = 1.3, D = 1.0, D- = 0.7, and F = 0.0</li>
      </ul>
    ),
  },
  {
    title: "Important institutional differences",
    content: (
      <p>
        Schools may handle repeated courses, transfer credits, pass/fail classes, withdrawals, rounding, A+ grades, and major GPA differently. Mark non-GPA courses as skipped and treat this result as a planning estimate rather than an official transcript calculation. All inputs and exports are produced locally in your browser.
      </p>
    ),
  },
  {
    title: "Start from a semester that resembles yours",
    content: (
      <p>
        The preset library covers balanced and STEM-heavy terms, scholarship and Dean&rsquo;s list
        targets, probation recovery, grade-replacement retakes, transfers with no prior grade points,
        part-time and summer loads, honors thesis terms, withdrawals, a failed course, a 21-credit
        overload, and a graduate program. Load the closest one, then replace the course names,
        grades, and credit hours with your own. Starting from a realistic shape makes it much easier
        to see whether a target average is actually reachable this term.
      </p>
    ),
  },
];

export default function GpaCalculatorArticle() {
  return (
    <div className="divide-y divide-[var(--color-border-subtle)] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)]">
      {SECTIONS.map((section, index) => (
        <details key={section.title} open={index === 0} className="group">
          <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left focus:outline-none focus-visible:shadow-[inset_0_0_0_3px_var(--color-primary-soft)] sm:px-6">
            <h2 className="text-lg font-black text-[var(--color-text-primary)] sm:text-xl">{section.title}</h2>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[var(--color-border-default)] bg-[var(--color-surface-subtle)] text-[var(--color-text-secondary)] transition group-open:rotate-180 group-open:border-[var(--color-primary-border)] group-open:text-[var(--color-primary-text-strong)]">
              <ChevronDown className="h-4 w-4" aria-hidden />
            </span>
          </summary>
          <div className="darma-readable-copy px-5 pb-6 sm:px-6">{section.content}</div>
        </details>
      ))}
    </div>
  );
}
