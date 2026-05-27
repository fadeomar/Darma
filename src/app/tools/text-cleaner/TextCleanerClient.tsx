"use client";

import { useMemo, useState } from "react";
import { Button, CopyButton } from "@/components/ui";
import { EditorPanel, ToolControlPanel, ControlSection, ControlGrid, SegmentedControl, WarningPanel } from "@/features/tools/components";
import { ToolLayoutTextWorkbench } from "@/features/tools/layouts";
import { downloadText } from "../_shared/clientUtils";
import { CASE_TRANSFORMS, CLEAN_TRANSFORMS, SAMPLE_TEXT, computeStats } from "./transforms";

type Group = "clean" | "case";

export default function TextCleanerClient() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [group, setGroup] = useState<Group>("clean");
  const transforms = group === "clean" ? CLEAN_TRANSFORMS : CASE_TRANSFORMS;
  const inputStats = useMemo(() => computeStats(input), [input]);
  const outputStats = useMemo(() => computeStats(output), [output]);

  function applyTransform(id: string) {
    const transform = transforms.find((item) => item.id === id);
    if (!transform) return;
    setOutput(transform.fn(input));
  }

  return (
    <ToolLayoutTextWorkbench
      inputSlot={
        <EditorPanel
          title="Input text"
          language="Text"
          value={input}
          onChange={setInput}
          minRows={15}
          placeholder="Paste messy text here..."
          actions={<><Button size="sm" variant="secondary" onClick={() => setInput(SAMPLE_TEXT)}>Sample</Button><Button size="sm" variant="ghost" onClick={() => { setInput(""); setOutput(""); }}>Clear</Button></>}
          footer={`${inputStats.characters.toLocaleString()} chars · ${inputStats.words.toLocaleString()} words · ${inputStats.lines.toLocaleString()} lines`}
        />
      }
      outputSlot={
        <EditorPanel
          title="Cleaned output"
          language="Text"
          value={output}
          readOnly
          minRows={15}
          placeholder="Cleaned text will appear here."
          actions={<><CopyButton text={output} size="sm" variant="secondary">Copy</CopyButton><Button size="sm" variant="secondary" disabled={!output} onClick={() => downloadText("cleaned-text.txt", output)}>Download</Button></>}
          footer={output ? `${outputStats.characters.toLocaleString()} chars · ${outputStats.words.toLocaleString()} words · ${Math.max(0, inputStats.characters - outputStats.characters).toLocaleString()} chars removed` : "Choose a cleaning or case action to create output."}
        />
      }
      actionsSlot={
        <>
          <SegmentedControl<Group> ariaLabel="Text transform group" value={group} onChange={setGroup} options={[{ value: "clean", label: "Clean" }, { value: "case", label: "Case" }]} />
          <Button size="sm" disabled={!input} onClick={() => applyTransform(transforms[0]?.id ?? "")}>Run first action</Button>
          <Button size="sm" variant="secondary" disabled={!output} onClick={() => setInput(output)}>Use output as input</Button>
        </>
      }
      optionsSlot={
        <ToolControlPanel title="Text actions" description="Pick one transform. Output stays stable until you run another action.">
          <ControlSection title={group === "clean" ? "Whitespace and lines" : "Case conversion"}>
            <ControlGrid columns={3}>
              {transforms.map((item) => <Button key={item.id} size="sm" variant="secondary" onClick={() => applyTransform(item.id)} disabled={!input} title={item.title}>{item.label}</Button>)}
            </ControlGrid>
          </ControlSection>
        </ToolControlPanel>
      }
      statsSlot={<WarningPanel messages={[{ id: "local", severity: "info", title: "Local processing", message: "Text cleanup runs in your browser and is not uploaded." }]} />}
    />
  );
}
