"use client";

import { useMemo, useState } from "react";
import { CopyButton, Tabs } from "@/components/ui";
import { buildFilterString, buildTransformString, generateFilterCss, generateReactStyle, getActiveRasterAdjustments } from "../lib/adjustments";
import { cropEqual, FULL_CROP } from "../lib/crop";
import type { PhotoEditState } from "../types";

type OutputTab = "raw" | "css" | "react";

export function CssOutput({ edit, className }: { edit: PhotoEditState; className: string }) {
  const [tab, setTab] = useState<OutputTab>("css");
  const raster = getActiveRasterAdjustments(edit.adjustments);
  const outputs = useMemo(() => ({
    raw: `filter: ${buildFilterString(edit.adjustments)};\ntransform: ${buildTransformString(edit.orientation)};`,
    css: generateFilterCss(edit.adjustments, className, edit.orientation),
    react: `style={${generateReactStyle(edit.adjustments, edit.orientation)}}`,
  }), [className, edit.adjustments, edit.orientation]);

  return (
    <section aria-label="CSS output" className="space-y-3">
      <div>
        <h2 className="text-sm font-black text-[var(--color-text-primary)]">CSS output</h2>
        <p className="text-xs text-[var(--color-text-tertiary)]">Only browser-representable adjustments are included.</p>
      </div>
      <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3">
        <Tabs<OutputTab>
          ariaLabel="CSS output format"
          value={tab}
          onChange={setTab}
          items={[{ value: "raw", label: "Raw" }, { value: "css", label: "CSS class" }, { value: "react", label: "React" }]}
        />
        <div className="mt-3 flex justify-end"><CopyButton size="sm" getText={() => outputs[tab]}>Copy {tab === "css" ? "CSS" : tab}</CopyButton></div>
        <pre className="mt-2 max-w-full overflow-x-auto whitespace-pre-wrap break-words rounded-[var(--radius-sm)] bg-[var(--color-code-surface)] p-3 text-xs leading-5 text-[var(--color-text-primary)]"><code>{outputs[tab]}</code></pre>
        {raster.length > 0 ? (
          <p className="mt-3 rounded-[var(--radius-sm)] border border-[var(--color-info-border)] bg-[var(--color-info-bg)] px-3 py-2 text-xs leading-5 text-[var(--color-info-text)]">
            Exposure, temperature, highlights, and shadows are applied to exported pixels and cannot be reproduced exactly with standard CSS filters.
          </p>
        ) : null}
        {!cropEqual(edit.crop, FULL_CROP) ? <p className="mt-2 text-xs leading-5 text-[var(--color-text-tertiary)]">Crop settings are export-only and are not included in this CSS snippet.</p> : null}
      </div>
    </section>
  );
}
