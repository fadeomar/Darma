import { describe, expect, it } from "vitest";
import { TEMPLATE_CATEGORIES } from "../domain/constants";
import {
  SEED_TEMPLATES,
  getFeaturedTemplates,
  getTemplateById,
  getTemplateCategories,
  getTemplatesByCategory,
  searchTemplates,
} from "./seedTemplates";

describe("seed templates", () => {
  it("ships at least 20 templates", () => {
    expect(SEED_TEMPLATES.length).toBeGreaterThanOrEqual(20);
  });

  it("has unique ids and non-empty tasks", () => {
    const ids = new Set<string>();
    for (const t of SEED_TEMPLATES) {
      expect(ids.has(t.id)).toBe(false);
      ids.add(t.id);
      expect(t.tasks.length).toBeGreaterThan(0);
    }
  });

  it("only uses known categories", () => {
    for (const t of SEED_TEMPLATES) {
      expect(TEMPLATE_CATEGORIES).toContain(t.category);
    }
  });

  it("uses valid due offsets when present", () => {
    for (const t of SEED_TEMPLATES) {
      for (const task of t.tasks) {
        if (task.dueOffsetDays !== undefined) {
          expect(Number.isInteger(task.dueOffsetDays)).toBe(true);
          expect(task.dueOffsetDays).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  it("getTemplateById finds a template", () => {
    expect(getTemplateById("tpl-daily-routine")?.name).toBe("Daily routine");
    expect(getTemplateById("nope")).toBeUndefined();
  });

  it("getTemplateCategories only lists categories that have templates", () => {
    const cats = getTemplateCategories();
    for (const c of cats) expect(getTemplatesByCategory(c).length).toBeGreaterThan(0);
  });

  it("getFeaturedTemplates returns only featured templates", () => {
    const featured = getFeaturedTemplates();
    expect(featured.length).toBeGreaterThan(0);
    expect(featured.every((t) => t.featured)).toBe(true);
  });

  it("searchTemplates matches name, description, and tags", () => {
    expect(searchTemplates("packing").some((t) => t.id === "tpl-travel-packing")).toBe(true);
    expect(searchTemplates("").length).toBe(SEED_TEMPLATES.length);
    expect(searchTemplates("zzz-no-match")).toHaveLength(0);
  });
});
