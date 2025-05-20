// generateShadowStyle.ts
import { BoxShadowState, LightSourceConfig } from "@/types";

const lightSourceMap: Record<number, LightSourceConfig> = {
  1: { xMultiplier: -1, yMultiplier: -1, angle: 315 }, // Top-left
  2: { xMultiplier: 1, yMultiplier: -1, angle: 45 }, // Top-right
  3: { xMultiplier: 1, yMultiplier: 1, angle: 135 }, // Bottom-right
  4: { xMultiplier: -1, yMultiplier: 1, angle: 225 }, // Bottom-left
};

export const generateShadowStyle = (state: BoxShadowState): string => {
  const { shadows, activeLightSource } = state;
  console.log({ shadows, activeLightSource });
  const config = lightSourceMap[activeLightSource] || lightSourceMap[1];

  const shadowStyles = shadows.map((shadow) => {
    const { offsetX, offsetY, blur, spread, opacity, color, inset, distance } =
      shadow;
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
    .box-shadow-preview {
      box-shadow: ${shadowStyles.join(", ")};
      width: ${state.boxSize}px;
      height: ${state.boxSize}px;
      border-radius: ${state.borderRadius}px;
      background-color: ${state.backgroundColor};
    }
  `;
};
