import { ChangeEvent } from "react";

import { getBoxShadowColor, getHoverColor, isValidColor } from "@/utils";
import ConfigurationRow from "./ConfigurationRow";
import ResetButton from "./ResetButton";
import { ShadowsDInputsProps, State } from "@/types/buttonGeneratorTypes";
import { shouldShowElement } from "./utils";

export const GradientsDInputs = ({ state, setState }: ShadowsDInputsProps) => {
  const updateState = (updates: { [key: string]: string | number }) => {
    setState((old: State) => ({ ...old, ...updates }));
  };

  return (
    <>
      {/* Start color Row */}
      <div className="row">
        <label htmlFor="startColor" className="opacity-60">
          Start color:
        </label>
        <input
          type="color"
          name="startColor"
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            updateState({ color1: value });
          }}
          placeholder="#ffffff"
          value={state.color1}
          id="startColor"
        />
        <label
          htmlFor="startColorInput"
          style={{ paddingLeft: "10px" }}
          className="opacity-60"
        >
          or
        </label>
        <input
          type="text"
          placeholder="#ffffff"
          name="startColorInput"
          id="startColorInput"
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            if (isValidColor(value)) {
              updateState({ color1: value });
            }
          }}
          value={state.color1}
        />
        {state.color1 !== state.defaultColor1 && (
          <ResetButton
            onClick={() => updateState({ color1: state.defaultColor1 })}
          />
        )}
      </div>
      <ConfigurationRow
        label="Start position:"
        type="range"
        value={parseInt(state.p1 ?? "100", 10)}
        step={1}
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          const value = Number(e.target.value);
          updateState({ p1: `${value}%` });
        }}
        min="0"
        max={100}
      />
      {/* End color Row */}
      <div className="row">
        <label htmlFor="hover-color" className="opacity-60">
          End color:
        </label>
        <input
          type="color"
          name="hover-color"
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            updateState({ color2: value });
          }}
          placeholder="#ffffff"
          value={state.color2}
          id="hover-color"
        />
        <label
          htmlFor="endColorInput"
          style={{ paddingLeft: "10px" }}
          className="opacity-60"
        >
          or
        </label>
        <input
          type="text"
          placeholder="#ffffff"
          name="hover-color"
          id="endColorInput"
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            if (isValidColor(value)) {
              updateState({ color2: value });
            }
          }}
          value={state.color2}
        />
        {state.color2 !== state.defaultColor2 && (
          <ResetButton
            onClick={() =>
              updateState({
                color2: state.defaultColor2,
              })
            }
          />
        )}
      </div>
      <ConfigurationRow
        label="End position:"
        type="range"
        value={parseInt(state.p2 ?? "100", 10)}
        step={1}
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          const value = Number(e.target.value);
          updateState({ p2: `${value}%` });
        }}
        min="0"
        max={100}
      />
      <ConfigurationRow
        label="Degree:"
        type="range"
        value={state.degree ? parseInt(state.degree, 10) : 0}
        step={10}
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          const value = Number(e.target.value);
          updateState({ degree: `${value}deg` });
        }}
        min="0"
        max={360}
      />
      {/* Text-color Row */}
      <div className="row">
        <label htmlFor="text-color" className="opacity-60">
          text color:
        </label>
        <input
          type="color"
          name="text-color"
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            updateState({ textColor: value });
          }}
          placeholder="#ffffff"
          value={state.textColor}
          id="text-color"
        />
        <label
          htmlFor="textColorInput"
          style={{ paddingLeft: "10px" }}
          className="opacity-60"
        >
          or
        </label>
        <input
          type="text"
          placeholder="#ffffff"
          name="text-color"
          id="textColorInput"
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            updateState({ textColor: value });
          }}
          value={state.textColor}
        />
        {state.textColor !== state.defaultTextColor && (
          <ResetButton
            onClick={() =>
              setState((old) => ({ ...old, textColor: state.defaultTextColor }))
            }
          />
        )}
      </div>
      {/* Placeholder Text Row */}
      <div className="row">
        <label htmlFor="placeholder-text" className="opacity-60">
          Placeholder text:
        </label>

        <input
          type="text"
          placeholder={state.textPlaceholder}
          name="placeholder-text"
          id="placeholder-text"
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            updateState({ textPlaceholder: value });
          }}
          value={state.textPlaceholder}
        />
        {state.textPlaceholder !== "Click me!" && (
          <ResetButton
            onClick={() =>
              setState((old) => ({ ...old, textPlaceholder: "Click me!" }))
            }
          />
        )}
      </div>
      <ConfigurationRow
        label="Size:"
        type="range"
        value={state.size ?? 100}
        step={10}
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          const value = Number(e.target.value);
          updateState({ size: value });
        }}
        min="100"
        max={410}
      />

      <ConfigurationRow
        label="Radius:"
        type="range"
        value={state.radius ?? 4}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          const value = Number(e.target.value);
          setState((old) => ({ ...old, radius: value }));
        }}
        min="0"
        max={50}
      />
    </>
  );
};

