"use client";
import React, { useEffect, useState, useRef, ChangeEvent } from "react";
import ShapeSwitcher from "./ShapeSwitcher";
import CodeEditor from "@/components/CodeEditor";
import { isValidColor, colorLuminance, getContrast } from "@/utils";
import ConfigurationRow from "@/components/ConfigurationRow";

interface ConfigurationProps {
  previewBox: React.RefObject<HTMLDivElement | null>; // Allow null explicitly
  activeLightSource?: number;
}

const Configuration: React.FC<ConfigurationProps> = ({
  previewBox,
  activeLightSource = 1,
}) => {
  const [blur, setBlur] = useState<number>(60);
  const defaultColor = "#e0e0e0";
  const [color, setColor] = useState<string>(defaultColor);
  const [size, setSize] = useState<number>(300);
  const [radius, setRadius] = useState<number>(50);
  const [shape, setShape] = useState<number>(0);
  const [distance, setDistance] = useState<number>(20);
  const [colorDifference, setColorDifference] = useState<number>(0.15);
  const [maxRadius, setMaxRadius] = useState<number>(150);
  const [gradient, setGradient] = useState<boolean>(false);
  const [codeString, setCodeString] = useState<string>("");

  // Type refs
  const colorInput = useRef<HTMLInputElement>(null);
  const theme = useRef<boolean>(false);

  const colorOnChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (isValidColor(value)) {
      setColor(value);
    }
  };

  const handleColor = (e: ChangeEvent<HTMLInputElement>) => {
    setColor(e.target.value);
  };

  const handleDistance = (e: ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setDistance(value);
    setBlur(value * 2);
  };

  const handleSize = (e: ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setSize(value);
    setDistance(Math.round(value * 0.1));
    setBlur(Math.round(value * 0.2));
    setMaxRadius(Math.round(value / 2));
  };

  const handleShape = (e: React.MouseEvent<HTMLButtonElement>) => {
    const shapeId = Number(e.currentTarget.dataset.shape);
    setShape(shapeId);
    if (shapeId === 2 || shapeId === 3) {
      setGradient(true);
    } else {
      setGradient(false);
    }
  };

  useEffect(() => {
    if (!isValidColor(color)) {
      return;
    }

    // let angle: number, positionX: number, positionY: number;
    const darkColor = colorLuminance(color, colorDifference * -1);
    const lightColor = colorLuminance(color, colorDifference);

    const firstGradientColor =
      gradient && shape !== 1
        ? colorLuminance(color, shape === 3 ? 0.07 : -0.1)
        : color;
    const secondGradientColor =
      gradient && shape !== 1
        ? colorLuminance(color, shape === 2 ? 0.07 : -0.1)
        : color;

    const lightSourceMap: Record<
      number,
      { xMultiplier: number; yMultiplier: number; angle: number }
    > = {
      1: { xMultiplier: 1, yMultiplier: 1, angle: 145 },
      2: { xMultiplier: -1, yMultiplier: 1, angle: 225 },
      3: { xMultiplier: -1, yMultiplier: -1, angle: 315 },
      4: { xMultiplier: 1, yMultiplier: -1, angle: 45 },
    };

    const config = lightSourceMap[activeLightSource] || lightSourceMap[1]; // Default to 1 if undefined

    const positionX = distance * config.xMultiplier;
    const positionY = distance * config.yMultiplier;
    const angle = config.angle;

    if (colorInput.current) {
      colorInput.current.value = color;
    }

    document.documentElement.style.cssText = `
      --positionX: ${positionX}px;
      --positionXOpposite: ${positionX * -1}px;
      --positionY: ${positionY}px;
      --positionYOpposite: ${positionY * -1}px;
      --angle: ${angle}deg;
      --blur: ${blur}px;
      --textColor: ${getContrast(color)};
      --textColorOpposite: ${color};
      --baseColor: ${color};
      --darkColor: ${darkColor};
      --lightColor: ${lightColor};
      --firstGradientColor: ${firstGradientColor};
      --secondGradientColor: ${secondGradientColor};
      --size: ${size}px;
      --radius: ${radius}px;
    `;

    if (shape === 1) {
      previewBox.current?.classList.add("pressed");
    } else {
      previewBox.current?.classList.remove("pressed");
    }

    if (isValidColor(color)) {
      theme.current = getContrast(color) === "#001f3f";
    }

    const borderRadius =
      parseInt(String(radius)) === maxRadius ? "50%" : `${radius}px`;
    const background =
      gradient && shape !== 1
        ? `linear-gradient(${angle}deg, ${firstGradientColor}, ${secondGradientColor})`
        : `${color}`;
    const boxShadowPosition = shape === 1 ? "inset" : "";
    const firstBoxShadow = `${boxShadowPosition} ${positionX}px ${positionY}px ${blur}px ${darkColor}`;
    const secondBoxShadow = `${boxShadowPosition} ${positionX * -1}px ${
      positionY * -1
    }px ${blur}px ${lightColor}`;

    setCodeString(
      `height: ${size}px;
       width: ${size}px;
       border-radius: ${borderRadius};
       background: ${background};
       box-shadow: ${firstBoxShadow}, ${secondBoxShadow};
       padding: 1rem;`
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    color,
    blur,
    size,
    radius,
    shape,
    distance,
    colorDifference,
    gradient,
    activeLightSource,
    previewBox,
  ]);

  return (
    <div className="configuration soft-shadow">
      <div className="row">
        <label htmlFor="color" className="opacity-60">
          Pick a color
        </label>
        <input
          type="color"
          name="color"
          onChange={handleColor}
          placeholder="#ffffff"
          value={color}
          id="color"
        />
        <label
          htmlFor="colorInput"
          style={{ paddingLeft: "10px" }}
          className="opacity-60"
        >
          or
        </label>
        <input
          type="text"
          placeholder="#ffffff"
          name="color"
          id="colorInput"
          ref={colorInput}
          onChange={colorOnChange}
        />
        {color !== defaultColor && (
          <button
            onClick={() => setColor(defaultColor)}
            className="h-[32px] flex items-center gap-1.5 px-2 py-1 ml-3 text-xs text-[var(--textColor)] border-[3px] bg-[var(--baseColor)] border-[var(--textColor)]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 384 512"
              className="w-4 h-4"
            >
              <path
                fill="currentColor"
                d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"
              />
            </svg>
            Reset
          </button>
        )}
      </div>
      <div className="flex flex-col flex-wrap w-max-[200px] py-4">
        <span className="pr-1 opacity-60">to get better result</span>
        <span className="pr-1 opacity-60">
          - when you change Size, the radius, distance and blur change
          automatically
        </span>
        <span className="pr-1 opacity-60">
          - when you change distance, the blur change automatically
        </span>
        <span className="pr-1 opacity-60">
          - you can change any value as you want, try it out
        </span>
      </div>
      <ConfigurationRow
        label="Size"
        type="range"
        value={size}
        onChange={handleSize}
        min="10"
        max={410}
      />
      <ConfigurationRow
        label="Radius"
        type="range"
        value={radius}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setRadius(Number(e.target.value))
        }
        min="0"
        max={maxRadius}
      />
      <ConfigurationRow
        label="Distance"
        type="range"
        value={distance}
        onChange={handleDistance}
        min="5"
        max="50"
      />
      <ConfigurationRow
        label="Intensity"
        type="range"
        value={colorDifference}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setColorDifference(Number(e.target.value))
        }
        min="0.01"
        max="0.6"
        step="0.01"
      />
      <ConfigurationRow
        label="Blur"
        type="range"
        value={blur}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setBlur(Number(e.target.value))
        }
        min="0"
        max="100"
      />
      <ShapeSwitcher shape={shape} setShape={handleShape} />

      <CodeEditor
        code={`<div class='neumorphic'></div>
           <style>
           .neumorphic {${codeString}
           }
           </style>`}
        language="html"
        setCode={() => {}}
        showCopyButton
      />
    </div>
  );
};

export default Configuration;
