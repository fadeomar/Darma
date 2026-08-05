import { describe, expect, it } from "vitest";
import { matchesNavRoute, resolveActiveNavHref } from "./navActive";

const NAV = ["/", "/explore", "/tools", "/tools/css-loaders", "/games", "/guides", "/tech-atlas"];

describe("header active-route matching", () => {
  it("keeps Tools active for the catalog and for ordinary tool routes", () => {
    expect(resolveActiveNavHref("/tools", NAV)).toBe("/tools");
    expect(resolveActiveNavHref("/tools/json-formatter", NAV)).toBe("/tools");
  });

  it("gives Loaders ownership of its own route and descendants", () => {
    expect(resolveActiveNavHref("/tools/css-loaders", NAV)).toBe("/tools/css-loaders");
    expect(resolveActiveNavHref("/tools/css-loaders/skeletons", NAV)).toBe("/tools/css-loaders");
  });

  it("never leaves Tools and Loaders active at the same time", () => {
    const active = resolveActiveNavHref("/tools/css-loaders/react", NAV);
    expect(NAV.filter((href) => href === active)).toHaveLength(1);
    expect(active).not.toBe("/tools");
  });

  it("matches home exactly and returns null when nothing matches", () => {
    expect(matchesNavRoute("/tools", "/")).toBe(false);
    expect(resolveActiveNavHref("/", NAV)).toBe("/");
    expect(resolveActiveNavHref("/nothing-here", NAV.filter((href) => href !== "/"))).toBeNull();
  });
});
