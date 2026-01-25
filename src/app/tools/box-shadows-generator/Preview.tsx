// app/tools/box-shadow/Preview.tsx
"use client";
import React, { useRef } from "react";
import { BoxShadowState } from "@/types";
import { generateShadowStyle } from "./generateShadowStyle";
import LightSource from "@/components/LightSource";

interface PreviewProps {
  state: BoxShadowState;
  setActiveLightSource: (value: number) => void;
  activeLightSource: number;
}

const Preview: React.FC<PreviewProps> = ({
  state,
  setActiveLightSource,
  activeLightSource,
}) => {
  const previewBox = useRef<HTMLDivElement>(null);
  const styleContent = generateShadowStyle(state);

  return (
    <div className="p-4 bg-gray-100 rounded-lg shadow-md flex items-center justify-center flex-col">
      <h2 className="text-lg font-bold mb-4">Preview</h2>
      <div className="flex-1 pt-24">
        {/* Preview Box Container */}
        <div className="relative w-[220px] h-[300px] flex items-center justify-center">
          <div ref={previewBox} className="box-shadow-preview" />

          {/* Light Sources */}
          <LightSource
            top="-40px"
            right="-40px"
            bottom="unset"
            left="unset"
            data-value="2"
            onClick={(e) =>
              setActiveLightSource(
                parseInt(e.currentTarget.dataset.value || "2")
              )
            }
            isActive={activeLightSource === 2}
            className="light-source"
          />
          <LightSource
            top="-40px"
            left="-40px"
            bottom="unset"
            right="unset"
            data-value="1"
            onClick={(e) =>
              setActiveLightSource(
                parseInt(e.currentTarget.dataset.value || "1")
              )
            }
            isActive={activeLightSource === 1}
            className="light-source"
          />
          <LightSource
            bottom="-40px"
            right="-40px"
            top="unset"
            left="unset"
            data-value="3"
            onClick={(e) =>
              setActiveLightSource(
                parseInt(e.currentTarget.dataset.value || "3")
              )
            }
            isActive={activeLightSource === 3}
            className="light-source"
          />
          <LightSource
            bottom="-40px"
            left="-40px"
            top="unset"
            right="unset"
            data-value="4"
            onClick={(e) =>
              setActiveLightSource(
                parseInt(e.currentTarget.dataset.value || "4")
              )
            }
            isActive={activeLightSource === 4}
            className="light-source"
          />
        </div>
      </div>
      <style>{styleContent}</style>
    </div>
  );
};

export default Preview;
