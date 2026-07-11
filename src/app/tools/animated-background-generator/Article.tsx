import { ToolArticle, ToolArticleSection } from "@/features/tools/components";

export default function Article() {
  return (
    <ToolArticle>
      <ToolArticleSection title="How to use animated backgrounds safely in production">
        <p>
          Animated backgrounds can make a hero section feel premium, but they need motion, contrast, and performance limits. Always preview the background behind real buttons, cards, and dashboard panels before exporting.
        </p>
      </ToolArticleSection>
      <ToolArticleSection title="Watch particle count, blur, and glow">
        <p>
          Large blurred objects and heavy glow effects can increase paint cost. For full-page hero sections, keep the element count moderate and test on mobile devices before shipping.
        </p>
      </ToolArticleSection>
      <ToolArticleSection title="Include reduced-motion support">
        <p>
          The generated CSS includes a <code>prefers-reduced-motion</code> guard so users who prefer less motion can still see the background without continuous animation.
        </p>
      </ToolArticleSection>
    </ToolArticle>
  );
}
