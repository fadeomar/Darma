import type { ToolDefinition } from "@/features/tools/domain/tool";
import { cn } from "@/lib/cn";

export function ToolPreviewArtwork({ tool, className }: { tool: ToolDefinition; className?: string }) {
  return (
    <div className={cn("landing-tool-art", `landing-tool-art-${tool.id}`, className)} aria-hidden>
      {tool.id === "css-gradient-generator" ? <GradientArt /> : null}
      {tool.id === "json-formatter" ? <JsonArt /> : null}
      {tool.id === "gpa-calculator" ? <GpaArt /> : null}
      {tool.id === "image-compressor-resizer" ? <ImageArt /> : null}
      {!["css-gradient-generator", "json-formatter", "gpa-calculator", "image-compressor-resizer"].includes(tool.id) ? <GenericArt layoutType={tool.layoutType} /> : null}
      <span className="landing-tool-art-grid" />
      <span className="landing-tool-art-glow" />
    </div>
  );
}

function GradientArt() {
  return (
    <>
      <div className="landing-tool-gradient-canvas" />
      <div className="landing-tool-gradient-points"><span /><span /><span /></div>
      <div className="landing-tool-gradient-code"><span>135deg</span><i>#ff6a3d</i><i>#2dd4bf</i></div>
    </>
  );
}

function JsonArt() {
  return (
    <div className="landing-tool-json-window">
      <div className="landing-tool-window-bar"><span /><span /><span /></div>
      <div className="landing-tool-json-lines">
        <p><b>{"{"}</b></p>
        <p><i>"workspace"</i>: <em>"Darma"</em>,</p>
        <p><i>"status"</i>: <strong>true</strong>,</p>
        <p><i>"tools"</i>: <span>68</span></p>
        <p><b>{"}"}</b></p>
      </div>
      <span className="landing-tool-json-check">✓ valid</span>
    </div>
  );
}

function GpaArt() {
  return (
    <div className="landing-tool-gpa-shell">
      <div className="landing-tool-gpa-score"><span>Semester GPA</span><strong>3.57</strong><small>On track</small></div>
      <div className="landing-tool-gpa-bars">
        {[38, 68, 52, 86, 72].map((height) => <span key={height} style={{ height: `${height}%` }} />)}
      </div>
      <div className="landing-tool-gpa-line"><span /><span /><span /></div>
    </div>
  );
}

function ImageArt() {
  return (
    <div className="landing-tool-image-shell">
      <div className="landing-tool-image-before"><span>4.8 MB</span></div>
      <div className="landing-tool-image-divider"><i /></div>
      <div className="landing-tool-image-after"><span>620 KB</span></div>
      <div className="landing-tool-image-saving">−87%</div>
    </div>
  );
}

function GenericArt({ layoutType }: { layoutType?: ToolDefinition["layoutType"] }) {
  if (layoutType === "text-workbench") {
    return (
      <div className="landing-tool-generic-editor">
        <div><span /><span /><span /><span /></div>
        <i>→</i>
        <div><span /><span /><span /></div>
      </div>
    );
  }
  if (layoutType === "interactive-challenge") {
    return <div className="landing-tool-generic-challenge"><span>03</span><strong>READY</strong><i>START</i></div>;
  }
  return (
    <div className="landing-tool-generic-visual">
      <span /><span /><span />
      <div><i /><i /><i /></div>
    </div>
  );
}
