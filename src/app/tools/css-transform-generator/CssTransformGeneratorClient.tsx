"use client";

import { useMemo, useState } from "react";
import { WarningPanel, type WarningMessage } from "@/features/tools/components";
import { ToolLayoutVisualGenerator } from "@/features/tools/layouts";
import { createDefaultTransformState, generateTailwindStarter, generateTransformCss, generateTransformHtml, generateTransformJsx, validateTransformState } from "./transform";
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
  const messages = useMemo<WarningMessage[]>(() => validateTransformState(state).map((message, index) => ({ id: `${message.type}-${index}`, severity: message.type === "error" ? "danger" : message.type === "warning" ? "warning" : "info", message: message.message })), [state]);
  function patchState(patch: Partial<TransformGeneratorState>) { setState((current) => ({ ...current, ...patch })); }
  function loadPreset(preset: TransformPreset) { setState(preset.state); }
  return <ToolLayoutVisualGenerator previewSlot={<TransformPreview state={state} onPatch={patchState} />} controlsSlot={<TransformControls state={state} onPatch={patchState} onLoadPreset={loadPreset} />} codeSlot={<TransformCodeOutput css={css} html={html} jsx={jsx} tailwind={tailwind} />} presetsSlot={<WarningPanel title="Transform checks" messages={messages.length ? messages : [{ id: "ok", severity: "success", message: "Transform output matches the current controls." }]} />} />;
}
