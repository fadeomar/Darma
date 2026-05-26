"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Code2, Copy, Download } from "lucide-react";
import { Badge, Button, Tabs } from "@/components/ui";
import { buildLoaderCopyAllText, buildLoaderCopyText, copyTextToClipboard } from "../copy-utils";
import { getLoaderFormatLabel } from "../loader-utils";
import type { LoaderCustomizationState, LoaderDefinition, LoaderFormat } from "../types";

type LoaderCodeTabsProps = {
  loader: LoaderDefinition;
  customization: LoaderCustomizationState;
  onCopySuccess: (message: string) => void;
};

const BASE_TABS: LoaderFormat[] = ["html", "css", "react", "tailwind"];
const QUICK_COPY_FORMATS: LoaderFormat[] = ["html", "css", "react"];

export default function LoaderCodeTabs({ loader, customization, onCopySuccess }: LoaderCodeTabsProps) {
  const availableFormats = useMemo(() => BASE_TABS.filter((format) => loader.formats.includes(format)), [loader.formats]);
  const [activeFormat, setActiveFormat] = useState<LoaderFormat>(availableFormats[0] ?? "html");
  const [copiedAction, setCopiedAction] = useState<LoaderFormat | "selected" | "all" | null>(null);

  useEffect(() => {
    setActiveFormat(availableFormats[0] ?? "html");
    setCopiedAction(null);
  }, [availableFormats, loader.id]);

  const selectedCode = buildLoaderCopyText(loader, activeFormat, customization);
  const tabItems = availableFormats.map((format) => ({ value: format, label: getLoaderFormatLabel(format) }));

  async function copyCode(format: LoaderFormat | "selected" | "all") {
    const text = format === "all" ? buildLoaderCopyAllText(loader, customization) : format === "selected" ? selectedCode : buildLoaderCopyText(loader, format, customization);

    try {
      await copyTextToClipboard(text);
      setCopiedAction(format);
      onCopySuccess(format === "all" ? `All code copied from ${loader.name}` : `${format === "selected" ? activeFormat.toUpperCase() : format.toUpperCase()} copied from ${loader.name}`);
      window.setTimeout(() => setCopiedAction(null), 1400);
    } catch {
      onCopySuccess("Could not copy automatically. Select the code and copy it manually.");
    }
  }

  function downloadCode() {
    const extension = activeFormat === "css" ? "css" : activeFormat === "html" ? "html" : "tsx";
    const blob = new Blob([selectedCode], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${loader.id}.${extension}`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="css-loaders-code-panel" aria-label="Loader code">
      <div className="css-loaders-code-header">
        <div>
          <div className="css-loaders-code-title">
            <Code2 className="h-4 w-4" aria-hidden />
            <h3>Copy-ready code</h3>
          </div>
          <p>Generated from the current modal controls.</p>
        </div>
        <Badge variant="outline">{activeFormat.toUpperCase()}</Badge>
      </div>

      <Tabs items={tabItems} value={activeFormat} onChange={(v) => setActiveFormat(v)} ariaLabel="Loader code tabs" className="css-loaders-code-tabs" />

      <pre className="css-loaders-code-block" tabIndex={0}>
        <code>{selectedCode}</code>
      </pre>

      <div className="css-loaders-code-actions css-loaders-code-actions-primary">
        {QUICK_COPY_FORMATS.filter((format) => loader.formats.includes(format)).map((format) => (
          <Button
            key={format}
            variant={copiedAction === format ? "soft" : "secondary"}
            size="sm"
            onClick={() => copyCode(format)}
            leftIcon={copiedAction === format ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          >
            {copiedAction === format ? "Copied" : `Copy ${format.toUpperCase()}`}
          </Button>
        ))}
        <Button
          variant={copiedAction === "all" ? "soft" : "primary"}
          size="sm"
          onClick={() => copyCode("all")}
          leftIcon={copiedAction === "all" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        >
          {copiedAction === "all" ? "Copied all" : "Copy all"}
        </Button>
      </div>

      <div className="css-loaders-code-actions css-loaders-code-actions-secondary">
        <Button
          variant={copiedAction === "selected" ? "soft" : "ghost"}
          size="sm"
          onClick={() => copyCode("selected")}
          leftIcon={copiedAction === "selected" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        >
          {copiedAction === "selected" ? "Selected copied" : "Copy selected tab"}
        </Button>
        <Button variant="ghost" size="sm" onClick={downloadCode} leftIcon={<Download className="h-4 w-4" />}>
          Download
        </Button>
      </div>
    </section>
  );
}
