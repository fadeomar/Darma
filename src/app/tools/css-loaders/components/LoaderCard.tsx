"use client";

import { Bookmark, Check, Code2, Eye, FileCode2, Heart, Loader2 } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Badge, Button, Card } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatLoaderLabel } from "../loader-utils";
import type { LoaderIndexItem, LoaderPreviewItem } from "../types";

function getPreviewInlineStyle(loaderPreview?: LoaderPreviewItem): CSSProperties | undefined {
  const defaults = loaderPreview?.defaults;
  if (!defaults) return undefined;

  const style: Record<string, string> = {};
  if (defaults.color) style["--loader-color"] = defaults.color;
  if (defaults.secondaryColor) style["--loader-secondary-color"] = defaults.secondaryColor;
  if (defaults.size) style["--loader-size"] = `${defaults.size}px`;
  if (defaults.speed) style["--loader-speed"] = `${defaults.speed}s`;
  if (defaults.background) style["--loader-bg"] = defaults.background;
  return style as CSSProperties;
}

type LoaderCardProps = {
  loader: LoaderIndexItem;
  loaderPreview?: LoaderPreviewItem;
  highlighted?: boolean;
  favorite?: boolean;
  onOpen: (loader: LoaderIndexItem) => void;
  onToggleFavorite: (loaderId: string) => void;
  onCopyPreview: (loader: LoaderPreviewItem, format: "css" | "html") => Promise<void>;
  onCopySuccess: (message: string) => void;
};

function LoaderPreview({ loaderPreview, name }: { loaderPreview?: LoaderPreviewItem; name: string }) {
  if (!loaderPreview) {
    return (
      <div className="css-loader-render-root css-loader-render-placeholder" aria-label={`${name} preview loading`}>
        <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
        <span>Loading preview</span>
      </div>
    );
  }

  return (
    <div className="css-loader-render-root" aria-label={`${name} preview`}>
      <style data-css-loader-card-preview={loaderPreview.id} dangerouslySetInnerHTML={{ __html: loaderPreview.previewCss }} />
      <div className="css-loader-render-inner" dangerouslySetInnerHTML={{ __html: loaderPreview.previewHtml }} />
    </div>
  );
}

export default function LoaderCard({
  loader,
  loaderPreview,
  highlighted = false,
  favorite = false,
  onOpen,
  onToggleFavorite,
  onCopyPreview,
  onCopySuccess,
}: LoaderCardProps) {
  const [copiedFormat, setCopiedFormat] = useState<"css" | "html" | null>(null);
  const [isInViewport, setIsInViewport] = useState(true);
  const previewRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = previewRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInViewport(entry.isIntersecting);
      },
      { rootMargin: "180px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  async function copySnippet(format: "css" | "html") {
    if (!loaderPreview) {
      onCopySuccess("Preview code is still loading");
      return;
    }

    try {
      await onCopyPreview(loaderPreview, format);
      setCopiedFormat(format);
      window.setTimeout(() => setCopiedFormat(null), 1400);
    } catch {
      // Parent handler already shows a toast with the copy failure.
    }
  }

  return (
    <Card
      id={`css-loader-card-${loader.id}`}
      as="article"
      variant="interactive"
      padding="none"
      tabIndex={0}
      onClick={() => onOpen(loader)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(loader);
        }
      }}
      className={cn(
        "css-loaders-card",
        highlighted && "css-loaders-card-highlighted",
        favorite && "css-loaders-card-favorite",
        !isInViewport && "css-loaders-card-offscreen",
      )}
    >
      <div ref={previewRef} className="css-loader-preview-stage" style={getPreviewInlineStyle(loaderPreview)}>
        <button
          type="button"
          className="css-loaders-favorite-button"
          aria-label={favorite ? `Remove ${loader.name} from saved loaders` : `Save ${loader.name}`}
          aria-pressed={favorite}
          onClick={(event) => {
            event.stopPropagation();
            onToggleFavorite(loader.id);
          }}
          onKeyDown={(event) => event.stopPropagation()}
        >
          {favorite ? <Heart className="h-4 w-4" aria-hidden /> : <Bookmark className="h-4 w-4" aria-hidden />}
        </button>

        <LoaderPreview loaderPreview={loaderPreview} name={loader.name} />

        <div className="css-loaders-card-quick-actions" onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
          <Button
            variant="secondary"
            size="sm"
            disabled={!loaderPreview}
            onClick={() => copySnippet("css")}
            leftIcon={copiedFormat === "css" ? <Check className="h-4 w-4" /> : <Code2 className="h-4 w-4" />}
          >
            {copiedFormat === "css" ? "Copied" : "CSS"}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={!loaderPreview}
            onClick={() => copySnippet("html")}
            leftIcon={copiedFormat === "html" ? <Check className="h-4 w-4" /> : <FileCode2 className="h-4 w-4" />}
          >
            {copiedFormat === "html" ? "Copied" : "HTML"}
          </Button>
          <Button variant="primary" size="sm" onClick={() => onOpen(loader)} leftIcon={<Eye className="h-4 w-4" />}>
            Open
          </Button>
        </div>
      </div>

      <div className="css-loaders-card-body">
        <div className="css-loaders-card-title-row">
          <div className="min-w-0">
            <h3 className="truncate text-base font-black text-[var(--color-text)]">{loader.name}</h3>
            <p className="css-loaders-card-category">{formatLoaderLabel(loader.category)}</p>
          </div>
          <div className="css-loaders-card-badges">
            {loader.flags.popular ? <Badge variant="soft">Popular</Badge> : null}
            {favorite ? <Badge variant="outline">Saved</Badge> : null}
          </div>
        </div>
      </div>
    </Card>
  );
}
