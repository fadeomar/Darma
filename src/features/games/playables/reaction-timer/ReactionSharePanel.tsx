"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Download, Image as ImageIcon, Share2 } from "lucide-react";
import { Button } from "@/components/ui";
import { copyTextToClipboard } from "@/lib/copy-to-clipboard";
import {
  downloadShareCardPng,
  filenameForShareResult,
  renderShareCardBlob,
  renderShareCardDataUrl,
  type ShareActionKind,
  type ShareableGameResult,
} from "./reactionShareCard";
import { emitEdgeCaseNotice } from "./reactionEdgeCases";

type ActionStatus = "idle" | "copy" | "share" | "download" | "error";

export function ReactionSharePanel({
  result,
  onShareAction,
  compact = false,
}: {
  result: ShareableGameResult;
  onShareAction?: (action: ShareActionKind, result: ShareableGameResult) => void;
  compact?: boolean;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<ActionStatus>("idle");
  const [open, setOpen] = useState(!compact);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  useEffect(() => {
    let cancelled = false;
    setPreviewUrl(null);
    renderShareCardDataUrl(result)
      .then((url) => {
        if (!cancelled) setPreviewUrl(url);
      })
      .catch(() => {
        if (!cancelled) setPreviewUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [result]);

  const clearSoon = () => window.setTimeout(() => setStatus("idle"), 1800);

  const record = (action: ShareActionKind) => {
    onShareAction?.(action, result);
  };

  const handleCopy = async () => {
    const ok = await copyTextToClipboard(result.copyText);
    setStatus(ok ? "copy" : "error");
    if (ok) {
      record("copy");
    } else {
      emitEdgeCaseNotice({
        severity: "warning",
        title: "Clipboard copy unavailable",
        detail: "The browser blocked Clipboard API access. You can still select the share text manually.",
      });
    }
    clearSoon();
  };

  const handleDownload = async () => {
    try {
      await downloadShareCardPng(result);
      setStatus("download");
      record("download");
    } catch {
      setStatus("error");
      emitEdgeCaseNotice({
        severity: "warning",
        title: "PNG download failed",
        detail: "The browser could not generate or download the result image. Copy/share text remains available.",
      });
    }
    clearSoon();
  };

  const handleNativeShare = async () => {
    if (!canNativeShare) {
      await handleCopy();
      return;
    }
    try {
      const shareData: ShareData = {
        title: `${result.gameTitle} · ${result.modeLabel}`,
        text: result.copyText,
        url: result.routePath,
      };
      const blob = await renderShareCardBlob(result);
      const file = new File([blob], filenameForShareResult(result), { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (data: { files?: File[] }) => boolean };
      if (nav.canShare?.({ files: [file] })) {
        await navigator.share({ ...shareData, files: [file] } as ShareData & { files: File[] });
      } else {
        await navigator.share(shareData);
      }
      setStatus("share");
      record("native-share");
    } catch (error) {
      // User cancel is not a failure that should scare them; leave the panel idle.
      if (error instanceof DOMException && error.name === "AbortError") {
        setStatus("idle");
      } else {
        setStatus("error");
        emitEdgeCaseNotice({
          severity: "warning",
          title: "Native share failed",
          detail: "The browser share sheet was unavailable or rejected the result. Copy/download can still be used.",
        });
      }
    }
    clearSoon();
  };

  return (
    <section
      className="rtp-share-panel"
      aria-label="Share result"
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
      data-rtp-control="true"
    >
      <button type="button" className="rtp-share-panel-head" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        <span className="rtp-share-panel-icon" aria-hidden>
          <ImageIcon className="h-4 w-4" />
        </span>
        <span className="rtp-share-panel-headtext">
          <strong>Share your result</strong>
          <small>Copy text, use native share, or download a PNG card.</small>
        </span>
        <span className="rtp-share-panel-toggle" aria-hidden>{open ? "−" : "+"}</span>
      </button>

      {open ? (
        <div className="rtp-share-panel-body">
          <div className="rtp-share-preview" aria-label={`Preview card for ${result.modeLabel}`}>
            {previewUrl ? (
              <img src={previewUrl} alt={`${result.gameTitle} ${result.modeLabel} result card preview`} />
            ) : (
              <div className="rtp-share-preview-placeholder">
                <ImageIcon className="h-6 w-6" aria-hidden />
                <span>Preview generating…</span>
              </div>
            )}
          </div>

          <div className="rtp-share-copytext">
            <span className="rtp-share-copytext-label">Share text</span>
            <p>{result.copyText}</p>
          </div>

          <div className="rtp-share-actions">
            <Button size="sm" variant="outline" onClick={handleCopy} leftIcon={status === "copy" ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}>
              {status === "copy" ? "Copied" : "Copy text"}
            </Button>
            {canNativeShare ? (
              <Button size="sm" variant="secondary" onClick={handleNativeShare} leftIcon={status === "share" ? <Check className="h-4 w-4" aria-hidden /> : <Share2 className="h-4 w-4" aria-hidden />}>
                {status === "share" ? "Shared" : "Share"}
              </Button>
            ) : null}
            <Button size="sm" onClick={handleDownload} leftIcon={status === "download" ? <Check className="h-4 w-4" aria-hidden /> : <Download className="h-4 w-4" aria-hidden />}>
              {status === "download" ? "Downloaded" : "Download PNG"}
            </Button>
          </div>

          <p className="rtp-share-note" aria-live="polite">
            {status === "error"
              ? "Sharing was not available in this browser. Copy or download may still work."
              : "Generated locally in your browser — no account, upload, or backend required."}
          </p>
        </div>
      ) : null}
    </section>
  );
}
