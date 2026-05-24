"use client";

import { useMemo, useState } from "react";
import { Button, CopyButton, Tabs } from "@/components/ui";
import { EditorPanel, WarningPanel } from "@/features/tools/components";
import { ToolLayoutTextWorkbench } from "@/features/tools/layouts";
import { decodeJwt } from "./jwt";
import { DEFAULT_JWT } from "./presets";
import type { JwtTab } from "./types";

export default function JwtDecoderClient() {
  const [token, setToken] = useState("");
  const [tab, setTab] = useState<JwtTab>("payload");
  const decoded = useMemo(() => decodeJwt(token), [token]);
  const activeValue = tab === "header" ? decoded.header?.pretty ?? "" : tab === "payload" ? decoded.payload?.pretty ?? "" : tab === "claims" ? decoded.claimAnalysis.insights.map((item) => `${item.label}: ${item.value}\n${item.description}`).join("\n\n") : decoded.signature || "No signature segment.";
  const warningMessages = [
    { id: "not-verified", severity: "warning" as const, title: "Decoded only", message: "This tool decodes JWT content but does not verify the signature or prove the token is valid." },
    ...decoded.issues.map((issue, index) => ({ id: `issue-${index}`, severity: issue.level === "error" ? "danger" as const : issue.level === "warning" ? "warning" as const : "info" as const, title: issue.level === "error" ? "JWT error" : "JWT note", message: issue.message })),
  ];
  return <ToolLayoutTextWorkbench
    inputSlot={<EditorPanel title="JWT token" language="JWT" value={token} onChange={setToken} minRows={10} placeholder="Paste a JWT here..." actions={<><Button size="sm" variant="secondary" onClick={() => setToken(DEFAULT_JWT)}>Sample</Button><Button size="sm" variant="ghost" onClick={() => setToken("")}>Clear</Button></>} footer={`${token.length.toLocaleString()} characters · ${decoded.segments.length || 0} segment(s)`} />}
    outputSlot={<EditorPanel title="Decoded output" language={tab} value={activeValue} readOnly minRows={16} placeholder="Decoded header, payload, signature, or claims will appear here." actions={<><Tabs<JwtTab> ariaLabel="JWT sections" value={tab} onChange={setTab} items={[{ value: "header", label: "Header" }, { value: "payload", label: "Payload" }, { value: "signature", label: "Signature" }, { value: "claims", label: "Claims" }]} /><CopyButton text={activeValue} size="sm" variant="secondary">Copy</CopyButton></>} footer="Review expiration and signature verification in your application before trusting any token." />}
    statsSlot={<WarningPanel messages={warningMessages} />}
  />;
}
