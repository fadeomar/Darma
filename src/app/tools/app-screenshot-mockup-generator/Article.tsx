import { ToolArticleSection } from "@/features/tools/content/ToolArticleSection";
import { ToolFaq } from "@/features/tools/content/ToolFaq";

export default function Article() {
  return (
    <div className="space-y-6 text-sm leading-7 text-[var(--color-text-secondary)]">
      <ToolArticleSection title="What this screenshot mockup generator creates">
        <p>
          App Screenshot / Mockup Generator turns raw product screenshots into polished marketing images with device frames, browser chrome, backgrounds, text overlays, safe-area guides, and export packs.
        </p>
        <p>
          It is designed for landing pages, product launch posts, documentation images, support articles, app listing drafts, and internal product presentations.
        </p>
      </ToolArticleSection>

      <ToolArticleSection title="Why use mockups instead of raw screenshots?">
        <p>
          Raw screenshots are often too flat for a landing page or launch post. A mockup adds context, scale, typography, and a controlled background so the screenshot looks intentional and easier to understand.
        </p>
      </ToolArticleSection>

      <ToolArticleSection title="Client-only privacy">
        <p>
          The screenshot, background image, canvas rendering, validation checks, and ZIP export all run locally in the browser. Darma does not upload the screenshot to a server.
        </p>
      </ToolArticleSection>

      <ToolArticleSection title="Best practices">
        <p>
          Use high-resolution screenshots, keep marketing titles short, avoid placing important UI near export edges, and test both square and wide outputs if the same visual will be reused across website and social placements.
        </p>
      </ToolArticleSection>

      <ToolFaq
        items={[
          {
            question: "Can I use this for app store screenshots?",
            answer: "Yes as a starting point. The App Store Preview pack creates tall phone and tablet-style outputs, but you should always verify final marketplace requirements before publishing.",
          },
          {
            question: "Does the tool upload my screenshot?",
            answer: "No. The image stays in your browser. Preview rendering and ZIP export are local canvas operations.",
          },
          {
            question: "Which export pack should I use for a website hero?",
            answer: "Use the Landing Page Pack. It includes wide and 16:9 outputs that work well in hero sections, feature blocks, and product pages.",
          },
          {
            question: "Can I remove the device frame?",
            answer: "Yes. Choose the Clean card device or disable device/browser chrome to create a simpler framed screenshot.",
          },
        ]}
      />
    </div>
  );
}
