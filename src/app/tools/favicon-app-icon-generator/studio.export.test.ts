import { describe, expect, it } from "vitest";
import { DEFAULT_FAVICON_INPUT } from "./presets";
import { createFaviconHandoffAssets, createFaviconInputFingerprint } from "./studio";
import type { GeneratedAsset } from "./types";
import { createZipArchive, readZipEntries } from "./zip";

function asset(filename: string, text: string, mimeType = "text/plain"): GeneratedAsset {
  const blob = new Blob([text], { type: mimeType });
  return { filename, mimeType, blob, kind: mimeType.startsWith("image/") ? "image" : "snippet", size: blob.size, text };
}

describe("favicon production pack", () => {
  it("creates and reopens a ZIP with project, audit, and metrics files", async () => {
    const generated = [
      asset("favicon.ico", "ico", "image/x-icon"),
      asset("site.webmanifest", '{"icons":[]}', "application/manifest+json"),
      asset("README.md", "# Install", "text/markdown"),
    ];
    const fingerprint = createFaviconInputFingerprint(DEFAULT_FAVICON_INPUT);
    const handoff = createFaviconHandoffAssets(DEFAULT_FAVICON_INPUT, generated, fingerprint);
    const zip = await createZipArchive([...generated, ...handoff]);
    const entries = await readZipEntries(new File([zip], "favicon-pack.zip", { type: "application/zip" }));
    const names = entries.map((entry) => entry.name);
    expect(names).toEqual(expect.arrayContaining([
      "favicon.ico",
      "site.webmanifest",
      "README.md",
      "favicon-project.json",
      "production-audit.md",
      "production-metrics.csv",
    ]));
    const project = entries.find((entry) => entry.name === "favicon-project.json")?.text ?? "";
    const audit = entries.find((entry) => entry.name === "production-audit.md")?.text ?? "";
    const csv = entries.find((entry) => entry.name === "production-metrics.csv")?.text ?? "";
    expect(JSON.parse(project).tool).toBe("darma-favicon-app-icon-generator");
    expect(audit).toContain("# Favicon and app icon production audit");
    expect(csv.trim().split("\n")).toHaveLength(2);
  });
});
