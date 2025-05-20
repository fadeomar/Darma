// CodeResult.tsx
"use client";
import React, { useState } from "react";
import { BoxShadowState, LightSourceConfig } from "@/types";

interface CodeResultProps {
  state: BoxShadowState;
}

const lightSourceMap: Record<number, LightSourceConfig> = {
  1: { xMultiplier: -1, yMultiplier: -1, angle: 315 },
  2: { xMultiplier: 1, yMultiplier: -1, angle: 45 },
  3: { xMultiplier: 1, yMultiplier: 1, angle: 135 },
  4: { xMultiplier: -1, yMultiplier: 1, angle: 225 },
};

const CodeResult: React.FC<CodeResultProps> = ({ state }) => {
  const [copied, setCopied] = useState(false);

  const generateCode = () => {
    const { shadows, activeLightSource } = state;
    const config = lightSourceMap[activeLightSource] || lightSourceMap[1];

    const shadowStyles = shadows.map((shadow) => {
      const {
        offsetX,
        offsetY,
        blur,
        spread,
        opacity,
        color,
        inset,
        distance,
      } = shadow;
      const positionX = offsetX + distance * config.xMultiplier;
      const positionY = offsetY + distance * config.yMultiplier;
      const rgbaColor = `rgba(${parseInt(color.slice(1, 3), 16)}, ${parseInt(
        color.slice(3, 5),
        16
      )}, ${parseInt(color.slice(5, 7), 16)}, ${opacity})`;
      return `${
        inset ? "inset " : ""
      }${positionX}px ${positionY}px ${blur}px ${spread}px ${rgbaColor}`;
    });

    return `
.box-shadow {
  box-shadow: ${shadowStyles.join(", ")};
  width: ${state.boxSize}px;
  height: ${state.boxSize}px;
  border-radius: ${state.borderRadius}px;
  background-color: ${state.backgroundColor};
}`;
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generateCode().trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Generated CSS</h2>
      <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-x-auto">
        <code>{generateCode()}</code>
      </pre>
      <button
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        onClick={handleCopy}
      >
        {copied ? "Copied!" : "Copy CSS"}
      </button>
    </div>
  );
};

export default CodeResult;
