"use client";

import { useMemo, useState } from "react";
import JSZip from "jszip";
import {
  Award,
  BookOpenCheck,
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
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { Button, CopyButton, Input, Select } from "@/components/ui";
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

function SummaryCard({ label, value, hint, icon }: { label: string; value: string; hint: string; icon: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-3 py-2.5 shadow-[var(--shadow-xs)]">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{label}</span>
        <span className="text-[var(--color-primary)]">{icon}</span>
      </div>
      <div className="mt-1 truncate text-xl font-black tracking-tight text-[var(--color-text-primary)]" title={value}>{value}</div>
      <div className="mt-0.5 truncate text-[11px] text-[var(--color-text-tertiary)]">{hint}</div>
    </div>
  );
}

function MetricCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3">
      <div className="truncate text-[10px] font-bold uppercase tracking-[0.07em] text-[var(--color-text-tertiary)]">{label}</div>
      <div className="mt-1 truncate font-mono text-lg font-black text-[var(--color-text-primary)]" title={value}>{value}</div>
      {hint ? <div className="mt-0.5 truncate text-[10px] text-[var(--color-text-tertiary)]">{hint}</div> : null}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 flex items-center justify-between gap-2 text-[11px] font-bold text-[var(--color-text-secondary)]">
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
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <SummaryCard label="Semester GPA" value={formatGpa(analysis.semester.gpa, 3)} hint={gpaStanding(analysis.semester.gpa)} icon={<Award className="h-4 w-4" />} />
        <SummaryCard label="Projected cumulative" value={formatGpa(analysis.projectedCumulativeGpa, 3)} hint={`${analysis.projectedTotalCredits} total credits`} icon={<TrendingUp className="h-4 w-4" />} />
        <SummaryCard label="Semester load" value={`${analysis.semester.totalCredits} cr`} hint={`${analysis.semester.countedCourses} counted courses`} icon={<BookOpenCheck className="h-4 w-4" />} />
        <SummaryCard label="Production review" value={reviewCount ? `${reviewCount} review` : "Ready"} hint={`${checks.length} checks completed`} icon={reviewCount ? <Flag className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />} />
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[430px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 shadow-[var(--shadow-sm)]">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-black text-[var(--color-text-primary)]"><Sparkles className="h-4 w-4 text-[var(--color-primary)]" />Practical presets</h2>
                <p className="mt-0.5 text-[11px] text-[var(--color-text-tertiary)]">Load a realistic semester and edit any value.</p>
              </div>
              <Button size="sm" variant="ghost" onClick={reset} leftIcon={<RotateCcw className="h-3.5 w-3.5" />}>Reset</Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {GPA_PRESETS.map((preset) => (
                <button key={preset.id} type="button" onClick={() => applyPreset(preset.id)} className="min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-2.5 text-left transition hover:border-[var(--color-primary)] hover:bg-[var(--color-control-hover)]">
                  <span className="block truncate text-xs font-bold text-[var(--color-text-primary)]">{preset.name}</span>
                  <span className="mt-1 block line-clamp-2 text-[10px] leading-4 text-[var(--color-text-tertiary)]">{preset.description}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 shadow-[var(--shadow-sm)]">
            <div className="mb-3 flex items-center gap-2"><GraduationCap className="h-4 w-4 text-[var(--color-primary)]" /><div><h2 className="text-sm font-black text-[var(--color-text-primary)]">Current record & target</h2><p className="text-[11px] text-[var(--color-text-tertiary)]">Use zero completed credits for a first semester.</p></div></div>
            <div className="grid grid-cols-3 gap-2">
              <Field label="Current GPA" hint="0–4"><Input type="text" inputMode="decimal" value={contextForm.completedGpa} onChange={(event) => setContextForm((current) => ({ ...current, completedGpa: event.target.value }))} aria-label="Current cumulative GPA" /></Field>
              <Field label="Completed" hint="credits"><Input type="text" inputMode="decimal" value={contextForm.completedCredits} onChange={(event) => setContextForm((current) => ({ ...current, completedCredits: event.target.value }))} aria-label="Completed credits" /></Field>
              <Field label="Target GPA" hint="0–4"><Input type="text" inputMode="decimal" value={contextForm.targetGpa} onChange={(event) => setContextForm((current) => ({ ...current, targetGpa: event.target.value }))} aria-label="Target cumulative GPA" /></Field>
            </div>
          </section>

          <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] shadow-[var(--shadow-sm)]">
            <div className="flex items-center justify-between gap-2 border-b border-[var(--color-border-subtle)] px-4 py-3">
              <div><h2 className="text-sm font-black text-[var(--color-text-primary)]">Semester courses</h2><p className="text-[11px] text-[var(--color-text-tertiary)]">Use Count/Skip for pass/fail or withdrawn courses.</p></div>
              <Button size="sm" variant="secondary" onClick={addCourse} leftIcon={<Plus className="h-3.5 w-3.5" />}>Add</Button>
            </div>
            <div className="max-h-[430px] overflow-auto p-3">
              <div className="min-w-[390px] space-y-2">
                <div className="grid grid-cols-[minmax(0,1fr)_72px_60px_58px_32px] gap-2 px-1 text-[9px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]"><span>Course</span><span>Grade</span><span>Credits</span><span>Use</span><span /></div>
                {courseForms.map((course, index) => (
                  <div key={course.id} className={`grid grid-cols-[minmax(0,1fr)_72px_60px_58px_32px] gap-2 rounded-[var(--radius-sm)] p-1 ${course.included ? "bg-transparent" : "bg-[var(--color-surface-subtle)] opacity-70"}`}>
                    <Input value={course.name} onChange={(event) => updateCourse(course.id, { name: event.target.value })} placeholder={`Course ${index + 1}`} aria-label={`Course ${index + 1} name`} />
                    <Select value={course.grade} onChange={(event) => updateCourse(course.id, { grade: event.target.value as LetterGrade })} aria-label={`Course ${index + 1} grade`}>{LETTER_GRADES.map((grade) => <option key={grade} value={grade}>{grade}</option>)}</Select>
                    <Input type="text" inputMode="decimal" value={course.credits} onChange={(event) => updateCourse(course.id, { credits: event.target.value })} aria-label={`Course ${index + 1} credits`} />
                    <Button size="sm" variant={course.included ? "primary" : "secondary"} onClick={() => updateCourse(course.id, { included: !course.included })} aria-pressed={course.included}>{course.included ? "Count" : "Skip"}</Button>
                    <Button size="icon" variant="ghost" onClick={() => removeCourse(course.id)} disabled={courseForms.length <= 1} aria-label={`Remove course ${index + 1}`} leftIcon={<Trash2 className="h-4 w-4" />} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        </aside>

        <main className="min-w-0 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-sm)]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-4 py-3">
            <div><h2 className="text-sm font-black text-[var(--color-text-primary)]">GPA analysis</h2><p className="text-[11px] text-[var(--color-text-tertiary)]">Semester, cumulative, contribution, and target planning.</p></div>
            <div className="flex flex-wrap gap-1 rounded-[var(--radius-md)] bg-[var(--color-surface-subtle)] p-1">
              {tabs.map((tab) => <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`rounded-[var(--radius-sm)] px-2.5 py-1.5 text-[11px] font-bold transition ${activeTab === tab.id ? "bg-[var(--color-surface-base)] text-[var(--color-primary)] shadow-[var(--shadow-xs)]" : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"}`}>{tab.label}</button>)}
            </div>
          </div>

          {activeTab === "overview" ? (
            <div className="space-y-4 p-4">
              <div className="grid gap-3 md:grid-cols-[minmax(0,1.2fr)_minmax(250px,0.8fr)]">
                <section className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-5">
                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <div><div className="text-[10px] font-bold uppercase tracking-[0.09em] text-[var(--color-text-tertiary)]">Semester GPA</div><div className="mt-1 text-6xl font-black tracking-[-0.05em] text-[var(--color-text-primary)]">{formatGpa(analysis.semester.gpa, 3)}</div><div className="mt-1 text-xs font-bold text-[var(--color-primary)]">{gpaStanding(analysis.semester.gpa)} · common 4.0 scale</div></div>
                    <div className="grid grid-cols-2 gap-2"><MetricCard label="Projected cumulative" value={formatGpa(analysis.projectedCumulativeGpa, 3)} hint={`${analysis.projectedTotalCredits} credits`} /><MetricCard label="Quality points" value={analysis.semester.qualityPoints.toFixed(2)} hint={`${analysis.semester.totalCredits} term credits`} /></div>
                  </div>
                </section>
                <section className={`rounded-[var(--radius-md)] border p-4 ${TARGET_STYLES[analysis.targetStatus]}`}>
                  <div className="flex items-center justify-between gap-2"><div><div className="text-[10px] font-bold uppercase tracking-[0.08em] opacity-75">Target status</div><div className="mt-1 text-lg font-black">{TARGET_LABELS[analysis.targetStatus]}</div></div><Target className="h-6 w-6" /></div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs"><div><div className="opacity-70">Required term GPA</div><div className="font-mono text-lg font-black">{formatGpa(analysis.requiredSemesterGpa)}</div></div><div><div className="opacity-70">Projected gap</div><div className="font-mono text-lg font-black">{analysis.targetGap === null ? "—" : `${analysis.targetGap >= 0 ? "+" : ""}${analysis.targetGap.toFixed(3)}`}</div></div></div>
                  <div className="mt-2 text-[11px] leading-5 opacity-85">{analysis.requiredGradeLabel}</div>
                </section>
              </div>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                <section>
                  <div className="mb-2 flex items-center justify-between"><div><h3 className="text-sm font-black text-[var(--color-text-primary)]">Grade distribution</h3><p className="text-[11px] text-[var(--color-text-tertiary)]">Credit share by letter grade, not just course count.</p></div><Gauge className="h-5 w-5 text-[var(--color-primary)]" /></div>
                  <div className="space-y-2 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3">
                    {analysis.distribution.length ? analysis.distribution.map((row) => (
                      <div key={row.grade} className="grid grid-cols-[38px_minmax(0,1fr)_110px] items-center gap-2 text-xs">
                        <span className="font-mono font-black text-[var(--color-text-primary)]">{row.grade}</span>
                        <div className="h-2.5 overflow-hidden rounded-full bg-[var(--color-surface-subtle)]"><div className="h-full rounded-full bg-[var(--color-accent)]" style={{ width: `${row.sharePercent}%` }} /></div>
                        <span className="text-right text-[11px] text-[var(--color-text-tertiary)]">{row.credits} cr · {row.sharePercent}%</span>
                      </div>
                    )) : <div className="py-8 text-center text-sm text-[var(--color-text-tertiary)]">Add valid included courses to see the distribution.</div>}
                  </div>
                </section>
                <section className="space-y-3 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4">
                  <div className="flex items-center gap-2"><Award className="h-5 w-5 text-[var(--color-primary)]" /><h3 className="text-sm font-black text-[var(--color-text-primary)]">Term snapshot</h3></div>
                  <div className="grid grid-cols-2 gap-2"><MetricCard label="Counted" value={String(analysis.semester.countedCourses)} hint="courses" /><MetricCard label="Excluded" value={String(analysis.excludedCourseCount)} hint="pass/fail or skipped" /><MetricCard label="Prior quality" value={analysis.completedQualityPoints.toFixed(1)} hint="estimated points" /><MetricCard label="Invalid rows" value={String(analysis.invalidCourseCount)} hint="not counted" /></div>
                  <div className="rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-2.5 text-[11px] leading-5 text-[var(--color-text-secondary)]">GPA is credit-weighted. A 4-credit course changes the result four times as much as a 1-credit course with the same grade.</div>
                </section>
              </div>
            </div>
          ) : null}

          {activeTab === "courses" ? (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border-subtle)] px-4 py-3"><div><h3 className="text-sm font-black text-[var(--color-text-primary)]">Course contribution</h3><p className="text-[11px] text-[var(--color-text-tertiary)]">See the grade points, weighted quality points, and semester share for every row.</p></div><Button size="sm" variant="secondary" onClick={() => downloadText("gpa-courses.csv", coursesCsv, "text/csv;charset=utf-8")} leftIcon={<FileSpreadsheet className="h-4 w-4" />}>CSV</Button></div>
              <div className="max-h-[560px] overflow-auto"><table className="w-full min-w-[48rem] border-collapse text-right text-xs"><thead className="sticky top-0 z-10 bg-[var(--color-surface-subtle)] text-[var(--color-text-tertiary)]"><tr>{["Course", "Status", "Grade", "Points", "Credits", "Quality points", "Weight"].map((heading) => <th key={heading} className="px-3 py-2 font-semibold first:text-left">{heading}</th>)}</tr></thead><tbody>{analysis.courseRows.map((row, index) => <tr key={row.id} className="border-t border-[var(--color-border-subtle)] hover:bg-[var(--color-control-hover)]"><td className="px-3 py-2 text-left font-bold text-[var(--color-text-primary)]">{row.name.trim() || `Course ${index + 1}`}</td><td className="px-3 py-2"><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${row.included && row.validCredits ? "bg-[var(--color-success-bg)] text-[var(--color-success-text)]" : "bg-[var(--color-surface-subtle)] text-[var(--color-text-tertiary)]"}`}>{row.included ? row.validCredits ? "Counted" : "Invalid" : "Skipped"}</span></td><td className="px-3 py-2 font-mono font-black">{row.grade}</td><td className="px-3 py-2">{row.gradePoints.toFixed(1)}</td><td className="px-3 py-2">{Number.isFinite(row.credits) ? row.credits : "—"}</td><td className="px-3 py-2 font-bold text-[var(--color-text-primary)]">{row.qualityPoints.toFixed(2)}</td><td className="px-3 py-2">{row.semesterWeightPercent.toFixed(1)}%</td></tr>)}</tbody></table></div>
            </div>
          ) : null}

          {activeTab === "planner" ? (
            <div className="space-y-4 p-4">
              <section className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3"><div><div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Required semester average</div><div className="mt-1 text-4xl font-black tracking-tight text-[var(--color-text-primary)]">{formatGpa(analysis.requiredSemesterGpa, 3)}</div><div className="mt-1 text-xs font-bold text-[var(--color-primary)]">{analysis.requiredGradeLabel}</div></div><div className={`rounded-full border px-3 py-1.5 text-xs font-black ${TARGET_STYLES[analysis.targetStatus]}`}>{TARGET_LABELS[analysis.targetStatus]}</div></div>
                <div className="mt-5 space-y-3">
                  <div><div className="mb-1 flex justify-between text-[11px] text-[var(--color-text-secondary)]"><span>Required</span><span>{formatGpa(analysis.requiredSemesterGpa)}</span></div><div className="h-3 overflow-hidden rounded-full bg-[var(--color-surface-subtle)]"><div className="h-full rounded-full bg-[var(--color-warning)]" style={{ width: `${requiredWidth}%` }} /></div></div>
                  <div><div className="mb-1 flex justify-between text-[11px] text-[var(--color-text-secondary)]"><span>Entered grades</span><span>{formatGpa(analysis.semester.gpa)}</span></div><div className="h-3 overflow-hidden rounded-full bg-[var(--color-surface-subtle)]"><div className="h-full rounded-full bg-[var(--color-accent)]" style={{ width: `${semesterWidth}%` }} /></div></div>
                </div>
              </section>

              <section><div className="mb-2"><h3 className="text-sm font-black text-[var(--color-text-primary)]">What-if semester averages</h3><p className="text-[11px] text-[var(--color-text-tertiary)]">Projected cumulative GPA if the entered credit load averages each grade band.</p></div><div className="overflow-auto rounded-[var(--radius-md)] border border-[var(--color-border-subtle)]"><table className="w-full min-w-[32rem] text-right text-sm"><thead className="bg-[var(--color-surface-subtle)] text-[var(--color-text-tertiary)]"><tr><th className="px-4 py-3 text-left">Average</th><th className="px-4 py-3">Term GPA</th><th className="px-4 py-3">Projected cumulative</th><th className="px-4 py-3">Against target</th></tr></thead><tbody>{([4, 3.7, 3.3, 3, 2.7, 2] as const).map((average) => { const projected = projectCumulativeGpa(context.completedGpa, context.completedCredits, average, analysis.semester.totalCredits); const gap = projected !== null && Number.isFinite(context.targetGpa) ? projected - context.targetGpa : null; return <tr key={average} className="border-t border-[var(--color-border-subtle)]"><td className="px-4 py-3 text-left font-bold text-[var(--color-text-primary)]">{average === 4 ? "A" : average === 3.7 ? "A-" : average === 3.3 ? "B+" : average === 3 ? "B" : average === 2.7 ? "B-" : "C"} average</td><td className="px-4 py-3 font-mono">{average.toFixed(1)}</td><td className="px-4 py-3 font-mono font-black text-[var(--color-text-primary)]">{formatGpa(projected, 3)}</td><td className={`px-4 py-3 font-bold ${gap !== null && gap >= 0 ? "text-[var(--color-success-text)]" : "text-[var(--color-warning-text)]"}`}>{gap === null ? "—" : `${gap >= 0 ? "+" : ""}${gap.toFixed(3)}`}</td></tr>; })}</tbody></table></div></section>

              <div className="rounded-[var(--radius-md)] border border-[var(--color-info-border)] bg-[var(--color-info-bg)] p-3 text-xs leading-5 text-[var(--color-info-text)]">The planner assumes all entered semester credits count toward cumulative GPA. Institutions may replace repeated grades, cap transferable credits, or calculate major and overall GPA separately.</div>
            </div>
          ) : null}

          {activeTab === "exports" ? (
            <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_280px]">
              <section><div className="mb-2 flex items-center gap-2"><PackageCheck className="h-5 w-5 text-[var(--color-primary)]" /><div><h3 className="text-sm font-black text-[var(--color-text-primary)]">Production checks</h3><p className="text-[11px] text-[var(--color-text-tertiary)]">Validation and planning notes before relying on the result.</p></div></div><div className="space-y-2">{checks.map((check) => <div key={check.id} className={`rounded-[var(--radius-md)] border p-3 ${CHECK_STYLES[check.level]}`}><div className="flex gap-2"><span className="mt-0.5">{check.level === "success" ? <CheckCircle2 className="h-4 w-4" /> : <Flag className="h-4 w-4" />}</span><div><div className="text-xs font-black">{check.title}</div><div className="mt-0.5 text-[11px] leading-5 opacity-85">{check.message}</div></div></div></div>)}</div></section>
              <section className="space-y-2 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4"><div className="mb-2 flex items-center gap-2"><Download className="h-5 w-5 text-[var(--color-primary)]" /><h3 className="text-sm font-black text-[var(--color-text-primary)]">Exports</h3></div><CopyButton text={summaryMarkdown} className="w-full">Copy summary</CopyButton><Button className="w-full" variant="secondary" onClick={() => downloadText("gpa-summary.md", summaryMarkdown, "text/markdown;charset=utf-8")} leftIcon={<Download className="h-4 w-4" />}>Markdown summary</Button><Button className="w-full" variant="secondary" onClick={() => downloadText("gpa-courses.csv", coursesCsv, "text/csv;charset=utf-8")} leftIcon={<FileSpreadsheet className="h-4 w-4" />}>Courses CSV</Button><Button className="w-full" variant="secondary" onClick={() => downloadText("gpa-report.json", reportJson, "application/json;charset=utf-8")} leftIcon={<FileJson className="h-4 w-4" />}>JSON audit report</Button><Button className="w-full" onClick={downloadPack} leftIcon={<PackageCheck className="h-4 w-4" />}>Download analysis pack</Button><div className="pt-2 text-[10px] leading-4 text-[var(--color-text-tertiary)]">Exports include entered grades and academic context. Review before sharing if course names are sensitive.</div></section>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
