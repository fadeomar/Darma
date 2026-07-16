import { ToolArticle, ToolArticleSection } from "@/features/tools/components";

export default function Article() {
  return (
    <ToolArticle>
      <ToolArticleSection title="Build motion around real content">
        <p>
          Animated backgrounds should support a page rather than compete with it. Preview the design behind hero copy, buttons, cards, or dashboard panels before exporting, and keep the busiest movement away from critical text and controls.
        </p>
      </ToolArticleSection>

      <ToolArticleSection title="Treat particle count, blur, glow, and size as one budget">
        <p>
          A moderate particle count can still become expensive when every element is very large, heavily blurred, and surrounded by a wide drop shadow. The production audit combines these values into an estimated performance score so you can identify costly combinations instead of reviewing each slider in isolation.
        </p>
        <ul>
          <li>Prefer fewer, larger ambient layers or more numerous small particles—not both at maximum values.</li>
          <li>Keep full-page effects lighter than short hero-section effects.</li>
          <li>Test on low-end mobile hardware because desktop previews can hide paint and compositing costs.</li>
        </ul>
      </ToolArticleSection>

      <ToolArticleSection title="Reduced motion is required, not optional">
        <p>
          Every exported CSS file includes a <code>prefers-reduced-motion</code> rule that disables continuous particle and pseudo-element animation. Still test this behavior in a real browser because surrounding page transitions and framework animations may need their own reduced-motion handling.
        </p>
      </ToolArticleSection>

      <ToolArticleSection title="Save projects separately from deployment files">
        <p>
          Project JSON stores the editable seed, colors, motion, effects, and preview settings. The production ZIP contains a standalone HTML preview, scoped CSS, a React component, design tokens, an audit report, and CSV metrics. Reopen the JSON for future edits and use the generated code for deployment.
        </p>
      </ToolArticleSection>

      <ToolArticleSection title="Final production checklist">
        <ul>
          <li>Review the background behind real text and interactive controls.</li>
          <li>Resolve every blocking audit error and review all warnings.</li>
          <li>Verify reduced-motion behavior.</li>
          <li>Test the final section on mobile Safari, Chromium, and a low-end device.</li>
          <li>Keep a project JSON beside the deployed code so the visual can be reproduced later.</li>
        </ul>
      </ToolArticleSection>
    </ToolArticle>
  );
}
