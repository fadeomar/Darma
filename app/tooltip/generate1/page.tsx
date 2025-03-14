"use client";

import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import "./style.css";

interface TooltipConfig {
  direction: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
  borderWidth: string;
  borderStyle: string;
  borderRadius: string;
  size: string;
  arrowSize: string;
  cursorType: string;
  slideDistance: string;
  animationTiming: string;
  delayShow: string;
  delayHide: string;
  isStatic: boolean;
  isVisible: boolean;
  hasRoundedCorners: boolean;
  tooltipText: string;
  fontSize: string;
}

const initialConfig: TooltipConfig = {
  direction: "top",
  textColor: "#ffffff",
  bgColor: "#333333",
  borderColor: "#333333",
  borderWidth: "0",
  borderStyle: "solid",
  borderRadius: "0.3rem",
  size: "medium",
  arrowSize: "0.6rem",
  cursorType: "default",
  slideDistance: "10",
  animationTiming: "0.3",
  delayShow: "0",
  delayHide: "0",
  isStatic: false,
  isVisible: false,
  hasRoundedCorners: true,
  tooltipText: "Your tooltip text",
  fontSize: "0.9",
};

const generatedTooltipStyle = (config) => {
  const tt = [
    `width: 218px;`,
    `background: #4994b6;`,
    `color: blue;`,
    `text-align: center;`,
    `padding: 15px 24px 14px 24px;`,
    `border-radius: 7px;`,
    `top: ${config.direction === "top" ? "-72px;" : "calc(100% + 26px);"}`,
    `left: 50%;`,
    `transform: translateX(-50%);`,
    `position: absolute;`,
    `z-index: 9999;`,
  ]
    .filter(Boolean)
    .join("\n  ");

  const bb = [
    `border-width: 0 20px 21px;`,
    `border-color: transparent;`,
    `border-bottom-color: #4994b6;`,
    `z-index: 9999;`,
    `position: absolute;`,
    `top: ${config.direction === "top" ? "auto;" : "-20px;"}`,
    `bottom: ${config.direction === "top" ? "-21px;" : "auto;"}`,
    `left: 50%;`,
    `transform: translateX(-50%) ${config.direction === "top" && "scale(-1)"};`,
    `position: absolute;`,
  ]
    .filter(Boolean)
    .join("\n  ");
  return `.tooltip {${tt}} \n \n .triangle {${bb}}`;
};

const directions = [
  "top",
  "bottom",
  "left",
  "right",
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
];

const sizes = ["small", "medium", "large", "fit"];
const borderStyles = ["solid", "dashed", "dotted"];
const cursorTypes = ["default", "help", "pointer", "not-allowed"];

