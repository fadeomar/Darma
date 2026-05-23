export default function Article() {
  return (
    <div className="prose prose-slate max-w-none dark:prose-invert">
      <h2>What are CSS container queries?</h2>
      <p>
        CSS container queries let a component respond to the size of one of its parent containers. Instead of asking “how wide is the viewport?”, the component can ask “how much space did this card, widget, or module actually receive?”
      </p>

      <h2>Container queries vs media queries</h2>
      <p>
        Media queries are still useful for page-wide changes based on viewport or device conditions. Container queries are better when a reusable component can appear in many different places, such as a sidebar, dashboard grid, full-width article, or product listing.
      </p>

      <h2>How container-type and container-name work</h2>
      <p>
        <code>container-type: inline-size</code> makes an element queryable by its inline width, which is the most common production use case. <code>container-name</code> gives that container a name so your <code>@container</code> rules can target it clearly.
      </p>

      <h2>Writing @container rules</h2>
      <p>
        A typical rule looks like <code>@container card (min-width: 400px)</code>. The styles inside that rule apply to descendants of the matching container when the condition is true. This is why the query container usually wraps the component you want to adapt.
      </p>

      <h2>Common responsive component patterns</h2>
      <p>
        Container queries are excellent for responsive cards, profile modules, dashboard widgets, sidebar panels, article previews, product cards, stats cards, and reusable design-system components that need to work in many parent layouts.
      </p>

      <h2>Best practices and pitfalls</h2>
      <p>
        Start with <code>inline-size</code> and width-based breakpoints. Keep breakpoints component-specific rather than copying global viewport breakpoints. Use named containers when a page has nested components, and remember that container queries style descendants, not the container itself directly.
      </p>

      <h2>Privacy note</h2>
      <p>
        This generator runs in your browser. Your component names, breakpoints, style rules, and generated code are not sent to a Darma server.
      </p>

      <h2>FAQ</h2>
      <h3>Should I replace all media queries with container queries?</h3>
      <p>No. Use media queries for page-level viewport changes and container queries for reusable components that must adapt to parent size.</p>
      <h3>Why is inline-size the default?</h3>
      <p>Most responsive component work depends on available width, so <code>inline-size</code> is usually the most practical and predictable container type.</p>
      <h3>Can container queries change layout and typography?</h3>
      <p>Yes. You can change layout, spacing, font sizes, visibility, image ratios, and many other descendant styles inside <code>@container</code> rules.</p>
    </div>
  );
}
