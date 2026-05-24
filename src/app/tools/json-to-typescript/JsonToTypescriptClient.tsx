"use client";

import { useMemo, useState } from "react";
import { Button, CopyButton, Input, Select } from "@/components/ui";
import {
  ControlGrid,
  ControlSection,
  EditorPanel,
  ToolControlPanel,
  WarningPanel,
} from "@/features/tools/components";
import { ToolLayoutTextWorkbench } from "@/features/tools/layouts";
import { downloadText } from "../_shared/clientUtils";
import { inferTypeScript, parseJsonInput } from "./infer";
import { DEFAULT_OPTIONS, SAMPLE_JSON } from "./presets";
import type { ArrayHandling, NullHandling, OutputStyle } from "./types";

export default function JsonToTypescriptClient() {
  const [input, setInput] = useState(SAMPLE_JSON);
  const [options, setOptions] = useState(DEFAULT_OPTIONS);

  const parsed = useMemo(() => parseJsonInput(input), [input]);
  const parseError = "error" in parsed ? parsed.error : undefined;

  const output = useMemo(() => {
    if (!parsed.ok) {
      return null;
    }

    return inferTypeScript(parsed.value, options);
  }, [parsed, options]);

  const code = output?.code ?? "";

  return (
    <ToolLayoutTextWorkbench
      inputSlot={
        <EditorPanel
          title="Input JSON"
          language="JSON"
          value={input}
          onChange={setInput}
          minRows={18}
          placeholder="Paste JSON here..."
          actions={
            <>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setInput(SAMPLE_JSON)}
              >
                Sample
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setInput("")}>
                Clear
              </Button>
            </>
          }
          footer={`${input.length.toLocaleString()} characters`}
        />
      }
      outputSlot={
        <EditorPanel
          title="TypeScript output"
          language="TS"
          value={code}
          readOnly
          minRows={18}
          placeholder="Generated TypeScript will appear here."
          error={!parsed.ok ? parseError : undefined}
          actions={
            <>
              <CopyButton text={code} size="sm" variant="secondary">
                Copy
              </CopyButton>
              <Button
                size="sm"
                variant="secondary"
                disabled={!code}
                onClick={() =>
                  downloadText(
                    `${options.rootName || "types"}.ts`,
                    code,
                    "text/typescript;charset=utf-8",
                  )
                }
              >
                Download
              </Button>
            </>
          }
          footer={
            output
              ? `Root type: ${output.rootName}`
              : "Fix JSON errors to generate types."
          }
        />
      }
      optionsSlot={
        <ToolControlPanel title="Type options">
          <ControlSection title="Shape">
            <ControlGrid columns={2}>
              <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                Root name
                <Input
                  size="sm"
                  className="mt-1"
                  value={options.rootName}
                  onChange={(event) =>
                    setOptions((current) => ({
                      ...current,
                      rootName: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                Output style
                <Select
                  size="sm"
                  className="mt-1"
                  value={options.outputStyle}
                  onChange={(event) =>
                    setOptions((current) => ({
                      ...current,
                      outputStyle: event.target.value as OutputStyle,
                    }))
                  }
                >
                  <option value="interface">interface</option>
                  <option value="type">type</option>
                </Select>
              </label>

              <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                Null handling
                <Select
                  size="sm"
                  className="mt-1"
                  value={options.nullHandling}
                  onChange={(event) =>
                    setOptions((current) => ({
                      ...current,
                      nullHandling: event.target.value as NullHandling,
                    }))
                  }
                >
                  <option value="include-null">include null</option>
                  <option value="null-as-optional">null as optional</option>
                </Select>
              </label>

              <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                Arrays
                <Select
                  size="sm"
                  className="mt-1"
                  value={options.arrayHandling}
                  onChange={(event) =>
                    setOptions((current) => ({
                      ...current,
                      arrayHandling: event.target.value as ArrayHandling,
                    }))
                  }
                >
                  <option value="all-items">all items</option>
                  <option value="first-item">first item</option>
                </Select>
              </label>
            </ControlGrid>

            <div className="mt-3 flex flex-wrap gap-2">
              {(
                [
                  "exportTypes",
                  "optionalProperties",
                  "readonlyProperties",
                  "useSemicolons",
                ] as const
              ).map((key) => (
                <Button
                  key={key}
                  size="sm"
                  variant={options[key] ? "primary" : "secondary"}
                  onClick={() =>
                    setOptions((current) => ({
                      ...current,
                      [key]: !current[key],
                    }))
                  }
                >
                  {key.replace(/([A-Z])/g, " $1")}
                </Button>
              ))}
            </div>
          </ControlSection>
        </ToolControlPanel>
      }
      statsSlot={
        <WarningPanel
          messages={
            !parsed.ok
              ? [
                  {
                    id: "json-error",
                    severity: "danger",
                    title: "Invalid JSON",
                    message: parseError ?? "Invalid JSON.",
                  },
                ]
              : (output?.warnings ?? []).length
                ? output!.warnings.map((message, index) => ({
                    id: `warn-${index}`,
                    severity: "warning",
                    title: "Type inference note",
                    message,
                  }))
                : [
                    {
                      id: "ok",
                      severity: "success",
                      title: "Ready",
                      message:
                        "JSON parsed successfully and TypeScript was generated locally.",
                    },
                  ]
          }
        />
      }
    />
  );
}
