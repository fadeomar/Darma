"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button, CopyButton, Input, Select } from "@/components/ui";
import { ToolControlPanel, ControlSection, WarningPanel } from "@/features/tools/components";
import { ToolLayoutTextWorkbench } from "@/features/tools/layouts";
import { computeGpa, gpaStanding, LETTER_GRADES, type Course, type LetterGrade } from "./gpa";

const INITIAL_COURSES: Course[] = [
  { id: "c1", name: "", grade: "A", credits: 3 },
  { id: "c2", name: "", grade: "B+", credits: 4 },
  { id: "c3", name: "", grade: "A-", credits: 3 },
];

let nextId = 4;

export default function GpaCalculatorClient() {
  const [courses, setCourses] = useState<Course[]>(INITIAL_COURSES);

  const result = useMemo(() => computeGpa(courses), [courses]);

  function updateCourse(id: string, patch: Partial<Course>) {
    setCourses((prev) => prev.map((course) => (course.id === id ? { ...course, ...patch } : course)));
  }

  function addCourse() {
    setCourses((prev) => [...prev, { id: `c${nextId++}`, name: "", grade: "A", credits: 3 }]);
  }

  function removeCourse(id: string) {
    setCourses((prev) => (prev.length > 1 ? prev.filter((course) => course.id !== id) : prev));
  }

  const summary = useMemo(() => {
    const lines = courses
      .filter((course) => Number.isFinite(course.credits) && course.credits > 0)
      .map((course, index) => `${course.name.trim() || `Course ${index + 1}`}: ${course.grade}, ${course.credits} credits`);
    return [
      `GPA: ${result.gpa.toFixed(2)} (${gpaStanding(result.gpa)})`,
      `Total credits: ${result.totalCredits}`,
      `Quality points: ${result.qualityPoints}`,
      "",
      ...lines,
    ].join("\n");
  }, [courses, result]);

  return (
    <ToolLayoutTextWorkbench
      inputSlot={
        <ToolControlPanel title="Your courses" description="Add each course with its letter grade and credit hours. The GPA updates as you type.">
          <ControlSection title="Courses">
            <div className="space-y-2">
              <div className="hidden grid-cols-[minmax(0,1fr)_88px_72px_auto] gap-2 px-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)] sm:grid">
                <span>Course (optional)</span>
                <span>Grade</span>
                <span>Credits</span>
                <span className="sr-only">Remove</span>
              </div>
              {courses.map((course, index) => (
                <div key={course.id} className="grid grid-cols-[minmax(0,1fr)_88px_72px_auto] gap-2">
                  <Input
                    type="text"
                    value={course.name}
                    onChange={(event) => updateCourse(course.id, { name: event.target.value })}
                    placeholder={`Course ${index + 1}`}
                    aria-label={`Course ${index + 1} name`}
                  />
                  <Select
                    value={course.grade}
                    onChange={(event) => updateCourse(course.id, { grade: event.target.value as LetterGrade })}
                    aria-label={`Course ${index + 1} grade`}
                  >
                    {LETTER_GRADES.map((grade) => (
                      <option key={grade} value={grade}>{grade}</option>
                    ))}
                  </Select>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={Number.isFinite(course.credits) ? String(course.credits) : ""}
                    onChange={(event) => updateCourse(course.id, { credits: Number.parseFloat(event.target.value) })}
                    aria-label={`Course ${index + 1} credits`}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeCourse(course.id)}
                    disabled={courses.length <= 1}
                    aria-label={`Remove course ${index + 1}`}
                    leftIcon={<Trash2 className="h-4 w-4" aria-hidden />}
                  />
                </div>
              ))}
            </div>
            <div className="mt-3">
              <Button size="sm" variant="secondary" onClick={addCourse} leftIcon={<Plus className="h-4 w-4" aria-hidden />}>
                Add course
              </Button>
            </div>
          </ControlSection>
        </ToolControlPanel>
      }
      outputSlot={
        <section className="flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-sm)]">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/75 px-4 py-3">
            <h2 className="text-sm font-bold tracking-[-0.01em] text-[var(--color-text-primary)]">Result</h2>
            <CopyButton text={summary} size="sm" variant="secondary" disabled={result.totalCredits === 0}>Copy result</CopyButton>
          </div>
          <div className="flex flex-1 flex-col gap-4 p-4">
            {result.totalCredits > 0 ? (
              <>
                <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-5 text-center shadow-[inset_0_1px_0_var(--color-border-subtle)]">
                  <div className="text-5xl font-black tracking-tight text-[var(--color-text-primary)]">{result.gpa.toFixed(2)}</div>
                  <div className="mt-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-primary)]">{gpaStanding(result.gpa)}</div>
                  <div className="mt-1 text-xs text-[var(--color-text-tertiary)]">on a 4.0 scale</div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Total credits", value: result.totalCredits.toLocaleString() },
                    { label: "Quality points", value: result.qualityPoints.toLocaleString() },
                    { label: "Courses", value: result.countedCourses.toLocaleString() },
                  ].map((item) => (
                    <div key={item.label} className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3 text-center">
                      <div className="font-mono text-lg font-black text-[var(--color-text-primary)]">{item.value}</div>
                      <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{item.label}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center text-center text-sm text-[var(--color-text-tertiary)]">
                Add at least one course with credit hours to see your GPA.
              </div>
            )}
          </div>
        </section>
      }
      statsSlot={
        <WarningPanel
          messages={[
            { id: "scale", severity: "info", title: "4.0 grade scale", message: "A/A+ = 4.0, A- = 3.7, B+ = 3.3, B = 3.0, and so on down to F = 0.0. GPA is the credit-weighted average of these points." },
            { id: "local", severity: "info", title: "Private by design", message: "Your courses and grades are never uploaded — everything is calculated in your browser." },
          ]}
        />
      }
    />
  );
}
