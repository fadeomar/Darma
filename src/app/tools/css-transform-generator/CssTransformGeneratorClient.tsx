"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui";
import { WarningPanel, type WarningMessage } from "@/features/tools/components";
import { ToolLayoutVisualGenerator } from "@/features/tools/layouts";
import {
  createDefaultTransformState,
  generateTailwindStarter,
  generateTransformCss,
  generateTransformCssVariables,
  generateTransformHtml,
  generateTransformJsx,
  generateTransformKeyframeSnippet,
  generateTransformReactStyleObject,
  generateTransformTokenJson,
  validateTransformState,
} from "./transform";
import type { TransformGeneratorState, TransformPreset } from "./types";
import { TransformPreview } from "./components/TransformPreview";
import { TransformControls } from "./components/TransformControls";
import { TransformCodeOutput } from "./components/TransformCodeOutput";

export default function CssTransformGeneratorClient() {
  const [state, setState] = useState<TransformGeneratorState>(() => createDefaultTransformState());
  const css = useMemo(() => generateTransformCss(state), [state]);
  const html = useMemo(() => generateTransformHtml(state), [state]);
  const jsx = useMemo(() => generateTransformJsx(state), [state]);
  const tailwind = useMemo(() => generateTailwindStarter(state), [state]);
  const variables = useMemo(() => generateTransformCssVariables(state), [state]);
  const reactStyle = useMemo(() => generateTransformReactStyleObject(state), [state]);
  const tokenJson = useMemo(() => generateTransformTokenJson(state), [state]);
  const keyframes = useMemo(() => generateTransformKeyframeSnippet(state), [state]);
  const messages = useMemo<WarningMessage[]>(
    () =>
      validateTransformState(state).map((message, index) => ({
        id: `${message.type}-${index}`,
        severity: message.type === "error" ? "danger" : message.type === "warning" ? "warning" : "info",
        message: message.message,
      })),
    [state],
  );

  function patchState(patch: Partial<TransformGeneratorState>) {
    setState((current) => ({ ...current, ...patch }));
  }

  function loadPreset(preset: TransformPreset) {
    setState(preset.state);
  }

  function resetTransform() {
    setState(createDefaultTransformState());
  }

  async function copyCss() {
    await navigator.clipboard.writeText(css);
  }

  const developerTools = (
    <details className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-xs)]">
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-bold text-[var(--color-text-primary)] marker:hidden">
        <span className="flex items-center justify-between gap-3">
          <span>Developer handoff & diagnostics</span>
          <span className="text-xs font-semibold text-[var(--color-text-tertiary)]">CSS, React, Tailwind, tokens, checks</span>
        </span>
      </summary>
      <div className="space-y-4 border-t border-[var(--color-border-subtle)] p-4">
        <WarningPanel
          title="Transform checks"
          messages={messages.length ? messages : [{ id: "ok", severity: "success", message: "Transform output matches the current controls." }]}
        />
        <TransformCodeOutput css={css} html={html} jsx={jsx} tailwind={tailwind} variables={variables} reactStyle={reactStyle} tokenJson={tokenJson} keyframes={keyframes} />
      </div>
    </details>
  );

  return (
    <ToolLayoutVisualGenerator
      controlsPosition="right"
      controlsWidth="wide"
      wrapPreview={false}
      mobileCodeAfterControls
      previewSlot={<TransformPreview state={state} onPatch={patchState} onLoadPreset={loadPreset} />}
      controlsSlot={<TransformControls state={state} onPatch={patchState} />}
      actionsSlot={
        <>
          <Button variant="secondary" onClick={resetTransform}>Reset</Button>
          <Button onClick={copyCss}>Copy CSS</Button>
        </>
      }
      codeSlot={developerTools}
      actionsPlacement="under-preview"
    />
  );
}
