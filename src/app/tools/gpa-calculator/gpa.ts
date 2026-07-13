import type {
  Course,
  CourseAnalysisRow,
  GpaAnalysis,
  GpaCheck,
  GpaContext,
  GpaResult,
  GradeDistributionRow,
  LetterGrade,
  TargetStatus,
} from "./types";

export const GRADE_POINTS: Record<LetterGrade, number> = {
  "A+": 4,
  A: 4,
  "A-": 3.7,
  "B+": 3.3,
  B: 3,
  "B-": 2.7,
  "C+": 2.3,
  C: 2,
  "C-": 1.7,
  "D+": 1.3,
  D: 1,
  "D-": 0.7,
  F: 0,
};

export const LETTER_GRADES: LetterGrade[] = [
  "A+",
  "A",
  "A-",
  "B+",
  "B",
  "B-",
  "C+",
  "C",
  "C-",
  "D+",
  "D",
  "D-",
  "F",
];

const EPSILON = 1e-9;

function round(value: number, digits = 3): number {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function isValidCredits(credits: number): boolean {
  return Number.isFinite(credits) && credits > 0;
}

export function isValidGpa(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= 4;
}

export function computeGpa(courses: Course[]): GpaResult {
  let totalCredits = 0;
  let qualityPoints = 0;
  let countedCourses = 0;

  for (const course of courses) {
    if (!course.included || !isValidCredits(course.credits)) continue;
    const points = GRADE_POINTS[course.grade];
    if (points === undefined) continue;
    totalCredits += course.credits;
    qualityPoints += points * course.credits;
    countedCourses += 1;
  }

  return {
    gpa: totalCredits > 0 ? round(qualityPoints / totalCredits) : 0,
    totalCredits: round(totalCredits),
    qualityPoints: round(qualityPoints),
    countedCourses,
  };
}

export function gpaStanding(gpa: number): string {
  if (!Number.isFinite(gpa) || gpa <= 0) return "—";
  if (gpa >= 3.9) return "Outstanding";
  if (gpa >= 3.5) return "Excellent";
  if (gpa >= 3) return "Very good";
  if (gpa >= 2) return "Satisfactory";
  return "Needs improvement";
}

export function minimumGradeLabel(requiredGpa: number | null): string {
  if (requiredGpa === null || !Number.isFinite(requiredGpa)) return "—";
  if (requiredGpa <= 0) return "Target already secured";
  if (requiredGpa > 4) return "Above A / impossible on a 4.0 scale";

  const uniqueBands = [
    { grade: "A", points: 4 },
    { grade: "A-", points: 3.7 },
    { grade: "B+", points: 3.3 },
    { grade: "B", points: 3 },
    { grade: "B-", points: 2.7 },
    { grade: "C+", points: 2.3 },
    { grade: "C", points: 2 },
    { grade: "C-", points: 1.7 },
    { grade: "D+", points: 1.3 },
    { grade: "D", points: 1 },
    { grade: "D-", points: 0.7 },
    { grade: "F", points: 0 },
  ] as const;

  const exactOrHigher = [...uniqueBands].reverse().find((band) => band.points + EPSILON >= requiredGpa);
  return exactOrHigher ? `About ${exactOrHigher.grade} average or better` : "A average";
}

function determineTargetStatus(
  semesterCredits: number,
  semesterGpa: number,
  requiredSemesterGpa: number | null,
  targetConfigured: boolean,
): TargetStatus {
  if (!targetConfigured) return "not-configured";
  if (semesterCredits <= 0) return "needs-courses";
  if (requiredSemesterGpa === null) return "not-configured";
  if (requiredSemesterGpa <= 0) return "already-achieved";
  if (requiredSemesterGpa > 4 + EPSILON) return "impossible";
  return semesterGpa + EPSILON >= requiredSemesterGpa ? "on-track" : "below-target";
}

export function projectCumulativeGpa(
  completedGpa: number,
  completedCredits: number,
  semesterGpa: number,
  semesterCredits: number,
): number | null {
  const safeCompletedCredits = Number.isFinite(completedCredits) && completedCredits > 0 ? completedCredits : 0;
  const safeSemesterCredits = Number.isFinite(semesterCredits) && semesterCredits > 0 ? semesterCredits : 0;
  const totalCredits = safeCompletedCredits + safeSemesterCredits;
  if (totalCredits <= 0) return null;

  const completedQuality = isValidGpa(completedGpa) ? completedGpa * safeCompletedCredits : 0;
  const semesterQuality = isValidGpa(semesterGpa) ? semesterGpa * safeSemesterCredits : 0;
  return round((completedQuality + semesterQuality) / totalCredits);
}

export function requiredSemesterGpaForTarget(
  context: GpaContext,
  semesterCredits: number,
): number | null {
  if (!isValidGpa(context.targetGpa) || !Number.isFinite(semesterCredits) || semesterCredits <= 0) return null;
  const completedCredits = Number.isFinite(context.completedCredits) && context.completedCredits > 0
    ? context.completedCredits
    : 0;
  const completedGpa = isValidGpa(context.completedGpa) ? context.completedGpa : 0;
  const targetQuality = context.targetGpa * (completedCredits + semesterCredits);
  const completedQuality = completedGpa * completedCredits;
  return round((targetQuality - completedQuality) / semesterCredits);
}

function buildCourseRows(courses: Course[], semesterCredits: number): CourseAnalysisRow[] {
  return courses.map((course) => {
    const validCredits = isValidCredits(course.credits);
    const gradePoints = GRADE_POINTS[course.grade] ?? 0;
    const qualityPoints = course.included && validCredits ? gradePoints * course.credits : 0;
    return {
      ...course,
      gradePoints,
      qualityPoints: round(qualityPoints),
      semesterWeightPercent:
        course.included && validCredits && semesterCredits > 0
          ? round((course.credits / semesterCredits) * 100, 1)
          : 0,
      validCredits,
    };
  });
}

function buildDistribution(rows: CourseAnalysisRow[], semesterCredits: number): GradeDistributionRow[] {
  const map = new Map<LetterGrade, Omit<GradeDistributionRow, "sharePercent">>();
  for (const row of rows) {
    if (!row.included || !row.validCredits) continue;
    const current = map.get(row.grade) ?? {
      grade: row.grade,
      gradePoints: row.gradePoints,
      courses: 0,
      credits: 0,
      qualityPoints: 0,
    };
    current.courses += 1;
    current.credits += row.credits;
    current.qualityPoints += row.qualityPoints;
    map.set(row.grade, current);
  }

  return LETTER_GRADES
    .filter((grade) => map.has(grade))
    .map((grade) => {
      const row = map.get(grade)!;
      return {
        ...row,
        credits: round(row.credits),
        qualityPoints: round(row.qualityPoints),
        sharePercent: semesterCredits > 0 ? round((row.credits / semesterCredits) * 100, 1) : 0,
      };
    });
}

export function analyzeGpa(courses: Course[], context: GpaContext): GpaAnalysis {
  const semester = computeGpa(courses);
  const courseRows = buildCourseRows(courses, semester.totalCredits);
  const completedCredits = Number.isFinite(context.completedCredits) && context.completedCredits > 0
    ? context.completedCredits
    : 0;
  const completedGpa = isValidGpa(context.completedGpa) ? context.completedGpa : 0;
  const completedQualityPoints = round(completedGpa * completedCredits);
  const projectedCumulativeGpa = projectCumulativeGpa(
    completedGpa,
    completedCredits,
    semester.gpa,
    semester.totalCredits,
  );
  const requiredSemesterGpa = requiredSemesterGpaForTarget(context, semester.totalCredits);
  const targetConfigured = isValidGpa(context.targetGpa);
  const targetStatus = determineTargetStatus(
    semester.totalCredits,
    semester.gpa,
    requiredSemesterGpa,
    targetConfigured,
  );

  return {
    semester,
    projectedCumulativeGpa,
    projectedTotalCredits: round(completedCredits + semester.totalCredits),
    completedQualityPoints,
    requiredSemesterGpa,
    requiredGradeLabel: minimumGradeLabel(requiredSemesterGpa),
    targetGap:
      projectedCumulativeGpa !== null && targetConfigured
        ? round(projectedCumulativeGpa - context.targetGpa)
        : null,
    targetStatus,
    invalidCourseCount: courses.filter((course) => course.included && !isValidCredits(course.credits)).length,
    excludedCourseCount: courses.filter((course) => !course.included).length,
    distribution: buildDistribution(courseRows, semester.totalCredits),
    courseRows,
  };
}

export function buildGpaChecks(courses: Course[], context: GpaContext, analysis: GpaAnalysis): GpaCheck[] {
  const checks: GpaCheck[] = [];

  if (analysis.semester.countedCourses === 0) {
    checks.push({ id: "no-courses", level: "danger", title: "No counted courses", message: "Add at least one included course with positive credit hours." });
  } else {
    checks.push({ id: "calculation-ready", level: "success", title: "Calculation ready", message: `${analysis.semester.countedCourses} course${analysis.semester.countedCourses === 1 ? "" : "s"} contribute to the semester GPA.` });
  }

  if (analysis.invalidCourseCount > 0) {
    checks.push({ id: "invalid-credits", level: "warning", title: "Invalid credit rows", message: `${analysis.invalidCourseCount} included row${analysis.invalidCourseCount === 1 ? " has" : "s have"} empty, zero, or invalid credits and is excluded from the calculation.` });
  }

  if (analysis.excludedCourseCount > 0) {
    checks.push({ id: "excluded-courses", level: "info", title: "Excluded courses", message: `${analysis.excludedCourseCount} row${analysis.excludedCourseCount === 1 ? " is" : "s are"} marked as pass/fail, withdrawn, or otherwise excluded.` });
  }

  const oversizedCourses = courses.filter((course) => course.included && isValidCredits(course.credits) && course.credits > 8);
  if (oversizedCourses.length > 0) {
    checks.push({ id: "large-course-credit", level: "warning", title: "Large credit value", message: "One or more courses exceed 8 credits. Confirm the values match your institution's transcript units." });
  }

  if (analysis.semester.totalCredits > 24) {
    checks.push({ id: "heavy-load", level: "warning", title: "Heavy semester load", message: `${analysis.semester.totalCredits} credits is unusually high for one term. Verify that courses are not duplicated.` });
  }

  const duplicateNames = new Set<string>();
  const seenNames = new Set<string>();
  for (const course of courses) {
    const normalized = course.name.trim().toLowerCase();
    if (!normalized) continue;
    if (seenNames.has(normalized)) duplicateNames.add(normalized);
    seenNames.add(normalized);
  }
  if (duplicateNames.size > 0) {
    checks.push({ id: "duplicate-names", level: "warning", title: "Possible duplicate courses", message: "Repeated course names were found. Confirm repeated rows are intentional." });
  }

  if (context.completedCredits > 0 && !isValidGpa(context.completedGpa)) {
    checks.push({ id: "invalid-completed-gpa", level: "danger", title: "Invalid current GPA", message: "Completed credits were entered, but the current cumulative GPA is outside the 0.00–4.00 range." });
  }

  if (context.completedCredits < 0 || !Number.isFinite(context.completedCredits)) {
    checks.push({ id: "invalid-completed-credits", level: "danger", title: "Invalid completed credits", message: "Completed credits must be zero or a positive number." });
  }

  if (!isValidGpa(context.targetGpa)) {
    checks.push({ id: "target-not-set", level: "info", title: "Target planning inactive", message: "Enter a target cumulative GPA between 0.00 and 4.00 to see the required semester average." });
  } else if (analysis.targetStatus === "impossible") {
    checks.push({ id: "target-impossible", level: "danger", title: "Target is not reachable this term", message: `The required semester GPA is ${analysis.requiredSemesterGpa?.toFixed(2)}, above the 4.00 maximum. Lower the target or plan across more credits.` });
  } else if (analysis.targetStatus === "below-target") {
    checks.push({ id: "target-below", level: "warning", title: "Planned grades are below target", message: `The entered courses project ${analysis.projectedCumulativeGpa?.toFixed(2)}, which is ${Math.abs(analysis.targetGap ?? 0).toFixed(2)} below the target.` });
  } else if (analysis.targetStatus === "on-track") {
    checks.push({ id: "target-on-track", level: "success", title: "Target is on track", message: `The entered grades meet or exceed the required ${analysis.requiredSemesterGpa?.toFixed(2)} semester GPA.` });
  } else if (analysis.targetStatus === "already-achieved") {
    checks.push({ id: "target-secured", level: "success", title: "Target already secured", message: "Your existing record is already high enough that this target does not require a positive semester GPA." });
  }

  checks.push({ id: "scale", level: "info", title: "Common 4.0 scale", message: "A/A+ = 4.0 and plus/minus grades use 0.3 steps. Confirm your institution's exact repeat, pass/fail, and rounding rules." });
  return checks;
}

function csvCell(value: string | number | boolean): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function buildCoursesCsv(analysis: GpaAnalysis): string {
  const header = ["Course", "Grade", "Grade points", "Credits", "Included", "Quality points", "Semester weight %"];
  const rows = analysis.courseRows.map((row, index) => [
    row.name.trim() || `Course ${index + 1}`,
    row.grade,
    row.gradePoints,
    Number.isFinite(row.credits) ? row.credits : "",
    row.included,
    row.qualityPoints,
    row.semesterWeightPercent,
  ]);
  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n") + "\n";
}

export function buildGpaSummaryMarkdown(context: GpaContext, analysis: GpaAnalysis, checks: GpaCheck[]): string {
  const targetLine = isValidGpa(context.targetGpa)
    ? `- Target cumulative GPA: ${context.targetGpa.toFixed(2)}\n- Required semester GPA: ${analysis.requiredSemesterGpa === null ? "—" : analysis.requiredSemesterGpa.toFixed(2)}\n- Target status: ${analysis.targetStatus}`
    : "- Target planning: not configured";

  const courses = analysis.courseRows.map((row, index) => {
    const name = row.name.trim() || `Course ${index + 1}`;
    const credits = Number.isFinite(row.credits) ? row.credits : "invalid";
    return `- ${name}: ${row.grade}, ${credits} credits, ${row.included ? "included" : "excluded"}`;
  }).join("\n");

  const review = checks.map((check) => `- [${check.level.toUpperCase()}] ${check.title}: ${check.message}`).join("\n");

  return `# GPA analysis\n\n## Summary\n\n- Semester GPA: ${analysis.semester.gpa.toFixed(3)}\n- Semester credits: ${analysis.semester.totalCredits}\n- Quality points: ${analysis.semester.qualityPoints}\n- Projected cumulative GPA: ${analysis.projectedCumulativeGpa === null ? "—" : analysis.projectedCumulativeGpa.toFixed(3)}\n- Projected total credits: ${analysis.projectedTotalCredits}\n${targetLine}\n\n## Courses\n\n${courses || "- No courses"}\n\n## Production review\n\n${review}\n`;
}

export function buildGpaReport(context: GpaContext, analysis: GpaAnalysis, checks: GpaCheck[]) {
  return {
    generatedAt: new Date().toISOString(),
    scale: "Common US 4.0 scale with plus/minus grades",
    context,
    metrics: {
      semesterGpa: analysis.semester.gpa,
      semesterCredits: analysis.semester.totalCredits,
      semesterQualityPoints: analysis.semester.qualityPoints,
      countedCourses: analysis.semester.countedCourses,
      projectedCumulativeGpa: analysis.projectedCumulativeGpa,
      projectedTotalCredits: analysis.projectedTotalCredits,
      requiredSemesterGpa: analysis.requiredSemesterGpa,
      requiredGradeLabel: analysis.requiredGradeLabel,
      targetGap: analysis.targetGap,
      targetStatus: analysis.targetStatus,
    },
    courses: analysis.courseRows,
    gradeDistribution: analysis.distribution,
    checks,
  };
}
