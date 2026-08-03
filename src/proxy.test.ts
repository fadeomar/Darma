import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { config, proxy } from "./proxy";

const BASE = "https://darma.test";

function request(path: string) {
  return new NextRequest(new URL(path, BASE));
}

describe("proxy", () => {
  it("leaves /search alone so the unified search page can render", async () => {
    const response = await proxy(request("/search"));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("leaves /search alone when a query is present", async () => {
    const response = await proxy(request("/search?q=json"));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("does not match /search, so the route is never intercepted", () => {
    expect(config.matcher).not.toContain("/search");
  });

  it("sends the legacy /search/[slug] alias to the real search page", async () => {
    const response = await proxy(request("/search/json-formatter"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(`${BASE}/search?q=json-formatter`);
  });

  it("keeps the legacy /element alias pointing at the home page", async () => {
    const response = await proxy(request("/element"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(`${BASE}/`);
  });
});
