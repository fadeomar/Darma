"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Code2, Copy, FileCode2, Layers, Loader2, X } from "lucide-react";
import { Badge, Button } from "@/components/ui";
import { buildLoaderCopyAllText, buildLoaderCopyText, copyTextToClipboard } from "../copy-utils";
import { useModalFocusTrap } from "../hooks/useModalFocusTrap";
import { formatLoaderLabel, getDefaultLoaderCustomization } from "../loader-utils";
import type { LoaderCustomizationState, LoaderDefinition, LoaderIndexItem, LoaderPreviewMode, LoaderPreviewTheme } from "../types";
import LoaderCodeTabs from "./LoaderCodeTabs";
import LoaderControls from "./LoaderControls";
import LoaderPreviewStage from "./LoaderPreviewStage";
import PreviewModeTabs from "./PreviewModeTabs";

type LoaderDetailModalProps = {
  loader: LoaderDefinition | null;
  loaderSummary?: LoaderIndexItem | null;
  loading?: boolean;
  error?: string;
  open: boolean;
  onClose: () => void;
  onCopySuccess: (message: string) => void;
};

const PREVIEW_THEMES: Array<{ value: LoaderPreviewTheme; label: string }> = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "transparent", label: "Transparent" },
  { value: "gradient", label: "Gradient" },
];

function LoaderDetailLoadingState({ loaderSummary, error }: { loaderSummary?: LoaderIndexItem | null; error?: string }) {
  return (
    <div className="css-loaders-detail-loading" role={error ? "alert" : "status"}>
      {error ? <AlertTriangle className="h-6 w-6" aria-hidden /> : <Loader2 className="h-6 w-6 animate-spin" aria-hidden />}
      <div>
        <h3>{error ? "Could not load loader detail" : "Loading full loader details"}</h3>
        <p>
          {error || `Fetching HTML, CSS, React, controls, and source metadata${loaderSummary?.name ? ` for ${loaderSummary.name}` : ""}.`}
        </p>
      </div>
    </div>
  );
}

