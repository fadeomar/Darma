import { describe, expect, it } from "vitest";
import { DEFAULT_QR_FORM } from "./qr";
import {
  DEFAULT_QR_OPTIONS,
  buildQRAudit,
  buildQRCssSnippet,
  buildQRHtmlSnippet,
  buildQRMarkdownReport,
  buildQRReactComponent,
  buildQRSummary,
  calculateContrastRatio,
  createQRProject,
  normalizeHexColor,
  normalizeQRForm,
  normalizeQROptions,
  parseQRProject,
  payloadDensityLabel,
  summarizeQRAudit,
} from "./studio";

describe("QR studio normalization", () => {
  it("expands short hex colors", () => {
    expect(normalizeHexColor("#abc", "#000000")).toBe("#aabbcc");
  });

  it("falls back for invalid colors", () => {
    expect(normalizeHexColor("red", "#123456")).toBe("#123456");
  });

  it("clamps imported options", () => {
    expect(normalizeQROptions({ size: 12, margin: 99, errorCorrectionLevel: "Z" })).toEqual({
      ...DEFAULT_QR_OPTIONS,
      size: 160,
      margin: 12,
    });
  });

  it("sanitizes imported form fields and choices", () => {
    const form = normalizeQRForm({ type: "unknown", url: "https://example.com\u0000", wifiEncryption: "bad" });
    expect(form.type).toBe("url");
    expect(form.url).toBe("https://example.com");
    expect(form.wifiEncryption).toBe("WPA");
  });
});

describe("QR project import and export", () => {
  it("round-trips a project file", () => {
    const project = createQRProject(
      { ...DEFAULT_QR_FORM, type: "url", url: "https://example.com" },
      { ...DEFAULT_QR_OPTIONS, size: 480 },
      "2026-07-14T00:00:00.000Z",
    );
    expect(parseQRProject(JSON.stringify(project))).toEqual({ form: project.form, options: project.options });
  });

  it("rejects invalid JSON", () => {
    expect(() => parseQRProject("{")) .toThrow("not valid JSON");
  });

  it("rejects an unrelated schema", () => {
    expect(() => parseQRProject(JSON.stringify({ schema: "other", version: 1 }))).toThrow("not a Darma QR Code");
  });

  it("rejects an unsupported version", () => {
    expect(() => parseQRProject(JSON.stringify({ schema: "darma.qr-code", version: 2 }))).toThrow("not supported");
  });
});

describe("QR audit and summaries", () => {
  const validForm = { ...DEFAULT_QR_FORM, type: "url" as const, url: "https://example.com/menu" };

  it("calculates black and white contrast", () => {
    expect(calculateContrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 2);
  });

  it("flags low contrast as an error", () => {
    const checks = buildQRAudit(validForm, { ...DEFAULT_QR_OPTIONS, foreground: "#777777", background: "#888888" });
    expect(checks.find((check) => check.id === "contrast")?.severity).toBe("error");
  });

  it("warns for transparent backgrounds", () => {
    const checks = buildQRAudit(validForm, { ...DEFAULT_QR_OPTIONS, transparentBackground: true });
    expect(checks.find((check) => check.id === "contrast")?.severity).toBe("warning");
  });

  it("flags missing quiet zones", () => {
    const checks = buildQRAudit(validForm, { ...DEFAULT_QR_OPTIONS, margin: 0 });
    expect(checks.find((check) => check.id === "quiet-zone")?.severity).toBe("error");
  });

  it("warns when a WiFi password is embedded", () => {
    const checks = buildQRAudit(
      { ...DEFAULT_QR_FORM, type: "wifi", wifiSsid: "Guest", wifiPassword: "secret", wifiEncryption: "WPA" },
      DEFAULT_QR_OPTIONS,
    );
    expect(checks.find((check) => check.id === "sensitive-data")?.severity).toBe("warning");
  });

  it("summarizes severity counts", () => {
    const checks = buildQRAudit(validForm, DEFAULT_QR_OPTIONS);
    const counts = summarizeQRAudit(checks);
    expect(counts.pass).toBeGreaterThanOrEqual(4);
    expect(counts.error).toBe(0);
  });

  it("returns four summary cards", () => {
    const checks = buildQRAudit(validForm, DEFAULT_QR_OPTIONS);
    const cards = buildQRSummary(validForm, DEFAULT_QR_OPTIONS, checks);
    expect(cards).toHaveLength(4);
    expect(cards.map((card) => card.label)).toEqual(["Content", "Density", "Contrast", "Readiness"]);
  });

  it("labels payload density bands", () => {
    expect(payloadDensityLabel(100)).toBe("Light");
    expect(payloadDensityLabel(300)).toBe("Medium");
    expect(payloadDensityLabel(900)).toBe("Dense");
    expect(payloadDensityLabel(1500)).toBe("Very dense");
  });
});

describe("QR developer exports", () => {
  const form = { ...DEFAULT_QR_FORM, type: "url" as const, url: "https://example.com" };
  const checks = buildQRAudit(form, DEFAULT_QR_OPTIONS);

  it("builds semantic HTML", () => {
    expect(buildQRHtmlSnippet()).toContain('<figure class="qr-code">');
    expect(buildQRHtmlSnippet()).toContain('alt="Scan QR code"');
  });

  it("escapes HTML attributes", () => {
    expect(buildQRHtmlSnippet({ alt: '<scan "now">' })).toContain("&lt;scan &quot;now&quot;&gt;");
  });

  it("builds CSS for responsive images", () => {
    expect(buildQRCssSnippet()).toContain("width: min(100%, 20rem)");
  });

  it("builds a typed React component", () => {
    const output = buildQRReactComponent({ componentName: "MenuQr" });
    expect(output).toContain("type MenuQrProps");
    expect(output).toContain("export function MenuQr");
  });

  it("builds a Markdown production report", () => {
    const output = buildQRMarkdownReport(form, DEFAULT_QR_OPTIONS, checks);
    expect(output).toContain("# Darma QR Code production report");
    expect(output).toContain("https://example.com");
  });
});
