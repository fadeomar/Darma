"use client";

import { useMemo, useState } from "react";
import { WarningPanel, type WarningMessage } from "@/features/tools/components";
import { ToolLayoutVisualGenerator } from "@/features/tools/layouts";
import { createDefaultResponsiveImageState, createImageCandidate, createSizesRule, generateCssHelper, generateImgMarkup, generateNextImageMarkup, generatePictureMarkup, normalizeResponsiveImageState, validateResponsiveImageState } from "./responsiveImage";
import type { ImageCandidate, ResponsiveImageState, SizesRule } from "./types";
import { ResponsiveImagePreview } from "./components/ResponsiveImagePreview";
import { ResponsiveImageControls } from "./components/ResponsiveImageControls";
import { ResponsiveImageCodeOutput } from "./components/ResponsiveImageCodeOutput";

export default function ResponsiveImageSrcsetClient() {
  const [state, setState] = useState<ResponsiveImageState>(() => createDefaultResponsiveImageState());
  const normalized = useMemo(() => normalizeResponsiveImageState(state), [state]);
  const img = useMemo(() => generateImgMarkup(normalized), [normalized]);
  const picture = useMemo(() => generatePictureMarkup(normalized), [normalized]);
  const nextImage = useMemo(() => generateNextImageMarkup(normalized), [normalized]);
  const css = useMemo(() => generateCssHelper(normalized), [normalized]);
  const messages = useMemo<WarningMessage[]>(() => validateResponsiveImageState(normalized).map((message, index) => ({ id: `${message.type}-${index}`, severity: message.type === "error" ? "danger" : message.type === "warning" ? "warning" : "info", message: message.message })), [normalized]);
  function patchState(patch: Partial<ResponsiveImageState>) { setState((current) => normalizeResponsiveImageState({ ...current, ...patch })); }
  function updateCandidate(id: string, patch: Partial<ImageCandidate>) { patchState({ candidates: normalized.candidates.map((item) => item.id === id ? { ...item, ...patch } : item) }); }
  function updateSizeRule(id: string, patch: Partial<SizesRule>) { patchState({ sizes: normalized.sizes.map((item) => item.id === id ? { ...item, ...patch } : item) }); }
  return <ToolLayoutVisualGenerator previewSlot={<ResponsiveImagePreview state={normalized} onPatch={patchState} />} controlsSlot={<ResponsiveImageControls state={normalized} onPatch={patchState} onLoadPreset={(next) => setState(normalizeResponsiveImageState(next))} onUpdateCandidate={updateCandidate} onUpdateSizeRule={updateSizeRule} onAddCandidate={() => patchState({ candidates: [...normalized.candidates, createImageCandidate({ width: 1200 })] })} onAddSizeRule={() => patchState({ sizes: [...normalized.sizes, createSizesRule()] })} />} codeSlot={<ResponsiveImageCodeOutput img={img} picture={picture} nextImage={nextImage} css={css} />} presetsSlot={<WarningPanel title="Responsive image checks" messages={messages.length ? messages : [{ id: "ok", severity: "success", message: "Responsive image markup looks ready to test." }]} />} />;
}
