"use client";

import { useMemo, useState } from "react";
import { Button, CopyButton } from "@/components/ui";
import {
  ControlSection,
  EditorPanel,
  SegmentedControl,
  ToolControlPanel,
  WarningPanel,
} from "@/features/tools/components";
import { ToolLayoutTextWorkbench } from "@/features/tools/layouts";
import { downloadText } from "../_shared/clientUtils";
import {
  parseQueryParams,
  processUrlText,
  URL_EXAMPLES,
  type UrlEncodingType,
  type UrlMode,
} from "./url";

export default function UrlEncoderDecoderClient() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<UrlMode>("encode");
  const [type, setType] = useState<UrlEncodingType>("component");

  const result = useMemo(
    () => processUrlText(input, mode, type),
    [input, mode, type],
  );

  const params = useMemo(() => parseQueryParams(input), [input]);
  const resultError = "error" in result ? result.error : undefined;

  function swap() {
    if (!result.output) {
      return;
    }

    setInput(result.output);
    setMode((current) => (current === "encode" ? "decode" : "encode"));
  }

  return (
    <ToolLayoutTextWorkbench
      inputSlot={
        <EditorPanel
          title="Input"
          language="URL/Text"
          value={input}
          onChange={setInput}
          minRows={13}
          placeholder="Paste a URL, query string, or text..."
          actions={
            <>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setInput(URL_EXAMPLES[0] ?? "")}
              >
                Sample
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setInput("")}>
                Clear
              </Button>
            </>
          }
          footer={`${input.length.toLocaleString()} characters${
            params.length ? ` · ${params.length} query parameters detected` : ""
          }`}
        />
      }
      outputSlot={
        <EditorPanel
          title="Output"
          language={result.ok ? result.status : "Error"}
          value={result.output}
          readOnly
          minRows={13}
          placeholder="Encoded or decoded output will appear here."
          error={!result.ok ? resultError : undefined}
          actions={
            <>
              <CopyButton text={result.output} size="sm" variant="secondary">
                Copy
              </CopyButton>
              <Button
                size="sm"
                variant="secondary"
                disabled={!result.output}
                onClick={() => downloadText("url-output.txt", result.output)}
              >
                Download
              </Button>
            </>
          }
          footer={
            result.ok
              ? result.status
              : "Fix the malformed percent encoding and try again."
          }
        />
      }
      actionsSlot={
        <>
          <SegmentedControl<UrlMode>
            ariaLabel="URL mode"
            value={mode}
            onChange={setMode}
            options={[
              { value: "encode", label: "Encode" },
              { value: "decode", label: "Decode" },
            ]}
          />

          <SegmentedControl<UrlEncodingType>
            ariaLabel="Encoding type"
            value={type}
            onChange={setType}
            options={[
              { value: "component", label: "Component" },
              { value: "full", label: "Full URL" },
            ]}
          />

          <Button size="sm" onClick={swap} disabled={!result.output}>
            Swap
          </Button>
        </>
      }
      optionsSlot={
        params.length ? (
          <ToolControlPanel title="Detected query parameters">
            <ControlSection title="Preview">
              <div className="grid gap-2 text-xs text-[var(--color-text-muted)]">
                {params.slice(0, 8).map((row, index) => (
                  <div
                    key={`${row.key}-${index}`}
                    className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-2"
                  >
                    <strong>{row.key}</strong>: {row.value || "(empty)"}
                  </div>
                ))}
              </div>
            </ControlSection>
          </ToolControlPanel>
        ) : undefined
      }
      statsSlot={
        <WarningPanel
          messages={
            !result.ok
              ? [
                  {
                    id: "url-error",
                    severity: "danger",
                    title: "Malformed URI",
                    message: resultError ?? "Malformed URI.",
                  },
                ]
              : [
                  {
                    id: "tip",
                    severity: "info",
                    title:
                      type === "component" ? "Component mode" : "Full URL mode",
                    message:
                      type === "component"
                        ? "Use this for query values and path segments."
                        : "Use this for complete URLs where reserved characters should stay readable.",
                  },
                ]
          }
        />
      }
    />
  );
}
