import { ColorShade, ColorShadesParams } from "@/types";
import tinycolor from "tinycolor2";

export const generateShades = ({
  color1,
  color2,
  steps,
}: ColorShadesParams): ColorShade[] => {
  const start = tinycolor(color1);
  const end = tinycolor(color2);

  // Validate inputs
  if (!start.isValid() || !end.isValid() || steps < 2 || steps > 20) {
    return [];
  }

  const shades: ColorShade[] = [];

  for (let i = 0; i < steps; i++) {
    const ratio = i / (steps - 1);
    const color = tinycolor.mix(start, end, ratio * 100);

    shades.push({
      hex: color.toHexString(),
      rgb: color.toRgbString(),
      hsl: color.toHslString(),
    });
  }

  return shades;
};

export const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error("Failed to copy:", err);
    return false;
  }
};
