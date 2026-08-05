import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { RESOURCE_CATALOG } from "../catalog";
import type { Resource } from "../schema";
import { isApprovedResourceIcon, resolveResourceIcon, resourceMonogram } from "./resourceIconPolicy";

type ResourceIcon = Resource["icon"];

const icon = (overrides: Partial<ResourceIcon>): ResourceIcon =>
  ({ status: "remote-candidate", ...overrides }) as ResourceIcon;

describe("resourceMonogram", () => {
  it("uses the first letter of the first two words", () => {
    expect(resourceMonogram("Mozilla Developer Network")).toBe("MD");
    expect(resourceMonogram("Team Topologies")).toBe("TT");
  });

  it("uses the first two letters of a single word", () => {
    expect(resourceMonogram("Figma")).toBe("FI");
    expect(resourceMonogram("web")).toBe("WE");
  });

  it("splits on dots and dashes so domain-style names read correctly", () => {
    expect(resourceMonogram("web.dev")).toBe("WD");
    expect(resourceMonogram("CSS-Tricks")).toBe("CT");
  });

  it("ignores punctuation and symbols", () => {
    expect(resourceMonogram("¡Can I Use?")).toBe("CI");
    expect(resourceMonogram("  spaced   out  ")).toBe("SO");
  });

  it("never returns an empty string", () => {
    expect(resourceMonogram("")).toBe("?");
    expect(resourceMonogram("!!!")).toBe("?");
  });

  it("is deterministic across repeated calls", () => {
    const first = resourceMonogram("Open Web Docs");
    const second = resourceMonogram("Open Web Docs");

    expect(first).toBe(second);
  });

  it("produces a monogram of one or two characters for every catalog record", () => {
    for (const resource of RESOURCE_CATALOG) {
      const monogram = resourceMonogram(resource.name);

      expect(monogram.length, `"${resource.name}" -> "${monogram}"`).toBeGreaterThanOrEqual(1);
      expect(monogram.length, `"${resource.name}" -> "${monogram}"`).toBeLessThanOrEqual(2);
    }
  });
});

describe("resolveResourceIcon", () => {
  it("renders a self-hosted icon when the record is approved", () => {
    const resolved = resolveResourceIcon(icon({ status: "local", localPath: "/resources/logos/figma.svg" }), "Figma");

    expect(resolved).toEqual({ kind: "image", src: "/resources/logos/figma.svg" });
  });

  it("falls back to a monogram when an unreviewed remote candidate is all that exists", () => {
    const resolved = resolveResourceIcon(
      icon({ status: "remote-candidate", logoUrl: "https://cdn.example.com/logo.svg", faviconUrl: "https://example.com/favicon.ico" }),
      "Example Source",
    );

    expect(resolved).toEqual({ kind: "monogram", monogram: "ES" });
  });

  it("falls back to a monogram for fallback-only and review-needed icons", () => {
    for (const status of ["fallback-only", "review-needed"] as const) {
      const resolved = resolveResourceIcon(icon({ status, logoUrl: "https://cdn.example.com/logo.svg" }), "Some Source");

      expect(resolved.kind).toBe("monogram");
    }
  });

  it("falls back to a monogram when the icon is missing entirely", () => {
    expect(resolveResourceIcon(icon({}), "Missing Icon").kind).toBe("monogram");
  });

  it("ignores a local status with no local path", () => {
    expect(resolveResourceIcon(icon({ status: "local" }), "No Path").kind).toBe("monogram");
  });

  it("never returns a remote URL", () => {
    const resolved = resolveResourceIcon(
      icon({ status: "local", localPath: "/resources/logos/a.svg", logoUrl: "https://cdn.example.com/logo.svg" }),
      "A",
    );

    expect(resolved.kind).toBe("image");
    expect(resolved.kind === "image" && resolved.src.startsWith("/")).toBe(true);
  });
});

describe("catalog-wide icon policy", () => {
  it("resolves an identity tile for every record, so no card can render empty", () => {
    for (const resource of RESOURCE_CATALOG) {
      const resolved = resolveResourceIcon(resource.icon, resource.name);

      const hasIdentity =
        (resolved.kind === "image" && resolved.src.length > 0) ||
        (resolved.kind === "monogram" && resolved.monogram.length > 0);

      expect(hasIdentity, `"${resource.name}" has no identity tile`).toBe(true);
    }
  });

  it("never issues a third-party request for an unapproved icon", () => {
    for (const resource of RESOURCE_CATALOG) {
      const resolved = resolveResourceIcon(resource.icon, resource.name);

      if (resolved.kind !== "image") continue;

      // Approved icons are self-hosted, so the src must be a same-origin path.
      expect(isApprovedResourceIcon(resource.icon)).toBe(true);
      expect(resolved.src, `"${resource.name}" must be self-hosted`).toMatch(/^\//);
    }
  });

  it("treats only self-hosted icons as approved", () => {
    for (const resource of RESOURCE_CATALOG) {
      expect(isApprovedResourceIcon(resource.icon)).toBe(
        resource.icon.status === "local" && Boolean(resource.icon.localPath),
      );
    }
  });
});

describe("ResourceLogo contract", () => {
  const source = readFileSync(resolve(process.cwd(), "src/features/resources/components/ResourceLogo.tsx"), "utf8");

  it("routes every icon through the policy instead of reading remote URLs", () => {
    expect(source).toMatch(/resolveResourceIcon/);
    expect(source).not.toMatch(/logoUrl/);
    expect(source).not.toMatch(/faviconUrl/);
  });

  it("swaps to a monogram when an approved image fails at runtime", () => {
    expect(source).toMatch(/onError=\{\(\) => setFailed\(true\)\}/);
    expect(source).toMatch(/icon\.kind !== "image" \|\| failed/);
  });

  it("keeps the tile decorative so the resource title is the only announcement", () => {
    expect(source.match(/aria-hidden/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
    expect(source).toMatch(/alt=""/);
  });

  it("preserves fixed tile dimensions in every state", () => {
    expect(source).toMatch(/sm: "h-9 w-9/);
    expect(source).toMatch(/md: "h-12 w-12/);
    expect(source).toMatch(/lg: "h-16 w-16/);
  });

  it("keeps monogram text at 12px or larger", () => {
    // text-xs = 12px, text-sm = 14px, text-base = 16px.
    expect(source).toMatch(/text-xs/);
    expect(source).not.toMatch(/text-\[(?:[0-9]|10|11)px\]/);
  });
});
