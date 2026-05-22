// app/tools/box-shadow/page.tsx
"use client";
import React, { useState } from "react";
import Configuration from "./Configuration";
import Preview from "./Preview";
import CodeResult from "./CodeResult";
import Title from "@/components/Title";
import { BoxShadowState } from "@/types";

import "./styles.css";

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
    <div className="container mx-auto p-4">
      <Title variant="h1" label="Box Shadow Generator" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Configuration state={state} setState={setState} />
        <Preview
          state={state}
          setActiveLightSource={(value) =>
            setState({ ...state, activeLightSource: value })
          }
          activeLightSource={state.activeLightSource}
        />
        <CodeResult state={state} />
      </div>
    </div>
  );
};

export default BoxShadowPage;
