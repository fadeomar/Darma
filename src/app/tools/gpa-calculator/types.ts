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

export type Course = {
  id: string;
  name: string;
  grade: LetterGrade;
  credits: number;
  included: boolean;
};

export type GpaContext = {
  completedGpa: number;
  completedCredits: number;
  targetGpa: number;
};

export type GpaResult = {
  gpa: number;
  totalCredits: number;
  qualityPoints: number;
  countedCourses: number;
};

export type GradeDistributionRow = {
  grade: LetterGrade;
  gradePoints: number;
  courses: number;
  credits: number;
  qualityPoints: number;
  sharePercent: number;
};

export type CourseAnalysisRow = Course & {
  gradePoints: number;
  qualityPoints: number;
  semesterWeightPercent: number;
  validCredits: boolean;
};

export type TargetStatus =
  | "not-configured"
  | "needs-courses"
  | "already-achieved"
  | "on-track"
  | "below-target"
  | "impossible";

export type GpaAnalysis = {
  semester: GpaResult;
  projectedCumulativeGpa: number | null;
  projectedTotalCredits: number;
  completedQualityPoints: number;
  requiredSemesterGpa: number | null;
  requiredGradeLabel: string;
  targetGap: number | null;
  targetStatus: TargetStatus;
  invalidCourseCount: number;
  excludedCourseCount: number;
  distribution: GradeDistributionRow[];
  courseRows: CourseAnalysisRow[];
};

export type GpaCheckLevel = "success" | "info" | "warning" | "danger";

export type GpaCheck = {
  id: string;
  level: GpaCheckLevel;
  title: string;
  message: string;
};

export type GpaPreset = {
  id: string;
  name: string;
  description: string;
  context: GpaContext;
  courses: Course[];
};

export type GpaTab = "overview" | "courses" | "planner" | "exports";
