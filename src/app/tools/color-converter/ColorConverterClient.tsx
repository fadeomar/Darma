"use client";

import { useMemo, useState } from "react";
import { Button, CopyButton, Input } from "@/components/ui";
import {
  ColorField,
  ControlGrid,
  ResultPanel,
  WarningPanel,
} from "@/features/tools/components";
import { ToolLayoutSingleUtility } from "@/features/tools/layouts";
import { parseColorInput, COLOR_EXAMPLES } from "./color";

export default function ColorConverterClient() {
  const [input, setInput] = useState("#3b82f6");

  const parsed = useMemo(() => parseColorInput(input), [input]);
  const colorError = "error" in parsed ? parsed.error : "";

  const outputs = parsed.ok
    ? [
        { label: "HEX", value: parsed.hex },
        { label: "RGB", value: parsed.cssRgb },
        { label: "HSL", value: parsed.cssHsl },
        { label: "CSS variable", value: `--color-brand: ${parsed.hex};` },
      ]
    : [];

  return (
    <ToolLayoutSingleUtility
      resultSlot={
        <ResultPanel
          title="Color preview"
          description="Every swatch includes text values so the result is not color-only."
          value={
            <div
              className="rounded-[var(--radius-lg)] border border-[var(--color-border)] p-8 text-center"
              style={{
                background: parsed.ok ? parsed.hex : "var(--color-bg-soft)",
                color: parsed.ok
                  ? parsed.bestTextColor
                  : "var(--color-text-muted)",
              }}
            >
              <div className="text-3xl font-black">
                {parsed.ok ? parsed.hex : "Invalid color"}
              </div>

              <p className="mt-2 text-sm">
                {parsed.ok
                  ? `Detected ${parsed.detectedFormat.toUpperCase()}`
                  : colorError}
              </p>
            </div>
          }
          actions={
            parsed.ok ? (
              <CopyButton text={parsed.hex} size="sm">
                Copy HEX
              </CopyButton>
            ) : null
          }
        />
      }
      actionsSlot={
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs font-semibold text-[var(--color-text-muted)]">
            Color
            <Input
              className="mt-1"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="#3b82f6"
            />
          </label>

          {parsed.ok ? (
            <ColorField label="Picker" value={parsed.hex} onChange={setInput} />
          ) : null}
        </div>
      }
      controlsSlot={
        <div className="space-y-4">
          <ControlGrid columns={4}>
            {outputs.map((item) => (
              <ResultPanel
                key={item.label}
                title={item.label}
                value={
                  <code className="break-all font-mono text-xs">
                    {item.value}
                  </code>
                }
                actions={
                  <CopyButton text={item.value} size="sm" variant="secondary">
                    Copy
                  </CopyButton>
                }
              />
            ))}
          </ControlGrid>

          <div className="flex flex-wrap gap-2">
            {COLOR_EXAMPLES.map((item) => (
              <Button
                key={item.value}
                size="sm"
                variant="secondary"
                onClick={() => setInput(item.value)}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      }
      infoSlot={
        <WarningPanel
          messages={
            parsed.ok
              ? [
                  {
                    id: "contrast",
                    severity: "info",
                    title: "Contrast hint",
                    message: `Contrast with black: ${parsed.contrastWithBlack.toFixed(
                      2,
                    )}. Contrast with white: ${parsed.contrastWithWhite.toFixed(
                      2,
                    )}.`,
                  },
                ]
              : [
                  {
                    id: "invalid",
                    severity: "danger",
                    title: "Invalid color",
                    message: colorError,
                  },
                ]
          }
        />
      }
    />
  );
}
