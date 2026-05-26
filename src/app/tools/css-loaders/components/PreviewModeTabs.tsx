import { Tabs } from "@/components/ui";
import type { LoaderPreviewMode } from "../types";

const PREVIEW_MODE_ITEMS: Array<{ value: LoaderPreviewMode; label: string }> = [
  { value: "standalone", label: "Standalone" },
  { value: "button", label: "Button" },
  { value: "card", label: "Card" },
  { value: "overlay", label: "Overlay" },
];

type PreviewModeTabsProps = {
  value: LoaderPreviewMode;
  onChange: (value: LoaderPreviewMode) => void;
};

export default function PreviewModeTabs({ value, onChange }: PreviewModeTabsProps) {
  return <Tabs items={PREVIEW_MODE_ITEMS} value={value} onChange={onChange} ariaLabel="Preview mode" className="css-loaders-preview-tabs" />;
}
