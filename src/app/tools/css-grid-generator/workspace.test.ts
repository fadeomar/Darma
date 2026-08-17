import { describe, expect, it } from "vitest";
import { createDefaultGridState } from "./grid";
import {
  createGridShareUrl,
  parseGridWorkspace,
  serializeGridWorkspace,
} from "./workspace";

describe("grid workspace", () => {
  it("round trips workspace JSON", () => {
    const state = createDefaultGridState();
    expect(parseGridWorkspace(serializeGridWorkspace(state)).columns).toBe(
      state.columns,
    );
  });

  it("creates a compact share URL and removes preset", () => {
    const state = createDefaultGridState();
    state.items[0].content = "Résumé ✓ تخطيط";
    const rawUrl = new URL("https://darma.test/tools/css-grid-generator");
    rawUrl.searchParams.set("grid", serializeGridWorkspace(state));
    const legacyLength = rawUrl.toString().length;

    const url = new URL(
      createGridShareUrl(
        "https://darma.test/tools/css-grid-generator?preset=bento-grid",
        state,
      ),
    );
    const payload = url.searchParams.get("grid") ?? "";

    expect(url.searchParams.has("preset")).toBe(false);
    expect(payload.startsWith("v1.")).toBe(true);
    expect(parseGridWorkspace(payload).items[0].content).toBe(
      "Résumé ✓ تخطيط",
    );
    expect(url.toString().length).toBeLessThan(legacyLength);
  });

  it("keeps older raw-JSON share links readable", () => {
    const state = createDefaultGridState();
    expect(parseGridWorkspace(JSON.stringify(state)).rows).toBe(state.rows);
  });
});
