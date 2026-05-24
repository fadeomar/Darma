"use client";

import { useMemo, useState } from "react";
import { Button, CopyButton } from "@/components/ui";
import { EditorPanel, SegmentedControl, ToolControlPanel, ControlSection, WarningPanel } from "@/features/tools/components";
import { ToolLayoutTextWorkbench } from "@/features/tools/layouts";
import { downloadText } from "../_shared/clientUtils";
import { computeBase64Stats, transformBase64, type Base64Mode } from "./base64";

const SAMPLE = "Darma tools encode and decode text locally.";

export default function Base64Client() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Base64Mode>("encode");
  const [urlSafe, setUrlSafe] = useState(false);
  const [removePadding, setRemovePadding] = useState(false);
  const result = useMemo(() => transformBase64(input, mode, { urlSafe, removePadding }), [input, mode, urlSafe, removePadding]);
  const stats = useMemo(() => computeBase64Stats(input, result.output, mode), [input, result.output, mode]);
  function swap() { setInput(result.output); setMode(mode === "encode" ? "decode" : "encode"); }
  return (
    <ToolLayoutTextWorkbench
      inputSlot={<EditorPanel title="Input" language={mode === "encode" ? "Text" : "Base64"} value={input} onChange={setInput} minRows={14} placeholder="Paste text or Base64 here..." actions={<><Button size="sm" variant="secondary" onClick={() => setInput(SAMPLE)}>Sample</Button><Button size="sm" variant="ghost" onClick={() => setInput("")}>Clear</Button></>} footer={`${stats.inputChars.toLocaleString()} chars · ${stats.inputBytes.toLocaleString()} bytes`} />}
      outputSlot={<EditorPanel title="Output" language={mode === "encode" ? "Base64" : "Decoded text"} value={result.output} readOnly minRows={14} placeholder="Converted output will appear here." error={result.error?.message} actions={<><CopyButton text={result.output} size="sm" variant="secondary">Copy</CopyButton><Button size="sm" variant="secondary" disabled={!result.output} onClick={() => downloadText(mode === "encode" ? "encoded-base64.txt" : "decoded-text.txt", result.output)}>Download</Button></>} footer={result.output ? `${stats.outputChars.toLocaleString()} chars · ${stats.outputBytes.toLocaleString()} bytes · ${stats.sizeChangePercent}% size change` : "Switch mode or paste input to convert."} />}
      actionsSlot={<><SegmentedControl<Base64Mode> ariaLabel="Base64 mode" value={mode} onChange={setMode} options={[{ value: "encode", label: "Encode" }, { value: "decode", label: "Decode" }]} /><Button size="sm" onClick={swap} disabled={!result.output}>Swap</Button></>}
      optionsSlot={<ToolControlPanel title="Base64 options"><ControlSection title="Encoding profile"><div className="flex flex-wrap gap-2"><Button size="sm" variant={urlSafe ? "primary" : "secondary"} onClick={() => setUrlSafe((v) => !v)}>URL-safe</Button><Button size="sm" variant={removePadding ? "primary" : "secondary"} onClick={() => setRemovePadding((v) => !v)}>Remove padding</Button></div></ControlSection></ToolControlPanel>}
      statsSlot={<WarningPanel messages={result.error ? [{ id: "base64-error", severity: "danger", title: "Invalid Base64", message: result.error.message }] : [{ id: "local", severity: "info", title: "Browser-only", message: "Encoding and decoding happen locally in your browser." }]} />}
    />
  );
}
