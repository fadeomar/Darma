import type { Course, GpaContext, GpaPreset } from "./types";

export const DEFAULT_GPA_CONTEXT: GpaContext = {
  completedGpa: 3.2,
  completedCredits: 60,
  targetGpa: 3.3,
};

export const DEFAULT_GPA_COURSES: Course[] = [
  { id: "default-calculus", name: "Calculus II", grade: "B+", credits: 4, included: true },
  { id: "default-programming", name: "Data Structures", grade: "A-", credits: 3, included: true },
  { id: "default-writing", name: "Academic Writing", grade: "A", credits: 3, included: true },
  { id: "default-lab", name: "Physics Lab", grade: "B", credits: 1, included: true },
];

function courses(prefix: string, rows: Array<[string, Course["grade"], number, boolean?]>): Course[] {
  return rows.map(([name, grade, credits, included = true], index) => ({
    id: `${prefix}-${index + 1}`,
    name,
    grade,
    credits,
    included,
  }));
}

export const GPA_PRESETS: GpaPreset[] = [
  {
    id: "balanced-semester",
    name: "Balanced semester",
    description: "A typical 14-credit term with mixed A and B grades.",
    context: { completedGpa: 3.2, completedCredits: 60, targetGpa: 3.3 },
    courses: courses("balanced", [
      ["Calculus II", "B+", 4],
      ["Data Structures", "A-", 3],
      ["Academic Writing", "A", 3],
      ["Physics", "B", 3],
      ["Physics Lab", "A", 1],
    ]),
  },
  {
    id: "scholarship-push",
    name: "Scholarship push",
    description: "Plan a high-performing term toward a 3.50 cumulative target.",
    context: { completedGpa: 3.43, completedCredits: 72, targetGpa: 3.5 },
    courses: courses("scholarship", [
      ["Algorithms", "A", 3],
      ["Database Systems", "A-", 3],
      ["Operating Systems", "A", 4],
      ["Technical Elective", "A", 3],
      ["Seminar", "A-", 1],
    ]),
  },
  {
    id: "recovery-plan",
    name: "Recovery plan",
    description: "See how a stronger semester can improve a lower cumulative GPA.",
    context: { completedGpa: 2.18, completedCredits: 45, targetGpa: 2.35 },
    courses: courses("recovery", [
      ["Statistics", "B+", 3],
      ["Research Methods", "A-", 3],
      ["Major Core", "B", 4],
      ["Communication", "A", 3],
      ["Elective", "B+", 3],
    ]),
  },
  {
    id: "first-semester",
    name: "First semester",
    description: "Calculate a new student's GPA without prior credits.",
    context: { completedGpa: 0, completedCredits: 0, targetGpa: 3 },
    courses: courses("first", [
      ["Introduction to Computing", "A-", 3],
      ["College Mathematics", "B+", 3],
      ["English Composition", "A", 3],
      ["University Skills", "A", 2],
      ["General Science", "B", 3],
    ]),
  },
  {
    id: "stem-heavy",
    name: "STEM-heavy load",
    description: "A 17-credit technical semester with differently weighted courses.",
    context: { completedGpa: 3.05, completedCredits: 48, targetGpa: 3.1 },
    courses: courses("stem", [
      ["Discrete Mathematics", "B+", 4],
      ["Computer Architecture", "B", 4],
      ["Software Engineering", "A-", 3],
      ["Probability", "B+", 3],
      ["Architecture Lab", "A", 1],
      ["Professional Ethics", "A", 2],
    ]),
  },
  {
    id: "pass-fail-mix",
    name: "Pass/fail mix",
    description: "Demonstrates courses intentionally excluded from GPA calculation.",
    context: { completedGpa: 3.1, completedCredits: 84, targetGpa: 3.15 },
    courses: courses("pass-fail", [
      ["Capstone I", "A-", 4],
      ["Advanced Elective", "B+", 3],
      ["Internship (Pass)", "A", 3, false],
      ["Community Service", "A", 1, false],
      ["Major Elective", "A", 3],
    ]),
  },
];
