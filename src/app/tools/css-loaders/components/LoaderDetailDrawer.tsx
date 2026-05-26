"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Code2, FileCode2, Layers, Loader2, X } from "lucide-react";
import { Badge, Button } from "@/components/ui";
import { buildLoaderCopyAllText, buildLoaderCopyText, copyTextToClipboard } from "../copy-utils";
import { formatLoaderLabel, getDefaultLoaderCustomization } from "../loader-utils";
import type { LoaderCustomizationState, LoaderDefinition, LoaderIndexItem, LoaderPreviewMode, LoaderPreviewTheme } from "../types";
import LoaderCodeTabs from "./LoaderCodeTabs";
import LoaderControls from "./LoaderControls";
import LoaderPreviewStage from "./LoaderPreviewStage";
import PreviewModeTabs from "./PreviewModeTabs";

type LoaderDetailDrawerProps = {
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

function LoaderDetailDrawerContent({
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
  const defaultCustomization = useMemo(() => (loader ? getDefaultLoaderCustomization(loader) : null), [loader]);
  const [previewMode, setPreviewMode] = useState<LoaderPreviewMode>("standalone");
  const [previewTheme, setPreviewTheme] = useState<LoaderPreviewTheme>("light");
  const [customization, setCustomization] = useState<LoaderCustomizationState | null>(defaultCustomization);
  const [copiedSticky, setCopiedSticky] = useState(false);
  const [isMobileSheet, setIsMobileSheet] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 720px)").matches : false,
  );

  const displayName = loader?.name ?? loaderSummary?.name ?? "Loader";
  const displayCategory = loader?.category ?? loaderSummary?.category;

  useEffect(() => {
    setPreviewMode("standalone");
    setPreviewTheme("light");
    setCustomization(defaultCustomization);
    setCopiedSticky(false);
  }, [defaultCustomization, loader?.id]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 720px)");
    function syncMobileSheet() {
      setIsMobileSheet(media.matches);
    }

    syncMobileSheet();
    media.addEventListener("change", syncMobileSheet);

    return () => media.removeEventListener("change", syncMobileSheet);
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    if (!open) return;
    document.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [onClose, open]);

  async function copySnippet(format: "html" | "css" | "react" | "all") {
    if (!loader || !customization) return false;

    const text = format === "all" ? buildLoaderCopyAllText(loader, customization) : buildLoaderCopyText(loader, format, customization);

    try {
      await copyTextToClipboard(text);
      onCopySuccess(format === "all" ? `All code copied from ${loader.name}` : `${format.toUpperCase()} copied from ${loader.name}`);
      return true;
    } catch {
      onCopySuccess("Could not copy automatically. Select the code and copy it manually.");
      return false;
    }
  }

  async function copyStickyCss() {
    const copied = await copySnippet("css");
    if (!copied) return;
    setCopiedSticky(true);
    window.setTimeout(() => setCopiedSticky(false), 1400);
  }

  const activeFlags = loader
    ? Object.entries(loader.flags)
        .filter(([, value]) => Boolean(value))
        .map(([key]) => key)
    : [];

  return (
    <div className="css-loaders-drawer-root css-loaders-drawer-open" role="dialog" aria-modal="true" aria-label={`${displayName} details`}>
      <motion.button
        type="button"
        className="css-loaders-drawer-backdrop"
        onClick={onClose}
        aria-label="Close loader details"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
      />

      <motion.aside
        className="css-loaders-drawer-panel"
        initial={isMobileSheet ? { y: "105%" } : { x: "105%" }}
        animate={isMobileSheet ? { y: 0 } : { x: 0 }}
        exit={isMobileSheet ? { y: "105%" } : { x: "105%" }}
        transition={{ type: "spring", stiffness: 340, damping: 34 }}
      >
        <header className="css-loaders-drawer-header">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {displayCategory ? <Badge variant="soft">{formatLoaderLabel(displayCategory)}</Badge> : null}
              {loader?.flags.popular || loaderSummary?.flags.popular ? <Badge variant="outline">Popular</Badge> : null}
              {loader?.flags.customizable || loaderSummary?.flags.customizable ? <Badge variant="outline">Customizable</Badge> : null}
              {loading ? <Badge variant="outline">Lazy loading detail</Badge> : null}
            </div>
            <h2>{displayName}</h2>
            <p>{(loader?.tags ?? loaderSummary?.tags ?? []).map((tag) => `#${tag}`).join("  ")}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" aria-hidden />
            Close drawer
          </Button>
        </header>

        <div className="css-loaders-drawer-scroll">
          {!loader || !customization ? (
            <LoaderDetailLoadingState loaderSummary={loaderSummary} error={error} />
          ) : (
            <>
              <section className="css-loaders-preview-section" aria-label="Loader preview modes">
                <div className="css-loaders-preview-section-head">
                  <div>
                    <h3>Preview playground</h3>
                    <p>Test the loader as a standalone animation, button state, card loading state, or page overlay.</p>
                  </div>
                  <PreviewModeTabs value={previewMode} onChange={setPreviewMode} />
                </div>

                <div className="css-loaders-theme-row" aria-label="Preview background theme">
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

                <LoaderPreviewStage loader={loader} customization={customization} mode={previewMode} theme={previewTheme} />
              </section>

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
                {loader.source?.name || loader.source?.author || loader.source?.license ? (
                  <p>
                    Source: {[loader.source?.name, loader.source?.author, loader.source?.license].filter(Boolean).join(" · ")}
                  </p>
                ) : null}
              </section>
            </>
          )}
        </div>

        <div className="css-loaders-drawer-actions">
          <Button
            variant={copiedSticky ? "soft" : "primary"}
            onClick={copyStickyCss}
            disabled={!loader || !customization}
            leftIcon={copiedSticky ? <CheckCircle2 className="h-4 w-4" /> : <Code2 className="h-4 w-4" />}
          >
            {copiedSticky ? "CSS copied" : "Copy CSS"}
          </Button>
          <Button variant="secondary" onClick={() => copySnippet("html")} disabled={!loader || !customization} leftIcon={<FileCode2 className="h-4 w-4" />}>
            Copy HTML
          </Button>
          {loader?.formats.includes("react") ? (
            <Button variant="secondary" onClick={() => copySnippet("react")} disabled={!customization} leftIcon={<Layers className="h-4 w-4" />}>
              Copy React
            </Button>
          ) : null}
          <Button variant="soft" onClick={() => copySnippet("all")} disabled={!loader || !customization}>
            Copy all
          </Button>
        </div>
      </motion.aside>
    </div>
  );
}

export default function LoaderDetailDrawer({ loader, loaderSummary, loading, error, open, onClose, onCopySuccess }: LoaderDetailDrawerProps) {
  return (
    <AnimatePresence>
      {open ? (
        <LoaderDetailDrawerContent
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
