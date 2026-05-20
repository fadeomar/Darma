"use client";
import React, { useState } from "react";

import Preview from "./Preview";
import Configuration from "./Configuration";
import CodeEditor from "@/components/CodeEditor";
import VariantSelector from "@/components/VariantSelector";
import { State } from "@/types/buttonGeneratorTypes";

const _defaultShadowColor = "#c9003d";
const _defaultTextColor = "#ffffff";
const _defaultColor1 = "#4ecdc4";
const _defaultColor2 = "#c797eb";
const _defaultBgColor = "#ff6392";
const _defaultHoverBgColor = "#ff81be";
const _defaultHoverShadowColor = "#ff0a78";
const _defaultHoverTextColor = "#ffffff";

const default3DStyleState = {
  size: 120,
  radius: 50,
  color: _defaultTextColor,
  textColor: _defaultTextColor,
  fontSize: "16px",
};
function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
const defaultShadowStyleState = {
  size: 130,
  radius: 5,
  color: _defaultTextColor,
  textColor: _defaultTextColor,
  bgColor: "#3d348b",
  shadowColor: "#0c0a1c",
  slideDirection: "right",
  fontSize: "16px",
};

const defaultState = {
  // normal state
  size: 120,
  radius: 50,
  textPlaceholder: "Click me!",
  bgColor: _defaultBgColor,
  defaultBgColor: _defaultBgColor,
  textColor: _defaultTextColor,
  defaultTextColor: _defaultTextColor,
  shadowColor: _defaultShadowColor,
  defaultShadowColor: _defaultShadowColor,
  // hover state
  hoverBgColor: _defaultHoverBgColor,
  defaultHoverBgColor: _defaultHoverBgColor,
  hoverShadowColor: _defaultHoverShadowColor,
  defaultHoverShadowColor: _defaultHoverShadowColor,
  hoverTextColor: _defaultHoverTextColor,
  defaultHoverTextColor: _defaultHoverTextColor,
  variant: "3d",
  easing: "ease",
  degree: "300deg",
  color1: _defaultColor1,
  color2: _defaultColor2,
  p1: "0%",
  p2: "75%",
  defaultColor1: _defaultColor1,
  defaultColor2: _defaultColor2,
  fontSize: "16px",
  slideDirection: "left",
};
import { handleStyle } from "./styles";

const App = () => {
  const [state, setState] = useState<State>(defaultState);
  const handleVariantSelect = (value: string) => {
    if (value === "3d") {
      setState((old) => ({ ...old, variant: value, ...default3DStyleState }));
    } else {
      setState((old) => ({
        ...old,
        variant: value,
        ...defaultShadowStyleState,
        radius: getRandomNumber(4, 30),
        size: getRandomNumber(130, 200),
      }));
    }
  };
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
      <div className="flex flex-col items-center gap-4">
        <VariantSelector
          label={"Select Button Variant"}
          variants={[
            "3d",
            "shadow-border",
            "shadow-on-click",
            "sliding",
            "arrow",
            "glow",
            "outline",
            "gradients",
            "retro",
            "transition-on-hover",
          ]}
          selected={state.variant}
          handleSelect={handleVariantSelect}
        />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/40">Preview</p>
        <Preview state={state} />
        <div className="w-full">
          <p className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-black/40">Code</p>
          <CodeEditor
            code={`<button class='darma-button'>${
              state.textPlaceholder
            }</button>
                  <style>
                  ${handleStyle(state)}
                  </style>`}
            language="html"
            setCode={() => {}}
            showCopyButton
            analyticsContext="code from buttons generator"
          />
        </div>
      </div>
      <Configuration state={state} setState={setState} />
    </div>
  );
};

export default App;
