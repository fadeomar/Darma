import { describe, expect, it } from "vitest";
import { buildCss, buildReport, checkContrast, colorCss, colorInput, composite, contrastRatio, DEFAULT_SETTINGS, findAlternatives, formatRatio, parseColor, readSettings, serializeSettings, TARGETS, type Target } from "./contrast";
const color = (value: string) => parseColor(value)!;
describe("color parsing", () => {
  it.each([
    ["#abc", "rgb(170 187 204 / 1)"], [" ABCDEF ", "rgb(171 205 239 / 1)"],
    ["rgb(255, 0, 0)", "rgb(255 0 0 / 1)"], ["rgb(100% 0% 0% / 50%)", "rgb(255 0 0 / 0.5)"],
    ["rgba(255, 0, 0, .5)", "rgb(255 0 0 / 0.5)"], ["hsl(120 100% 50%)", "rgb(0 255 0 / 1)"],
    ["hsla(0, 100%, 50%, .5)", "rgb(255 0 0 / 0.5)"], ["hsl(-120deg 100% 50%)", "rgb(0 0 255 / 1)"],
    ["hsl(.5turn 100% 50%)", "rgb(0 255 255 / 1)"], ["hsl(200grad 100% 50%)", "rgb(0 255 255 / 1)"],
  ])("parses %s", (input, expected) => expect(colorCss(color(input))).toBe(expected));
  it("preserves HEX alpha", () => { expect(color("#0000").a).toBe(0); expect(color("#11223380").a).toBe(128 / 255); expect(color("#abcd")).toEqual(color("#aabbccdd")); });
  it.each(["", "#12", "#12gg00", "rgb(300 0 0)", "rgb(0 0 0 / 2)", "rgb(0, 0, 0 / .5)", "rgb(0,,0)", "rgb(0 0)", "rgb(0 0 0 /)", "rgb(0 0 0 / .5 / .5)", "rgb(Infinity 0 0)", "hsl(0 50 50)", "hsl(0 101% 50%)", "var(--brand)", "url(x)", "x".repeat(121)])("rejects %s", (input) => expect(parseColor(input)).toBeNull());
});
describe("WCAG calculations", () => {
  it("returns extrema and opaque symmetry", () => { expect(contrastRatio(color("#000"), color("#fff"))).toBe(21); expect(contrastRatio(color("#fff"), color("#fff"))).toBe(1); expect(contrastRatio(color("#198578"), color("#fff"))).toBe(contrastRatio(color("#fff"), color("#198578"))); });
  it("classifies the documented greys", () => { expect(checkContrast(DEFAULT_SETTINGS)?.ratio).toBeCloseTo(4.478089453577215, 12); expect(checkContrast({ ...DEFAULT_SETTINGS, foreground: "#767676" })?.checks[0].pass).toBe(true); expect(checkContrast(DEFAULT_SETTINGS)?.checks.map((check) => check.pass)).toEqual([false, false, true, false, true]); });
  it("does not round into a false pass", () => { const result = checkContrast({ ...DEFAULT_SETTINGS, foreground: "#198578" })!; expect(result.ratio).toBeCloseTo(4.499139373950386, 12); expect(result.ratio.toFixed(2)).toBe("4.50"); expect(result.checks[0].pass).toBe(false); expect(formatRatio(result.ratio)).toBe("4.499139"); });
  it.each([3, 4.5, 7])("checks below and above %s", (limit) => {
    for (const delta of [-.000001, .000001]) {
      const desired = limit + delta, luminance = .05 * desired - .05, channel = 255 * (1.055 * luminance ** (1 / 2.4) - .055);
      const result = checkContrast({ ...DEFAULT_SETTINGS, foreground: `rgb(${channel} ${channel} ${channel})`, background: "#000" })!;
      expect(result.checks.find((check) => check.minimum === limit)?.pass).toBe(delta > 0);
    }
  });
  it("composites without rounding the effective channels", () => { expect(composite(color("rgba(0,0,0,.5)"), color("#fff"))).toEqual({ r: 127.5, g: 127.5, b: 127.5, a: 1 }); expect(contrastRatio(color("rgba(0,0,0,0)"), color("#fff"))).toBe(1); expect(contrastRatio(color("rgba(0,0,0,1)"), color("#fff"))).toBe(21); expect(contrastRatio(color("rgba(0,0,0,.5)"), color("#fff"))).toBeCloseTo(3.976653024912438, 12); });
  it("rejects a transparent background and invalid input", () => { expect(checkContrast({ ...DEFAULT_SETTINGS, background: "#fff8" })).toBeNull(); expect(checkContrast({ ...DEFAULT_SETTINGS, foreground: "invalid" })).toBeNull(); });
});
describe("alternatives", () => {
  it.each(["foreground", "background"] as const)("verifies final %s values and preserves the fixed color", (change) => {
    const alternatives = findAlternatives(DEFAULT_SETTINGS, change); expect(alternatives.length).toBeGreaterThan(0); expect(new Set(alternatives.map((item) => item.value)).size).toBe(alternatives.length);
    for (const item of alternatives) { const next = checkContrast({ ...DEFAULT_SETTINGS, [change]: item.value })!; expect(next.ratio).toBe(item.ratio); expect(next.ratio).toBeGreaterThanOrEqual(4.5); const fixed = change === "foreground" ? "background" : "foreground"; expect(next[fixed]).toEqual(color(DEFAULT_SETTINGS[fixed])); }
  });
  it("does not invent solutions for unreachable alpha constraints", () => { expect(findAlternatives({ ...DEFAULT_SETTINGS, foreground: "rgba(0,0,0,0)" }, "foreground")).toEqual([]); expect(findAlternatives({ ...DEFAULT_SETTINGS, foreground: "rgba(0,0,0,.1)", target: "normal-aaa" }, "foreground")).toEqual([]); });
  it("preserves alpha and verifies serialized color", () => { const settings = { ...DEFAULT_SETTINGS, foreground: "rgba(100,100,100,.8)" }; const alternatives = findAlternatives(settings, "foreground"); expect(alternatives.length).toBeGreaterThan(0); for (const item of alternatives) { expect(color(item.value).a).toBe(.8); expect(checkContrast({ ...settings, foreground: item.value })!.ratio).toBeGreaterThanOrEqual(4.5); } });
  it("does not repair passing pairs", () => expect(findAlternatives({ ...DEFAULT_SETTINGS, foreground: "#000" }, "foreground")).toEqual([]));
  it("verifies every suggestion across target and palette combinations", () => {
    for (const target of Object.keys(TARGETS) as Target[]) for (const foreground of ["#198578", "#ffcc00", "#777", "rgba(150,100,50,.65)"]) for (const background of ["#fff", "#222", "#CC4715"]) for (const change of ["foreground", "background"] as const) {
      const settings = { foreground, background, target }; for (const item of findAlternatives(settings, change)) expect(checkContrast({ ...settings, [change]: item.value })!.ratio).toBeGreaterThanOrEqual(TARGETS[target].minimum);
    }
  });
});
describe("sharing and exports", () => {
  it("round-trips opacity, inputs and target", () => { const settings = { ...DEFAULT_SETTINGS, foreground: "hsl(120 50% 20% / .9)", target: "large-aaa" as const }; expect(readSettings(serializeSettings(settings))).toEqual(settings); expect(parseColor(colorInput(color("rgba(1,2,3,.5)")))).toEqual(color("rgba(1,2,3,.5)")); });
  it.each(["?target=__proto__", "?target=unknown", "?fg=invalid", "?bg=%23fff8", "?fg=" + "x".repeat(701)])("rejects invalid shared settings", (search) => expect(readSettings(search)).toBeNull());
  it("exports judgments and effective color with alpha-preserving CSS", () => { const report = buildReport(DEFAULT_SETTINGS); expect(report).toContain("Normal text · AA: Fail"); expect(report).toContain("Large text · AA: Pass"); expect(report).toContain("Effective text color:"); expect(report).toContain("Selected target:"); expect(buildCss({ ...DEFAULT_SETTINGS, foreground: "rgba(0,0,0,.5)" })).toContain("rgb(0 0 0 / 0.5)"); expect(buildCss({ ...DEFAULT_SETTINGS, background: "invalid" })).toBe(""); });
});
