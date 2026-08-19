"use client";

import { useMemo, useState } from "react";
import { ToolLayoutVisualGenerator } from "@/features/tools/layouts";
import {
  createDefaultResponsiveImageState,
  createImageCandidate,
  createPictureSource,
  createSizesRule,
  generateCandidatesFromPattern,
  generateCssHelper,
  generateImgMarkup,
  generateNextImageMarkup,
  generatePictureMarkup,
  normalizeResponsiveImageState,
} from "./responsiveImage";
import { buildResponsiveImageAudit, buildResponsiveImageSrcsetManifest } from "./studio";
import type { ImageCandidate, PictureSource, ResponsiveImageState, SizesRule } from "./types";
import { ResponsiveImagePreview } from "./components/ResponsiveImagePreview";
import { ResponsiveImageControls } from "./components/ResponsiveImageControls";
import { ResponsiveImageCodeOutput } from "./components/ResponsiveImageCodeOutput";
import { ResponsiveImageProductionPanel } from "./components/ResponsiveImageProductionPanel";

export default function ResponsiveImageSrcsetClient() {
  const [state, setState] = useState<ResponsiveImageState>(() => createDefaultResponsiveImageState());
  const normalized = useMemo(() => normalizeResponsiveImageState(state), [state]);
  const img = useMemo(() => generateImgMarkup(normalized), [normalized]);
  const picture = useMemo(() => generatePictureMarkup(normalized), [normalized]);
  const nextImage = useMemo(() => generateNextImageMarkup(normalized), [normalized]);
  const css = useMemo(() => generateCssHelper(normalized), [normalized]);
  const manifest = useMemo(() => buildResponsiveImageSrcsetManifest(normalized), [normalized]);
  const checks = useMemo(() => buildResponsiveImageAudit(normalized), [normalized]);

  function patchState(patch: Partial<ResponsiveImageState>) {
    setState((current) => normalizeResponsiveImageState({ ...current, ...patch, presetId: patch.presetId ?? "custom" }));
  }

  function updateCandidate(id: string, patch: Partial<ImageCandidate>) {
    patchState({ candidates: normalized.candidates.map((item) => item.id === id ? { ...item, ...patch } : item) });
  }

  function updateSizeRule(id: string, patch: Partial<SizesRule>) {
    patchState({ sizes: normalized.sizes.map((item) => item.id === id ? { ...item, ...patch } : item) });
  }

  function updatePictureSource(id: string, patch: Partial<PictureSource>) {
    patchState({ pictureSources: normalized.pictureSources.map((item) => item.id === id ? { ...item, ...patch } : item) });
  }

  function regeneratePictureSource(id: string) {
    patchState({
      pictureSources: normalized.pictureSources.map((source) => {
        if (source.id !== id) return source;
        const format = source.type === "image/avif" ? "avif" : source.type === "image/webp" ? "webp" : source.type === "image/png" ? "png" : source.type === "image/jpeg" ? "jpg" : "custom";
        const widths = source.candidates.map((candidate) => candidate.width);
        return { ...source, candidates: generateCandidatesFromPattern(source.urlPattern, widths.length ? widths : [400, 800, 1200], format) };
      }),
    });
  }

  return (
    <ToolLayoutVisualGenerator
      controlsPosition="right"
      actionsPlacement="under-preview"
      previewSlot={<ResponsiveImagePreview state={normalized} onPatch={patchState} />}
      controlsSlot={
        <ResponsiveImageControls
          state={normalized}
          onPatch={patchState}
          onLoadPreset={(next) => setState(normalizeResponsiveImageState(next))}
          onUpdateCandidate={updateCandidate}
          onRemoveCandidate={(id) => patchState({ candidates: normalized.candidates.filter((candidate) => candidate.id !== id) })}
          onUpdateSizeRule={updateSizeRule}
          onRemoveSizeRule={(id) => patchState({ sizes: normalized.sizes.filter((rule) => rule.id !== id) })}
          onAddCandidate={() => patchState({ candidates: [...normalized.candidates, createImageCandidate({ width: Math.min(8000, (normalized.candidates.at(-1)?.width ?? 800) + 400) })] })}
          onRegenerateCandidates={() => patchState({ candidates: generateCandidatesFromPattern(normalized.urlPattern, normalized.candidates.map((candidate) => candidate.width), normalized.candidates[0]?.format ?? "jpg") })}
          onAddSizeRule={() => patchState({ sizes: [...normalized.sizes, createSizesRule()] })}
          onAddPictureSource={() => patchState({ pictureSources: [...normalized.pictureSources, createPictureSource()] })}
          onUpdatePictureSource={updatePictureSource}
          onRemovePictureSource={(id) => patchState({ pictureSources: normalized.pictureSources.filter((source) => source.id !== id) })}
          onRegeneratePictureSource={regeneratePictureSource}
        />
      }
      presetsSlot={
        <div className="space-y-4">
          <ResponsiveImageCodeOutput img={img} picture={picture} nextImage={nextImage} css={css} manifest={manifest} />
          <ResponsiveImageProductionPanel state={normalized} checks={checks} onImport={(next) => setState(normalizeResponsiveImageState(next))} />
        </div>
      }
    />
  );
}
