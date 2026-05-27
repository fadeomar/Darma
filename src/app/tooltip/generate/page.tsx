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
        type="button"
        onClick={copyToClipboard}
        className="absolute right-2 top-2 rounded-[var(--radius-sm)] border border-[var(--color-code-border)] bg-[var(--color-code-surface)] px-3 py-1 text-sm font-semibold text-[var(--color-code-text)] transition hover:bg-[var(--color-code-bg)] focus-visible:shadow-[var(--focus-ring)]"
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

    return `<button type="button" ${attributes.trim()}>
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
    <div className="min-h-screen bg-[var(--color-page-bg)] px-4 py-8 text-[var(--color-text-primary)] sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-[var(--color-text-primary)] mb-8">
          Tooltip Generator
        </h1>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Controls Section */}
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-6 shadow-[var(--shadow-sm)]">
            <h2 className="text-2xl font-semibold mb-6">Settings</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Direction */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--color-text-tertiary)]">
                  Direction
                </label>
                <select
                  className="w-full p-2 border border-[var(--color-border-default)] rounded-[var(--radius-sm)] bg-[var(--color-control-bg)] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)] focus:shadow-[var(--focus-ring)]"
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
                <label className="block text-sm font-medium text-[var(--color-text-tertiary)]">
                  Size
                </label>
                <select
                  className="w-full p-2 border border-[var(--color-border-default)] rounded-[var(--radius-sm)] bg-[var(--color-control-bg)] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)] focus:shadow-[var(--focus-ring)]"
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
                <label className="block text-sm font-medium text-[var(--color-text-tertiary)]">
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
                <label className="block text-sm font-medium text-[var(--color-text-tertiary)]">
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
                <label className="block text-sm font-medium text-[var(--color-text-tertiary)]">
                  Border Style
                </label>
                <select
                  className="w-full p-2 border border-[var(--color-border-default)] rounded-[var(--radius-sm)] bg-[var(--color-control-bg)] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)] focus:shadow-[var(--focus-ring)]"
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
                <label className="block text-sm font-medium text-[var(--color-text-tertiary)]">
                  Border Width (px)
                </label>
                <input
                  type="number"
                  className="w-full p-2 border border-[var(--color-border-default)] rounded-[var(--radius-sm)] bg-[var(--color-control-bg)] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)] focus:shadow-[var(--focus-ring)]"
                  min="0"
                  value={config.borderWidth}
                  onChange={(e) =>
                    setConfig({ ...config, borderWidth: e.target.value })
                  }
                />
              </div>

              {/* Animation Settings */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--color-text-tertiary)]">
                  Animation Timing (s)
                </label>
                <input
                  type="number"
                  step="0.1"
                  className="w-full p-2 border border-[var(--color-border-default)] rounded-[var(--radius-sm)] bg-[var(--color-control-bg)] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)] focus:shadow-[var(--focus-ring)]"
                  value={config.animationTiming}
                  onChange={(e) =>
                    setConfig({ ...config, animationTiming: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--color-text-tertiary)]">
                  Slide Distance (px)
                </label>
                <input
                  type="number"
                  className="w-full p-2 border border-[var(--color-border-default)] rounded-[var(--radius-sm)] bg-[var(--color-control-bg)] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)] focus:shadow-[var(--focus-ring)]"
                  value={config.slideDistance}
                  onChange={(e) =>
                    setConfig({ ...config, slideDistance: e.target.value })
                  }
                />
              </div>

              {/* Tooltip Content */}
              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-medium text-[var(--color-text-tertiary)]">
                  Tooltip Text
                </label>
                <input
                  type="text"
                  className="w-full p-2 border border-[var(--color-border-default)] rounded-[var(--radius-sm)] bg-[var(--color-control-bg)] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)] focus:shadow-[var(--focus-ring)]"
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
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-6 shadow-[var(--shadow-sm)]">
              <h2 className="text-2xl font-semibold mb-4">Preview</h2>
              <div className="flex h-48 items-center justify-center rounded-[var(--radius-lg)] border border-[var(--color-preview-border)] bg-[var(--color-preview-bg)]">
                {/* Preview Button */}
                <button
                  type="button"
                  className="tooltip-button"
                  data-cooltipz
                  data-cooltipz-dir={config.direction}
                  data-cooltipz-size={
                    config.size !== "medium" ? config.size : undefined
                  }
                  data-cooltipz-static={config.isStatic || undefined}
                  data-cooltipz-visible={config.isVisible || undefined}
                  aria-label={config.tooltipText}
                  style={
                    {
                      "--cooltipz-text-color": config.textColor,
                      "--cooltipz-bg-color": config.bgColor,
                      "--cooltipz-border-color": config.borderColor,
                      "--cooltipz-border-width": `${config.borderWidth}px`,
                      "--cooltipz-border-style": config.borderStyle,
                      "--cooltipz-border-radius": config.hasRoundedCorners
                        ? config.borderRadius
                        : "0",
                      "--cooltipz-arrow-size": config.arrowSize,
                      "--cooltipz-cursor": config.cursorType,
                      "--cooltipz-slide": `${config.slideDistance}px`,
                      "--cooltipz-timing": `${config.animationTiming}s`,
                      "--cooltipz-delay-show": `${config.delayShow}s`,
                      "--cooltipz-delay-hide": `${config.delayHide}s`,
                      "--cooltipz-font-size": `${config.fontSize}rem`,
                    } as React.CSSProperties
                  }
                >
                  Hover me
                </button>
              </div>
            </div>

            {/* Code Preview */}
            <div className="relative rounded-[var(--radius-lg)] border border-[var(--color-code-border)] bg-[var(--color-code-bg)] p-6 shadow-[var(--shadow-sm)]">
              <h2 className="text-xl font-semibold text-[var(--color-code-text)] mb-4">
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
