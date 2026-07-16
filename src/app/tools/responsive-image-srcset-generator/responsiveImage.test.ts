import { describe, expect, it } from "vitest";
import {
  createDefaultResponsiveImageState,
  estimateSelectedCandidate,
  estimateSlotWidth,
  generateAllResponsiveImageCode,
  generateImgMarkup,
  generateNextImageMarkup,
  generateSizes,
  generateSrcset,
} from "./responsiveImage";

describe("responsive image generation", () => {
  it("generates sorted width descriptors", () => {
    const state = createDefaultResponsiveImageState();
    const srcset = generateSrcset([...state.candidates].reverse());
    expect(srcset.indexOf("400w")).toBeLessThan(srcset.indexOf("1600w"));
  });

  it("generates sizes rules followed by the default slot", () => {
    const state = createDefaultResponsiveImageState();
    expect(generateSizes(state.sizes, state.defaultSlotSize)).toBe("(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw");
  });

  it("escapes HTML attribute values without relying on backslashes", () => {
    const state = createDefaultResponsiveImageState();
    state.attributes.alt = 'A "quoted" image & more';
    state.attributes.src = '/image?label="hero"&size=large';
    const html = generateImgMarkup(state);
    expect(html).toContain("A &quot;quoted&quot; image &amp; more");
    expect(html).toContain("label=&quot;hero&quot;&amp;size=large");
    expect(html).not.toContain('\\"hero\\"');
  });

  it("supports single-quoted HTML attributes safely", () => {
    const state = createDefaultResponsiveImageState();
    state.exportOptions.quoteStyle = "single";
    state.attributes.alt = "Editor's image";
    expect(generateImgMarkup(state)).toContain("alt='Editor&#39;s image'");
  });

  it("includes fetch priority in HTML and Next.js output when configured", () => {
    const state = createDefaultResponsiveImageState();
    state.attributes.fetchPriority = "high";
    expect(generateImgMarkup(state)).toContain('fetchpriority="high"');
    expect(generateNextImageMarkup(state)).toContain('fetchPriority="high"');
  });

  it("estimates slot width and candidate selection", () => {
    const state = createDefaultResponsiveImageState();
    const slot = estimateSlotWidth(state.sizes, state.defaultSlotSize, 900);
    expect(slot).toBe(450);
    expect(estimateSelectedCandidate(state.candidates, slot, 2)?.width).toBe(1200);
  });

  it("honors combined export options", () => {
    const state = createDefaultResponsiveImageState();
    state.exportOptions.includeComments = false;
    state.exportOptions.includeCssHelper = false;
    const output = generateAllResponsiveImageCode(state);
    expect(output).not.toContain("HTML img");
    expect(output).not.toContain("object-fit");
    expect(output).toContain("<picture>");
  });
});
