import { ToolArticleSection } from "@/features/tools/content/ToolArticleSection";
import { ToolFaq } from "@/features/tools/content/ToolFaq";

export default function Article() {
  return (
    <div className="space-y-6 text-sm leading-7 text-[var(--color-text-secondary)]">
      <ToolArticleSection title="What this OG image generator creates">
        <p>
          Social preview images are the large cards shown when a page is shared on social networks, chat apps, and collaboration tools. This tool creates the image assets and metadata snippets needed for Open Graph and Twitter/X cards.
        </p>
        <p>
          The default canvas is 1200×630 because that size works well as a general-purpose Open Graph image and keeps a practical 1.91:1 social-card ratio.
        </p>
      </ToolArticleSection>

      <ToolArticleSection title="Open Graph vs Twitter cards">
        <p>
          Open Graph metadata is used by many platforms, including Facebook-style cards, LinkedIn, Discord, Slack, and other unfurl systems. Twitter/X uses its own <code>twitter:card</code> tags, but the same image can usually be reused.
        </p>
      </ToolArticleSection>

      <ToolArticleSection title="Next.js App Router setup">
        <p>
          In Next.js App Router projects, you can place <code>opengraph-image.png</code> and <code>twitter-image.png</code> inside a route segment such as <code>src/app</code>. The Next.js export pack also includes a metadata snippet when you want explicit titles, descriptions, image alt text, and URL metadata.
        </p>
      </ToolArticleSection>

      <ToolArticleSection title="Common mistakes">
        <p>
          The most common problems are cropped text, low contrast, using a non-absolute image URL in metadata, missing alt text, uploading an image that is too small, and forgetting to refresh social platform caches after a deploy.
        </p>
      </ToolArticleSection>

      <ToolFaq
        items={[
          {
            question: "Can I use the same image for every platform?",
            answer: "Usually yes. A 1200×630 image works well for broad social sharing. The social export pack also generates platform-named variants for teams that want clearer asset organization.",
          },
          {
            question: "Does Darma upload my images?",
            answer: "No. The canvas rendering, preview, ZIP generation, and validation all run locally in your browser.",
          },
          {
            question: "Should I include text inside the image?",
            answer: "Yes, but keep it short. Social cards are often viewed on mobile, so the title should be large and readable with enough contrast.",
          },
          {
            question: "Why does a social platform still show my old image?",
            answer: "Most platforms cache preview images. After changing metadata or images, use that platform’s sharing/debugger tool to refresh its cache.",
          },
        ]}
      />
    </div>
  );
}
