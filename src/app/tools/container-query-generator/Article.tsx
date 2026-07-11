export default function Article() {
  return (
    <div className="prose prose-slate max-w-none dark:prose-invert">
      <h2>What are CSS container queries?</h2>
      <p>
        CSS container queries let a component respond to the size of its parent container. Instead of asking how wide the whole browser viewport is, the component can react to the space it actually receives inside a sidebar, grid, modal, dashboard, or full-width layout.
      </p>

      <h2>Why container queries matter</h2>
      <p>
        Media queries are great for page-level layout changes. Container queries are better for reusable components because the same card, product tile, widget, or article preview can adapt differently depending on where it is placed.
      </p>

      <h2>Production setup</h2>
      <p>
        The usual production pattern is to set <code>container-type: inline-size</code> on a wrapper, optionally add <code>container-name</code>, then write <code>@container</code> rules for descendant elements. This generator also includes fallback CSS and an optional <code>@supports</code> guard.
      </p>

      <h2>Container queries vs media queries</h2>
      <p>
        Use media queries when the entire page should change because of viewport size. Use container queries when a component should change because its parent region changed. Many real interfaces use both: media queries for the page shell and container queries for component internals.
      </p>

      <h2>Best practices</h2>
      <p>
        Keep breakpoints component-specific, not copied from global viewport breakpoints. Prefer <code>inline-size</code> for width-based layouts, avoid too many overlapping rules, and keep a safe stacked fallback for browsers or contexts where container queries are unavailable.
      </p>

      <h2>Privacy note</h2>
      <p>
        This generator runs locally in your browser. Your selectors, breakpoints, style rules, and generated code are not uploaded to a Darma server.
      </p>

      <h2>FAQ</h2>
      <h3>Should I replace all media queries with container queries?</h3>
      <p>No. Use media queries for page-level viewport changes and container queries for reusable components that adapt to parent size.</p>
      <h3>Should I use a named container?</h3>
      <p>Named containers are useful when components are nested or when you want to make generated CSS easier to read and maintain.</p>
      <h3>What is the safest default container type?</h3>
      <p><code>inline-size</code> is the safest default for most responsive component work because it queries available width.</p>
    </div>
  );
}
