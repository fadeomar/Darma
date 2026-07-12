export default function Article() {
  return (
    <div className="prose prose-slate max-w-none dark:prose-invert">
      <h2>What is CSS Flexbox?</h2>
      <p>
        CSS Flexbox is a layout model for arranging items along one main axis. It is ideal for navigation bars, toolbars, form actions, centered content, card rows, media objects, and app shells where item sizes can grow or shrink.
      </p>

      <h2>When to use Flexbox instead of CSS Grid</h2>
      <p>
        Use Flexbox when the layout is mainly one-dimensional: a row or a column. Use CSS Grid when rows and columns both need strong placement control. A common production pattern is to use Grid for the page structure and Flexbox inside each component.
      </p>

      <h2>Main axis vs cross axis</h2>
      <p>
        The main axis follows <code>flex-direction</code>. In a row layout, <code>justify-content</code> moves items horizontally. In a column layout, the same property distributes items vertically. The cross axis is controlled by <code>align-items</code>.
      </p>

      <h2>flex-grow, flex-shrink, and flex-basis</h2>
      <p>
        <code>flex-basis</code> is the starting size. <code>flex-grow</code> decides how extra space is shared. <code>flex-shrink</code> decides how items reduce when space is tight. For equal cards, <code>flex: 1 1 0</code> is often a useful starting point.
      </p>

      <h2>Responsive Flexbox rules</h2>
      <p>
        <code>flex-wrap: wrap</code> is helpful for card rows. For navigation, toolbars, and form actions, a mobile stack rule is often clearer than forcing every item to remain on one line. This generator includes tablet and mobile behaviors so you can copy safer responsive CSS.
      </p>

      <h2>Production exports</h2>
      <p>
        The generator can export CSS, CSS variables, HTML, React JSX, Tailwind starter markup, JSON layout tokens, and a plain-language explanation. These outputs are useful for handoff between designers and developers.
      </p>

      <h2>Common Flexbox patterns</h2>
      <p>
        Flexbox works especially well for navbars with pushed actions, form footer buttons, pricing cards, split hero sections, vertical stacks, avatar-and-content media objects, and centered loading or empty states.
      </p>

      <h2>Privacy note</h2>
      <p>
        This generator runs in your browser. Your labels, generated markup, and generated CSS are not sent to a Darma server.
      </p>

      <h2>FAQ</h2>
      <h3>Why does align-content not change anything?</h3>
      <p>
        <code>align-content</code> only has a visible effect when flex items wrap into multiple lines and there is extra cross-axis space to distribute.
      </p>
      <h3>How do I push one navbar item to the end?</h3>
      <p>
        Select the item and enable <code>margin-left: auto</code>, or use the “Push selected” quick action.
      </p>
      <h3>How do I make equal cards?</h3>
      <p>
        Use the “Equal items” quick action or set every item to <code>flex-grow: 1</code>, <code>flex-shrink: 1</code>, and <code>flex-basis: 0</code>.
      </p>
    </div>
  );
}
