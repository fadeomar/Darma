export function isFullscreenActive(): boolean {
  if (typeof document === "undefined") return false;
  return Boolean(document.fullscreenElement);
}

export async function enterFullscreen(element: HTMLElement): Promise<void> {
  if (!element) return;
  if (element.requestFullscreen) {
    await element.requestFullscreen();
  }
}

export async function exitFullscreen(): Promise<void> {
  if (typeof document === "undefined") return;
  if (document.fullscreenElement && document.exitFullscreen) {
    await document.exitFullscreen();
  }
}
