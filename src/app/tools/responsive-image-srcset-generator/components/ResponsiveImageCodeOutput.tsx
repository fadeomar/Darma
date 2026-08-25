import { CodeOutputPanel } from "@/features/tools/components";

export function ResponsiveImageCodeOutput({ img, picture, nextImage, css, manifest }: { img: string; picture: string; nextImage: string; css: string; manifest: string }) {
  return (
    <details className="rounded-[var(--radius-xl)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] shadow-[var(--shadow-card)]">
      <summary className="cursor-pointer list-none px-4 py-4 [&::-webkit-details-marker]:hidden">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-black text-[var(--color-text-primary)]">Generated markup & code</p>
            <p className="mt-1 text-xs leading-5 text-[var(--color-text-tertiary)]">Copy img, picture, Next.js Image, CSS, or the candidate manifest when you are ready to implement.</p>
          </div>
          <span className="rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-2.5 py-1 text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Developer</span>
        </div>
      </summary>
      <div className="border-t border-[var(--color-border-subtle)] p-3 sm:p-4">
        <CodeOutputPanel title="Generated image delivery code" description="Choose the implementation format you need." tabs={[{ id: "img", label: "img", code: img, language: "html" }, { id: "picture", label: "picture", code: picture, language: "html" }, { id: "next", label: "Next.js", code: nextImage, language: "tsx" }, { id: "css", label: "CSS", code: css, language: "css" }, { id: "manifest", label: "Manifest", code: manifest, language: "json" }]} />
      </div>
    </details>
  );
}
