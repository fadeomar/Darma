import { Button, Input } from "@/components/ui";
import { getDefaultLoaderCustomization, getEffectiveLoaderControls, getLoaderBaseAnimationSpeed } from "../loader-utils";
import type { LoaderCustomizationState, LoaderDefinition } from "../types";

type LoaderControlsProps = {
  loader: LoaderDefinition;
  value: LoaderCustomizationState;
  onChange: (value: LoaderCustomizationState) => void;
};

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export default function LoaderControls({ loader, value, onChange }: LoaderControlsProps) {
  const controls = getEffectiveLoaderControls(loader);
  const hasLoaderControls = controls.color || controls.secondaryColor || controls.size || controls.speed;
  const baseSpeed = getLoaderBaseAnimationSpeed(loader);
  const speedMax = Math.max(3, Math.ceil(baseSpeed * 2));

  function patch(patchValue: Partial<LoaderCustomizationState>) {
    onChange({ ...value, ...patchValue });
  }

  return (
    <div className="css-loaders-controls" aria-label="Loader customization controls">
      <div className="css-loaders-controls-header">
        <div>
          <h3>Customize</h3>
          <p>Controls now only appear when they can affect this loader. Background controls the preview canvas.</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => onChange(getDefaultLoaderCustomization(loader))}>
          Reset
        </Button>
      </div>

      <div className="css-loaders-control-grid">
        {hasLoaderControls ? (
          <>
            {controls.color ? (
              <label className="css-loaders-control-field">
                <span>Color</span>
                <div className="css-loaders-color-row">
                  <Input type="color" value={value.color} onChange={(event) => patch({ color: event.target.value })} width="compact" aria-label="Loader color" />
                  <Input value={value.color} onChange={(event) => patch({ color: event.target.value })} width="full" aria-label="Loader color hex" />
                </div>
              </label>
            ) : null}

            {controls.secondaryColor ? (
              <label className="css-loaders-control-field">
                <span>Secondary</span>
                <div className="css-loaders-color-row">
                  <Input
                    type="color"
                    value={value.secondaryColor}
                    onChange={(event) => patch({ secondaryColor: event.target.value })}
                    width="compact"
                    aria-label="Loader secondary color"
                  />
                  <Input value={value.secondaryColor} onChange={(event) => patch({ secondaryColor: event.target.value })} width="full" aria-label="Loader secondary color hex" />
                </div>
              </label>
            ) : null}

            {controls.size ? (
              <label className="css-loaders-control-field css-loaders-range-field">
                <span>
                  Size <strong>{value.size}px</strong>
                </span>
                <input
                  type="range"
                  min="24"
                  max="128"
                  step="1"
                  value={value.size}
                  onChange={(event) => patch({ size: clampNumber(Number(event.target.value), 24, 128) })}
                />
              </label>
            ) : null}

            {controls.speed ? (
              <label className="css-loaders-control-field css-loaders-range-field">
                <span>
                  Speed <strong>{value.speed.toFixed(2)}s</strong>
                </span>
                <input
                  type="range"
                  min="0.15"
                  max={speedMax}
                  step="0.05"
                  value={value.speed}
                  onChange={(event) => patch({ speed: clampNumber(Number(event.target.value), 0.15, speedMax) })}
                />
              </label>
            ) : null}
          </>
        ) : (
          <div className="css-loaders-control-note">This loader uses fixed artwork, so only the preview background can be adjusted safely.</div>
        )}

        <label className="css-loaders-control-field css-loaders-preview-background-field">
          <span>Preview background</span>
          <div className="css-loaders-color-row">
            <Input
              type="color"
              value={value.background}
              onChange={(event) => patch({ background: event.target.value })}
              width="compact"
              aria-label="Preview background color"
            />
            <Input value={value.background} onChange={(event) => patch({ background: event.target.value })} width="full" aria-label="Preview background hex" />
          </div>
        </label>
      </div>
    </div>
  );
}
