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
  {
    id: "dean-list-target",
    name: "Dean's list target",
    description: "Check what this term needs to reach a 3.70 cumulative average.",
    context: { completedGpa: 3.58, completedCredits: 90, targetGpa: 3.7 },
    courses: courses("dean", [
      ["Machine Learning", "A", 3],
      ["Distributed Systems", "A-", 3],
      ["Compilers", "A", 4],
      ["Technical Writing", "A", 2],
      ["Research Seminar", "A-", 2],
    ]),
  },
  {
    id: "probation-exit",
    name: "Academic probation exit",
    description: "A lighter load aimed at clearing a 2.00 minimum requirement.",
    context: { completedGpa: 1.74, completedCredits: 30, targetGpa: 2 },
    courses: courses("probation", [
      ["Study Skills", "A", 2],
      ["College Algebra (retake)", "B+", 3],
      ["Introduction to Sociology", "A-", 3],
      ["Composition II", "B+", 3],
    ]),
  },
  {
    id: "retake-improvement",
    name: "Grade replacement retake",
    description: "Two repeated courses alongside new credits after a weak term.",
    context: { completedGpa: 2.62, completedCredits: 54, targetGpa: 2.9 },
    courses: courses("retake", [
      ["Calculus I (retake)", "B+", 4],
      ["Chemistry I (retake)", "B", 4],
      ["Introduction to Economics", "A-", 3],
      ["Public Speaking", "A", 3],
    ]),
  },
  {
    id: "part-time-worker",
    name: "Part-time student",
    description: "A two-course evening term for someone studying while working.",
    context: { completedGpa: 3.34, completedCredits: 39, targetGpa: 3.4 },
    courses: courses("part-time", [
      ["Project Management", "A-", 3],
      ["Business Analytics", "B+", 3],
    ]),
  },
  {
    id: "transfer-student",
    name: "Transfer student",
    description: "Transferred credits carry no grade points, so only new work counts.",
    context: { completedGpa: 0, completedCredits: 0, targetGpa: 3.25 },
    courses: courses("transfer", [
      ["Upper-Division Core", "B+", 3],
      ["Major Methods", "A-", 3],
      ["Elective Seminar", "A", 3],
      ["Lab Practicum", "B+", 2],
    ]),
  },
  {
    id: "final-semester",
    name: "Final semester",
    description: "A graduating term where a large credit history barely moves the average.",
    context: { completedGpa: 3.41, completedCredits: 108, targetGpa: 3.5 },
    courses: courses("final", [
      ["Capstone II", "A", 4],
      ["Senior Elective", "A-", 3],
      ["Portfolio Review", "A", 2],
      ["Professional Practice", "B+", 3],
    ]),
  },
  {
    id: "honors-thesis",
    name: "Honors thesis term",
    description: "A thesis-weighted semester with a small number of high-credit courses.",
    context: { completedGpa: 3.76, completedCredits: 96, targetGpa: 3.8 },
    courses: courses("honors", [
      ["Honors Thesis", "A", 6],
      ["Advanced Topics", "A-", 3],
      ["Thesis Colloquium", "A", 1],
      ["Statistics for Research", "A-", 3],
    ]),
  },
  {
    id: "summer-session",
    name: "Summer session",
    description: "A short two-course summer term used to catch up on credits.",
    context: { completedGpa: 3.02, completedCredits: 63, targetGpa: 3.1 },
    courses: courses("summer", [
      ["Linear Algebra", "B+", 3],
      ["World History", "A", 3],
    ]),
  },
  {
    id: "withdrawal-term",
    name: "Term with a withdrawal",
    description: "A withdrawn course is excluded, so it affects credits but not grade points.",
    context: { completedGpa: 3.15, completedCredits: 51, targetGpa: 3.2 },
    courses: courses("withdrawal", [
      ["Organic Chemistry", "B", 4],
      ["Genetics", "B+", 3],
      ["Biostatistics (withdrawn)", "A", 3, false],
      ["Scientific Writing", "A-", 3],
    ]),
  },
  {
    id: "failed-course",
    name: "Recovering from a failed course",
    description: "One failing grade alongside solid work, to see the true cumulative impact.",
    context: { completedGpa: 3.05, completedCredits: 42, targetGpa: 3 },
    courses: courses("failed", [
      ["Physics II", "F", 4],
      ["Differential Equations", "B+", 3],
      ["Technical Elective", "A-", 3],
      ["Ethics", "A", 3],
    ]),
  },
  {
    id: "heavy-overload",
    name: "21-credit overload",
    description: "An unusually heavy term for testing how much one semester can shift a GPA.",
    context: { completedGpa: 3.28, completedCredits: 66, targetGpa: 3.4 },
    courses: courses("overload", [
      ["Advanced Algorithms", "A-", 4],
      ["Networks", "B+", 4],
      ["Human-Computer Interaction", "A", 3],
      ["Cloud Systems", "A-", 3],
      ["Mobile Development", "A", 3],
      ["Team Project", "A", 3],
      ["Networks Lab", "B+", 1],
    ]),
  },
  {
    id: "graduate-program",
    name: "Graduate program term",
    description: "A postgraduate load where a B is often the minimum passing standard.",
    context: { completedGpa: 3.62, completedCredits: 18, targetGpa: 3.5 },
    courses: courses("graduate", [
      ["Advanced Research Methods", "A-", 3],
      ["Domain Seminar", "A", 3],
      ["Quantitative Analysis", "B+", 3],
      ["Directed Study", "A", 3],
    ]),
  },
];
