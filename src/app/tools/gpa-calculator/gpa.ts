// ─── GPA calculation logic ─────────────────────────────────────────────────
// Standard US 4.0-scale GPA. Each course contributes grade points × credit
// hours ("quality points"); GPA is the total quality points over total credits.

export type LetterGrade =
  | "A+"
  | "A"
  | "A-"
  | "B+"
  | "B"
  | "B-"
  | "C+"
  | "C"
  | "C-"
  | "D+"
  | "D"
  | "D-"
  | "F";

/** Grade points on the common US 4.0 scale (A and A+ both 4.0). */
export const GRADE_POINTS: Record<LetterGrade, number> = {
  "A+": 4.0,
  A: 4.0,
  "A-": 3.7,
  "B+": 3.3,
  B: 3.0,
  "B-": 2.7,
  "C+": 2.3,
  C: 2.0,
  "C-": 1.7,
  "D+": 1.3,
  D: 1.0,
  "D-": 0.7,
  F: 0.0,
};

export const LETTER_GRADES: LetterGrade[] = [
  "A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "F",
];

export type Course = {
  id: string;
  name: string;
  grade: LetterGrade;
  credits: number;
};

export type GpaResult = {
  gpa: number;
  totalCredits: number;
  qualityPoints: number;
  /** Number of courses with a positive credit value that counted. */
  countedCourses: number;
};

/** Whether a credit value is usable (finite and positive). */
function validCredits(credits: number): boolean {
  return Number.isFinite(credits) && credits > 0;
}

export function computeGpa(courses: Course[]): GpaResult {
  let totalCredits = 0;
  let qualityPoints = 0;
  let countedCourses = 0;

  for (const course of courses) {
    if (!validCredits(course.credits)) continue;
    const points = GRADE_POINTS[course.grade];
    if (points === undefined) continue;
    totalCredits += course.credits;
    qualityPoints += points * course.credits;
    countedCourses += 1;
  }

  const gpa = totalCredits > 0 ? qualityPoints / totalCredits : 0;

  return {
    gpa: Math.round(gpa * 1000) / 1000,
    totalCredits,
    qualityPoints: Math.round(qualityPoints * 1000) / 1000,
    countedCourses,
  };
}

/** A short, friendly standing label for a GPA on the 4.0 scale. */
export function gpaStanding(gpa: number): string {
  if (gpa >= 3.9) return "Outstanding";
  if (gpa >= 3.5) return "Excellent";
  if (gpa >= 3.0) return "Very good";
  if (gpa >= 2.0) return "Satisfactory";
  if (gpa > 0) return "Needs improvement";
  return "—";
}
