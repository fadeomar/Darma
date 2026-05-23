export async function safeCopyText(text: string): Promise<{ ok: boolean; error?: string }> {
  if (typeof navigator === "undefined" || !navigator.clipboard) {
    return { ok: false, error: "Clipboard is not available in this browser." };
  }
  try {
    await navigator.clipboard.writeText(text);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Copy failed." };
  }
}
