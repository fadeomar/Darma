import { ToolArticle, ToolArticleSection } from "@/features/tools/components";

export default function NeumorphismArticle() {
  return (
    <ToolArticle>
      <ToolArticleSection title="What neumorphism is good for">
        <p>
          Neumorphism uses a surface color plus two opposing shadows to create a soft raised or pressed effect. It works best for calm dashboard widgets, controls, cards, and decorative UI pieces where the background and component share a similar tone.
        </p>
      </ToolArticleSection>

      <ToolArticleSection title="Start from the UI you are actually building">
        <p>
          Choose a real use-case starter before touching the depth controls. Darma includes raised cards, pricing panels, search fields, pressed toggles, floating actions, dashboard stats, media controls, profile chips, notifications, and dark controls so you can begin from a familiar component instead of guessing shadow values.
        </p>
        <ul>
          <li><strong>Raised surfaces:</strong> soft cards, pricing cards, settings panels, hero panels, and stat tiles.</li>
          <li><strong>Pressed surfaces:</strong> search fields, selected toggles, inset controls, and dark active states.</li>
          <li><strong>Compact actions:</strong> pill buttons, floating actions, profile chips, and media controls.</li>
          <li><strong>Expressive styles:</strong> clay cards and convex surfaces when the design can support stronger depth.</li>
        </ul>
      </ToolArticleSection>

      <ToolArticleSection title="How the main controls change the result">
        <ul>
          <li><strong>Distance</strong> controls how far the paired shadows sit from the surface.</li>
          <li><strong>Blur</strong> controls softness. Higher blur creates a calmer effect but can become visually muddy.</li>
          <li><strong>Intensity</strong> changes how strongly the light and dark shadows separate from the surface color.</li>
          <li><strong>Spread</strong> expands or contracts the shadows and is useful for tightening or widening the depth footprint.</li>
          <li><strong>Light source</strong> must stay consistent across nearby components or the interface will feel physically incorrect.</li>
          <li><strong>Shape</strong> switches between flat, pressed, convex, and concave treatments without forcing you to rebuild values manually.</li>
        </ul>
      </ToolArticleSection>

      <ToolArticleSection title="Production guidelines">
        <ul>
          <li>Keep blur and distance moderate. Very large soft shadows can become expensive to paint.</li>
          <li>Do not rely on shadow depth as the only way to communicate state. Add text, icons, borders, or contrast when the UI is interactive.</li>
          <li>Check text contrast on every surface. A beautiful soft card is still unusable if the label is too faint.</li>
          <li>Use pressed or inset styles sparingly for selected states, toggles, and input wells.</li>
          <li>Keep one light direction across a component group so cards and controls appear to belong to the same physical surface.</li>
        </ul>
      </ToolArticleSection>

      <ToolArticleSection title="What this generator exports">
        <p>
          The generated output includes normal CSS, CSS variables, Tailwind starter tokens, a React inline style object, HTML markup, and JSON design tokens so the shadow can move from prototype to implementation without rewriting values manually.
        </p>
      </ToolArticleSection>
    </ToolArticle>
  );
}