export const ShadowsDInputs = ({ state, setState }: ShadowsDInputsProps) => {
  const updateState = (updates: { [key: string]: string | number }) => {
    setState((old: State) => ({ ...old, ...updates }));
  };

  return (
    <>
      <div className="default-state">
        {/* Placeholder Text Row */}
        <div className="row">
          <label htmlFor="placeholder-text" className="opacity-60">
            Placeholder text:
          </label>

          <input
            type="text"
            placeholder={state.textPlaceholder}
            name="placeholder-text"
            id="placeholder-text"
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              const value = e.target.value;
              updateState({ textPlaceholder: value });
            }}
            value={state.textPlaceholder}
          />
          {state.textPlaceholder !== "Click me!" && (
            <ResetButton
              onClick={() => updateState({ textPlaceholder: "Click me!" })}
            />
          )}
        </div>

        {/* BG color Row */}
        <div className="row">
          <label htmlFor="bgColor" className="opacity-60">
            {state.variant === "transition-on-hover"
              ? "Border Color"
              : "BG color:"}
          </label>
          <input
            type="color"
            name="bgColor"
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              const value = e.target.value;
              updateState({
                bgColor: value,
                shadowColor: getBoxShadowColor(value),
                hoverBgColor: getHoverColor(value),
              });
            }}
            placeholder="#ffffff"
            value={state.bgColor}
            id="bgColor"
          />
          <label
            htmlFor="bgColorInput"
            style={{ paddingLeft: "10px" }}
            className="opacity-60"
          >
            or
          </label>
          <input
            type="text"
            placeholder="#ffffff"
            name="bgColorInput"
            id="bgColorInput"
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              const value = e.target.value;
              updateState({
                bgColor: value,
                shadowColor: getBoxShadowColor(value),
                hoverBgColor: getHoverColor(value),
              });
            }}
            value={state.bgColor}
          />
          {state.bgColor !== state.defaultBgColor && (
            <ResetButton
              onClick={() => updateState({ bgColor: state.defaultBgColor })}
            />
          )}
        </div>

        {/* shadow color Row */}
        {shouldShowElement(state.variant, "transition-on-hover") && (
          <div className="row">
            <label htmlFor="shadow-color" className="opacity-60">
              Shadow color:
            </label>
            <input
              type="color"
              name="shadow-color"
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                const value = e.target.value;
                updateState({ shadowColor: value });
              }}
              placeholder="#ffffff"
              value={state.shadowColor}
              id="shadow-color"
            />
            <label
              htmlFor="shadowColorInput"
              style={{ paddingLeft: "10px" }}
              className="opacity-60"
            >
              or
            </label>
            <input
              type="text"
              placeholder="#ffffff"
              name="shadow-color"
              id="shadowColorInput"
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                const value = e.target.value;
                updateState({ shadowColor: value });
              }}
              value={state.shadowColor}
            />
            {state.shadowColor !== state.defaultShadowColor && (
              <ResetButton
                onClick={() =>
                  updateState({
                    shadowColor: state.defaultShadowColor,
                  })
                }
              />
            )}
          </div>
        )}

        {/* Text-color Row */}
        <div className="row">
          <label htmlFor="text-color" className="opacity-60">
            text color:
          </label>
          <input
            type="color"
            name="text-color"
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              const value = e.target.value;
              updateState({ textColor: value });
            }}
            placeholder="#ffffff"
            value={state.textColor}
            id="text-color"
          />
          <label
            htmlFor="textColorInput"
            style={{ paddingLeft: "10px" }}
            className="opacity-60"
          >
            or
          </label>
          <input
            type="text"
            placeholder="#ffffff"
            name="text-color"
            id="textColorInput"
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              const value = e.target.value;
              updateState({ textColor: value });
            }}
            value={state.textColor}
          />
          {state.textColor !== state.defaultTextColor && (
            <ResetButton
              onClick={() =>
                updateState({
                  textColor: state.defaultTextColor,
                })
              }
            />
          )}
        </div>
        {/* size Row */}
        <ConfigurationRow
          label="Size:"
          type="range"
          value={state.size ? state.size : 100}
          step={10}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            const value = Number(e.target.value);
            updateState({ size: value });
          }}
          min="100"
          max={410}
        />
        {/* radius row */}
        <ConfigurationRow
          label="Radius:"
          type="range"
          value={state.radius ? state.radius : 4}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const value = Number(e.target.value);
            updateState({ radius: value });
          }}
          min="0"
          max={50}
        />

        {/* font size row */}
        <ConfigurationRow
          label="Font Size:"
          type="range"
          value={parseInt(state.fontSize ? state.fontSize : "16", 10)}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const value = `${e.target.value}px`;
            updateState({ fontSize: value });
          }}
          min="10"
          max="30"
          step="1"
        />
      </div>
      <div className="hover-state">
        {/* Hover color Row */}
        <div className="row">
          <label htmlFor="hover-bg-color" className="opacity-60 text-sm">
            {state.variant === "transition-on-hover"
              ? "Slide Color"
              : "Hover BG color:"}
          </label>
          <input
            type="color"
            name="hover-bg-color"
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              const value = e.target.value;
              updateState({ hoverBgColor: value });
            }}
            placeholder="#ffffff"
            value={state.hoverBgColor}
            id="hover-bg-color"
          />
          <label
            htmlFor="hoverBgColorInput"
            style={{ paddingLeft: "10px" }}
            className="opacity-60"
          >
            or
          </label>
          <input
            type="text"
            placeholder="#ffffff"
            name="hover-bg-color"
            id="hoverBgColorInput"
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              const value = e.target.value;
              updateState({ hoverBgColor: value });
            }}
            value={state.hoverBgColor}
          />

          {state.hoverBgColor !== state.defaultHoverBgColor && (
            <ResetButton
              onClick={() =>
                updateState({
                  hoverBgColor: state.defaultHoverBgColor,
                })
              }
            />
          )}
        </div>

        {/* Hover shadow color Row */}
        {shouldShowElement(state.variant, [
          "transition-on-hover",
          "shadow-on-click",
        ]) && (
          <div className="row">
            <label htmlFor="hover-shadow-color" className="opacity-60">
              Hover Shadow color:
            </label>
            <input
              type="color"
              name="hover-shadow-color"
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                const value = e.target.value;
                updateState({ hoverShadowColor: value });
              }}
              placeholder="#ffffff"
              value={state.hoverShadowColor}
              id="hover-shadow-color"
            />
            <label
              htmlFor="hoverShadowColorInput"
              style={{ paddingLeft: "10px" }}
              className="opacity-60"
            >
              or
            </label>
            <input
              type="text"
              placeholder="#ffffff"
              name="hover-shadow-color"
              id="hoverShadowColorInput"
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                const value = e.target.value;
                updateState({ hoverShadowColor: value });
              }}
              value={state.hoverShadowColor}
            />
            {state.hoverShadowColor !== state.defaultHoverShadowColor && (
              <ResetButton
                onClick={() =>
                  updateState({
                    hoverShadowColor: state.defaultHoverShadowColor,
                  })
                }
              />
            )}
          </div>
        )}

        {/* hover Text-color Row */}
        <div className="row">
          <label htmlFor="hover-text-color" className="opacity-60">
            Hover Text Color:
          </label>
          <input
            type="color"
            name="hover-text-color"
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              const value = e.target.value;
              updateState({ hoverTextColor: value });
            }}
            placeholder="#ffffff"
            value={state.hoverTextColor}
            id="hover-text-color"
          />
          <label
            htmlFor="textColorInput"
            style={{ paddingLeft: "10px" }}
            className="opacity-60"
          >
            or
          </label>
          <input
            type="text"
            placeholder="#ffffff"
            name="hover-text-color"
            id="textColorInput"
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              const value = e.target.value;
              updateState({ hoverTextColor: value });
            }}
            value={state.hoverTextColor}
          />
          {state.hoverTextColor !== state.defaultHoverTextColor && (
            <ResetButton
              onClick={() =>
                updateState({
                  hoverTextColor: state.defaultHoverTextColor,
                })
              }
            />
          )}
        </div>
      </div>
    </>
  );
};
