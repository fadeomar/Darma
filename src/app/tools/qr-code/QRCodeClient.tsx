"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import { Download, QrCode } from "lucide-react";
import { Button, Field, Input } from "@/components/ui";
import { ToolLayoutSingleUtility } from "@/features/tools/layouts";

interface QRCodeResponse {
  qrCodeUrl?: string;
  error?: string;
}

const MAX_QR_TEXT_LENGTH = 2000;

export default function QRCodeClient() {
  const [inputText, setInputText] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setQrCodeUrl("");

    const text = inputText.trim();

    if (!text) {
      setError("Please enter text or a URL.");
      return;
    }

    if (text.length > MAX_QR_TEXT_LENGTH) {
      setError(`Please keep the QR content under ${MAX_QR_TEXT_LENGTH} characters.`);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/generate-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data: QRCodeResponse = await response.json();
      if (!response.ok || !data.qrCodeUrl) {
        throw new Error(data.error ?? "Failed to generate QR code.");
      }
      setQrCodeUrl(data.qrCodeUrl);
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : "An error occurred while generating the QR code.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!qrCodeUrl) return;
    const link = document.createElement("a");
    link.href = qrCodeUrl;
    link.download = "qrcode.png";
    link.click();
  };

  return (
    <ToolLayoutSingleUtility
      resultSlot={
        <div className="flex min-h-[280px] flex-col items-center justify-center gap-5">
          {qrCodeUrl ? (
            <Image src={qrCodeUrl} alt="Generated QR code" width={260} height={260} className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-3 shadow-sm" />
          ) : (
            <div className="flex h-64 w-64 items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-muted)]">
              <QrCode className="h-16 w-16 text-[var(--color-text-soft)]" aria-hidden />
            </div>
          )}
          <p className="max-w-lg text-sm leading-6 text-[var(--color-text-muted)]">
            Enter a URL or text below, generate the QR code, then download it as an image.
          </p>
        </div>
      }
      controlsSlot={
        <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-4">
          <Field label="Text or URL" error={error || undefined} required>
            <Input
              id="inputText"
              value={inputText}
              onChange={(event) => setInputText(event.target.value)}
              placeholder="https://example.com"
              maxLength={MAX_QR_TEXT_LENGTH}
            />
            <p className="mt-2 text-xs text-[var(--color-text-muted)]">
              {inputText.length}/{MAX_QR_TEXT_LENGTH} characters
            </p>
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" loading={loading} leftIcon={<QrCode className="h-4 w-4" />}>Generate QR Code</Button>
            <Button type="button" variant="secondary" disabled={!qrCodeUrl} onClick={handleDownload} leftIcon={<Download className="h-4 w-4" />}>Download PNG</Button>
          </div>
        </form>
      }
      infoSlot={
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["Fast", "Generate scannable QR codes in seconds."],
            ["Flexible", "Works with URLs, notes, contact text, and short instructions."],
            ["Portable", "Download a PNG for flyers, handouts, or screens."],
          ].map(([title, body]) => (
            <div key={title} className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-4 text-left">
              <h2 className="text-sm font-black text-[var(--color-text)]">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">{body}</p>
            </div>
          ))}
        </div>
      }
    />
  );
}
