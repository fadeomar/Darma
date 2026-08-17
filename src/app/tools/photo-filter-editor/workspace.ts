export type Size2D = { width: number; height: number };

export function resolveOutputDimensions(
  natural: Size2D,
  options: {
    mode: "original" | "custom";
    customWidth: string;
    customHeight: string;
    lockAspect: boolean;
    driver: "width" | "height";
  },
): Size2D {
  if (natural.width <= 0 || natural.height <= 0) return { width: 0, height: 0 };
  if (options.mode === "original") return natural;

  const parsedWidth = Math.max(1, Number.parseInt(options.customWidth, 10) || natural.width);
  const parsedHeight = Math.max(1, Number.parseInt(options.customHeight, 10) || natural.height);
  if (!options.lockAspect) return { width: parsedWidth, height: parsedHeight };

  if (options.driver === "height") {
    return {
      width: Math.max(1, Math.round((parsedHeight / natural.height) * natural.width)),
      height: parsedHeight,
    };
  }

  return {
    width: parsedWidth,
    height: Math.max(1, Math.round((parsedWidth / natural.width) * natural.height)),
  };
}

export const LARGE_EXPORT_PIXEL_WARNING = 48_000_000;
export const LARGE_EXPORT_DIMENSION_WARNING = 16_000;

export function fitPreviewToWorkspace(preview: Size2D, workspace: Size2D, padding = 32): Size2D {
  if (preview.width <= 0 || preview.height <= 0) return { width: 1, height: 1 };
  if (workspace.width <= 0 || workspace.height <= 0) return { width: preview.width, height: preview.height };

  const availableWidth = Math.max(1, workspace.width - padding);
  const availableHeight = Math.max(1, workspace.height - padding);
  const scale = Math.min(1, availableWidth / preview.width, availableHeight / preview.height);

  return {
    width: Math.max(1, Math.round(preview.width * scale)),
    height: Math.max(1, Math.round(preview.height * scale)),
  };
}

export function estimateCanvasWorkingMemory(size: Size2D) {
  if (size.width <= 0 || size.height <= 0) return 0;
  // Rendering can temporarily hold source/output ImageData plus canvas backing
  // stores. 2.5 RGBA buffers is deliberately a rough, conservative UI hint.
  return Math.round(size.width * size.height * 4 * 2.5);
}

export function shouldWarnLargeExport(size: Size2D) {
  return (
    size.width * size.height > LARGE_EXPORT_PIXEL_WARNING ||
    size.width > LARGE_EXPORT_DIMENSION_WARNING ||
    size.height > LARGE_EXPORT_DIMENSION_WARNING
  );
}
