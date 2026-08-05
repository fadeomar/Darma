import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = join(__dirname, "..");
const read = (p: string) => readFileSync(join(SRC, p), "utf8");

/**
 * Phase 2 typography floor: nothing a visitor is meant to READ renders below
 * 12px. These are source-level contracts on the shared primitives and shared
 * stylesheets — the places a regression would propagate from — not a scan of
 * every arbitrary numeric value in the codebase.
 */

function walk(dir: string, exts: string[], skip: string[] = []): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const rel = full.slice(SRC.length + 1).split("\\").join("/");
    if (skip.some((s) => rel === s || rel.startsWith(`${s}/`))) continue;
    if (statSync(full).isDirectory()) out.push(...walk(full, exts, skip));
    else if (exts.some((e) => name.endsWith(e))) out.push(full);
  }
  return out;
}

describe("typography floor", () => {
  it("exposes a 12px readable floor token", () => {
    const tokens = read("styles/typography.css");
    expect(tokens).toContain("--text-floor: 0.75rem");
    expect(tokens).toContain("--text-meta: 0.75rem");
    expect(tokens).toContain("--text-badge: 0.75rem");
  });

  it("keeps the shared Badge text at or above the floor", () => {
    const badge = read("components/ui/Badge.tsx");
    expect(badge).toContain("text-[length:var(--text-badge)]");
    // The old 11px literal must not come back.
    expect(badge).not.toMatch(/text-\[(?:8|9|10|11)px\]/);
  });

  it("keeps shared CTA and control sizes at or above 14px", () => {
    const button = read("components/ui/Button.tsx");
    expect(button).not.toMatch(/text-\[(?:8|9|10|11)px\]/);
    // sm/md/lg all use text-sm or text-base.
    expect(button).toMatch(/sm: *"[^"]*text-sm/);
  });

  it("has no sub-12px Tailwind text utility left in public source", () => {
    // src/app/admin is internal tooling, not public content.
    const files = walk(SRC, [".tsx", ".ts"], ["app/admin"]);
    const offenders: string[] = [];
    for (const f of files) {
      if (/\.test\.tsx?$/.test(f)) continue;
      const body = readFileSync(f, "utf8");
      const hits = body.match(/text-\[(?:8|9|10|11)px\]/g);
      if (hits) offenders.push(`${f.slice(SRC.length + 1)} (${hits.length})`);
    }
    expect(offenders).toEqual([]);
  });
});

describe("text contrast tokens", () => {
  it("defines text-safe brand tokens in both themes", () => {
    const light = read("styles/tokens.css");
    const dark = read("styles/themes.css");
    for (const t of ["--color-primary-text-strong", "--color-accent-text", "--color-on-ink-primary"]) {
      expect(light).toContain(`${t}:`);
      expect(dark).toContain(`${t}:`);
    }
  });

  it("keeps the confirmed failing values out of the affected components", () => {
    // F-19: bright teal as badge text measured 2.49:1 on white.
    const badge = read("components/ui/Badge.tsx");
    expect(badge).not.toContain("text-[var(--color-accent)]");
    expect(badge).not.toContain("text-[var(--color-primary)]");
    expect(badge).toContain("text-[var(--color-accent-text)]");
    expect(badge).toContain("text-[var(--color-primary-text-strong)]");

    // F-21: the footer legal line measured 4.34:1 on the ink footer.
    const experience = read("styles/experience.css");
    expect(experience).not.toContain("#817b72");
  });

  it("colours ink-surface text with the on-ink tokens", () => {
    const experience = read("styles/experience.css");
    const routeLost = experience.slice(experience.indexOf(".route-lost-console"));
    const block = routeLost.slice(0, 600);
    expect(block).not.toContain("color: var(--color-primary);");
    expect(block).toContain("var(--color-on-ink-primary)");
  });
});
