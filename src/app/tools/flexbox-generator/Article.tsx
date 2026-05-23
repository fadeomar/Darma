export default function Article() {
  return (
    <div className="prose prose-slate max-w-none dark:prose-invert">
      <h2>What is CSS Flexbox?</h2>
      <p>
        CSS Flexbox is a layout model for arranging items in one direction at a time: a row or a column. It is ideal when the size of the items can change and the browser should distribute free space, align items, or wrap content onto new lines.
      </p>

      <h2>When to use Flexbox instead of CSS Grid</h2>
      <p>
        Use Flexbox for one-dimensional layouts such as navbars, toolbars, form actions, centered empty states, media objects, and card rows. Use CSS Grid when you need stronger two-dimensional control over rows and columns at the same time.
      </p>

      <h2>Main axis vs cross axis</h2>
      <p>
        Flexbox always has a main axis and a cross axis. The main axis follows <code>flex-direction</code>. In a row layout, the main axis is horizontal. In a column layout, the main axis is vertical. This is why the same alignment property can appear to move items in a different direction after you change the direction.
      </p>

      <h2>justify-content vs align-items</h2>
      <p>
        <code>justify-content</code> distributes items along the main axis. <code>align-items</code> aligns items on the cross axis. A common pattern for centering is <code>justify-content: center</code> and <code>align-items: center</code>.
      </p>

      <h2>flex-grow, flex-shrink, and flex-basis</h2>
      <p>
        <code>flex-basis</code> is the starting size of an item. <code>flex-grow</code> controls how much extra space an item can take. <code>flex-shrink</code> controls how much an item can shrink when there is not enough room. For equal flexible cards, <code>flex: 1 1 0</code> is often a useful starting point.
      </p>

      <h2>Wrapping responsive layouts</h2>
      <p>
        <code>flex-wrap: wrap</code> lets items move onto new lines. Combine it with a useful <code>flex-basis</code>, such as <code>240px</code>, to create card rows that naturally respond to available width.
      </p>

      <h2>Common Flexbox patterns</h2>
      <p>
        Flexbox works especially well for navbars with pushed actions, toolbars, pricing cards, split hero sections, vertical stacks, avatar-and-content media objects, and centered loading or empty states.
      </p>

      <h2>Privacy note</h2>
      <p>
        This generator runs in your browser. Your Flexbox layout, labels, generated HTML, and generated CSS are not sent to a Darma server.
      </p>

      <h2>FAQ</h2>
      <h3>Why does align-content not change anything?</h3>
      <p>
        <code>align-content</code> only has a visible effect when flex items wrap into multiple lines and there is extra cross-axis space to distribute.
      </p>
      <h3>How do I push one navbar item to the end?</h3>
      <p>
        Select the item and enable <code>margin-left: auto</code>, or use the “Push selected/end” quick action.
      </p>
      <h3>How do I make equal cards?</h3>
      <p>
        Use the “Equal items” quick action or set every item to <code>flex-grow: 1</code>, <code>flex-shrink: 1</code>, and <code>flex-basis: 0</code>.
      </p>
    </div>
  );
}
