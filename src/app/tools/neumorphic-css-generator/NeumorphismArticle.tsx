import { ToolArticle, ToolArticleSection } from "@/features/tools/components";

export default function NeumorphismArticle() {
  return (
    <ToolArticle>
      <ToolArticleSection title="What neumorphism is good for">
        <p>
          Neumorphism uses a surface color plus two opposing shadows to create a soft raised or pressed effect. It works best for calm dashboard widgets, controls, cards, and decorative UI pieces where the background and component share a similar tone.
        </p>
      </ToolArticleSection>
      <ToolArticleSection title="Production guidelines">
        <ul>
          <li>Keep blur and distance moderate. Very large soft shadows can become expensive to paint.</li>
          <li>Do not rely on shadow depth as the only way to communicate state. Add text, icons, borders, or contrast when the UI is interactive.</li>
          <li>Check text contrast on every surface. A beautiful soft card is still unusable if the label is too faint.</li>
          <li>Use pressed or inset styles sparingly for selected states, toggles, and input wells.</li>
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
