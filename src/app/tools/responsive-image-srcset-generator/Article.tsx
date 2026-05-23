export default function Article() {
  return (
    <article className="prose prose-slate max-w-none dark:prose-invert">
      <h2>What are responsive images?</h2>
      <p>
        Responsive images let the browser choose an image file that fits the user&apos;s layout, viewport, and device pixel ratio. Instead of shipping one oversized file to every device, you provide multiple candidates and describe how wide the image will be rendered.
      </p>

      <h2>What srcset does</h2>
      <p>
        The <code>srcset</code> attribute lists image candidates. Width descriptors such as <code>400w</code>, <code>800w</code>, and <code>1200w</code> tell the browser the intrinsic width of each file. The browser can then pick a candidate that is close to the image slot it needs.
      </p>

      <h2>What sizes does</h2>
      <p>
        The <code>sizes</code> attribute describes the rendered slot size at different viewport widths. For example, a card image may be <code>100vw</code> on mobile, <code>50vw</code> on tablet, and <code>33vw</code> in a desktop grid. Good <code>sizes</code> values are the difference between useful responsive images and accidentally downloading files that are too large.
      </p>

      <h2>Width descriptors vs density descriptors</h2>
      <p>
        Width descriptors are best for fluid layouts because the image slot can change. Density descriptors such as <code>1x</code> and <code>2x</code> are simpler and can work well for fixed-size icons or avatars, but width descriptors plus <code>sizes</code> are usually better for responsive cards, heroes, and content images.
      </p>

      <h2>When to use picture</h2>
      <p>
        Use the <code>&lt;picture&gt;</code> element when you need art direction or format fallback. Art direction means serving different crops for different conditions. Format fallback means offering AVIF or WebP first while keeping a JPG or PNG fallback inside the final <code>&lt;img&gt;</code> element.
      </p>

      <h2>How to use responsive images in Next.js</h2>
      <p>
        Next.js <code>&lt;Image&gt;</code> still needs a thoughtful <code>sizes</code> value when the image is responsive. Without a useful <code>sizes</code> value, the generated candidates may not match the actual layout as well as they could. Treat <code>sizes</code> as the contract between your CSS layout and the image optimizer.
      </p>

      <h2>Performance and accessibility tips</h2>
      <ul>
        <li>Add <code>width</code> and <code>height</code> so the browser can reserve space and reduce layout shift.</li>
        <li>Write descriptive <code>alt</code> text unless the image is decorative.</li>
        <li>Use <code>loading=&quot;lazy&quot;</code> for most below-the-fold images.</li>
        <li>Use <code>loading=&quot;eager&quot;</code> and high fetch priority only for important above-the-fold images.</li>
        <li>Keep candidate sets practical. Three to six useful widths are often easier to maintain than a very long list.</li>
      </ul>

      <h2>Privacy note</h2>
      <p>
        This generator works in your browser. It creates markup from the URLs, sizes, and attributes you enter without uploading image files or sending generation data to a server route.
      </p>

      <h2>FAQ</h2>
      <h3>Does the browser always choose the exact candidate shown by the analyzer?</h3>
      <p>No. The analyzer is an educational estimate. Real browsers can also consider caching, network conditions, and supported image formats.</p>
      <h3>Should I always use picture?</h3>
      <p>No. Use a normal <code>&lt;img&gt;</code> with <code>srcset</code> and <code>sizes</code> for most responsive images. Use <code>&lt;picture&gt;</code> when you need format fallback or different crops.</p>
      <h3>What is the most common mistake?</h3>
      <p>The most common mistake is adding <code>srcset</code> but leaving out a correct <code>sizes</code> value. That can make browsers assume the image is much wider than it really is.</p>
    </article>
  );
}
