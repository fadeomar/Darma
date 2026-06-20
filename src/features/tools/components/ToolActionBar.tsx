"use client";

import { Download, RotateCcw, Share2, Sparkles, Upload } from "lucide-react";
import { Button, CopyButton } from "@/components/ui";
import { FavoriteToolButton } from "@/features/tools/components/FavoriteToolButton";
import type { ToolDefinition } from "@/features/tools/domain/tool";
import { cn } from "@/lib/cn";

export function ToolActionBar({
  copyText,
  onDownload,
  onReset,
  onSample,
  onUseOutputAsInput,
  tool,
  shareUrl,
  className,
}: {
  copyText?: string;
  onDownload?: () => void;
  onReset?: () => void;
  onSample?: () => void;
  onUseOutputAsInput?: () => void;
  tool?: Pick<ToolDefinition, "id" | "title">;
  shareUrl?: string;
  className?: string;
}) {
  const canShare = Boolean(shareUrl);

  return (
    <div className={cn("flex flex-wrap items-center gap-2 rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] px-3 py-2.5 shadow-[var(--shadow-card)]", className)}>
      {copyText !== undefined ? <CopyButton text={copyText} size="sm" variant="secondary" disabled={!copyText}>Copy</CopyButton> : null}
      {onDownload ? <Button size="sm" variant="secondary" onClick={onDownload} disabled={!copyText} leftIcon={<Download className="h-4 w-4" aria-hidden />}>Download</Button> : null}
      {onSample ? <Button size="sm" variant="secondary" onClick={onSample} leftIcon={<Sparkles className="h-4 w-4" aria-hidden />}>Sample</Button> : null}
      {onUseOutputAsInput ? <Button size="sm" variant="secondary" onClick={onUseOutputAsInput} disabled={!copyText} leftIcon={<Upload className="h-4 w-4" aria-hidden />}>Use output as input</Button> : null}
      {onReset ? <Button size="sm" variant="ghost" onClick={onReset} leftIcon={<RotateCcw className="h-4 w-4" aria-hidden />}>Reset</Button> : null}
      {tool ? <FavoriteToolButton toolId={tool.id} toolTitle={tool.title} /> : null}
      {canShare ? (
        <Button
          size="sm"
          variant="ghost"
          leftIcon={<Share2 className="h-4 w-4" aria-hidden />}
          onClick={async () => {
            if (navigator.share) {
              await navigator.share({ title: tool?.title ?? "Darma tool", url: shareUrl });
              return;
            }
            await navigator.clipboard.writeText(shareUrl);
          }}
        >
          Share
        </Button>
      ) : null}
    </div>
  );
}
