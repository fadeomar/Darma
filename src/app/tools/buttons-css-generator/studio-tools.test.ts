import { describe, expect, it } from "vitest";
import { defaultButtonConfig } from "./presets";
import {
  decodeButtonStudioState,
  encodeButtonStudioState,
  importButtonCss,
  sanitizeCustomCssOverrides,
} from "./studio-tools";

describe("button studio tools", () => {
  it("round-trips share state", () => {
    const token = encodeButtonStudioState({
      version: 2,
      config: { ...defaultButtonConfig, text: "Shared", customCss: "filter: saturate(1.1);" },
      previewBackground: "dark",
      customPreviewBackground: "#111827",
      previewContext: "pricing",
      previewDevice: "mobile",
      previewInput: "keyboard",
      motionPreview: "reduced",
    });
    const decoded = decodeButtonStudioState(token);
    expect(decoded?.config.text).toBe("Shared");
    expect(decoded?.previewBackground).toBe("dark");
    expect(decoded?.previewDevice).toBe("mobile");
    expect(decoded?.previewInput).toBe("keyboard");
    expect(decoded?.motionPreview).toBe("reduced");
  });

  it("migrates version 1 share state with safe defaults", () => {
    const legacy = encodeButtonStudioState({
      version: 2,
      config: defaultButtonConfig,
      previewBackground: "light",
      customPreviewBackground: "#ffffff",
      previewContext: "canvas",
      previewDevice: "desktop",
      previewInput: "mouse",
      motionPreview: "normal",
    });
    const raw = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(legacy.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(legacy.length / 4) * 4, "=")), (char) => char.charCodeAt(0))));
    raw.version = 1;
    delete raw.previewInput;
    delete raw.motionPreview;
    const bytes = new TextEncoder().encode(JSON.stringify(raw));
    let binary = ""; bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
    const token = btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
    const decoded = decodeButtonStudioState(token);
    expect(decoded?.version).toBe(2);
    expect(decoded?.previewInput).toBe("mouse");
    expect(decoded?.motionPreview).toBe("normal");
  });

  it("imports common base and interaction declarations", () => {
    const result = importButtonCss(`
      .cta {
        background: linear-gradient(120deg, #2563eb, #7c3aed);
        color: #fff;
        padding: 12px 24px;
        border-radius: 999px;
        box-shadow: 0 8px 22px 0 rgba(0,0,0,.24);
        font-size: 16px;
        font-weight: 700;
        transition: transform 220ms ease-in-out;
      }
      .cta:hover { background: #1d4ed8; transform: translateY(-2px) scale(1.02); }
      .cta:active { transform: translateY(1px) scale(.98); }
      .cta:focus-visible { outline: 3px solid #93c5fd; outline-offset: 3px; }
      @media (max-width: 640px) { .cta { width: 100%; } }
    `, defaultButtonConfig);

    expect(result.config.className).toBe("cta");
    expect(result.config.style).toBe("gradient");
    expect(result.config.gradientAngle).toBe(120);
    expect(result.config.shape).toBe("pill");
    expect(result.config.paddingX).toBe(24);
    expect(result.config.customizeHoverState).toBe(true);
    expect(result.config.hoverTranslateY).toBe(-2);
    expect(result.config.customizeActiveState).toBe(true);
    expect(result.config.focusRingWidth).toBe(3);
    expect(result.config.motionDuration).toBe(220);
    expect(result.config.motionEasing).toBe("ease-in-out");
    expect(result.config.mobileFullWidth).toBe(true);
    expect(result.matchedProperties).toBeGreaterThan(10);
  });

  it("keeps custom overrides scoped to declarations", () => {
    expect(sanitizeCustomCssOverrides("filter: saturate(1.1); } body { display:none; background:url(https://x.test/a.png)")).not.toContain("{");
    expect(sanitizeCustomCssOverrides("filter: saturate(1.1); } body { display:none; background:url(https://x.test/a.png)")).not.toContain("url(");
  });
});
