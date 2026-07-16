import { describe, expect, it } from "vitest";
import { DEFAULT_OG_INPUT } from "./presets";
import {
  createInputFingerprint,
  createOgAuditMarkdown,
  createOgMetricsCsv,
  createOgProjectJson,
  parseOgProjectJson,
} from "./studio";
import type { OgGeneratedAsset } from "./types";
import { createZipArchive, listZipFileNames } from "./zip";

function textAsset(filename: string, text: string, kind: OgGeneratedAsset["kind"] = "snippet", mimeType = "text/plain"): OgGeneratedAsset {
  const blob = new Blob([text], { type: `${mimeType};charset=utf-8` });
  return { filename, mimeType, blob, kind, size: blob.size, text };
}

describe("OG production handoff", () => {
  it("builds and reopens a settings, audit, metrics, and ZIP handoff", async () => {
    const primary = textAsset("opengraph-image.png", "png", "image", "image/png");
    primary.width = 1200;
    primary.height = 630;
    const html = textAsset("html-meta-tags.txt", "<meta property=\"og:image\">");
    const baseAssets = [primary, html];
    const fingerprint = createInputFingerprint(DEFAULT_OG_INPUT);
    const projectJson = createOgProjectJson(DEFAULT_OG_INPUT);
    const audit = createOgAuditMarkdown(DEFAULT_OG_INPUT, baseAssets, fingerprint);
    const csv = createOgMetricsCsv(DEFAULT_OG_INPUT, baseAssets, fingerprint);
    const packageAssets = [
      ...baseAssets,
      textAsset("og-project.json", projectJson, "json", "application/json"),
      textAsset("production-audit.md", audit, "readme", "text/markdown"),
      textAsset("production-metrics.csv", csv, "snippet", "text/csv"),
    ];

    expect(parseOgProjectJson(projectJson).input.title).toBe(DEFAULT_OG_INPUT.title);
    expect(audit).toContain("Readiness: Ready");
    expect(csv.trim().split("\n")).toHaveLength(2);

    const zip = await createZipArchive(packageAssets);
    const names = await listZipFileNames(new File([zip], "og-pack.zip", { type: "application/zip" }));
    expect(names).toEqual(packageAssets.map((asset) => asset.filename));
    expect(names).toEqual(expect.arrayContaining(["og-project.json", "production-audit.md", "production-metrics.csv"]));
  });
});
