import { buildCustomizedLoaderCss, getLoaderInlineStyle } from "../loader-utils";
import type { LoaderCustomizationState, LoaderDefinition, LoaderPreviewMode, LoaderPreviewTheme } from "../types";

type LoaderPreviewStageProps = {
  loader: LoaderDefinition;
  customization: LoaderCustomizationState;
  mode: LoaderPreviewMode;
  theme: LoaderPreviewTheme;
};

function LoaderMarkup({ loader }: { loader: LoaderDefinition }) {
  return (
    <div className="css-loader-custom-scale">
      <div dangerouslySetInnerHTML={{ __html: loader.code.html }} />
    </div>
  );
}

export default function LoaderPreviewStage({ loader, customization, mode, theme }: LoaderPreviewStageProps) {
  const inlineStyle = getLoaderInlineStyle(customization, loader.defaults.size);
  const previewCss = buildCustomizedLoaderCss(loader, customization);

  return (
    <div className={`css-loaders-detail-stage css-loaders-detail-stage-${mode} css-loaders-detail-theme-${theme} darma-loader-${loader.id}-preview`} style={inlineStyle}>
      <style dangerouslySetInnerHTML={{ __html: previewCss }} />

      {mode === "standalone" ? (
        <div className="css-loaders-detail-standalone" aria-label={`${loader.name} standalone preview`}>
          <LoaderMarkup loader={loader} />
        </div>
      ) : null}

      {mode === "button" ? (
        <div className="css-loaders-button-preview-wrap" aria-label={`${loader.name} button preview`}>
          <button type="button" className="css-loaders-demo-button">
            <LoaderMarkup loader={loader} />
            <span>Saving...</span>
          </button>
        </div>
      ) : null}

      {mode === "card" ? (
        <div className="css-loaders-demo-card" aria-label={`${loader.name} dashboard card loading preview`}>
          <div className="css-loaders-demo-card-topline" />
          <div className="css-loaders-demo-card-content">
            <LoaderMarkup loader={loader} />
            <div>
              <strong>Dashboard card</strong>
              <span>Loading analytics...</span>
            </div>
          </div>
          <div className="css-loaders-demo-card-bars">
            <i />
            <i />
            <i />
          </div>
        </div>
      ) : null}

      {mode === "overlay" ? (
        <div className="css-loaders-overlay-mock" aria-label={`${loader.name} page overlay preview`}>
          <div className="css-loaders-overlay-page">
            <span />
            <span />
            <span />
          </div>
          <div className="css-loaders-overlay-layer">
            <LoaderMarkup loader={loader} />
            <p>Loading page...</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
