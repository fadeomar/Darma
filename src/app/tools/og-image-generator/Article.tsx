import { ToolArticleSection } from "@/features/tools/content/ToolArticleSection";
import { ToolFaq } from "@/features/tools/content/ToolFaq";

export default function Article() {
  return (
    <div className="space-y-6 text-sm leading-7 text-[var(--color-text-secondary)]">
      <ToolArticleSection title="What the production studio creates">
        <p>
          Open Graph images are the large visual cards shown when a page is shared in social networks,
          chat applications, documentation tools, and team workspaces. The studio renders the image,
          prepares HTML and Next.js metadata, checks the handoff, and packages the files locally.
        </p>
        <p>
          The primary canvas is 1200×630, a practical 1.91:1 preview size. Additional platform-named
          variants depend on the selected export pack.
        </p>
      </ToolArticleSection>

      <ToolArticleSection title="Use the four production signals">
        <p>
          The summary cards expose the selected template, title length, main text contrast, and package
          readiness before the detailed previews. Production checks then explain blocking errors,
          warnings, manual image-background reviews, safe-area guidance, and whether the generated files
          still match the visible design.
        </p>
      </ToolArticleSection>

      <ToolArticleSection title="Save and reopen design settings">
        <p>
          Export a versioned JSON project when you need to revisit the design or share its settings with
          another browser. The project deliberately excludes uploaded logo and background image data so
          the file stays compact and does not duplicate private binary assets. Reattach those source files
          after importing.
        </p>
      </ToolArticleSection>

      <ToolArticleSection title="Open Graph, Twitter/X, and Next.js">
        <p>
          Open Graph metadata is used by many link-preview systems, while Twitter/X also reads its own
          card tags. A 1200×630 image can usually serve both. In Next.js App Router projects,
          <code>opengraph-image.png</code> and <code>twitter-image.png</code> can be placed inside a route
          segment, and the generated TypeScript snippet supplies explicit metadata when needed.
        </p>
      </ToolArticleSection>

      <ToolArticleSection title="What the ZIP adds">
        <p>
          In addition to image assets and install snippets, the production pack includes a settings-only
          project file, a Markdown audit, CSV metrics, an asset manifest, a local HTML preview, and a QA
          checklist. Validate the deployed URL and refresh each platform cache after publishing.
        </p>
      </ToolArticleSection>

      <ToolFaq
        items={[
          {
            question: "Can I use the same image for every platform?",
            answer: "Usually yes. A 1200×630 image works well for broad sharing. Platform-named variants are also included in larger export packs for clearer team handoff.",
          },
          {
            question: "Does Darma upload my images or project?",
            answer: "No. Rendering, validation, JSON import, report generation, and ZIP creation all run locally in the browser.",
          },
          {
            question: "Why are uploaded images missing after project import?",
            answer: "Project JSON intentionally stores settings only. This keeps backups small and prevents embedded logo or background data from being copied unintentionally. Reattach the original local files after import.",
          },
          {
            question: "Why is contrast marked for manual review?",
            answer: "A single ratio cannot reliably describe text over every part of a photographic background. Review all platform previews and reposition or darken the image overlay when necessary.",
          },
          {
            question: "Why does a platform still show my previous image?",
            answer: "Social platforms cache metadata and image responses. Confirm the deployed image URL, then use that platform's sharing debugger or cache refresh workflow.",
          },
        ]}
      />
    </div>
  );
}
