// app/tools/box-shadow/page.tsx
"use client";
import React, { useState } from "react";
import Configuration from "./Configuration";
import Preview from "./Preview";
import CodeResult from "./CodeResult";
import { BoxShadowState } from "@/types";


const defaultState = {
  shadows: [
    {
      id: "1",
      offsetX: 0,
      offsetY: 0,
      blur: 10,
      spread: 0,
      opacity: 0.5,
      color: "#000000",
      inset: false,
      distance: 10,
    },
  ],
  boxSize: 200,
  borderRadius: 10,
  backgroundColor: "#ffffff",
  activeLightSource: 1,
};

const BoxShadowPage = () => {
  const [state, setState] = useState<BoxShadowState>(defaultState);
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      {/* Left: preview dominant */}
      <div className="space-y-4">
        <Preview
          state={state}
          setActiveLightSource={(value) =>
            setState({ ...state, activeLightSource: value })
          }
          activeLightSource={state.activeLightSource}
        />
        <CodeResult state={state} />
      </div>
      {/* Right: configuration panel */}
      <Configuration state={state} setState={setState} />
    </div>
  );
};

export default BoxShadowPage;
