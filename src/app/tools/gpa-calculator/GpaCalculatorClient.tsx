"use client";

import { useMemo, useState } from "react";
import JSZip from "jszip";
import {
  Award,
  CheckCircle2,
  Download,
  FileJson,
  FileSpreadsheet,
  Flag,
  Gauge,
  GraduationCap,
  PackageCheck,
  Plus,
  RotateCcw,
  Sparkles,
  Target,
  Trash2,
} from "lucide-react";
import { Button, CopyButton, Input, Select } from "@/components/ui";
import { ToolMobileActions } from "@/features/tools/components";
import { downloadText } from "../_shared/clientUtils";
import {
  analyzeGpa,
  buildCoursesCsv,
  buildGpaChecks,
  buildGpaReport,
  buildGpaSummaryMarkdown,
  LETTER_GRADES,
  gpaStanding,
  projectCumulativeGpa,
} from "./gpa";
import { DEFAULT_GPA_CONTEXT, DEFAULT_GPA_COURSES, GPA_PRESETS } from "./presets";
import type {
  Course,
  GpaCheckLevel,
  GpaContext,
  GpaTab,
  LetterGrade,
  TargetStatus,
} from "./types";

type CourseForm = Omit<Course, "credits"> & { credits: string };
type ContextForm = { completedGpa: string; completedCredits: string; targetGpa: string };

const CHECK_STYLES: Record<GpaCheckLevel, string> = {
  success: "border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-text)]",
  info: "border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-[var(--color-info-text)]",
  warning: "border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]",
  danger: "border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]",
};

const TARGET_STYLES: Record<TargetStatus, string> = {
  "not-configured": "border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] text-[var(--color-text-secondary)]",
  "needs-courses": "border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-[var(--color-info-text)]",
  "already-achieved": "border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-text)]",
  "on-track": "border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-text)]",
  "below-target": "border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]",
  impossible: "border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]",
};

const TARGET_LABELS: Record<TargetStatus, string> = {
  "not-configured": "Target not configured",
  "needs-courses": "Add semester courses",
  "already-achieved": "Target already secured",
  "on-track": "On track",
  "below-target": "Below target",
  impossible: "Not reachable this term",
};

function toCourseForms(courses: Course[]): CourseForm[] {
  return courses.map((course) => ({ ...course, credits: String(course.credits) }));
}

function toContextForm(context: GpaContext): ContextForm {
  return {
    completedGpa: String(context.completedGpa),
    completedCredits: String(context.completedCredits),
    targetGpa: String(context.targetGpa),
  };
}

function parseNumber(value: string): number {
  if (!value.trim()) return Number.NaN;
  return Number(value);
}

function parseCourses(forms: CourseForm[]): Course[] {
  return forms.map((course) => ({ ...course, credits: parseNumber(course.credits) }));
}

function parseContext(form: ContextForm): GpaContext {
  return {
    completedGpa: parseNumber(form.completedGpa),
    completedCredits: parseNumber(form.completedCredits),
    targetGpa: parseNumber(form.targetGpa),
  };
}

function newCourse(index: number): CourseForm {
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `course-${Date.now()}-${index}`;
  return { id, name: "", grade: "A", credits: "3", included: true };
}

function MetricCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4">
      <div className="truncate text-xs font-bold uppercase tracking-[0.07em] text-[var(--color-text-tertiary)]">{label}</div>
      <div className="mt-1.5 truncate font-mono text-xl font-black text-[var(--color-text-primary)]" title={value}>{value}</div>
      {hint ? <div className="mt-1 truncate text-xs text-[var(--color-text-tertiary)]">{hint}</div> : null}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 flex items-center justify-between gap-2 text-xs font-bold text-[var(--color-text-secondary)]">
        <span>{label}</span>
        {hint ? <span className="font-normal text-[var(--color-text-tertiary)]">{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}

function formatGpa(value: number | null, digits = 2): string {
  return value === null || !Number.isFinite(value) ? "—" : value.toFixed(digits);
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export default function GpaCalculatorClient() {
  const [courseForms, setCourseForms] = useState<CourseForm[]>(() => toCourseForms(DEFAULT_GPA_COURSES));
  const [contextForm, setContextForm] = useState<ContextForm>(() => toContextForm(DEFAULT_GPA_CONTEXT));
  const [activeTab, setActiveTab] = useState<GpaTab>("overview");
  const [showAllPresets, setShowAllPresets] = useState(false);

  const courses = useMemo(() => parseCourses(courseForms), [courseForms]);
  const context = useMemo(() => parseContext(contextForm), [contextForm]);
  const analysis = useMemo(() => analyzeGpa(courses, context), [courses, context]);
  const checks = useMemo(() => buildGpaChecks(courses, context, analysis), [courses, context, analysis]);
  const summaryMarkdown = useMemo(() => buildGpaSummaryMarkdown(context, analysis, checks), [context, analysis, checks]);
  const coursesCsv = useMemo(() => buildCoursesCsv(analysis), [analysis]);
  const reportJson = useMemo(() => `${JSON.stringify(buildGpaReport(context, analysis, checks), null, 2)}\n`, [context, analysis, checks]);
  const reviewCount = checks.filter((check) => check.level === "warning" || check.level === "danger").length;
  const requiredWidth = analysis.requiredSemesterGpa === null ? 0 : clampPercent((analysis.requiredSemesterGpa / 4) * 100);
  const semesterWidth = clampPercent((analysis.semester.gpa / 4) * 100);

  function updateCourse(id: string, patch: Partial<CourseForm>) {
    setCourseForms((current) => current.map((course) => course.id === id ? { ...course, ...patch } : course));
  }

  function addCourse() {
    setCourseForms((current) => [...current, newCourse(current.length + 1)]);
  }

  function removeCourse(id: string) {
    setCourseForms((current) => current.length > 1 ? current.filter((course) => course.id !== id) : current);
  }

  function applyPreset(id: string) {
    const preset = GPA_PRESETS.find((item) => item.id === id);
    if (!preset) return;
    setCourseForms(toCourseForms(preset.courses));
    setContextForm(toContextForm(preset.context));
    setActiveTab("overview");
  }

  function reset() {
    setCourseForms(toCourseForms(DEFAULT_GPA_COURSES));
    setContextForm(toContextForm(DEFAULT_GPA_CONTEXT));
    setActiveTab("overview");
  }

  async function downloadPack() {
    const zip = new JSZip();
    zip.file("gpa-summary.md", summaryMarkdown);
    zip.file("gpa-report.json", reportJson);
    zip.file("courses.csv", coursesCsv);
    zip.file("README.md", "# Darma GPA analysis pack\n\n- `gpa-summary.md`: readable semester and cumulative summary\n- `gpa-report.json`: structured metrics, courses, distribution, and checks\n- `courses.csv`: course-level GPA contributions\n\nThis tool uses a common 4.0 scale. Confirm your institution's repeat, pass/fail, plus/minus, and rounding policies.\n");
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "gpa-analysis-pack.zip";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const tabs: Array<{ id: GpaTab; label: string }> = [
    { id: "overview", label: "Overview" },
    { id: "courses", label: "Course impact" },
    { id: "planner", label: "Target planner" },
    { id: "exports", label: "Checks & exports" },
  ];

  return (
    <div className="space-y-5">
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(320px,390px)_minmax(0,1fr)]">
        <aside data-tool-region="controls" className="space-y-4 rounded-[var(--radius-lg)] border border-[var(--color-tool-controls-border)] bg-[var(--color-tool-controls-bg)] p-3 shadow-[var(--shadow-tool-controls)] lg:sticky lg:top-[6.75rem] lg:max-h-[calc(100vh-7.75rem)] lg:overflow-y-auto lg:overscroll-contain">

          <section className="rounded-[var(--radius-lg)] border border-[var(--color-tool-controls-border)] bg-[var(--color-tool-controls-bg)] p-4">
            <div className="mb-3 flex items-center gap-2"><GraduationCap className="h-4 w-4 text-[var(--color-primary-text-strong)]" /><div><h2 className="text-sm font-black text-[var(--color-text-primary)]">Current record & target</h2><p className="text-xs text-[var(--color-text-tertiary)]">Use zero completed credits for a first semester.</p></div></div>
            <div className="grid grid-cols-3 gap-2">
              <Field label="Current GPA" hint="0–4"><Input type="text" inputMode="decimal" value={contextForm.completedGpa} onChange={(event) => setContextForm((current) => ({ ...current, completedGpa: event.target.value }))} aria-label="Current cumulative GPA" /></Field>
              <Field label="Completed" hint="credits"><Input type="text" inputMode="decimal" value={contextForm.completedCredits} onChange={(event) => setContextForm((current) => ({ ...current, completedCredits: event.target.value }))} aria-label="Completed credits" /></Field>
              <Field label="Target GPA" hint="0–4"><Input type="text" inputMode="decimal" value={contextForm.targetGpa} onChange={(event) => setContextForm((current) => ({ ...current, targetGpa: event.target.value }))} aria-label="Target cumulative GPA" /></Field>
            </div>
          </section>

          <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-tool-controls-border)] bg-[var(--color-tool-controls-bg)]">
            <div className="flex items-center justify-between gap-2 border-b border-[var(--color-border-subtle)] px-4 py-3">
              <div><h2 className="text-sm font-black text-[var(--color-text-primary)]">Semester courses</h2><p className="text-xs text-[var(--color-text-tertiary)]">Use Count/Skip for pass/fail or withdrawn courses.</p></div>
              <Button size="sm" variant="secondary" onClick={addCourse} leftIcon={<Plus className="h-3.5 w-3.5" />}>Add</Button>
            </div>
            <div className="max-h-[430px] overflow-auto p-3">
              <div className="min-w-[390px] space-y-2">
                <div className="grid grid-cols-[minmax(0,1fr)_72px_60px_58px_44px] gap-2 px-1 text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]"><span>Course</span><span>Grade</span><span>Credits</span><span>Use</span><span /></div>
                {courseForms.map((course, index) => (
                  <div key={course.id} className={`grid grid-cols-[minmax(0,1fr)_72px_60px_58px_44px] gap-2 rounded-[var(--radius-sm)] p-1 ${course.included ? "bg-transparent" : "bg-[var(--color-surface-subtle)] opacity-70"}`}>
                    <Input value={course.name} onChange={(event) => updateCourse(course.id, { name: event.target.value })} placeholder={`Course ${index + 1}`} aria-label={`Course ${index + 1} name`} />
                    <Select value={course.grade} onChange={(event) => updateCourse(course.id, { grade: event.target.value as LetterGrade })} aria-label={`Course ${index + 1} grade`}>{LETTER_GRADES.map((grade) => <option key={grade} value={grade}>{grade}</option>)}</Select>
                    <Input type="text" inputMode="decimal" value={course.credits} onChange={(event) => updateCourse(course.id, { credits: event.target.value })} aria-label={`Course ${index + 1} credits`} />
                    <Button size="sm" variant={course.included ? "primary" : "secondary"} onClick={() => updateCourse(course.id, { included: !course.included })} aria-pressed={course.included}>{course.included ? "Count" : "Skip"}</Button>
                    <Button size="icon" variant="ghost" className="h-11 w-11" onClick={() => removeCourse(course.id)} disabled={courseForms.length <= 1} aria-label={`Remove course ${index + 1}`} leftIcon={<Trash2 className="h-4 w-4" />} />
                  </div>
                ))}
              </div>
            </div>
          </section>
          <details className="group rounded-[var(--radius-md)] border border-[var(--color-tool-controls-border)] bg-[var(--color-tool-controls-header)]">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3.5 text-sm font-black text-[var(--color-text-primary)] outline-none hover:bg-[var(--color-control-hover)] focus-visible:shadow-[var(--focus-ring)] [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-[var(--color-primary-text-strong)]" />Practical presets</span>
              <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Load sample data</span>
            </summary>
            <div className="border-t border-[var(--color-tool-controls-border)] p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-xs text-[var(--color-text-secondary)]">Load a realistic semester and edit any value.</p>
                <Button size="sm" variant="ghost" onClick={reset} leftIcon={<RotateCcw className="h-3.5 w-3.5" />}>Reset</Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
              {(showAllPresets ? GPA_PRESETS : GPA_PRESETS.slice(0, 6)).map((preset) => (
                <button key={preset.id} type="button" onClick={() => applyPreset(preset.id)} className="min-h-24 min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-3 text-left transition hover:border-[var(--color-primary)] hover:bg-[var(--color-control-hover)]">
                  <span className="block truncate text-xs font-bold text-[var(--color-text-primary)]">{preset.name}</span>
                  <span className="mt-1 block line-clamp-2 text-xs leading-4 text-[var(--color-text-tertiary)]">{preset.description}</span>
                </button>
              ))}
              </div>
              {GPA_PRESETS.length > 6 ? (
                <Button className="mt-2 w-full" size="sm" variant="ghost" aria-expanded={showAllPresets} onClick={() => setShowAllPresets((value) => !value)}>
                  {showAllPresets ? "Show fewer semesters" : `Show all ${GPA_PRESETS.length} semesters`}
                </Button>
              ) : null}
            </div>
          </details>
        </aside>

        <main id="gpa-result" data-tool-region="result" className="min-w-0 scroll-mt-28 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-tool-result-border)] bg-[var(--color-tool-result-bg)] shadow-[var(--shadow-tool-result)]">
          <div className="flex flex-col gap-3 border-b border-[var(--color-tool-result-border)] bg-[var(--color-tool-result-header)] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div><div className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Live result</div><h2 className="mt-1 text-lg font-black text-[var(--color-text-primary)]">Your GPA analysis</h2><p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">Edit courses on the left. Semester, cumulative, and target results update immediately.</p></div>
            <div className="flex max-w-full flex-nowrap gap-1 overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-tool-result-border)] bg-[var(--color-surface-raised)] p-1">
              {tabs.map((tab) => <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`rounded-[var(--radius-sm)] px-2.5 py-1.5 text-xs font-bold transition ${activeTab === tab.id ? "bg-[var(--color-surface-base)] text-[var(--color-primary-text-strong)] shadow-[var(--shadow-xs)]" : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"}`}>{tab.label}</button>)}
            </div>
          </div>

          {activeTab === "overview" ? (
            <div className="space-y-4 p-4">
              <div className="grid gap-3 md:grid-cols-[minmax(0,1.2fr)_minmax(250px,0.8fr)]">
                <section className="rounded-[var(--radius-md)] border border-[var(--color-tool-result-border)] bg-[var(--color-surface-raised)] p-5 shadow-[var(--shadow-sm)]">
                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <div><div className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Semester GPA</div><div className="mt-1 text-6xl font-black tracking-[-0.05em] text-[var(--color-text-primary)]">{formatGpa(analysis.semester.gpa, 3)}</div><div className="mt-1 text-xs font-bold text-[var(--color-primary-text-strong)]">{gpaStanding(analysis.semester.gpa)} · common 4.0 scale</div></div>
                    <div className="grid grid-cols-2 gap-2"><MetricCard label="Projected cumulative" value={formatGpa(analysis.projectedCumulativeGpa, 3)} hint={`${analysis.projectedTotalCredits} credits`} /><MetricCard label="Quality points" value={analysis.semester.qualityPoints.toFixed(2)} hint={`${analysis.semester.totalCredits} term credits`} /></div>
                  </div>
                </section>
                <section className={`rounded-[var(--radius-md)] border p-4 ${TARGET_STYLES[analysis.targetStatus]}`}>
                  <div className="flex items-center justify-between gap-2"><div><div className="text-xs font-bold uppercase tracking-[0.08em] opacity-75">Target status</div><div className="mt-1 text-lg font-black">{TARGET_LABELS[analysis.targetStatus]}</div></div><Target className="h-6 w-6" /></div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs"><div><div className="opacity-70">Required term GPA</div><div className="font-mono text-lg font-black">{formatGpa(analysis.requiredSemesterGpa)}</div></div><div><div className="opacity-70">Projected gap</div><div className="font-mono text-lg font-black">{analysis.targetGap === null ? "—" : `${analysis.targetGap >= 0 ? "+" : ""}${analysis.targetGap.toFixed(3)}`}</div></div></div>
                  <div className="mt-2 text-xs leading-5 opacity-85">{analysis.requiredGradeLabel}</div>
                </section>
              </div>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                <section>
                  <div className="mb-2 flex items-center justify-between"><div><h3 className="text-sm font-black text-[var(--color-text-primary)]">Grade distribution</h3><p className="text-xs text-[var(--color-text-tertiary)]">Credit share by letter grade, not just course count.</p></div><Gauge className="h-5 w-5 text-[var(--color-primary-text-strong)]" /></div>
                  <div className="space-y-2 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3">
                    {analysis.distribution.length ? analysis.distribution.map((row) => (
                      <div key={row.grade} className="grid grid-cols-[38px_minmax(0,1fr)_110px] items-center gap-2 text-xs">
                        <span className="font-mono font-black text-[var(--color-text-primary)]">{row.grade}</span>
                        <div className="h-2.5 overflow-hidden rounded-full bg-[var(--color-surface-subtle)]"><div className="h-full rounded-full bg-[var(--color-accent)]" style={{ width: `${row.sharePercent}%` }} /></div>
                        <span className="text-right text-xs text-[var(--color-text-tertiary)]">{row.credits} cr · {row.sharePercent}%</span>
                      </div>
                    )) : <div className="py-8 text-center text-sm text-[var(--color-text-tertiary)]">Add valid included courses to see the distribution.</div>}
                  </div>
                </section>
                <section className="space-y-3 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4">
                  <div className="flex items-center gap-2"><Award className="h-5 w-5 text-[var(--color-primary-text-strong)]" /><h3 className="text-sm font-black text-[var(--color-text-primary)]">Term snapshot</h3></div>
                  <div className="grid grid-cols-2 gap-2"><MetricCard label="Counted" value={String(analysis.semester.countedCourses)} hint="courses" /><MetricCard label="Excluded" value={String(analysis.excludedCourseCount)} hint="pass/fail or skipped" /><MetricCard label="Prior quality" value={analysis.completedQualityPoints.toFixed(1)} hint="estimated points" /><MetricCard label="Invalid rows" value={String(analysis.invalidCourseCount)} hint="not counted" /></div>
                  <div className="rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-2.5 text-xs leading-5 text-[var(--color-text-secondary)]">GPA is credit-weighted. A 4-credit course changes the result four times as much as a 1-credit course with the same grade.</div>
                </section>
              </div>
            </div>
          ) : null}

          {activeTab === "courses" ? (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border-subtle)] px-4 py-3"><div><h3 className="text-sm font-black text-[var(--color-text-primary)]">Course contribution</h3><p className="text-xs text-[var(--color-text-tertiary)]">See the grade points, weighted quality points, and semester share for every row.</p></div><Button size="sm" variant="secondary" onClick={() => downloadText("gpa-courses.csv", coursesCsv, "text/csv;charset=utf-8")} leftIcon={<FileSpreadsheet className="h-4 w-4" />}>CSV</Button></div>
              <div className="max-h-[560px] overflow-auto"><table className="w-full min-w-[48rem] border-collapse text-right text-xs"><thead className="sticky top-0 z-10 bg-[var(--color-surface-subtle)] text-[var(--color-text-tertiary)]"><tr>{["Course", "Status", "Grade", "Points", "Credits", "Quality points", "Weight"].map((heading) => <th key={heading} className="px-3 py-2 font-semibold first:text-left">{heading}</th>)}</tr></thead><tbody>{analysis.courseRows.map((row, index) => <tr key={row.id} className="border-t border-[var(--color-border-subtle)] hover:bg-[var(--color-control-hover)]"><td className="px-3 py-2 text-left font-bold text-[var(--color-text-primary)]">{row.name.trim() || `Course ${index + 1}`}</td><td className="px-3 py-2"><span className={`rounded-full px-2 py-1 text-xs font-bold ${row.included && row.validCredits ? "bg-[var(--color-success-bg)] text-[var(--color-success-text)]" : "bg-[var(--color-surface-subtle)] text-[var(--color-text-tertiary)]"}`}>{row.included ? row.validCredits ? "Counted" : "Invalid" : "Skipped"}</span></td><td className="px-3 py-2 font-mono font-black">{row.grade}</td><td className="px-3 py-2">{row.gradePoints.toFixed(1)}</td><td className="px-3 py-2">{Number.isFinite(row.credits) ? row.credits : "—"}</td><td className="px-3 py-2 font-bold text-[var(--color-text-primary)]">{row.qualityPoints.toFixed(2)}</td><td className="px-3 py-2">{row.semesterWeightPercent.toFixed(1)}%</td></tr>)}</tbody></table></div>
            </div>
          ) : null}

          {activeTab === "planner" ? (
            <div className="space-y-4 p-4">
              <section className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3"><div><div className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Required semester average</div><div className="mt-1 text-4xl font-black tracking-tight text-[var(--color-text-primary)]">{formatGpa(analysis.requiredSemesterGpa, 3)}</div><div className="mt-1 text-xs font-bold text-[var(--color-primary-text-strong)]">{analysis.requiredGradeLabel}</div></div><div className={`rounded-full border px-3 py-1.5 text-xs font-black ${TARGET_STYLES[analysis.targetStatus]}`}>{TARGET_LABELS[analysis.targetStatus]}</div></div>
                <div className="mt-5 space-y-3">
                  <div><div className="mb-1 flex justify-between text-xs text-[var(--color-text-secondary)]"><span>Required</span><span>{formatGpa(analysis.requiredSemesterGpa)}</span></div><div className="h-3 overflow-hidden rounded-full bg-[var(--color-surface-subtle)]"><div className="h-full rounded-full bg-[var(--color-warning)]" style={{ width: `${requiredWidth}%` }} /></div></div>
                  <div><div className="mb-1 flex justify-between text-xs text-[var(--color-text-secondary)]"><span>Entered grades</span><span>{formatGpa(analysis.semester.gpa)}</span></div><div className="h-3 overflow-hidden rounded-full bg-[var(--color-surface-subtle)]"><div className="h-full rounded-full bg-[var(--color-accent)]" style={{ width: `${semesterWidth}%` }} /></div></div>
                </div>
              </section>

              <section><div className="mb-2"><h3 className="text-sm font-black text-[var(--color-text-primary)]">What-if semester averages</h3><p className="text-xs text-[var(--color-text-tertiary)]">Projected cumulative GPA if the entered credit load averages each grade band.</p></div><div className="overflow-auto rounded-[var(--radius-md)] border border-[var(--color-border-subtle)]"><table className="w-full min-w-[32rem] text-right text-sm"><thead className="bg-[var(--color-surface-subtle)] text-[var(--color-text-tertiary)]"><tr><th className="px-4 py-3 text-left">Average</th><th className="px-4 py-3">Term GPA</th><th className="px-4 py-3">Projected cumulative</th><th className="px-4 py-3">Against target</th></tr></thead><tbody>{([4, 3.7, 3.3, 3, 2.7, 2] as const).map((average) => { const projected = projectCumulativeGpa(context.completedGpa, context.completedCredits, average, analysis.semester.totalCredits); const gap = projected !== null && Number.isFinite(context.targetGpa) ? projected - context.targetGpa : null; return <tr key={average} className="border-t border-[var(--color-border-subtle)]"><td className="px-4 py-3 text-left font-bold text-[var(--color-text-primary)]">{average === 4 ? "A" : average === 3.7 ? "A-" : average === 3.3 ? "B+" : average === 3 ? "B" : average === 2.7 ? "B-" : "C"} average</td><td className="px-4 py-3 font-mono">{average.toFixed(1)}</td><td className="px-4 py-3 font-mono font-black text-[var(--color-text-primary)]">{formatGpa(projected, 3)}</td><td className={`px-4 py-3 font-bold ${gap !== null && gap >= 0 ? "text-[var(--color-success-text)]" : "text-[var(--color-warning-text)]"}`}>{gap === null ? "—" : `${gap >= 0 ? "+" : ""}${gap.toFixed(3)}`}</td></tr>; })}</tbody></table></div></section>

              <div className="rounded-[var(--radius-md)] border border-[var(--color-info-border)] bg-[var(--color-info-bg)] p-3 text-xs leading-5 text-[var(--color-info-text)]">The planner assumes all entered semester credits count toward cumulative GPA. Institutions may replace repeated grades, cap transferable credits, or calculate major and overall GPA separately.</div>
            </div>
          ) : null}

          {activeTab === "exports" ? (
            <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_280px]">
              <section><div className="mb-2 flex items-center gap-2"><PackageCheck className="h-5 w-5 text-[var(--color-primary-text-strong)]" /><div><h3 className="text-sm font-black text-[var(--color-text-primary)]">Production checks</h3><p className="text-xs text-[var(--color-text-tertiary)]">Validation and planning notes before relying on the result.</p></div></div><div className="space-y-2">{checks.map((check) => <div key={check.id} className={`rounded-[var(--radius-md)] border p-3 ${CHECK_STYLES[check.level]}`}><div className="flex gap-2"><span className="mt-0.5">{check.level === "success" ? <CheckCircle2 className="h-4 w-4" /> : <Flag className="h-4 w-4" />}</span><div><div className="text-xs font-black">{check.title}</div><div className="mt-0.5 text-xs leading-5 opacity-85">{check.message}</div></div></div></div>)}</div></section>
              <section className="space-y-2 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4"><div className="mb-2 flex items-center gap-2"><Download className="h-5 w-5 text-[var(--color-primary-text-strong)]" /><h3 className="text-sm font-black text-[var(--color-text-primary)]">Exports</h3></div><CopyButton text={summaryMarkdown} className="w-full">Copy summary</CopyButton><Button className="w-full" variant="secondary" onClick={() => downloadText("gpa-summary.md", summaryMarkdown, "text/markdown;charset=utf-8")} leftIcon={<Download className="h-4 w-4" />}>Markdown summary</Button><Button className="w-full" variant="secondary" onClick={() => downloadText("gpa-courses.csv", coursesCsv, "text/csv;charset=utf-8")} leftIcon={<FileSpreadsheet className="h-4 w-4" />}>Courses CSV</Button><Button className="w-full" variant="secondary" onClick={() => downloadText("gpa-report.json", reportJson, "application/json;charset=utf-8")} leftIcon={<FileJson className="h-4 w-4" />}>JSON audit report</Button><Button className="w-full" onClick={downloadPack} leftIcon={<PackageCheck className="h-4 w-4" />}>Download analysis pack</Button><div className="pt-2 text-xs leading-4 text-[var(--color-text-tertiary)]">Exports include entered grades and academic context. Review before sharing if course names are sensitive.</div></section>
            </div>
          ) : null}
        </main>
      </div>

      <ToolMobileActions>
        <a href="#gpa-result" className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-4 text-sm font-bold text-[var(--color-primary-text)] shadow-[var(--shadow-xs)]">View result</a>
        <Button variant="secondary" onClick={reset} leftIcon={<RotateCcw className="h-4 w-4" />}>Reset</Button>
      </ToolMobileActions>
    </div>
  );
}
