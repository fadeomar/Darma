"use client";

import { useMemo, useState } from "react";
import { Button, CopyButton, Input } from "@/components/ui";
import { CodeOutputPanel, EditorPanel, ResultPanel, ToolControlPanel, ControlSection, WarningPanel } from "@/features/tools/components";
import { ToolLayoutTextWorkbench } from "@/features/tools/layouts";
import { buildRegex, findMatches, replaceMatches } from "./regex";
import { DEFAULT_FLAGS, DEFAULT_PATTERN, DEFAULT_REPLACEMENT, FLAG_OPTIONS, SAMPLE_TEXT } from "./presets";

export default function RegexTesterClient() {
  const [pattern, setPattern] = useState(DEFAULT_PATTERN);
  const [flags, setFlags] = useState(DEFAULT_FLAGS);
  const [text, setText] = useState(SAMPLE_TEXT);
  const [replacement, setReplacement] = useState(DEFAULT_REPLACEMENT);
  const built = useMemo(() => buildRegex(pattern, flags), [pattern, flags]);
  const matches = useMemo(() => built instanceof RegExp ? findMatches(pattern, flags, text) : [], [built, pattern, flags, text]);
  const replaced = useMemo(() => built instanceof RegExp ? replaceMatches(pattern, flags, text, replacement) : "", [built, pattern, flags, text, replacement]);
  const error = !(built instanceof RegExp) ? built.message : "";
  function toggleFlag(flag: string) { setFlags((current) => current.includes(flag) ? current.replace(flag, "") : current + flag); }
  return <ToolLayoutTextWorkbench
    inputSlot={<EditorPanel title="Test text" language="Text" value={text} onChange={setText} minRows={15} placeholder="Paste text to test..." actions={<><Button size="sm" variant="secondary" onClick={() => setText(SAMPLE_TEXT)}>Sample</Button><Button size="sm" variant="ghost" onClick={() => setText("")}>Clear</Button></>} footer={`${matches.length.toLocaleString()} match(es) found`} />}
    outputSlot={<CodeOutputPanel title="Regex results" description="Matches, groups, and replacement output." tabs={[{ id: "matches", label: "Matches", code: matches.map((m, i) => `#${i + 1} [${m.index}-${m.endIndex}] ${m.match}${m.captures.length ? `\nCaptures: ${m.captures.map((c) => `${c.index}: ${c.value ?? ""}`).join(", ")}` : ""}${m.namedGroups.length ? `\nNamed: ${m.namedGroups.map((g) => `${g.name}: ${g.value ?? ""}`).join(", ")}` : ""}`).join("\n\n"), language: "txt" }, { id: "replace", label: "Replace", code: replaced, language: "txt" }]} emptyMessage="No matches yet." />}
    actionsSlot={<><Input size="sm" width="medium" aria-label="Regex pattern" value={pattern} onChange={(event) => setPattern(event.target.value)} placeholder="Pattern" /><Input size="sm" width="short" aria-label="Replacement" value={replacement} onChange={(event) => setReplacement(event.target.value)} placeholder="Replacement" /><CopyButton text={`/${pattern}/${flags}`} size="sm" variant="secondary">Copy regex</CopyButton></>}
    optionsSlot={<ToolControlPanel title="Regex options"><ControlSection title="Flags"><div className="flex flex-wrap gap-2">{FLAG_OPTIONS.map(({ flag, label }) => <Button key={flag} size="sm" variant={flags.includes(flag) ? "primary" : "secondary"} onClick={() => toggleFlag(flag)}>{label}</Button>)}</div></ControlSection><ControlSection title="Summary"><ResultPanel value={<div className="space-y-1 text-left"><p><strong>Pattern:</strong> /{pattern}/{flags}</p><p><strong>Matches:</strong> {matches.length}</p></div>} /></ControlSection></ToolControlPanel>}
    statsSlot={<WarningPanel messages={error ? [{ id: "regex-error", severity: "danger", title: "Invalid regex", message: error }] : [{ id: "ok", severity: "info", title: "Keyboard accessible", message: "Matches are listed as text with positions and groups, not color-only highlights." }]} />}
  />;
}
