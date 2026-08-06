import { describe, expect, it } from "vitest";
import {
  DEFAULT_CODE_VIDEO_SETTINGS,
  buildCodeVideoTimeline,
  buildTimelineSrt,
  getPlaybackSnapshot,
  splitIntoTeachingChunks,
  type CodeVideoProject,
} from "./timeline";

const project: CodeVideoProject = {
  title: "Demo",
  html: "<main>\n  <h1>Hello</h1>\n</main>\n",
  css: "body {\n  margin: 0;\n}\n\nh1 {\n  color: red;\n}\n",
  js: "const title = document.querySelector('h1');\ntitle?.addEventListener('click', () => {\n  title.textContent = 'Done';\n});\n",
};

describe("code video timeline", () => {
  it("preserves source exactly when teaching chunks are joined", () => {
    expect(splitIntoTeachingChunks(project.html, "html").join("")).toBe(project.html);
    expect(splitIntoTeachingChunks(project.css, "css").join("")).toBe(project.css);
    expect(splitIntoTeachingChunks(project.js, "js").join("")).toBe(project.js);
  });

  it("reconstructs the complete project at the end", () => {
    const timeline = buildCodeVideoTimeline(project, DEFAULT_CODE_VIDEO_SETTINGS);
    const snapshot = getPlaybackSnapshot(timeline, project, timeline.totalDurationMs);
    expect(snapshot.project).toEqual(project);
    expect(snapshot.isComplete).toBe(true);
  });

  it("shows the finished preview during the opening reveal", () => {
    const timeline = buildCodeVideoTimeline(project, DEFAULT_CODE_VIDEO_SETTINGS);
    const snapshot = getPlaybackSnapshot(timeline, project, 100);
    expect(snapshot.previewProject).toEqual(project);
    expect(snapshot.project.html).toBe("");
  });

  it("shows finished source during a code-only opening reveal", () => {
    const timeline = buildCodeVideoTimeline(project, { ...DEFAULT_CODE_VIDEO_SETTINGS, layout: "code" });
    const snapshot = getPlaybackSnapshot(timeline, project, 100);
    expect(snapshot.focus).toBe("code");
    expect(snapshot.project).toEqual(project);
  });

  it("does not execute JavaScript until the complete JS file is committed", () => {
    const longProject = {
      ...project,
      js: Array.from({ length: 18 }, (_, index) => `const value${index} = ${index};`).join("\n"),
    };
    const timeline = buildCodeVideoTimeline(longProject, { ...DEFAULT_CODE_VIDEO_SETTINGS, layout: "alternate" });
    const jsTypingSteps = timeline.steps.filter((step) => step.type === "type" && step.file === "js");
    expect(jsTypingSteps.length).toBeGreaterThan(1);

    const firstJsStepIndex = timeline.steps.indexOf(jsTypingSteps[0]);
    const firstJsStepEnd = timeline.steps
      .slice(0, firstJsStepIndex + 1)
      .reduce((total, step) => total + step.durationMs, 0);
    const partialSnapshot = getPlaybackSnapshot(timeline, longProject, firstJsStepEnd);
    expect(partialSnapshot.project.js.length).toBeGreaterThan(0);
    expect(partialSnapshot.previewProject.js).toBe("");

    const finalSnapshot = getPlaybackSnapshot(timeline, longProject, timeline.totalDurationMs);
    expect(finalSnapshot.previewProject.js).toBe(longProject.js);
  });

  it("creates ordered captions", () => {
    const timeline = buildCodeVideoTimeline(project, DEFAULT_CODE_VIDEO_SETTINGS);
    expect(buildTimelineSrt(timeline)).toContain("Show the completed project");
  });
});
