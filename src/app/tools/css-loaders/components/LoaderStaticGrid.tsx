import type { CSSProperties } from "react";
import { formatLoaderLabel } from "../loader-utils";
import type { LoaderPreviewItem } from "../types";

/**
 * Server-rendered loader strip.
 *
 * The interactive gallery loads previews from lazy chunks, so nothing a crawler
 * reads contains a real loader. This renders a small, honest set into the HTML
 * — the same set the page's ItemList structured data describes — while the
 * client gallery underneath keeps every filter and customization control.
 */
function previewStyle(loader: LoaderPreviewItem): CSSProperties | undefined {
  const defaults = loader.defaults;
  if (!defaults) return undefined;

  const style: Record<string, string> = {};
  if (defaults.color) {
    style.color = defaults.color;
    style["--loader-color"] = defaults.color;
  }
  if (defaults.secondaryColor) style["--loader-secondary-color"] = defaults.secondaryColor;
  if (defaults.size) style["--loader-size"] = `${defaults.size}px`;
  if (defaults.speed) style["--loader-speed"] = `${defaults.speed}s`;
  if (defaults.background) style["--loader-bg"] = defaults.background;
  return style as CSSProperties;
}

export default function LoaderStaticGrid({
  loaders,
  anchorPrefix,
}: {
  loaders: LoaderPreviewItem[];
  anchorPrefix: string;
}) {
  if (!loaders.length) return null;

  return (
    <ul className="css-loaders-grid css-loaders-static-grid">
      {loaders.map((loader) => (
        <li key={loader.id} id={`${anchorPrefix}${loader.id}`} className="css-loaders-static-card">
          <div className="css-loader-preview-stage" style={previewStyle(loader)}>
            <div className="css-loader-render-root" aria-label={`${loader.name} preview`}>
              <style dangerouslySetInnerHTML={{ __html: loader.previewCss }} />
              <div className="css-loader-render-inner" dangerouslySetInnerHTML={{ __html: loader.previewHtml }} />
            </div>
          </div>
          <div className="css-loaders-card-body">
            <h3 className="truncate text-sm font-black text-[var(--color-text)]">{loader.name}</h3>
            <p className="css-loaders-card-category">{formatLoaderLabel(loader.category)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
