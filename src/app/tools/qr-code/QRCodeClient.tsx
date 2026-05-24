"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import { Button, CopyButton, Input, Select } from "@/components/ui";
import { ColorField, ControlGrid, ControlSection, ResultPanel, ToolControlPanel, WarningPanel } from "@/features/tools/components";
import { ToolLayoutSingleUtility } from "@/features/tools/layouts";

type QRType = "url" | "text" | "email" | "phone" | "wifi";

export default function QRCodeClient() {
  const [kind, setKind] = useState<QRType>("url");
  const [inputText, setInputText] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [size, setSize] = useState(260);
  const [foreground, setForeground] = useState("#111827");
  const [background, setBackground] = useState("#ffffff");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const payload = kind === "email" && inputText ? `mailto:${inputText}` : kind === "phone" && inputText ? `tel:${inputText}` : inputText;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!payload.trim()) { setError("Enter content before generating a QR code."); return; }
    if (payload.length > 1200) { setError("QR input is too long. Keep it under 1,200 characters for reliable scanning."); return; }
    try {
      setLoading(true);
      const response = await fetch("/api/generate-qr", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: payload }) });
      if (!response.ok) throw new Error("Failed to generate QR code.");
      const data = await response.json() as { qrCodeUrl: string };
      setQrCodeUrl(data.qrCodeUrl);
    } catch { setError("An error occurred while generating the QR code."); }
    finally { setLoading(false); }
  }
  function download() { if (!qrCodeUrl) return; const a = document.createElement("a"); a.href = qrCodeUrl; a.download = "qrcode.png"; a.click(); }
  return <ToolLayoutSingleUtility
    resultSlot={<ResultPanel title="QR preview" description="Generate and download a scannable PNG." value={<div className="flex justify-center">{qrCodeUrl ? <Image src={qrCodeUrl} alt="Generated QR code" width={size} height={size} className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-3" /> : <div className="flex aspect-square w-64 items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] text-sm text-[var(--color-text-muted)]">QR preview</div>}</div>} actions={<><Button size="sm" disabled={!qrCodeUrl} onClick={download}>Download PNG</Button><CopyButton text={qrCodeUrl} size="sm" variant="secondary">Copy data URL</CopyButton></>} />}
    actionsSlot={<form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2"><label className="min-w-[240px] flex-1 text-xs font-semibold text-[var(--color-text-muted)]">Content<Input className="mt-1" value={inputText} onChange={(event) => setInputText(event.target.value)} placeholder={kind === "url" ? "https://example.com" : kind === "wifi" ? "WIFI:T:WPA;S:Network;P:password;;" : "Text to encode"} /></label><Button type="submit" loading={loading}>Generate QR</Button></form>}
    controlsSlot={<ToolControlPanel title="QR settings" footer={<p className="text-xs text-[var(--color-text-soft)]">The current implementation uses the existing Darma QR generation route. Input validation still happens before sending the request.</p>}><ControlSection title="Content type"><Select size="sm" width="medium" value={kind} onChange={(event) => setKind(event.target.value as QRType)}><option value="url">URL</option><option value="text">Text</option><option value="email">Email</option><option value="phone">Phone</option><option value="wifi">WiFi string</option></Select></ControlSection><ControlSection title="Preview options"><ControlGrid columns={3}><label className="text-xs font-semibold text-[var(--color-text-muted)]">Size<Input type="number" size="sm" width="numeric" className="mt-1" value={size} min={160} max={512} onChange={(e) => setSize(Number(e.target.value))} /></label><ColorField label="Foreground" value={foreground} onChange={setForeground} /><ColorField label="Background" value={background} onChange={setBackground} /></ControlGrid></ControlSection></ToolControlPanel>}
    infoSlot={<WarningPanel messages={[...(error ? [{ id: "error", severity: "danger" as const, title: "QR error", message: error }] : []), { id: "length", severity: inputText.length > 800 ? "warning" as const : "info" as const, title: "Scan reliability", message: `${inputText.length}/1200 characters. Shorter QR payloads usually scan faster.` }]} />}
  />;
}
