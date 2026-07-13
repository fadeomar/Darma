import { describe, expect, it } from "vitest";
import {
  analyzeGpa,
  buildCoursesCsv,
  buildGpaChecks,
  computeGpa,
  GRADE_POINTS,
  gpaStanding,
  minimumGradeLabel,
  projectCumulativeGpa,
  requiredSemesterGpaForTarget,
} from "./gpa";
import type { Course, GpaContext, LetterGrade } from "./types";

function course(grade: LetterGrade, credits: number, name = "", included = true): Course {
  return { id: `${grade}-${credits}-${name}`, name, grade, credits, included };
}

const context: GpaContext = { completedGpa: 3, completedCredits: 60, targetGpa: 3.1 };

describe("computeGpa", () => {
  it("computes a credit-weighted semester GPA", () => {
    const result = computeGpa([course("A", 3), course("B", 3), course("C", 4)]);
    expect(result).toEqual({ gpa: 2.9, totalCredits: 10, qualityPoints: 29, countedCourses: 3 });
  });

  it("excludes skipped and invalid-credit rows", () => {
    const result = computeGpa([
      course("A", 3),
      course("F", 3, "Pass/fail", false),
      course("B", 0),
      course("A", Number.NaN),
    ]);
    expect(result.totalCredits).toBe(3);
    expect(result.countedCourses).toBe(1);
    expect(result.gpa).toBe(4);
  });

  it("returns an empty result when no course can be counted", () => {
    expect(computeGpa([])).toEqual({ gpa: 0, totalCredits: 0, qualityPoints: 0, countedCourses: 0 });
  });
});

describe("cumulative and target planning", () => {
  it("projects a cumulative GPA from prior and semester quality points", () => {
    expect(projectCumulativeGpa(3, 60, 4, 15)).toBe(3.2);
  });

  it("returns the required semester GPA for a target", () => {
    expect(requiredSemesterGpaForTarget(context, 15)).toBe(3.5);
  });

  it("detects an impossible one-term target", () => {
    const analysis = analyzeGpa([course("A", 3), course("A", 3)], {
      completedGpa: 2,
      completedCredits: 90,
      targetGpa: 3,
    });
    expect(analysis.requiredSemesterGpa).toBeGreaterThan(4);
    expect(analysis.targetStatus).toBe("impossible");
  });

  it("marks a target on track when planned grades meet the requirement", () => {
    const analysis = analyzeGpa([course("A", 15)], context);
    expect(analysis.targetStatus).toBe("on-track");
    expect(analysis.projectedCumulativeGpa).toBe(3.2);
    expect(analysis.targetGap).toBe(0.1);
  });

  it("supports a first-semester target", () => {
    const analysis = analyzeGpa([course("B", 12)], { completedGpa: 0, completedCredits: 0, targetGpa: 3 });
    expect(analysis.projectedCumulativeGpa).toBe(3);
    expect(analysis.requiredSemesterGpa).toBe(3);
    expect(analysis.targetStatus).toBe("on-track");
  });
});

describe("analysis details", () => {
  it("builds grade distribution using credit share", () => {
    const analysis = analyzeGpa([course("A", 3), course("B", 1), course("A", 2)], context);
    const a = analysis.distribution.find((row) => row.grade === "A");
    const b = analysis.distribution.find((row) => row.grade === "B");
    expect(a).toMatchObject({ courses: 2, credits: 5, qualityPoints: 20, sharePercent: 83.3 });
    expect(b).toMatchObject({ courses: 1, credits: 1, qualityPoints: 3, sharePercent: 16.7 });
  });

  it("calculates each course weight and quality points", () => {
    const analysis = analyzeGpa([course("A-", 3, "Algorithms"), course("B+", 1, "Lab")], context);
    expect(analysis.courseRows[0]).toMatchObject({ gradePoints: 3.7, qualityPoints: 11.1, semesterWeightPercent: 75 });
    expect(analysis.courseRows[1]).toMatchObject({ gradePoints: 3.3, qualityPoints: 3.3, semesterWeightPercent: 25 });
  });

  it("generates checks for invalid rows, duplicates, and heavy loads", () => {
    const courses = [
      course("A", 12, "Studio"),
      course("B", 14, "Studio"),
      course("C", 0, "Invalid"),
    ];
    const analysis = analyzeGpa(courses, context);
    const ids = buildGpaChecks(courses, context, analysis).map((check) => check.id);
    expect(ids).toEqual(expect.arrayContaining(["invalid-credits", "large-course-credit", "heavy-load", "duplicate-names"]));
  });

  it("escapes course names in CSV exports", () => {
    const analysis = analyzeGpa([course("A", 3, 'Writing, "Advanced"')], context);
    const csv = buildCoursesCsv(analysis);
    expect(csv).toContain('"Writing, ""Advanced"""');
    expect(csv).toContain("A,4,3,true,12,100");
  });
});

describe("grade scale helpers", () => {
  it("maps common grade points and standing bands", () => {
    expect(GRADE_POINTS["B-"]).toBe(2.7);
    expect(gpaStanding(3.6)).toBe("Excellent");
    expect(gpaStanding(1.8)).toBe("Needs improvement");
  });

  it("describes the approximate minimum grade band", () => {
    expect(minimumGradeLabel(3.5)).toBe("About A- average or better");
    expect(minimumGradeLabel(4.2)).toContain("impossible");
    expect(minimumGradeLabel(-0.1)).toBe("Target already secured");
  });
});
