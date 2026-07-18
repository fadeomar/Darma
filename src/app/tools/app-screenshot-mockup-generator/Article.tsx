import { ToolArticleSection } from "@/features/tools/content/ToolArticleSection";
import { ToolFaq } from "@/features/tools/content/ToolFaq";

export default function Article() {
  return (
    <div className="space-y-6 text-sm leading-7 text-[var(--color-text-secondary)]">
      <ToolArticleSection title="What this screenshot mockup generator creates">
        <p>
          Turn a raw app or website screenshot into a polished PNG with a phone, tablet, laptop, desktop, browser, or clean card frame. Add a solid, gradient, mesh, or image background; optional marketing copy; and export-safe guides before downloading one file or a complete ZIP.
        </p>
        <p>
          The tool is useful for developers documenting a release, designers presenting interface work, creators making launch graphics, students preparing portfolios, and marketers building campaign assets. The production workflow adds a reopenable settings project, design fingerprints, severity-based checks, responsive snippets, reports, CSV metrics, CSS variables, and JSON tokens for teams moving assets into real product pages.
        </p>
      </ToolArticleSection>

      <ToolArticleSection title="A practical workflow">
        <ol className="list-decimal space-y-2 pl-5">
          <li>Upload a high-resolution PNG, JPG, or WebP screenshot.</li>
          <li>Choose a quick preset or select the frame that best matches the product.</li>
          <li>Use Cover for an edge-to-edge crop or Contain when every part of the screenshot must remain visible.</li>
          <li>Choose an export pack, then adjust the background, copy, spacing, and optional frame details.</li>
          <li>Review the live preview, crop summary, four production signals, and severity-based audit. Generate the pack after the final design change, then download current PNGs or the ZIP with code snippets, project settings, reports, metrics, and design tokens.</li>
        </ol>
      </ToolArticleSection>

      <ToolArticleSection title="Choose the right export pack">
        <p><strong className="text-[var(--color-text-primary)]">Landing Page</strong> is the best default for website heroes and feature sections. <strong className="text-[var(--color-text-primary)]">Social Promo</strong> provides square, story, and sharing-card formats. <strong className="text-[var(--color-text-primary)]">App Store Preview</strong> produces tall phone-first drafts. <strong className="text-[var(--color-text-primary)]">Documentation</strong> favors clean README, guide, and changelog dimensions. Choose <strong className="text-[var(--color-text-primary)]">Complete Mockup Kit</strong> when several channels need the same campaign artwork.</p>
        <p>Store requirements change, so treat marketplace outputs as design-ready drafts and confirm the current publishing specifications before submission.</p>
      </ToolArticleSection>

      <ToolArticleSection title="Choose a frame and fit mode">
        <p>Phone and tablet frames suit native apps and responsive screens. Laptop and desktop frames add product context to SaaS dashboards. Browser is best for websites and is the only frame that shows the URL field. Card removes device chrome for documentation, portfolios, and neutral product images.</p>
        <p><strong className="text-[var(--color-text-primary)]">Cover</strong> fills the available screen and may crop the source edges. <strong className="text-[var(--color-text-primary)]">Contain</strong> preserves the entire source and may add empty space around screenshots with a different aspect ratio.</p>
      </ToolArticleSection>

      <ToolArticleSection title="Best practices for clean screenshots">
        <ul className="list-disc space-y-2 pl-5">
          <li>Capture at a large resolution and avoid scaling a small source upward.</li>
          <li>Remove private data, notifications, cursor artifacts, and unrelated browser tabs before uploading.</li>
          <li>Keep titles concise and leave important interface content away from crop and safe-area edges.</li>
          <li>Match the frame to the interface rather than using a device frame only for decoration.</li>
          <li>Preview both wide and portrait exports when artwork will appear across several channels.</li>
        </ul>
      </ToolArticleSection>



      <ToolArticleSection title="Save settings and prevent stale exports">
        <p>
          Export a versioned project JSON file when you need to pause or share the design settings. Uploaded screenshot and background bytes are excluded deliberately, keeping the project compact and preventing private interface imagery from being copied into a settings backup. Reattach those local files after importing.
        </p>
        <p>
          Every generated PNG pack is tied to a fingerprint of the active design and attached sources. Changing copy, colors, frame settings, export pack, screenshot, or background immediately marks the old files as stale and disables their downloads until regeneration finishes.
        </p>
      </ToolArticleSection>

      <ToolArticleSection title="Understand the production audit">
        <p>
          Errors block final handoff, warnings identify quality or naming risks, information items document manual checks, and passing checks confirm usable parts of the project. The audit reviews source availability and resolution, image-background attachment, title length, filename portability, output completeness, duplicate filenames, payload size, marketplace verification, privacy, and package freshness.
        </p>
      </ToolArticleSection>

      <ToolArticleSection title="Production handoff tips">
        <ul className="list-disc space-y-2 pl-5">
          <li>Use the preview canvas controls to test the composition before generating the full pack.</li>
          <li>Generate the ZIP when the selected export pack matches the campaign channel, then use the individual PNG download only for quick iterations.</li>
          <li>Use the responsive picture snippet when several generated sizes are shipped together.</li>
          <li>Use the JSON token export to document frame and color decisions, the project JSON to reopen settings, and the Markdown/CSV files to preserve production evidence.</li>
        </ul>
      </ToolArticleSection>

      <ToolArticleSection title="Privacy and local processing">
        <p>Your screenshot and optional background image stay in the browser. Preview rendering, project validation, package checks, PNG generation, snippets, reports, and ZIP creation use local browser APIs; Darma does not send these files to a server. Export project JSON before refreshing when you need to preserve settings.</p>
      </ToolArticleSection>

      <ToolArticleSection title="Troubleshooting">
        <ul className="list-disc space-y-2 pl-5">
          <li>If a color does not appear, check its helper text. Background color is for Solid mode; gradient colors are for Gradient and Mesh; text colors require the related text or footer; accent appears in badges, mesh highlights, and the safe-area guide.</li>
          <li>The Browser URL appears only when Browser is selected and browser chrome is enabled.</li>
          <li>Phone, tablet, and desktop-style chrome use a minimum corner radius so their silhouettes remain recognizable. The slider shows the effective minimum.</li>
          <li>Image background mode requires a separate background upload. The screenshot upload fills the device, not the canvas background.</li>
          <li>Exports can contain a placeholder when no screenshot is loaded. Upload a real source before final use.</li>
        </ul>
      </ToolArticleSection>

      <ToolFaq
        items={[
          { question: "Can I use this for app store screenshots?", answer: "Yes, as a starting point. The App Store Preview pack creates phone- and tablet-oriented drafts, but verify current marketplace dimensions and content rules before publishing." },
          { question: "Does the tool upload my screenshot?", answer: "No. Images, rendering, checks, and ZIP creation remain local to your browser." },
          { question: "Which export pack should I use for a website hero?", answer: "Use Landing Page. It includes wide and 16:9 outputs suited to hero sections, feature blocks, and product pages." },
          { question: "Can I remove the device frame?", answer: "Yes. Choose Card for a clean framed image, or turn off chrome on supported device frames." },
          { question: "Why is part of my screenshot missing?", answer: "Cover fills the frame by cropping edges when aspect ratios differ. Switch to Contain to preserve the whole screenshot." },
          { question: "Can I use my own background image?", answer: "Yes. Select Image background mode and use the background upload shown there. It remains local to the browser." },
          { question: "What is included in the ZIP?", answer: "The ZIP contains the selected PNG export pack, README, HTML and Next.js examples, a responsive picture snippet, CSS, CSS variables, design tokens, settings-only project JSON, a Markdown audit, and CSV metrics." },
          { question: "Does project JSON contain my uploaded screenshot?", answer: "No. Uploaded screenshot and background bytes are deliberately excluded. Reattach the local images after importing the settings project." },
          { question: "Why are my PNG download buttons disabled?", answer: "The design changed after the last generation. Regenerate the pack so the PNGs and ZIP match the current fingerprint." },
          { question: "Why does the preview show a placeholder?", answer: "The generator supports placeholder previews so you can explore the controls first. Upload a screenshot before producing final assets." },
        ]}
      />
    </div>
  );
}