function LoaderDetailModalContent({
  loader,
  loaderSummary,
  loading,
  error,
  open,
  onClose,
  onCopySuccess,
}: {
  loader: LoaderDefinition | null;
  loaderSummary?: LoaderIndexItem | null;
  loading?: boolean;
  error?: string;
  open: boolean;
  onClose: () => void;
  onCopySuccess: (message: string) => void;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const defaultCustomization = useMemo(() => (loader ? getDefaultLoaderCustomization(loader) : null), [loader]);
  const [previewMode, setPreviewMode] = useState<LoaderPreviewMode>("standalone");
  const [previewTheme, setPreviewTheme] = useState<LoaderPreviewTheme>("light");
  const [customization, setCustomization] = useState<LoaderCustomizationState | null>(defaultCustomization);
  const [copiedHeaderAction, setCopiedHeaderAction] = useState<"css" | "html" | "react" | "all" | null>(null);
  const headerCopyTimerRef = useRef<number | null>(null);

  const displayName = loader?.name ?? loaderSummary?.name ?? "Loader";
  const displayCategory = loader?.category ?? loaderSummary?.category;
  const summaryTags = loader?.tags ?? loaderSummary?.tags ?? [];

  useModalFocusTrap({ open, panelRef, onClose });

  useEffect(() => {
    setPreviewMode("standalone");
    setPreviewTheme("light");
    setCustomization(defaultCustomization);
    setCopiedHeaderAction(null);
  }, [defaultCustomization, loader?.id]);

  useEffect(() => {
    return () => {
      if (headerCopyTimerRef.current) window.clearTimeout(headerCopyTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  async function copySnippet(format: "html" | "css" | "react" | "all") {
    if (!loader || !customization) return false;

    const text = format === "all" ? buildLoaderCopyAllText(loader, customization) : buildLoaderCopyText(loader, format, customization);

    try {
      await copyTextToClipboard(text);
      setCopiedHeaderAction(format);
      if (headerCopyTimerRef.current) window.clearTimeout(headerCopyTimerRef.current);
      headerCopyTimerRef.current = window.setTimeout(() => setCopiedHeaderAction(null), 1400);
      onCopySuccess(format === "all" ? `All code copied from ${loader.name}` : `${format.toUpperCase()} copied from ${loader.name}`);
      return true;
    } catch {
      onCopySuccess("Could not copy automatically. Please copy from the code panel.");
      return false;
    }
  }

  const activeFlags = loader
    ? Object.entries(loader.flags)
        .filter(([, value]) => Boolean(value))
        .map(([key]) => key)
    : [];

  const panelMotionProps = shouldReduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.12 },
      }
    : {
        initial: { opacity: 0, y: 18, scale: 0.97 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 18, scale: 0.98 },
        transition: { type: "spring" as const, stiffness: 300, damping: 30 },
      };

  return (
    <div className="css-loaders-modal-root css-loaders-modal-open" role="presentation">
      <motion.button
        type="button"
        className="css-loaders-modal-backdrop"
        onClick={onClose}
        aria-label="Close loader details"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: shouldReduceMotion ? 0.01 : 0.18 }}
      />

      <motion.div
        ref={panelRef}
        className="css-loaders-modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        {...panelMotionProps}
      >
        <header className="css-loaders-modal-header">
          <div className="css-loaders-modal-title-group">
            <div className="css-loaders-modal-title-row">
              {displayCategory ? <p className="css-loaders-modal-eyebrow">{formatLoaderLabel(displayCategory)}</p> : null}
              <h2 id={titleId}>{displayName}</h2>
              <div className="css-loaders-modal-badges" aria-label={`${displayName} highlights`}>
                {loader?.flags.popular || loaderSummary?.flags.popular ? <Badge variant="soft">Popular</Badge> : null}
                {loader?.flags.customizable || loaderSummary?.flags.customizable ? <Badge variant="outline">Customizable</Badge> : null}
                {loader?.formats.includes("react") || loaderSummary?.formats.includes("react") ? <Badge variant="outline">React</Badge> : null}
                {loading ? <Badge variant="outline">Lazy loading detail</Badge> : null}
              </div>
            </div>
            {summaryTags.length ? <p className="css-loaders-modal-tags">{summaryTags.slice(0, 6).map((tag) => `#${tag}`).join("  ")}</p> : null}
          </div>

          <div className="css-loaders-modal-header-actions">
            <Button
              variant={copiedHeaderAction === "css" ? "soft" : "primary"}
              size="sm"
              onClick={() => copySnippet("css")}
              disabled={!loader || !customization}
              leftIcon={copiedHeaderAction === "css" ? <CheckCircle2 className="h-4 w-4" /> : <Code2 className="h-4 w-4" />}
            >
              {copiedHeaderAction === "css" ? "CSS copied" : "Copy CSS"}
            </Button>
            <Button
              variant={copiedHeaderAction === "html" ? "soft" : "secondary"}
              size="sm"
              onClick={() => copySnippet("html")}
              disabled={!loader || !customization}
              leftIcon={copiedHeaderAction === "html" ? <CheckCircle2 className="h-4 w-4" /> : <FileCode2 className="h-4 w-4" />}
            >
              {copiedHeaderAction === "html" ? "HTML copied" : "Copy HTML"}
            </Button>
            {loader?.formats.includes("react") ? (
              <Button
                variant={copiedHeaderAction === "react" ? "soft" : "secondary"}
                size="sm"
                onClick={() => copySnippet("react")}
                disabled={!customization}
                leftIcon={copiedHeaderAction === "react" ? <CheckCircle2 className="h-4 w-4" /> : <Layers className="h-4 w-4" />}
              >
                {copiedHeaderAction === "react" ? "React copied" : "Copy React"}
              </Button>
            ) : null}
            <Button
              variant={copiedHeaderAction === "all" ? "soft" : "secondary"}
              size="sm"
              onClick={() => copySnippet("all")}
              disabled={!loader || !customization}
              leftIcon={copiedHeaderAction === "all" ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            >
              {copiedHeaderAction === "all" ? "Copied all" : "Copy all"}
            </Button>
            <button type="button" className="css-loaders-modal-close" onClick={onClose} data-modal-close aria-label="Close loader details">
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </header>

        {!loader || !customization ? (
          <div className="css-loaders-modal-body css-loaders-modal-body-loading">
            <LoaderDetailLoadingState loaderSummary={loaderSummary} error={error} />
          </div>
        ) : (
          <div className="css-loaders-modal-body">
            <section className="css-loaders-detail-preview css-loaders-modal-preview-column" aria-label="Loader preview">
              <div className="css-loaders-preview-toolbar">
                <PreviewModeTabs value={previewMode} onChange={setPreviewMode} />

                <div className="css-loaders-theme-tabs" aria-label="Preview background">
                  {PREVIEW_THEMES.map((theme) => (
                    <button
                      key={theme.value}
                      type="button"
                      aria-pressed={previewTheme === theme.value}
                      onClick={() => setPreviewTheme(theme.value)}
                      className={previewTheme === theme.value ? "css-loaders-theme-chip css-loaders-theme-chip-active" : "css-loaders-theme-chip"}
                    >
                      <span className={`css-loaders-theme-swatch css-loaders-theme-swatch-${theme.value}`} />
                      {theme.label}
                    </button>
                  ))}
                </div>
              </div>

              <LoaderPreviewStage loader={loader} customization={customization} mode={previewMode} theme={previewTheme} />
            </section>

            <div className="css-loaders-modal-side-column">
              <LoaderControls loader={loader} value={customization} onChange={setCustomization} />

              <LoaderCodeTabs loader={loader} customization={customization} onCopySuccess={onCopySuccess} />

              <section className="css-loaders-detail-meta" aria-label="Loader metadata">
                <h3>Details</h3>
                <div>
                  {loader.formats.map((format) => (
                    <Badge key={format} variant="outline">
                      {format.toUpperCase()}
                    </Badge>
                  ))}
                  {activeFlags.map((flag) => (
                    <Badge key={flag} variant="soft">
                      {formatLoaderLabel(flag)}
                    </Badge>
                  ))}
                </div>
                {loader.tags.length ? <p>Tags: {loader.tags.map((tag) => `#${tag}`).join("  ")}</p> : null}
                {loader.source?.name || loader.source?.author || loader.source?.license ? (
                  <p>Source: {[loader.source?.name, loader.source?.author, loader.source?.license].filter(Boolean).join(" · ")}</p>
                ) : null}
              </section>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function LoaderDetailModal({ loader, loaderSummary, loading, error, open, onClose, onCopySuccess }: LoaderDetailModalProps) {
  return (
    <AnimatePresence>
      {open ? (
        <LoaderDetailModalContent
          key={loader?.id ?? loaderSummary?.id ?? "loader-detail"}
          loader={loader}
          loaderSummary={loaderSummary}
          loading={loading}
          error={error}
          open={open}
          onClose={onClose}
          onCopySuccess={onCopySuccess}
        />
      ) : null}
    </AnimatePresence>
  );
}
