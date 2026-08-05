import type { ToolDefinition } from "@/features/tools/domain/tool";
import { ToolPreview, resolveToolPreview } from "@/components/visuals/tool-previews";
import { cn } from "@/lib/cn";

/**
 * The single tool-card preview surface. Every place a tool card appears — the
 * landing rail, the featured grid, the catalog, the compact catalog — renders
 * this, so there is one preview system rather than a generic fallback in one
 * section and bespoke art in another.
 *
 * The preview is decorative: the card title already names the tool.
 */
export function ToolPreviewArtwork({ tool, className }: { tool: ToolDefinition; className?: string }) {
  const config = resolveToolPreview(tool);

  return (
    <div className={cn("landing-tool-art", `landing-tool-art-${config.family}`, className)} aria-hidden>
      <span className="landing-tool-art-grid" />
      <span className="landing-tool-art-glow" />
      <ToolPreview config={config} />
    </div>
  );
}
