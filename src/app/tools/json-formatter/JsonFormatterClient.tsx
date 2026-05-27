"use client";

import { useMemo, useState } from "react";
import { Button, CopyButton, Select } from "@/components/ui";
import { EditorPanel, SegmentedControl, WarningPanel } from "@/features/tools/components";
import { ToolLayoutTextWorkbench } from "@/features/tools/layouts";
import { countLines, downloadText } from "../_shared/clientUtils";
import { formatJSON, getTopLevelCount, minifyJSON, SAMPLE_JSON, validateJSON, type IndentOption, type ValidationResult } from "./utils";

type Mode = "format" | "minify" | "validate";

function validationMessage(validation: ValidationResult | null) {
  if (!validation || !("error" in validation)) return "";
  const location = validation.line ? ` at line ${validation.line}${validation.col ? `, column ${validation.col}` : ""}` : "";
  return `${validation.error}${location}`;
}

export default function JsonFormatterClient() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<Mode>("format");
  const [indent, setIndent] = useState<IndentOption>(2);
  const [validation, setValidation] = useState<ValidationResult | null>(null);

  const error = validationMessage(validation);
  const stats = useMemo(() => ({
    inputChars: input.length,
    inputLines: countLines(input),
    outputChars: output.length,
    outputLines: countLines(output),
    topLevel: output ? getTopLevelCount(output) : 0,
  }), [input, output]);

  function run(nextMode = mode) {
    if (nextMode === "format") {
      const result = formatJSON(input, indent);
      setOutput(result.ok && result.output ? result.output : "");
      setValidation(result.validation);
      return;
    }
    if (nextMode === "minify") {
      const result = minifyJSON(input);
      setOutput(result.ok && result.output ? result.output : "");
      setValidation(result.validation);
      return;
    }
    const result = validateJSON(input);
    setValidation(result);
    setOutput(result.ok ? "Valid JSON. Use Format or Minify to generate output." : "");
  }

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
              <Button size="sm" variant="secondary" onClick={() => setInput(SAMPLE_JSON)}>Sample</Button>
              <Button size="sm" variant="ghost" onClick={() => { setInput(""); setOutput(""); setValidation(null); }}>Clear</Button>
            </>
          }
          footer={`${stats.inputChars.toLocaleString()} characters · ${stats.inputLines.toLocaleString()} lines`}
        />
      }
      outputSlot={
        <EditorPanel
          title="Output"
          language={mode === "minify" ? "Minified JSON" : mode === "validate" ? "Validation" : "Formatted JSON"}
          value={output}
          readOnly
          minRows={18}
          placeholder="Your output will appear here."
          error={error}
          actions={
            <>
              <CopyButton text={output} size="sm" variant="secondary">Copy</CopyButton>
              <Button size="sm" variant="secondary" disabled={!output} onClick={() => downloadText("formatted.json", output, "application/json;charset=utf-8")}>Download</Button>
            </>
          }
          footer={output ? `${stats.outputChars.toLocaleString()} characters · ${stats.outputLines.toLocaleString()} lines${stats.topLevel ? ` · ${stats.topLevel} top-level entries` : ""}` : "Paste input and choose an action to begin."}
        />
      }
      actionsSlot={
        <>
          <SegmentedControl<Mode>
            ariaLabel="JSON action"
            value={mode}
            onChange={(value) => setMode(value)}
            options={[{ value: "format", label: "Format" }, { value: "minify", label: "Minify" }, { value: "validate", label: "Validate" }]}
          />
          <Select size="sm" width="compact" value={String(indent)} onChange={(event) => setIndent(event.target.value === "tab" ? "tab" : Number(event.target.value) as IndentOption)} aria-label="Indent size">
            <option value="2">2 spaces</option>
            <option value="4">4 spaces</option>
            <option value="tab">Tabs</option>
          </Select>
          <Button size="sm" onClick={() => run()}>Run</Button>
        </>
      }
      statsSlot={
        <WarningPanel messages={error ? [{ id: "json-error", severity: "danger", title: "Invalid JSON", message: error }] : validation?.ok ? [{ id: "json-valid", severity: "success", title: "Valid JSON", message: "The input parsed successfully in your browser." }] : [{ id: "privacy", severity: "info", title: "Local processing", message: "Formatting and validation run locally in the browser." }]} />
      }
    />
  );
}
