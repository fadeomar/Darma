import { MouseEvent } from "react";

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

export default LightSource;
