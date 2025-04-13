"use client";
import React, { CSSProperties, useState } from "react";

import Preview from "./Preview";
import Configuration from "./Configuration";
import "./style.css";
import NeumorphismArticle from "./NeumorphismArticle";
import CodeEditor from "@/components/CodeEditor";
import VariantSelector from "@/components/VariantSelector";
import Title from "@/components/Title";
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
    <>
      <div className="w-full">
        <div className="container mx-auto w-full">
          <div className="max-w-screen-lg flex-custom w-full flex justify-between">
            <div className="flex flex-col justify-center items-center flex-1 pr-6">
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
              <Title
                variant="h4"
                as="h2"
                label={"Preview"}
                className="custom-class"
                style={{ "--angle": "90deg" } as CSSProperties}
              />
              <Preview
                // new
                state={state}
              />
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  marginTop: 16,
                }}
              >
                <Title
                  variant="h4"
                  as="h2"
                  label={"Code"}
                  className="custom-class"
                  style={{ "--angle": "90deg" } as CSSProperties}
                />
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
                />
              </div>
            </div>
            <Configuration
              // new
              state={state}
              setState={setState}
            />
          </div>
        </div>

        <div className="container max-w-screen-lg px-2 mx-auto mt-24">
          <section className="mb-24 text-left">
            <NeumorphismArticle />
          </section>
        </div>
      </div>
    </>
  );
};

export default App;
