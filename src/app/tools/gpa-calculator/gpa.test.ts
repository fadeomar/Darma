import { describe, expect, it } from "vitest";
import { computeGpa, gpaStanding, GRADE_POINTS, type Course } from "./gpa";

function course(grade: Course["grade"], credits: number, name = ""): Course {
  return { id: `${grade}-${credits}-${name}`, name, grade, credits };
}

describe("computeGpa", () => {
  it("computes a weighted GPA", () => {
    const result = computeGpa([course("A", 3), course("B", 3), course("C", 4)]);
    // (4*3 + 3*3 + 2*4) / 10 = 29/10 = 2.9
    expect(result.totalCredits).toBe(10);
    expect(result.qualityPoints).toBe(29);
    expect(result.gpa).toBe(2.9);
    expect(result.countedCourses).toBe(3);
  });

  it("returns a perfect GPA for all A grades", () => {
    expect(computeGpa([course("A", 3), course("A+", 4)]).gpa).toBe(4);
  });

  it("ignores rows with zero or invalid credits", () => {
    const result = computeGpa([course("A", 3), course("B", 0), course("F", Number.NaN)]);
    expect(result.totalCredits).toBe(3);
    expect(result.countedCourses).toBe(1);
    expect(result.gpa).toBe(4);
  });

  it("returns zero for an empty list", () => {
    expect(computeGpa([])).toEqual({ gpa: 0, totalCredits: 0, qualityPoints: 0, countedCourses: 0 });
  });

  it("rounds GPA to three decimals", () => {
    // (4*1 + 3.7*1 + 3.3*1) / 3 = 11/3 = 3.6666...
    expect(computeGpa([course("A", 1), course("A-", 1), course("B+", 1)]).gpa).toBe(3.667);
  });
});

describe("GRADE_POINTS", () => {
  it("maps the 4.0 scale anchors", () => {
    expect(GRADE_POINTS.A).toBe(4.0);
    expect(GRADE_POINTS.F).toBe(0.0);
    expect(GRADE_POINTS["B-"]).toBe(2.7);
  });
});

describe("gpaStanding", () => {
  it("labels standings by band", () => {
    expect(gpaStanding(4.0)).toBe("Outstanding");
    expect(gpaStanding(3.6)).toBe("Excellent");
    expect(gpaStanding(3.1)).toBe("Very good");
    expect(gpaStanding(2.4)).toBe("Satisfactory");
    expect(gpaStanding(1.2)).toBe("Needs improvement");
    expect(gpaStanding(0)).toBe("—");
  });
});
