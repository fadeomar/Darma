import { expect, it } from "vitest";
import { analyticsLocation } from "./location";
it("removes shared settings from analytics locations", () => { expect(analyticsLocation("https://darma.example/tools/contrast-checker?fg=%23FFFFFF&bg=red#settings")).toBe("https://darma.example/tools/contrast-checker"); expect(analyticsLocation("https://darma.example/tools/contrast-checker/?fg=secret")).toBe("https://darma.example/tools/contrast-checker/"); });
it("leaves unrelated routes unchanged", () => { const url = "https://darma.example/resources?q=react"; expect(analyticsLocation(url)).toBe(url); });
