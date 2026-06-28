import { afterEach, describe, expect, it, vi } from "vitest";
import { copyTextToClipboard } from "./copy-to-clipboard";

const originalNavigator = globalThis.navigator;
const originalDocument = globalThis.document;

function setNavigator(value: Navigator | undefined) {
  Object.defineProperty(globalThis, "navigator", {
    value,
    configurable: true,
  });
}

function setDocument(value: Document | undefined) {
  Object.defineProperty(globalThis, "document", {
    value,
    configurable: true,
  });
}

afterEach(() => {
  setNavigator(originalNavigator);
  setDocument(originalDocument);
  vi.restoreAllMocks();
});

describe("copyTextToClipboard", () => {
  it("returns true when navigator clipboard succeeds", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setNavigator({ clipboard: { writeText } } as unknown as Navigator);

    await expect(copyTextToClipboard("copy me")).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith("copy me");
  });

  it("falls back to textarea copy when navigator clipboard fails", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("blocked"));
    const textarea = {
      value: "",
      style: {},
      setAttribute: vi.fn(),
      focus: vi.fn(),
      select: vi.fn(),
      remove: vi.fn(),
    };
    const execCommand = vi.fn().mockReturnValue(true);

    setNavigator({ clipboard: { writeText } } as unknown as Navigator);
    setDocument({
      body: { appendChild: vi.fn() },
      createElement: vi.fn().mockReturnValue(textarea),
      execCommand,
    } as unknown as Document);

    await expect(copyTextToClipboard("fallback")).resolves.toBe(true);
    expect(execCommand).toHaveBeenCalledWith("copy");
    expect(textarea.value).toBe("fallback");
    expect(textarea.remove).toHaveBeenCalled();
  });

  it("returns false when clipboard and fallback are unavailable", async () => {
    setNavigator(undefined);
    setDocument(undefined);

    await expect(copyTextToClipboard("nope")).resolves.toBe(false);
  });
});
