import { PresetGallery } from "@/features/tools/components";
import { BEAM_PRESETS, type BeamPreset } from "../lib/beamPresets";

type BeamPresetCardsProps = {
  activeId?: string;
  onSelect: (preset: BeamPreset) => void;
};

export function BeamPresetCards({ activeId, onSelect }: BeamPresetCardsProps) {
  return (
    <PresetGallery
      presets={BEAM_PRESETS}
      selectedId={activeId}
      onSelect={(_id, preset) => onSelect(preset)}
      getId={(preset) => preset.id}
      getLabel={(preset) => preset.name}
      getDescription={(preset) => preset.description}
    />
  );
}
