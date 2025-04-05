import React, { useEffect, useRef, MouseEvent } from "react";

interface PreviewProps {
  previewBox: React.RefObject<HTMLDivElement | null>; // Explicitly allow null
  setActiveLightSource: (value: number) => void;
  activeLightSource?: number; // Add this to get the current active source
}

interface LightSourceProps {
  top?: string;
  bottom?: string;
  right?: string;
  left?: string;
  "data-value": string;
  onClick: (e: MouseEvent<HTMLDivElement>) => void;
  isActive: boolean; // Add this to control active state
  className: string | null;
}

const LightSource: React.FC<LightSourceProps> = ({
  top,
  bottom,
  right,
  left,
  "data-value": dataValue,
  onClick,
  isActive,
  className,
}) => {
  const isBottomRight = right === "unset" && bottom === "unset";
  const isBottomLeft = left === "unset" && bottom === "unset";
  const isTopRight = right === "unset" && top === "unset";
  const isTopLeft = left === "unset" && top === "unset";

  return (
    <div
      style={{ top, bottom, right, left }}
      data-value={dataValue}
      onClick={onClick}
      className={`absolute h-[30px] w-[30px] cursor-pointer border-2 border-[var(--textColor)] opacity-80 ${className} 
        ${isBottomRight ? "rounded-br-[30px]" : ""}
        ${isBottomLeft ? "rounded-bl-[30px]" : ""}
        ${isTopRight ? "rounded-tr-[30px]" : ""}
        ${isTopLeft ? "rounded-tl-[30px]" : ""}
        ${isActive ? "radial-gradient" : "bg-transparent"}`}
    />
  );
};

const Preview: React.FC<PreviewProps> = ({
  previewBox,
  setActiveLightSource,
  activeLightSource = 1, // Default to 1, matching your initial state
}) => {
  const lightSources = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    lightSources.current = Array.from(
      document.querySelectorAll(".light-source") as NodeListOf<HTMLDivElement>
    );
  }, []);

  const setLightSource = (e: MouseEvent<HTMLDivElement>) => {
    const value = parseInt(e.currentTarget.dataset.value || "1");
    setActiveLightSource(value);
    // No need to manually toggle classes here; isActive handles it
  };

  return (
    <div className="preview">
      <LightSource
        top="0"
        bottom="unset"
        right="0"
        left="unset"
        data-value="2"
        onClick={setLightSource}
        isActive={activeLightSource === 2}
        className="light-source"
      />
      <LightSource
        top="0"
        bottom="unset"
        right="unset"
        left="0"
        data-value="1"
        onClick={setLightSource}
        isActive={activeLightSource === 1}
        className="light-source"
      />
      <LightSource
        top="unset"
        bottom="0"
        right="0"
        left="unset"
        data-value="3"
        onClick={setLightSource}
        isActive={activeLightSource === 3}
        className="light-source"
      />
      <LightSource
        top="unset"
        bottom="0"
        right="unset"
        left="0"
        data-value="4"
        onClick={setLightSource}
        isActive={activeLightSource === 4}
        className="light-source"
      />
      <div
        ref={previewBox}
        className="soft-element soft-shadow max-w-[200px] md:max-w-none max-h-[200px] md:max-h-none"
      />
    </div>
  );
};

export default Preview;
