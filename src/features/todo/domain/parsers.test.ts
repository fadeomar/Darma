import { describe, expect, it } from "vitest";
import { parseBrainDumpToTasks, parseQuickCaptureInput } from "./parsers";

const baseDate = new Date("2026-06-27T08:00:00.000Z");

describe("parseQuickCaptureInput", () => {
  it("extracts tags, priority, and due dates", () => {
    const result = parseQuickCaptureInput("Submit proposal tomorrow #work !high", { baseDate });
    expect(result?.title).toBe("Submit proposal");
    expect(result?.tags).toEqual(["work"]);
    expect(result?.priority).toBe("high");
    expect(result?.dueAt?.slice(0, 10)).toBe("2026-06-28");
  });

  it("supports Arabic priority and date hints", () => {
    const result = parseQuickCaptureInput("راجع الدرس بكرا #study مهم", { baseDate });
    expect(result?.title).toBe("راجع الدرس");
    expect(result?.priority).toBe("high");
    expect(result?.dueAt?.slice(0, 10)).toBe("2026-06-28");
  });

  it("returns null for empty input", () => {
    expect(parseQuickCaptureInput("   ")).toBeNull();
  });
});

describe("parseBrainDumpToTasks", () => {
  it("parses nested bullets as subtasks", () => {
    const tasks = parseBrainDumpToTasks("Prepare exam #study !urgent\n  - Review chapter 1\n  - Solve questions", { baseDate });
    expect(tasks).toHaveLength(1);
    expect(tasks[0].priority).toBe("urgent");
    expect(tasks[0].tags).toEqual(["study"]);
    expect(tasks[0].subtasks?.map((t) => t.title)).toEqual(["Review chapter 1", "Solve questions"]);
  });

  it("splits long single-line brain dumps", () => {
    const tasks = parseBrainDumpToTasks("Prepare proposal, review budget, export PDF, send by email #work !high", { baseDate });
    expect(tasks.map((t) => t.title)).toEqual(["Prepare proposal", "review budget", "export PDF", "send by email"]);
  });
});