export default function TooltipGenerator() {
  const [config, setConfig] = useState<TooltipConfig>(initialConfig);

  const CopyButton = ({ content }: { content: string }) => {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = async () => {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <button
        onClick={copyToClipboard}
        className="absolute top-2 right-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
      >
        {copied ? "✓ Copied" : "Copy"}
      </button>
    );
  };

  const generateHTMLCode = () => {
    const attributes = [
      `data-cooltipz-dir="${config.direction}"`,
      config.size !== "medium" && `data-cooltipz-size="${config.size}"`,
      config.isStatic && "data-cooltipz-static",
      config.isVisible && "data-cooltipz-visible",
      `aria-label="${config.tooltipText}"`,
    ]
      .filter(Boolean)
      .join(" ");

    return `<button ${attributes.trim()}>
  Hover me
</button>`;
  };

  const generateCSSCode = () => {
    const properties = [
      `--cooltipz-text-color: ${config.textColor};`,
      `--cooltipz-bg-color: ${config.bgColor};`,
      `--cooltipz-border-color: ${config.borderColor};`,
      `--cooltipz-border-width: ${config.borderWidth}px;`,
      `--cooltipz-border-style: ${config.borderStyle};`,
      `--cooltipz-border-radius: ${
        config.hasRoundedCorners ? config.borderRadius : "0"
      };`,
      `--cooltipz-arrow-size: ${config.arrowSize};`,
      `--cooltipz-cursor: ${config.cursorType};`,
      `--cooltipz-slide: ${config.slideDistance}px;`,
      `--cooltipz-timing: ${config.animationTiming}s;`,
      config.delayShow !== "0" &&
        `--cooltipz-delay-show: ${config.delayShow}s;`,
      config.delayHide !== "0" &&
        `--cooltipz-delay-hide: ${config.delayHide}s;`,
      `--cooltipz-font-size: ${config.fontSize}rem;`,
    ]
      .filter(Boolean)
      .join("\n  ");

    return `button {
  ${properties}
}`;
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">
          Tooltip Generator
        </h1>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Controls Section */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-6">Settings</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Direction */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Direction
                </label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={config.direction}
                  onChange={(e) =>
                    setConfig({ ...config, direction: e.target.value })
                  }
                >
                  {directions.map((dir) => (
                    <option key={dir} value={dir}>
                      {dir.replace("-", " ")}
                    </option>
                  ))}
                </select>
              </div>

              {/* Size */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Size
                </label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={config.size}
                  onChange={(e) =>
                    setConfig({ ...config, size: e.target.value })
                  }
                >
                  {sizes.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>

              {/* Colors */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Text Color
                </label>
                <input
                  type="color"
                  className="w-full h-10"
                  value={config.textColor}
                  onChange={(e) =>
                    setConfig({ ...config, textColor: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Background Color
                </label>
                <input
                  type="color"
                  className="w-full h-10"
                  value={config.bgColor}
                  onChange={(e) =>
                    setConfig({ ...config, bgColor: e.target.value })
                  }
                />
              </div>

              {/* Border Settings */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Border Style
                </label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={config.borderStyle}
                  onChange={(e) =>
                    setConfig({ ...config, borderStyle: e.target.value })
                  }
                >
                  {borderStyles.map((style) => (
                    <option key={style} value={style}>
                      {style}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Border Width (px)
                </label>
                <input
                  type="number"
                  className="w-full p-2 border rounded-md"
                  min="0"
                  value={config.borderWidth}
                  onChange={(e) =>
                    setConfig({ ...config, borderWidth: e.target.value })
                  }
                />
              </div>

              {/* Animation Settings */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Animation Timing (s)
                </label>
                <input
                  type="number"
                  step="0.1"
                  className="w-full p-2 border rounded-md"
                  value={config.animationTiming}
                  onChange={(e) =>
                    setConfig({ ...config, animationTiming: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Slide Distance (px)
                </label>
                <input
                  type="number"
                  className="w-full p-2 border rounded-md"
                  value={config.slideDistance}
                  onChange={(e) =>
                    setConfig({ ...config, slideDistance: e.target.value })
                  }
                />
              </div>

              {/* Tooltip Content */}
              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Tooltip Text
                </label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-md"
                  value={config.tooltipText}
                  onChange={(e) =>
                    setConfig({ ...config, tooltipText: e.target.value })
                  }
                />
              </div>

              {/* Toggles */}
              <div className="flex flex-col gap-4 md:col-span-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={config.hasRoundedCorners}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        hasRoundedCorners: e.target.checked,
                      })
                    }
                  />
                  <span className="text-sm">Rounded Corners</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={config.isStatic}
                    onChange={(e) =>
                      setConfig({ ...config, isStatic: e.target.checked })
                    }
                  />
                  <span className="text-sm">Static (No Animation)</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={config.isVisible}
                    onChange={(e) =>
                      setConfig({ ...config, isVisible: e.target.checked })
                    }
                  />
                  <span className="text-sm">Always Visible</span>
                </label>
              </div>
            </div>
          </div>

          {/* Preview and Code Section */}
          <div className="space-y-8">
            {/* Preview */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-4">Preview</h2>
              <div className="flex justify-center items-center h-48 border rounded-lg bg-gray-50">
                {/* Preview Button */}

                <div className="tooltip-box">
                  <style>{generatedTooltipStyle(config)}</style>
                  <a href="#">Hover</a>
                  <div
                    className="tooltip"
                    data-cooltipz
                    data-cooltipz-dir={config.direction}
                    data-cooltipz-size={
                      config.size !== "medium" ? config.size : undefined
                    }
                    data-cooltipz-static={config.isStatic || undefined}
                    data-cooltipz-visible={config.isVisible || undefined}
                    aria-label={config.tooltipText}
                  >
                    <span
                      className="triangle"
                      style={{ borderColor: "none !important" }}
                    ></span>
                    Tooltip
                  </div>
                </div>
              </div>
            </div>
            {/* Code Preview */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-md relative">
              <h2 className="text-xl font-semibold text-white mb-4">
                Generated Code
              </h2>

              <div className="space-y-6">
                <div className="relative">
                  <CopyButton content={generateHTMLCode()} />
                  <SyntaxHighlighter
                    language="html"
                    style={vscDarkPlus}
                    customStyle={{ margin: 0, background: "none" }}
                  >
                    {generateHTMLCode()}
                  </SyntaxHighlighter>
                </div>

                <div className="relative">
                  <CopyButton content={generateCSSCode()} />
                  <SyntaxHighlighter
                    language="css"
                    style={vscDarkPlus}
                    customStyle={{ margin: 0, background: "none" }}
                  >
                    {generateCSSCode()}
                  </SyntaxHighlighter>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
