import "./style.css";

export default function Learn_CSS_Grid() {
  return (
    <div className="learn_css_grid">
      <header className="section header bw--0" role="banner">
        <h1 className="header-title">
          <span>L</span>
          <span>e</span>
          <span>a</span>
          <span>r</span>
          <span>n</span>
          <span className="--span-1">&nbsp;</span>
          <span>C</span>
          <span>S</span>
          <span>S</span>
          <span className="--span-2">&nbsp;</span>
          <span>G</span>
          <span>r</span>
          <span>i</span>
          <span>d</span>
        </h1>
        <p className="header-subtitle">
          A guide to learning CSS grid by
          <a href="https://twitter.com/jonsuh" rel="author">
            <span
              itemProp="author"
              // itemScope=""
              itemType="http://schema.org/Person"
            >
              @fadeomar
              <meta itemProp="name" content="Fadi Omar" />
            </span>
          </a>
        </p>
      </header>
      <section className="section supports">
        <div className="container">
          <p className="mb--0">
            <i>
              Note: To properly see the visual examples, you must be using a
              browser that supports CSS Grid. Check out
              <a href="https://caniuse.com/#search=grid">caniuse.com</a> to see
              current browser support.
            </i>
          </p>
        </div>
      </section>
      <main className="main" role="main">
        <div itemProp="articleBody">
          <section id="table-of-contents" className="section">
            <header className="ex__header mb--0">
              <p className="mb--2">
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout">
                  CSS Grid
                </a>
                is a powerful tool that allows for two-dimensional layouts to be
                created on the web. This guide was created as a resource to help
                you better understand and learn Grid, and was organized in a way
                I thought made the most sense when learning it.
              </p>
              <h3>Table of Contents</h3>
              <ol className="mb--0">
                <li>
                  <a href="#grid-container">Grid Container</a>
                </li>
                <li>
                  <a href="#explicit-grid">Explicit Grid</a>
                </li>
                <li>
                  <a href="#minimum-maximum-grid-track-sizes">
                    Minimum and Maxmum Grid Track Sizes
                  </a>
                </li>
                <li>
                  <a href="#repeating-grid-tracks">Repeating Grid Tracks</a>
                </li>
                <li>
                  <a href="#grid-gaps">Grid Gaps (Gutters)</a>
                </li>
                <li>
                  <a href="#positioning-items-grid-line-numbers">
                    Positioning Items by Grid Line Numbers
                  </a>
                </li>
                <li>
                  <a href="#spanning-items">
                    Spanning Items Across Rows and Columns
                  </a>
                </li>
                <li>
                  <a href="#naming-grid-lines">Naming Grid Lines</a>
                </li>
                <li>
                  <a href="#positioning-items-line-names">
                    Positioning Items by Line Names
                  </a>
                </li>
                <li>
                  <a href="#naming-positioning-lines-same-name">
                    Naming and Positioning Items by Lines with the Same Name
                  </a>
                </li>
                <li>
                  <a href="#naming-positioning-items-grid-areas">
                    Naming and Positioning Items by Grid Areas
                  </a>
                </li>
                <li>
                  <a href="#implicit-grid">Implicit Grid</a>
                </li>
                <li>
                  <a href="#implicitly-named-grid-areas">
                    Implicitly Named Grid Areas
                  </a>
                </li>
                <li>
                  <a href="#implicitly-named-grid-lines">
                    Implicitly Named Grid Lines
                  </a>
                </li>
                <li>
                  <a href="#layering-grid-items">Layering Grid Items</a>
                </li>
                <li>
                  <a href="#aligning-grid-items">
                    Aligning Grid Items (Box Alignment)
                  </a>
                </li>
                <li>
                  <a href="#aligning-grid-tracks">Aligning Grid Tracks</a>
                </li>
              </ol>
            </header>
          </section>
          <section id="grid-container" className="section">
            <header className="ex__header">
              <h2>Grid Container</h2>
              <p>
                Create a grid container by setting the
                <code>display</code> property with a value of <code>grid</code>{" "}
                or
                <code>inline-grid</code>. All direct children of grid containers
                become grid items.
              </p>
            </header>
            <div className="ex">
              <section className="ex__section">
                <div className="mb--1.5">
                  <code className="ex-propval">display: grid</code>
                </div>
                <p>
                  Grid items are placed in rows by default and span the full
                  width of the grid container.
                </p>
              </section>
              <aside className="ex__aside">
                <div className="vp">
                  <div className="vp__example">
                    <div className="vp-item">1</div>
                    <div className="vp-item">2</div>
                    <div className="vp-item">3</div>
                  </div>
                </div>
              </aside>
            </div>
            <div className="ex">
              <section className="ex__section">
                <div className="mb--1.5">
                  <code className="ex-propval">display: inline-grid</code>
                </div>
              </section>
              <aside className="ex__aside">
                <div className="vp" style={{ display: "inline-block" }}>
                  <div className="vp__example d--ig --d-g">
                    <div className="vp-item">1</div>
                    <div className="vp-item">2nd is the best</div>
                    <div className="vp-item">3</div>
                  </div>
                </div>
              </aside>
            </div>
          </section>
          <section id="explicit-grid" className="section">
            <header className="ex__header">
              <h2>Explicit Grid</h2>
              <p>
                Explicitly set a grid by creating columns and rows with the
                <code>grid-template-columns</code> and
                <code>grid-template-rows</code> properties.
              </p>
            </header>
            <div className="ex">
              <section className="ex__section">
                <div className="mb--1.5">
                  <pre>
                    <code className="ex-propval">
                      grid-template-rows: 50px 100px
                    </code>
                  </pre>
                </div>
                <p>
                  A row track is created for each value specified for
                  <code>grid-template-rows</code>. Track size values can be any
                  non-negative, length value (<code>px</code>, <code>%</code>,
                  <code>em</code>, etc.)
                </p>
                <p>
                  Items 1 and 2 have fixed heights of <code>50px</code> and
                  <code>100px</code>.
                </p>
                <p>
                  Because only 2 row tracks were defined, heights of items 3 and
                  4 are defined by the contents of each.
                </p>
              </section>
              <aside className="ex__aside">
                <div className="vp">
                  <div className="vp__example --gtr-px">
                    <div className="vp-item">1</div>
                    <div className="vp-item">2</div>
                    <div className="vp-item">3</div>
                    <div className="vp-item">4</div>
                  </div>
                </div>
              </aside>
            </div>
            <div className="ex">
              <section className="ex__section">
                <div className="mb--1.5">
                  <pre>
                    <code className="ex-propval">
                      grid-template-columns: 90px 50px 120px
                    </code>
                  </pre>
                </div>
                <p>
                  Like rows, a column track is created for each value specified
                  for <code>grid-template-columns</code>.
                </p>
                <p>
                  Items 4, 5 and 6 were placed on a new row track because only 3
                  column track sizes were defined; and because they were placed
                  in column tracks 1, 2 and 3, their column sizes are equal to
                  items 1, 2 and 3.
                </p>
                <p>
                  Grid items 1, 2 and 3 have fixed widths of <code>90px</code>,
                  <code>50px</code> and <code>120px</code> respectively.
                </p>
              </section>
              <aside className="ex__aside">
                <div className="vp">
                  <div className="vp__example --gtc-px">
                    <div className="vp-item">1</div>
                    <div className="vp-item">2</div>
                    <div className="vp-item">3</div>
                    <div className="vp-item">4</div>
                    <div className="vp-item">5</div>
                    <div className="vp-item">6</div>
                  </div>
                </div>
              </aside>
            </div>
            <div className="ex">
              <section className="ex__section">
                <div className="mb--1.5">
                  <pre>
                    <code className="ex-propval">
                      grid-template-columns: 1fr 1fr 2fr
                    </code>
                  </pre>
                </div>
                <p>
                  The <code>fr</code> unit helps create flexible grid tracks. It
                  represents a fraction of the available space in the grid
                  container (works like Flexbox’s unitless values).
                </p>
                <p>
                  In this example, items 1 and 2 take up the first two (of four)
                  sections while item 3 takes up the last two.
                </p>
              </section>
              <aside className="ex__aside">
                <div className="vp">
                  <div className="vp__example --gtc-fr">
                    <div className="vp-item">1</div>
                    <div className="vp-item">2</div>
                    <div className="vp-item">3</div>
                  </div>
                </div>
              </aside>
            </div>
            <div className="ex">
              <section className="ex__section">
                <div className="mb--1.5">
                  <pre>
                    <code className="ex-propval">
                      grid-template-columns: 3rem 25% 1fr 2fr
                    </code>
                  </pre>
                </div>
                <p>
                  <code>fr</code> is calculated based on the remaining space
                  when combined with other length values.
                </p>
                <p>
                  In this example, <code>3rem</code> and <code>25%</code> would
                  be subtracted from the available space before the size of
                  <code>fr</code> is calculated:
                  <br />
                  <code>
                    1fr = ((width of grid) - (3rem) - (25% of width of grid)) /
                    3
                  </code>
                </p>
              </section>
              <aside className="ex__aside">
                <div className="vp">
                  <div className="vp__example --gtc-mix">
                    <div className="vp-item">1</div>
                    <div className="vp-item">2</div>
                    <div className="vp-item">3</div>
                    <div className="vp-item">4</div>
                  </div>
                </div>
              </aside>
            </div>
          </section>
          <section id="minimum-maximum-grid-track-sizes" className="section">
            <header className="ex__header">
              <h2>Minimum and Maximum Grid Track Sizes</h2>
              <p>
                Tracks sizes can be defined to have a minimum and/or maximum
                size with the <code>minmax()</code> function.
              </p>
            </header>
            <div className="ex">
              <section className="ex__section">
                <div className="mb--1.5">
                  <pre>
                    <code className="ex-propval">
                      grid-template-rows:{"    "}minmax(100px, auto);
                    </code>
                    {"\n"}
                    <code className="ex-propval">
                      grid-template-columns: minmax(auto, 50%) 1fr 3em;
                    </code>
                  </pre>
                </div>
                <p>
                  The <code>minmax()</code> function accepts 2 arguments: the
                  first is the minimum size of the track and the second the
                  maximum size. Alongside length values, the values can also be
                  <code>auto</code>, which allows the track to grow/stretch
                  based on the size of the content.
                </p>
                <p>
                  In this example, the first row track is set to have a minimum
                  height of <code>100px</code>, but its maximum size of
                  <code>auto</code> will allow the row track to grow it the
                  content is taller than <code>100px</code>.
                </p>
                <p>
                  The first column track has a minimum size of <code>auto</code>
                  , but its maximum size of <code>50%</code> will prevent it
                  from getting no wider than <code>50%</code> of the grid
                  container width.
                </p>
              </section>
              <aside className="ex__aside">
                <div className="vp">
                  <div className="vp__example --gtrcmm">
                    <div className="vp-item">1</div>
                    <div className="vp-item">2</div>
                    <div className="vp-item">3</div>
                    <div className="vp-item">
                      4. This item has more content than the others and is
                      intentionally, unnecessarily, superfluously, uselessly,
                      and annoyingly verbose for the sake of example. This item
                      has more content than the others and is intentionally,
                      unnecessarily, superfluously, uselessly, and annoyingly
                      verbose for the sake of example. This item has more
                      content than the others and is intentionally,
                      unnecessarily, superfluously, uselessly, and annoyingly
                      verbose for the sake of example.
                    </div>
                    <div className="vp-item">5</div>
                    <div className="vp-item">6</div>
                  </div>
                </div>
              </aside>
            </div>
          </section>
        </div>
        <section id="repeating-grid-tracks" className="section">
          <header className="ex__header">
            <h2>Repeating Grid Tracks</h2>
            <p>
              Define repeating grid tracks using the
              <code>repeat()</code> notation. This is useful for grids with
              items with equal sizes or many items.
            </p>
          </header>
          <div className="ex">
            <section className="ex__section">
              <div className="mb--1.5">
                <pre>
                  <code className="ex-propval">
                    grid-template-rows:{"    "}repeat(4, 100px);
                  </code>
                  {"\n"}
                  <code className="ex-propval">
                    grid-template-columns: repeat(3, 1fr);
                  </code>
                </pre>
              </div>
              <p>
                The <code>repeat()</code> notation accepts 2 arguments: the
                first represents the number of times the defined tracks should
                repeat, and the second is the track definition.
              </p>
            </section>
            <aside className="ex__aside">
              <div className="vp">
                <div className="vp__example --gtrcr">
                  <div className="vp-item">1</div>
                  <div className="vp-item">2</div>
                  <div className="vp-item">3</div>
                  <div className="vp-item">4</div>
                  <div className="vp-item">5</div>
                  <div className="vp-item">6</div>
                  <div className="vp-item">7</div>
                  <div className="vp-item">8</div>
                  <div className="vp-item">9</div>
                  <div className="vp-item">10</div>
                  <div className="vp-item">11</div>
                  <div className="vp-item">12</div>
                </div>
              </div>
            </aside>
          </div>
          <div className="ex">
            <section className="ex__section">
              <div className="mb--1.5">
                <pre>
                  <code className="ex-propval">
                    grid-template-columns: 30px repeat(3, 1fr) 30px
                  </code>
                </pre>
              </div>
              <p>
                <code>repeat()</code> can also be used within track listings.
              </p>
              <p>
                In this example, the first and last column tracks have widths of
                <code>30px</code>, and the 3 column tracks in between, created
                by
                <code>repeat()</code>, have widths of <code>1fr</code> each.
              </p>
            </section>
            <aside className="ex__aside">
              <div className="vp">
                <div className="vp__example --gtrcr2">
                  <div className="vp-item">1</div>
                  <div className="vp-item">2</div>
                  <div className="vp-item">3</div>
                  <div className="vp-item">4</div>
                  <div className="vp-item">5</div>
                  <div className="vp-item">6</div>
                  <div className="vp-item">7</div>
                  <div className="vp-item">8</div>
                  <div className="vp-item">9</div>
                  <div className="vp-item">10</div>
                </div>
              </div>
            </aside>
          </div>
        </section>
        <section id="grid-gaps" className="section">
          <header className="ex__header">
            <h2>Grid Gaps (Gutters)</h2>
            <p>
              The <code>grid-column-gap</code> and
              <code>grid-row-gap</code> properties create gutters between
              columns and rows.
            </p>
            <p>
              Grid gaps are only created in between columns and rows, and not
              along the edge of the grid container 🙌 .
            </p>
          </header>
          <div className="ex">
            <section className="ex__section">
              <div className="mb--1.5">
                <pre>
                  <code className="ex-propval">grid-row-gap:{"    "}20px;</code>
                  {"\n"}
                  <code className="ex-propval">grid-column-gap: 5rem;</code>
                </pre>
              </div>
              <p>
                Gap size values can be any non-negative, length value (
                <code>px</code>, <code>%</code>, <code>em</code>, etc.)
              </p>
            </section>
            <aside className="ex__aside">
              <div className="vp">
                <div className="vp__example --grcg">
                  <div className="vp-item">1</div>
                  <div className="vp-item">2</div>
                  <div className="vp-item">3</div>
                  <div className="vp-item">4</div>
                </div>
              </div>
            </aside>
          </div>
          <div className="ex">
            <section className="ex__section">
              <div className="mb--1.5">
                <code className="ex-propval">grid-gap: 100px 1em</code>
              </div>
              <p>
                <code>grid-gap</code> is shorthand for
                <code>grid-row-gap</code> and <code>grid-column-gap</code>.
              </p>
              <p>
                If two values are specified, the first represents
                <code>grid-row-gap</code> and the second
                <code>grid-column-gap</code>.
              </p>
            </section>
            <aside className="ex__aside">
              <div className="vp">
                <div className="vp__example --gg">
                  <div className="vp-item">1</div>
                  <div className="vp-item">2</div>
                  <div className="vp-item">3</div>
                  <div className="vp-item">4</div>
                </div>
              </div>
            </aside>
          </div>
          <div className="ex">
            <section className="ex__section">
              <div className="mb--1.5">
                <code className="ex-propval">grid-gap: 2rem</code>
              </div>
              <p>One value sets equal row and column gaps.</p>
            </section>
            <aside className="ex__aside">
              <div className="vp">
                <div className="vp__example --gg1">
                  <div className="vp-item">1</div>
                  <div className="vp-item">2</div>
                  <div className="vp-item">3</div>
                  <div className="vp-item">4</div>
                </div>
              </div>
            </aside>
          </div>
        </section>
        <section id="positioning-items-grid-line-numbers" className="section">
          <header className="ex__header">
            <h2>Positioning Items by Grid Line Numbers</h2>
            <p>
              Grid lines are essentially lines that represent the start of, the
              end of, or between column and row tracks.
            </p>
            <p>
              Each line, starting from the start of the track and in the
              direction of the grid, is numbered incrementally starting from 1.
            </p>
          </header>
          <div className="ex">
            <section className="ex__section">
              <div className="mb--1.5">
                <pre>
                  <code className="ex-propval">grid-row-start:{"    "}2;</code>
                  {"\n"}
                  <code className="ex-propval">grid-row-end:{"      "}3;</code>
                  {"\n"}
                  <code className="ex-propval">grid-column-start: 2;</code>
                  {"\n"}
                  <code className="ex-propval">grid-column-end:{"   "}3;</code>
                </pre>
              </div>
              <p>
                This 2-column by 3-row grid results in 3 column lines and 4 row
                lines. Item 1 was repositioned by row and column line numbers.
              </p>
              <p>
                If an item spans only one row or column,
                <code>grid-row/column-end</code> is not necessary.
              </p>
            </section>
            <aside className="ex__aside">
              <div className="vp">
                <div className="vp__example p--r --grcse">
                  <div className="vp-item bc--teal">1</div>
                  <div className="vp-item">2</div>
                  <div className="vp-item">3</div>
                  <div className="vp-item">4</div>
                  <div className="vp-item">5</div>
                  <div className="vp-item">6</div>
                  <div className="vp__lines">
                    <div className="vp-line --y l--0">
                      <span className="t--50%">1</span>
                    </div>
                    <div className="vp-line --y l--50%">
                      <span className="t--50%">2</span>
                    </div>
                    <div className="vp-line --y r--0">
                      <span className="t--50%">3</span>
                    </div>
                    <div className="vp-line --x t--0">
                      <span className="l--75%">1</span>
                    </div>
                    <div className="vp-line --x t--33%">
                      <span className="l--75%">2</span>
                    </div>
                    <div className="vp-line --x t--66%">
                      <span className="l--75%">3</span>
                    </div>
                    <div className="vp-line --x b--0">
                      <span className="l--75%">4</span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
          <div className="ex">
            <section className="ex__section">
              <div className="mb--1.5">
                <pre>
                  <code className="ex-propval">grid-row:{"    "}2;</code>
                  {"\n"}
                  <code className="ex-propval">grid-column: 3 / 4;</code>
                </pre>
              </div>
              <p>
                <code>grid-row</code> is shorthand for
                <code>grid-row-start</code> and <code>grid-row-end</code>.
              </p>
              <p>
                <code>grid-column</code> is shorthand for
                <code>grid-column-start</code> and <code>grid-column-end</code>.
              </p>
              <p>
                If one value is provided, it specifies
                <code>grid-row/column-start</code>.
              </p>
              <p>
                If two values are specified, the first value corresponds to
                <code>grid-row/column-start</code> and the second
                <code>grid-row/column-end</code>, and must be separated by a
                <span className="ws--n">
                  forward slash <code>/</code>
                </span>
                .
              </p>
            </section>
            <aside className="ex__aside">
              <div className="vp">
                <div className="vp__example p--r --grc">
                  <div className="vp-item bc--teal">1</div>
                  <div className="vp-item">2</div>
                  <div className="vp-item">3</div>
                  <div className="vp-item">4</div>
                  <div className="vp-item">5</div>
                  <div className="vp-item">6</div>
                  <div className="vp__lines">
                    <div className="vp-line --x t--0">
                      <span className="l--50%">1</span>
                    </div>
                    <div className="vp-line --x t--50%">
                      <span className="l--50%">2</span>
                    </div>
                    <div className="vp-line --x b--0">
                      <span className="l--50%">3</span>
                    </div>
                    <div className="vp-line --y l--0">
                      <span className="t--50%">1</span>
                    </div>
                    <div className="vp-line --y l--33%">
                      <span className="t--50%">2</span>
                    </div>
                    <div className="vp-line --y l--66%">
                      <span className="t--50%">3</span>
                    </div>
                    <div className="vp-line --y r--0">
                      <span className="t--50%">4</span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
          <div className="ex">
            <section className="ex__section">
              <div className="mb--1.5">
                <code className="ex-propval">grid-area: 2 / 2 / 3 / 3</code>
              </div>
              <p>
                <code>grid-area</code> is shorthand for
                <code>grid-row-start</code>, <code>grid-column-start</code>,
                <code>grid-row-end</code> and <code>grid-column-end</code>.
              </p>
              <p>
                If four values are specified, the first corresponds to
                <code>grid-row-start</code>, the second
                <code>grid-column-start</code>, the third
                <code>grid-row-end</code> and the fourth
                <code>grid-column-end</code>.
              </p>
            </section>
            <aside className="ex__aside">
              <div className="vp">
                <div className="vp__example p--r --ga">
                  <div className="vp-item bc--teal">1</div>
                  <div className="vp-item">2</div>
                  <div className="vp-item">3</div>
                  <div className="vp-item">4</div>
                  <div className="vp-item">5</div>
                  <div className="vp-item">6</div>
                  <div className="vp__lines">
                    <div className="vp-line --x t--0">
                      <span className="l--50%">1</span>
                    </div>
                    <div className="vp-line --x t--50%">
                      <span className="l--50%">2</span>
                    </div>
                    <div className="vp-line --x b--0">
                      <span className="l--50%">3</span>
                    </div>
                    <div className="vp-line --y l--0">
                      <span className="t--50%">1</span>
                    </div>
                    <div className="vp-line --y l--33%">
                      <span className="t--50%">2</span>
                    </div>
                    <div className="vp-line --y l--66%">
                      <span className="t--50%">3</span>
                    </div>
                    <div className="vp-line --y r--0">
                      <span className="t--50%">4</span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>
        <section id="spanning-items" className="section">
          <header className="ex__header">
            <h2>Spanning Items Across Rows and Columns</h2>
            <p>
              Grid items span only one column and row track by default, but can
              span multiple row and/or column tracks using the same properties
              to
              <a href="#positioning-items-grid-line-numbers">position them</a>.
            </p>
          </header>
          <div className="ex">
            <section className="ex__section">
              <div className="mb--1.5">
                <pre>
                  <code className="ex-propval">grid-column-start: 1;</code>
                  {"\n"}
                  <code className="ex-propval">grid-column-end:{"   "}4;</code>
                </pre>
              </div>
              <p>
                Set a grid item to span more than one column track by setting
                <code>grid-column-end</code> to a column line number that is
                more than one column away from <code>grid-column-start</code>.
              </p>
            </section>
            <aside className="ex__aside">
              <div className="vp">
                <div className="vp__example --grcspan">
                  <div className="vp-item bc--teal">1</div>
                  <div className="vp-item">2</div>
                  <div className="vp-item">3</div>
                  <div className="vp-item">4</div>
                </div>
              </div>
            </aside>
          </div>
          <div className="ex">
            <section className="ex__section">
              <div className="mb--1">
                <pre>
                  <code className="ex-propval">grid-row-start: 1;</code>
                  {"\n"}
                  <code className="ex-propval">grid-row-end:{"   "}4;</code>
                </pre>
              </div>
              <p>
                Grid items can also span across multiple row tracks by setting
                <code>grid-row-end</code> to more than one row track away.
              </p>
            </section>
            <aside className="ex__aside">
              <div className="vp">
                <div className="vp__example --grcspan2">
                  <div className="vp-item bc--teal">1</div>
                  <div className="vp-item">2</div>
                  <div className="vp-item">3</div>
                  <div className="vp-item">4</div>
                  <div className="vp-item">5</div>
                  <div className="vp-item">6</div>
                  <div className="vp-item">7</div>
                </div>
              </div>
            </aside>
          </div>
          <div className="ex">
            <section className="ex__section">
              <div className="mb--1.5">
                <pre>
                  <code className="ex-propval">grid-row:{"    "}2 / 5;</code>
                  {"\n"}
                  <code className="ex-propval">grid-column: 2 / 4;</code>
                </pre>
              </div>
              <p>
                Shorthand properties <code>grid-row</code> and
                <code>grid-column</code> can also be used to position and span
                grid items more than one row or column.
              </p>
            </section>
            <aside className="ex__aside">
              <div className="vp">
                <div className="vp__example --grcspan3">
                  <div className="vp-item bc--teal">1</div>
                  <div className="vp-item">2</div>
                  <div className="vp-item">3</div>
                  <div className="vp-item">4</div>
                  <div className="vp-item">5</div>
                  <div className="vp-item">6</div>
                  <div className="vp-item">7</div>
                </div>
              </div>
            </aside>
          </div>
          <div className="ex">
            <section className="ex__section">
              <div className="mb--1.5">
                <pre>
                  <code className="ex-propval">
                    grid-row:{"    "}2 / span 3;
                  </code>
                  {"\n"}
                  <code className="ex-propval">grid-column: span 2;</code>
                </pre>
              </div>
              <p>
                The keyword <code>span</code>, followed by the # of columns or
                rows to span, can also be used.
              </p>
            </section>
            <aside className="ex__aside">
              <div className="vp">
                <div className="vp__example --grcspan4">
                  <div className="vp-item bc--teal">1</div>
                  <div className="vp-item">2</div>
                  <div className="vp-item">3</div>
                  <div className="vp-item">4</div>
                  <div className="vp-item">5</div>
                  <div className="vp-item">6</div>
                  <div className="vp-item">7</div>
                </div>
              </div>
            </aside>
          </div>
        </section>
        <section id="naming-grid-lines" className="section">
          <header className="ex__header">
            <h2>Naming Grid Lines</h2>
            <p>
              Grid lines can be named when defining the grid with the
              <code>grid-template-rows</code> and
              <code>grid-template-columns</code> properties. Line names can then
              be referenced to position grid items.
            </p>
          </header>
          <div className="ex">
            <section className="ex__section">
              <div className="mb--1.5">
                <pre>
                  <code className="ex-propval">
                    grid-template-rows:{"    "}[row-1-start] 1fr [row-2-start]
                    1fr [row-2-end];
                  </code>
                  {"\n"}
                  <code className="ex-propval">
                    grid-template-columns: [col-1-start] 1fr [col-2-start] 1fr
                    [col-3-start] 1fr [col-3-end];
                  </code>
                </pre>
              </div>
              <p>
                Assign names to grid lines when defining your grid with the
                <code>grid-template-rows</code> and
                <code>grid-template-columns</code> properties.
              </p>
              <p>
                In line names, avoid keywords that appear in the specification
                (e.g. <code>span</code>) to not cause confusion.
              </p>
              <p>
                Assigned line names must be wrapped in square brackets
                <code>[name-of-line]</code> and placed relative to the grid
                tracks.
              </p>
            </section>
            <aside className="ex__aside">
              <div className="vp">
                <div className="vp__example p--r --grc-line-name">
                  <div className="vp-item">1</div>
                  <div className="vp-item">2</div>
                  <div className="vp-item">3</div>
                  <div className="vp-item">4</div>
                  <div className="vp-item">5</div>
                  <div className="vp-item">6</div>
                  <div className="vp__lines">
                    <div className="vp-line --x t--0">
                      <span className="l--50%">row-1-start</span>
                    </div>
                    <div className="vp-line --x t--50%">
                      <span className="l--50%">row-2-start</span>
                    </div>
                    <div className="vp-line --x b--0">
                      <span className="l--50%">row-2-end</span>
                    </div>
                    <div className="vp-line --y l--0">
                      <span className="t--25% --wide">
                        col-1-
                        <wbr />
                        start
                      </span>
                    </div>
                    <div className="vp-line --y l--33%">
                      <span className="t--25% --wide">
                        col-2-
                        <wbr />
                        start
                      </span>
                    </div>
                    <div className="vp-line --y l--66%">
                      <span className="t--25% --wide">
                        col-3-
                        <wbr />
                        start
                      </span>
                    </div>
                    <div className="vp-line --y r--0">
                      <span className="t--25% --wide">
                        col-3-
                        <wbr />
                        end
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
          <div className="ex">
            <section className="ex__section">
              <div className="mb--1.5">
                <pre>
                  <code className="ex-propval">
                    grid-template-rows:{"    "}[row-start row-1-start] 1fr
                    [row-1-end row-2-start] 1fr [row-2-end row-end];
                  </code>
                  {"\n"}
                  <code className="ex-propval">
                    grid-template-columns: [col-start] 1fr [col-2-start] 1fr
                    [col-3-start] 1fr [col-end];
                  </code>
                </pre>
              </div>
              <p>
                Multiple names can be assigned to grid lines by adding names
                within square brackets and separating each with a whitespace.
              </p>
              <p>
                Each line name can then be referenced when
                <a href="#positioning-items-line-names">
                  positioning grid items by line names
                </a>
                .
              </p>
            </section>
            <aside className="ex__aside">
              <div className="vp">
                <div className="vp__example p--r --grc-line-names">
                  <div className="vp-item">1</div>
                  <div className="vp-item">2</div>
                  <div className="vp-item">3</div>
                  <div className="vp-item">4</div>
                  <div className="vp-item">5</div>
                  <div className="vp-item">6</div>
                  <div className="vp__lines">
                    <div className="vp-line --x t--0">
                      <span className="l--50%">
                        row-start
                        <br />
                        row-1-start
                      </span>
                    </div>
                    <div className="vp-line --x t--50%">
                      <span className="l--50%">
                        row-1-end
                        <br />
                        row-2-start
                      </span>
                    </div>
                    <div className="vp-line --x b--0">
                      <span className="l--50%">
                        row-2-end
                        <br />
                        row-end
                      </span>
                    </div>
                    <div className="vp-line --y l--0">
                      <span className="t--25% --wide">
                        col-
                        <wbr />
                        start
                      </span>
                    </div>
                    <div className="vp-line --y l--33%">
                      <span className="t--25% --wide">
                        col-2-
                        <wbr />
                        start
                      </span>
                    </div>
                    <div className="vp-line --y l--66%">
                      <span className="t--25% --wide">
                        col-3-
                        <wbr />
                        start
                      </span>
                    </div>
                    <div className="vp-line --y r--0">
                      <span className="t--25% --wide">
                        col-
                        <wbr />
                        end
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>
        <section id="positioning-items-line-names" className="section">
          <header className="ex__header">
            <h2>Positioning Items by Line Names</h2>
            <p>
              With named grid lines, items can be positioned by line names and
              numbers.
            </p>
          </header>
          <div className="ex">
            <section className="ex__section">
              <div className="mb--1.5">
                <pre>
                  <code className="ex-propval">
                    grid-row-start:{"    "}row-2-start;
                  </code>
                  {"\n"}
                  <code className="ex-propval">
                    grid-row-end:{"      "}row-end;
                  </code>
                  {"\n"}
                  <code className="ex-propval">
                    grid-column-start: col-2-start;
                  </code>
                  {"\n"}
                  <code className="ex-propval">
                    grid-column-end:{"   "}col-end;
                  </code>
                </pre>
              </div>
              <p>
                Referenced line names should not be wrapped in square brackets.
              </p>
            </section>
            <aside className="ex__aside">
              <div className="vp">
                <div className="vp__example p--r --grc-line-name --grc-line-name--position">
                  <div className="vp-item bc--teal">
                    <span
                      className="bc--teal p--0.25 p--r"
                      style={{ zIndex: 1 }}
                    >
                      1
                    </span>
                  </div>
                  <div className="vp-item">2</div>
                  <div className="vp-item">3</div>
                  <div className="vp-item">4</div>
                  <div className="vp__lines">
                    <div className="vp-line --x t--0">
                      <span className="l--50%">row-start</span>
                    </div>
                    <div className="vp-line --x t--50%">
                      <span className="l--50%">row-2-start</span>
                    </div>
                    <div className="vp-line --x b--0">
                      <span className="l--50%">row-end</span>
                    </div>
                    <div className="vp-line --y l--0">
                      <span className="t--25% --wide">
                        col-
                        <wbr />
                        start
                      </span>
                    </div>
                    <div className="vp-line --y l--33%">
                      <span className="t--25% --wide">
                        col-2-
                        <wbr />
                        start
                      </span>
                    </div>
                    <div className="vp-line --y l--66%">
                      <span className="t--25% --wide">
                        col-3-
                        <wbr />
                        start
                      </span>
                    </div>
                    <div className="vp-line --y r--0">
                      <span className="t--25% --wide">
                        col-
                        <wbr />
                        end
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
          <div className="ex">
            <section className="ex__section">
              <div className="mb--1.5">
                <pre>
                  <code className="ex-propval">
                    grid-row:{"    "}row-2-start / row-end;
                  </code>
                  {"\n"}
                  <code className="ex-propval">
                    grid-column: col-2-start / col-end;
                  </code>
                </pre>
              </div>
              <p>
                <code>grid-row</code> and <code>grid-column</code> shorthand
                properties also support the use of grid line names when
                positioning items.
              </p>
            </section>
            <aside className="ex__aside">
              <div className="vp">
                <div className="vp__example p--r --grc-line-name --grc-line-name--position2">
                  <div className="vp-item bc--teal">
                    <span
                      className="bc--teal p--0.25 p--r"
                      style={{ zIndex: 1 }}
                    >
                      1
                    </span>
                  </div>
                  <div className="vp-item">2</div>
                  <div className="vp-item">3</div>
                  <div className="vp-item">4</div>
                  <div className="vp__lines">
                    <div className="vp-line --x t--0">
                      <span className="l--50%">row-start</span>
                    </div>
                    <div className="vp-line --x t--50%">
                      <span className="l--50%">row-2-start</span>
                    </div>
                    <div className="vp-line --x b--0">
                      <span className="l--50%">row-end</span>
                    </div>
                    <div className="vp-line --y l--0">
                      <span className="t--25% --wide">
                        col-
                        <wbr />
                        start
                      </span>
                    </div>
                    <div className="vp-line --y l--33%">
                      <span className="t--25% --wide">
                        col-2-
                        <wbr />
                        start
                      </span>
                    </div>
                    <div className="vp-line --y l--66%">
                      <span className="t--25% --wide">
                        col-3-
                        <wbr />
                        start
                      </span>
                    </div>
                    <div className="vp-line --y r--0">
                      <span className="t--25% --wide">
                        col-
                        <wbr />
                        end
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>
        <section id="naming-positioning-lines-same-name" className="section">
          <header className="ex__header">
            <h2>
              Naming and Positioning Items by Grid Lines with the Same Name
            </h2>
            <p>
              Lines can be assigned the same name with the
              <code>repeat()</code> function. This can save you time from having
              to name each line in track definitions.
            </p>
          </header>
          <div className="ex">
            <section className="ex__section">
              <div className="mb--1 5">
                <pre>
                  <code className="ex-propval">
                    grid-template-rows: repeat(3, [row-start] 1fr [row-end]);
                  </code>
                  {"\n"}
                  <code className="ex-propval">
                    grid-template-columns: repeat(3, [col-start] 1fr [col-end]);
                  </code>
                </pre>
              </div>
              <p>
                Line name assignments can also be included within the
                <code>repeat()</code> function. This results in multiple grid
                lines with the same names.
              </p>
              <p>
                Lines with the same name are also assigned the a line’s
                position/name’s occurrence number, which allows it to be
                uniquely identified from another line with the same name.
              </p>
            </section>
            <aside className="ex__aside">
              <div className="vp">
                <div className="vp__example p--r --grc-line-name-repeat">
                  <div className="vp-item">1</div>
                  <div className="vp-item">2</div>
                  <div className="vp-item">3</div>
                  <div className="vp-item">4</div>
                  <div className="vp-item">5</div>
                  <div className="vp-item">6</div>
                  <div className="vp-item">7</div>
                  <div className="vp-item">8</div>
                  <div className="vp-item">9</div>
                  <div className="vp__lines">
                    <div className="vp-line --x t--0">
                      <span className="l--50%">row-start</span>
                    </div>
                    <div className="vp-line --x t--33%">
                      <span className="l--50%">
                        row-end
                        <br />
                        row-start 2
                      </span>
                    </div>
                    <div className="vp-line --x t--66%">
                      <span className="l--50%">
                        row-end 2<br />
                        row-start 3
                      </span>
                    </div>
                    <div className="vp-line --x b--0">
                      <span className="l--50%">row-end 3</span>
                    </div>
                    <div className="vp-line --y l--0">
                      <span style={{ top: "45%", width: "4.25rem" }}>
                        col-start
                      </span>
                    </div>
                    <div className="vp-line --y l--33%">
                      <span style={{ top: "55%", width: "4.25rem" }}>
                        col-end
                        <br />
                        col-start 2
                      </span>
                    </div>
                    <div className="vp-line --y l--66%">
                      <span style={{ top: "45%", width: "4.25rem" }}>
                        col-end 2<br />
                        col-start 3
                      </span>
                    </div>
                    <div className="vp-line --y r--0">
                      <span style={{ top: "55%", width: "4.25rem" }}>
                        col-end 3
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
          <div className="ex">
            <section className="ex__section">
              <div className="mb--1.5">
                <pre>
                  <code className="ex-propval">
                    grid-row:{"    "}row-start 2 / row-end 3;
                  </code>
                  {"\n"}
                  <code className="ex-propval">
                    grid-column: col-start / col-start 3;
                  </code>
                </pre>
              </div>
              <p>
                To position items by lines with the same name, reference the
                line’s name and position/name’s occurrence number—the name and
                number should be separated by a whitespace.
              </p>
              <p>
                In this example, item 1’s row position starts at the 2nd grid
                line named <code>row-start</code> and ends at the 3rd grid line
                named
                <code>row-end</code>; and its column position starts at the 1st
                grid line named <code>col-start</code> and ends at the 3rd grid
                line named <code>col-start</code>.
              </p>
            </section>
            <aside className="ex__aside">
              <div className="vp">
                <div className="vp__example p--r --grc-line-name-repeat --grc-line-name-repeat--position">
                  <div className="vp-item bc--teal">
                    <span
                      className="bc--teal p--0.25 p--r"
                      style={{ zIndex: 1 }}
                    >
                      1
                    </span>
                  </div>
                  <div className="vp-item">2</div>
                  <div className="vp-item">3</div>
                  <div className="vp-item">4</div>
                  <div className="vp-item">5</div>
                  <div className="vp-item">6</div>
                  <div className="vp__lines">
                    <div className="vp-line --x t--0">
                      <span className="l--50%">row-start</span>
                    </div>
                    <div className="vp-line --x t--33%">
                      <span className="l--50%">
                        row-end
                        <br />
                        row-start 2
                      </span>
                    </div>
                    <div className="vp-line --x t--66%">
                      <span className="l--50%">
                        row-end 2<br />
                        row-start 3
                      </span>
                    </div>
                    <div className="vp-line --x b--0">
                      <span className="l--50%">row-end 3</span>
                    </div>
                    <div className="vp-line --y l--0">
                      <span style={{ top: "45%", width: "4.25rem" }}>
                        col-start
                      </span>
                    </div>
                    <div className="vp-line --y l--33%">
                      <span style={{ top: "55%", width: "4.25rem" }}>
                        col-end
                        <br />
                        col-start 2
                      </span>
                    </div>
                    <div className="vp-line --y l--66%">
                      <span style={{ top: "45%", width: "4.25rem" }}>
                        col-end 2<br />
                        col-start 3
                      </span>
                    </div>
                    <div className="vp-line --y r--0">
                      <span style={{ top: "55%", width: "4.25rem" }}>
                        col-end 3
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>
        <section id="naming-positioning-items-grid-areas" className="section">
          <header className="ex__header">
            <h2>Naming and Positioning Items by Grid Areas</h2>
            <p>
              Like grid line names, grid areas can also be named with the
              <code>grid-template-areas</code> property. Names can then be
              referenced to position grid items.
            </p>
          </header>
          <div className="ex">
            <section className="ex__section">
              <div className="mb--1.5">
                <pre>
                  <code className="ex-propval">
                    grid-template-areas:{"   "}&quot;header header&quot;{"\n"}
                    {"                        "}&quot;content sidebar&quot;
                    {"\n"}
                    {"                        "}&quot;footer footer&quot;;
                  </code>
                  {"\n"}
                  <code className="ex-propval">
                    grid-template-rows:{"    "}150px 1fr 100px;
                  </code>
                  {"\n"}
                  <code className="ex-propval">
                    grid-template-columns: 1fr 200px;
                  </code>
                </pre>
              </div>
              <p>
                Sets of names should be surrounded in single or double quotes,
                and each name separated by a whitespace.
              </p>
              <p>
                Each set of names defines a row, and each name defines a column.
              </p>
            </section>
            <aside className="ex__aside">
              <div className="vp">
                <div className="vp__example --gta">
                  <div className="vp-item bc--teal o--0">header</div>
                  <div className="vp-item o--0">content</div>
                  <div className="vp-item bc--deep-orange o--0">sidebar</div>
                  <div className="vp-item bc--purple o--0">footer</div>
                  <div className="vp__lines">
                    <div className="vp-area">
                      <span>header</span>
                    </div>
                    <div className="vp-area vp-area--pink">
                      <span>content</span>
                    </div>
                    <div className="vp-area vp-area--orange">
                      <span>sidebar</span>
                    </div>
                    <div className="vp-area vp-area--purple">
                      <span>footer</span>
                    </div>
                    <div className="vp-line --x t--0 o--0.25" />
                    <div
                      className="vp-line --x l--0 o--0.25"
                      style={{ top: 149 }}
                    />
                    <div className="vp-line --x l--0 b--0 o--0.25" />
                    <div className="vp-line --y t--0 l--0 o--0.25" />
                    <div
                      className="vp-line --y t--0 o--0.25"
                      style={{ right: 99 }}
                    />
                    <div className="vp-line --y t--0 r--0 o--0.25" />
                  </div>
                </div>
              </div>
            </aside>
          </div>
          <div className="ex">
            <section className="ex__section">
              <div className="mb--1.5">
                <pre>
                  <code className="ex-propval">
                    grid-row-start:{"    "}header;
                  </code>
                  {"\n"}
                  <code className="ex-propval">
                    grid-row-end:{"      "}header;
                  </code>
                  {"\n"}
                  <code className="ex-propval">grid-column-start: header;</code>
                  {"\n"}
                  <code className="ex-propval">
                    grid-column-end:{"   "}header;
                  </code>
                </pre>
              </div>
              <p>
                Grid area names can be referenced by the same properties to
                position grid items: <code>grid-row-start</code>,
                <code>grid-row-end</code>, <code>grid-column-start</code>, and
                <code>grid-column-end</code>.
              </p>
            </section>
            <aside className="ex__aside">
              <div className="vp" style={{ minHeight: "17.4rem" }}>
                <div className="vp__example --gta">
                  <header className="vp-item bc--teal">header</header>
                </div>
              </div>
            </aside>
          </div>
          <div className="ex">
            <section className="ex__section">
              <div className="mb--1.5">
                <pre>
                  <code className="ex-propval">grid-row:{"    "}footer;</code>
                  {"\n"}
                  <code className="ex-propval">grid-column: footer;</code>
                </pre>
              </div>
              <p>
                The <code>grid-row</code> and <code>grid-column</code> shorthand
                properties can also reference grid area names.
              </p>
            </section>
            <aside className="ex__aside">
              <div className="vp" style={{ minHeight: "17.4rem" }}>
                <div className="vp__example --gta">
                  <header className="vp-item bc--teal">header</header>
                  <main className="vp-item">content</main>
                  <footer className="vp-item bc--purple">footer</footer>
                </div>
              </div>
            </aside>
          </div>
          <div className="ex">
            <section className="ex__section">
              <div className="mb--1.5">
                <pre>
                  <code className="ex-propval">grid-area: sidebar;</code>
                </pre>
              </div>
              <p>
                The <code>grid-area</code> shorthand property can also be used
                to reference grid area names.
              </p>
            </section>
            <aside className="ex__aside">
              <div className="vp" style={{ minHeight: "17.4rem" }}>
                <div className="vp__example --gta">
                  <header className="vp-item bc--teal">header</header>
                  <main className="vp-item">content</main>
                  <aside className="vp-item bc--deep-orange">sidebar</aside>
                  <footer className="vp-item bc--purple">footer</footer>
                </div>
              </div>
            </aside>
          </div>
        </section>
        <section id="implicit-grid" className="section">
          <header className="ex__header">
            <h2>Implicit Grid</h2>
            <p>
              An implicit grid is created when a grid needs to position items
              outside of the explicit grid because there isn’t enough space for
              items in the explicitly defined tracks or you decide to position
              something outside of the explicit grid. Those items are then
              auto-placed in the implicit grid.
            </p>
            <p>
              The implicit grid can be defined using the
              <code>grid-auto-rows</code>, <code>grid-auto-columns</code>, and
              <code>grid-auto-flow</code> properties.
            </p>
          </header>
          <div className="ex">
            <section className="ex__section">
              <div className="mb--1 5">
                <pre>
                  <code className="ex-propval">
                    grid-template-rows:{"    "}70px;
                  </code>
                  {"\n"}
                  <code className="ex-propval">
                    grid-template-columns: repeat(2, 1fr);
                  </code>
                  {"\n"}
                  <code className="ex-propval">
                    grid-auto-rows:{"        "}140px;
                  </code>
                </pre>
              </div>
              <p>
                In this example we’ve only defined one row track, therefore grid
                items 1 and 2 are <code>70px</code> tall.
              </p>
              <p>
                A second row track was auto-created to make room for items 3 and
                4. <code>grid-auto-rows</code> defines the row track sizes in
                the implicit grid, which is reflected by the the
                <code>140px</code> heights of items 3 and 4.
              </p>
            </section>
            <aside className="ex__aside">
              <div className="vp">
                <div className="vp__example p--r --gi">
                  <div className="vp-item">1</div>
                  <div className="vp-item">2</div>
                  <div className="vp-item bc--teal">3</div>
                  <div className="vp-item bc--teal">4</div>
                </div>
              </div>
            </aside>
          </div>
          <div className="ex">
            <section className="ex__section">
              <div className="mb--1 5">
                <pre>
                  <code className="ex-propval">grid-auto-flow: row</code>
                </pre>
              </div>
              <p>
                The default flow (direction) of a grid is <code>row</code>.
              </p>
            </section>
            <aside className="ex__aside">
              <div className="vp">
                <div className="vp__example p--r --gafr">
                  <div className="vp-item">1</div>
                  <div className="vp-item">2</div>
                  <div className="vp-item">3</div>
                  <div className="vp-item">4</div>
                  <div className="vp-item">5</div>
                </div>
              </div>
            </aside>
          </div>
          <div className="ex">
            <section className="ex__section">
              <div className="mb--1 5">
                <pre>
                  <code className="ex-propval">grid-auto-flow: column</code>
                </pre>
              </div>
              <p>
                A grid’s flow can be changed to <code>column</code>.
              </p>
            </section>
            <aside className="ex__aside">
              <div className="vp">
                <div className="vp__example p--r --gafc">
                  <div className="vp-item">1</div>
                  <div className="vp-item">2</div>
                  <div className="vp-item">3</div>
                  <div className="vp-item">4</div>
                  <div className="vp-item">5</div>
                </div>
              </div>
            </aside>
          </div>
          <div className="ex">
            <section className="ex__section">
              <div className="mb--1 5">
                <pre>
                  <code className="ex-propval">
                    grid-template-columns: 30px 60px;
                  </code>
                  {"\n"}
                  <code className="ex-propval">
                    grid-auto-flow:{"        "}column;
                  </code>
                  {"\n"}
                  <code className="ex-propval">
                    grid-auto-columns:{"     "}1fr;
                  </code>
                </pre>
              </div>
              <p>
                In this example, we’ve only defined the sizes of the first two
                column tracks—item 1 is <code>30px</code> wide and item 2,
                <code>60px</code>.
              </p>
              <p>
                Column tracks are auto-created in the implicit grid to make room
                for items 3, 4 and 5; and track sizes are defined by
                <code>grid-auto-columns</code>.
              </p>
            </section>
            <aside className="ex__aside">
              <div className="vp">
                <div className="vp__example p--r --gafci">
                  <div className="vp-item">1</div>
                  <div className="vp-item">2</div>
                  <div className="vp-item bc--teal">3</div>
                  <div className="vp-item bc--teal">4</div>
                  <div className="vp-item bc--teal">5</div>
                </div>
              </div>
            </aside>
          </div>
        </section>
        <section id="implicitly-named-grid-areas" className="section">
          <header className="ex__header">
            <h2>Implicitly Named Grid Areas</h2>
            <p>
              Grid lines can generally be named whatever you’d like, but
              assigning names ending in <code>-start</code> and{" "}
              <code>-end comes</code> with added benefits—they implicitly create
              named grid areas, which can be referenced for positioning.
            </p>
          </header>
          <div className="ex">
            <section className="ex__section">
              <div className="mb--1.5">
                <pre>
                  <code className="ex-propval">
                    grid-template-rows:{"    "}[outer-start] 1fr [inner-start]
                    1fr [inner-end] 1fr [outer-end];
                  </code>
                  {"\n"}
                  <code className="ex-propval">
                    grid-template-columns: [outer-start] 1fr [inner-start] 1fr
                    [inner-end] 1fr [outer-end];
                  </code>
                </pre>
              </div>
              <p>
                In this example, both rows and columns have
                <code>inner-start</code> and <code>inner-end</code> lines, which
                implicitly assigns the grid area’s name as <code>inner</code>.
              </p>
              <div className="my--1.5">
                <code className="ex-propval">grid-area: inner</code>
              </div>
              <p>
                Grid items can then be positioned by the grid area name as
                opposed to line names.
              </p>
            </section>
            <aside className="ex__aside">
              <div className="vp">
                <div className="vp__example p--r --grc-line-name-implicit-area">
                  <div className="vp-item" />
                  <div className="vp-item" />
                  <div className="vp-item" />
                  <div className="vp-item" />
                  <div className="vp-item bc--teal">inner</div>
                  <div className="vp-item" />
                  <div className="vp-item" />
                  <div className="vp-item" />
                  <div className="vp-item" />
                  <div className="vp__lines">
                    <div className="vp-line --x t--0">
                      <span className="l--50%">outer-start</span>
                    </div>
                    <div className="vp-line --x t--33%">
                      <span className="l--50%">inner-start</span>
                    </div>
                    <div className="vp-line --x t--66%">
                      <span className="l--50%">inner-end</span>
                    </div>
                    <div className="vp-line --x b--0">
                      <span className="l--50%">outer-end</span>
                    </div>
                    <div className="vp-line --y l--0">
                      <span className="t--50% --wide">
                        outer-
                        <wbr />
                        start
                      </span>
                    </div>
                    <div className="vp-line --y l--33%">
                      <span className="t--50% --wide">
                        inner-
                        <wbr />
                        start
                      </span>
                    </div>
                    <div className="vp-line --y l--66%">
                      <span className="t--50% --wide">
                        inner-
                        <wbr />
                        end
                      </span>
                    </div>
                    <div className="vp-line --y r--0">
                      <span className="t--50% --wide">
                        outer-
                        <wbr />
                        end
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>
        <section id="implicitly-named-grid-lines" className="section">
          <header className="ex__header">
            <h2>Implicitly Named Grid Lines</h2>
            <p>
              Implicitly named grid lines work in reverse to implicitly named
              grid areas—naming grid areas implicitly assigns names to grid
              lines.
            </p>
          </header>
          <div className="ex">
            <section className="ex__section">
              <div className="mb--1.5">
                <pre>
                  <code className="ex-propval">
                    grid-template-areas:{"   "}&quot;header header&quot;{"\n"}
                    {"                        "}&quot;content sidebar&quot;
                    {"\n"}
                    {"                        "}&quot;footer footer&quot;;
                  </code>
                  {"\n"}
                  <code className="ex-propval">
                    grid-template-rows:{"    "}80px 1fr 40px;
                  </code>
                  {"\n"}
                  <code className="ex-propval">
                    grid-template-columns: 1fr 200px;
                  </code>
                </pre>
              </div>
              <p>
                Named grid areas will implicitly name the grid lines along the
                edges of the area. Those grid lines will be named based on the
                area name and suffixed with <code>-start</code> or
                <code>-end</code>.
              </p>
            </section>
            <aside className="ex__aside">
              <div className="vp">
                <div className="vp__example --gta">
                  <div className="vp__lines">
                    <div className="vp-line --y t--0 l--0">
                      <span style={{ width: 85 }}>
                        header-start
                        <br />
                        content-start
                        <br />
                        footer-start
                      </span>
                    </div>
                    <div className="vp-line --y t--0" style={{ right: 98 }}>
                      <span className="t--25% r--0" style={{ width: 83 }}>
                        content-end
                        <br />
                        sidebar-start
                      </span>
                    </div>
                    <div className="vp-line --y t--0 r--0">
                      <span className="b--0" style={{ width: 77 }}>
                        header-end
                        <br />
                        sidebar-end
                        <br />
                        footer-end
                      </span>
                    </div>
                    <div className="vp-line --x t--0">
                      <span className="l--50%">header-start</span>
                    </div>
                    <div className="vp-line --x l--0" style={{ top: 149 }}>
                      <span className="l--50%">
                        header-end
                        <br />
                        content-start
                        <br />
                        sidebar-start
                      </span>
                    </div>
                    <div className="vp-line --x l--0" style={{ top: 197 }}>
                      <span className="l--50%">
                        content-end
                        <br />
                        sidebar-end
                        <br />
                        footer-start
                      </span>
                    </div>
                    <div className="vp-line --x l--0 b--0">
                      <span className="l--50%">footer-end</span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
          <div className="ex">
            <section className="ex__section">
              <div className="mb--1.5">
                <pre>
                  <code className="ex-propval">
                    grid-row-start:{"    "}header-start;
                  </code>
                  {"\n"}
                  <code className="ex-propval">
                    grid-row-end:{"      "}content-start;
                  </code>
                  {"\n"}
                  <code className="ex-propval">
                    grid-column-start: footer-start;
                  </code>
                  {"\n"}
                  <code className="ex-propval">
                    grid-column-end:{"   "}sidebar-end;
                  </code>
                </pre>
              </div>
              <p>
                In this example, the header was positioned using the implicit
                grid line names.
              </p>
            </section>
            <aside className="ex__aside">
              <div className="vp">
                <div className="vp__example --gta">
                  <div className="vp-item bc--teal vp-item--implicit-grid-line-names">
                    header
                  </div>
                  <main className="vp-item">content</main>
                  <aside className="vp-item">sidebar</aside>
                  <footer className="vp-item">footer</footer>
                </div>
              </div>
            </aside>
          </div>
        </section>
        <section id="layering-grid-items" className="section">
          <header className="ex__header">
            <h2>Layering Grid Items</h2>
            <p>
              Grid items can be layered/stacked by properly positioning them and
              assigning <code>z-index</code> when necessary.
            </p>
          </header>
          <div className="ex">
            <section className="ex__section">
              <div className="mb--1.5">
                <pre>
                  <code className="ex-propval">.item-1,</code>
                  {"\n"}
                  <code className="ex-propval">.item-2 {"{"}</code>
                  {"\n"}
                  <code className="ex-propval">
                    {"  "}grid-row-start:{"  "}1;
                  </code>
                  {"\n"}
                  <code className="ex-propval">
                    {"  "}grid-column-end: span 2;
                  </code>
                  {"\n"}
                  <code className="ex-propval">{"}"}</code>
                  {"\n"}
                  {"\n"}
                  <code className="ex-propval">
                    .item-1 {"{"} grid-column-start: 1; z-index: 1; {"}"}
                  </code>
                  {"\n"}
                  <code className="ex-propval">
                    .item-2 {"{"} grid-column-start: 2 {"}"}
                  </code>
                </pre>
                <p>
                  In this example, items 1 and 2 are positioned to start on row
                  line 1 and set to span 2 columns.
                </p>
                <p>
                  Both items are positioned by grid line numbers. Item 1 is set
                  to start at column line 1, and item 2 at column line 2, which
                  results in both items overlapping in the center column track.
                </p>
                <p>
                  By default, item 2 would sit on top of item 1; however, we’ve
                  created
                  <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Positioning/Understanding_z_index/The_stacking_context">
                    stacking context
                  </a>
                  by assigning <code>z-index: 1</code> to item 1, resulting it
                  to sit on top of item 2.
                </p>
              </div>
            </section>
            <aside className="ex__aside">
              <div className="vp">
                <div className="vp__example --go">
                  <div className="vp-item">1</div>
                  <div className="vp-item">2</div>
                  <div className="vp-item">3</div>
                  <div className="vp-item">4</div>
                  <div className="vp-item">5</div>
                </div>
              </div>
            </aside>
          </div>
          <div className="ex">
            <section className="ex__section">
              <div className="mb--1.5">
                <pre>
                  <code className="ex-propval">
                    grid-row-start:{"    "}header-start;
                  </code>
                  {"\n"}
                  <code className="ex-propval">
                    grid-row-end:{"      "}content-end;
                  </code>
                  {"\n"}
                  <code className="ex-propval">
                    grid-column-start: content-start;
                  </code>
                  {"\n"}
                  <code className="ex-propval">
                    grid-column-end:{"   "}sidebar-start;
                  </code>
                  {"\n"}
                  <code className="ex-propval">z-index: 1;</code>
                </pre>
              </div>
              <p>
                In this example, a grid item is positioned and layered on top
                using implicit grid line names from the defined
                <code>grid-template-areas</code>.
              </p>
            </section>
            <aside className="ex__aside">
              <div className="vp">
                <div className="vp__example --gta">
                  <div className="vp-item vp-item--implicit-grid-line-names">
                    header
                  </div>
                  <main className="vp-item">content</main>
                  <aside className="vp-item">sidebar</aside>
                  <footer className="vp-item">footer</footer>
                  <div className="vp-item vp-item--overlay">overlay</div>
                </div>
              </div>
            </aside>
          </div>
        </section>
        <section id="aligning-grid-items" className="section">
          <header className="ex__header">
            <h2>Aligning Grid Items (Box Alignment)</h2>
            <p>
              CSS’s
              <a href="https://drafts.csswg.org/css-align/">
                Box Alignment Module
              </a>
              complements CSS Grid to allow items to be aligned along the row of
              column axis.
            </p>
            <p>
              <code>justify-items</code> and <code>justify-self</code> align
              items along the row axis, and <code>align-items</code> and
              <code>align-self</code> align items along the column axis.
            </p>
            <p>
              <code>justify-items</code> and <code>align-items</code> are
              applied to the grid container and support the following values:
            </p>
            <ul>
              <li>
                <code>auto</code>
              </li>
              <li>
                <code>normal</code>
              </li>
              <li>
                <code>start</code>
              </li>
              <li>
                <code>end</code>
              </li>
              <li>
                <code>center</code>
              </li>
              <li>
                <code>stretch</code>
              </li>
              <li>
                <code>baseline</code>
              </li>
              <li>
                <code>first baseline</code>
              </li>
              <li>
                <code>last baseline</code>
              </li>
            </ul>
          </header>
          <div className="ex">
            <section className="ex__section">
              <div className="mb--1.5">
                <pre>
                  <code className="ex-propval">.grid {"{"}</code>
                  {"\n"}
                  <code className="ex-propval">
                    {"  "}grid-template-rows: 80px 80px;
                  </code>
                  {"\n"}
                  <code className="ex-propval">
                    {"  "}grid-template-columns: 1fr 1fr;
                  </code>
                  {"\n"}
                  <code className="ex-propval">
                    {"  "}grid-template-areas: &quot;content content&quot;
                  </code>
                  {"\n"}
                  <code className="ex-propval">
                    {"                       "}&quot;content content&quot;;
                  </code>
                  {"\n"}
                  <code className="ex-propval">{"}"}</code>
                  {"\n"}
                  <code className="ex-propval">
                    .item {"{"} grid-area: content {"}"}
                  </code>
                  {"\n"}
                  {"\n"}
                  {"\n"}
                  <code className="ex-propval">.grid {"{"}</code>
                  {"\n"}
                  <code className="ex-propval">{"  "}justify-items: start</code>
                  {"\n"}
                  <code className="ex-propval">{"}"}</code>
                </pre>
              </div>
              <p>
                Items are positioned at the start of the row axis (row line
                number
                <code>1</code>).
              </p>
            </section>
            <aside className="ex__aside">
              <div className="vp">
                <div className="vp__example p--r --gba ji--s">
                  <div className="vp-item">1</div>
                  <div className="vp__lines">
                    <div className="vp-area">
                      <span>content</span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
          <div className="ex">
            <section className="ex__section">
              <div className="mb--1.5">
                <pre>
                  <code className="ex-propval">justify-items: center</code>
                </pre>
              </div>
              <p>Items are positioned at the center of the row axis.</p>
            </section>
            <aside className="ex__aside">
              <div className="vp">
                <div className="vp__example p--r --gba ji--c">
                  <div className="vp-item">1</div>
                  <div className="vp__lines">
                    <div className="vp-area">
                      <span>content</span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
          <div className="ex">
            <section className="ex__section">
              <div className="mb--1.5">
                <pre>
                  <code className="ex-propval">justify-items: end</code>
                </pre>
              </div>
              <p>Items are positioned at the end of the row axis.</p>
            </section>
            <aside className="ex__aside">
              <div className="vp">
                <div className="vp__example p--r --gba ji--e">
                  <div className="vp-item">1</div>
                  <div className="vp__lines">
                    <div className="vp-area">
                      <span>content</span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
          <div className="ex">
            <section className="ex__section">
              <div className="mb--1.5">
                <pre>
                  <code className="ex-propval">justify-items: stretch</code>
                </pre>
              </div>
              <p>
                Items are stretched across the entire row axis.
                <code>stretch</code> is the default value.
              </p>
            </section>
            <aside className="ex__aside">
              <div className="vp">
                <div className="vp__example p--r --gba ji--st">
                  <div className="vp-item">1</div>
                  <div className="vp__lines">
                    <div className="vp-area">
                      <span>content</span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
          <div className="ex">
            <section className="ex__section">
              <div className="mb--1.5">
                <pre>
                  <code className="ex-propval">align-items: start</code>
                </pre>
              </div>
              <p>
                Items are positioned at the start of the column axis (column
                line
                <code>1</code>).
              </p>
            </section>
            <aside className="ex__aside">
              <div className="vp">
                <div className="vp__example p--r --gba ai--s">
                  <div className="vp-item">1</div>
                  <div className="vp__lines">
                    <div className="vp-area">
                      <span>content</span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
          <div className="ex">
            <section className="ex__section">
              <div className="mb--1.5">
                <pre>
                  <code className="ex-propval">align-items: center</code>
                </pre>
              </div>
              <p>Items are positioned at the center of the column axis.</p>
            </section>
            <aside className="ex__aside">
              <div className="vp">
                <div className="vp__example p--r --gba ai--c">
                  <div className="vp-item">1</div>
                  <div className="vp__lines">
                    <div className="vp-area">
                      <span>content</span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
          <div className="ex">
            <section className="ex__section">
              <div className="mb--1.5">
                <pre>
                  <code className="ex-propval">align-items: end</code>
                </pre>
              </div>
              <p>Items are positioned at the end of the column axis.</p>
            </section>
            <aside className="ex__aside">
              <div className="vp">
                <div className="vp__example p--r --gba ai--e">
                  <div className="vp-item">1</div>
                  <div className="vp__lines">
                    <div className="vp-area">
                      <span>content</span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
          <div className="ex">
            <section className="ex__section">
              <div className="mb--1.5">
                <pre>
                  <code className="ex-propval">align-items: stretch</code>
                </pre>
              </div>
              <p>Items are stretched across the entire column axis.</p>
            </section>
            <aside className="ex__aside">
              <div className="vp">
                <div className="vp__example p--r --gba ai--st">
                  <div className="vp-item">1</div>
                  <div className="vp__lines">
                    <div className="vp-area">
                      <span>content</span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
          <div className="ex">
            <section className="ex__section">
              <div className="mb--1.5">
                <pre>
                  <code className="ex-propval">justify-items: center</code>
                  {"\n"}
                  <code className="ex-propval">align-items:{"   "}center</code>
                </pre>
              </div>
              <p>
                Items are positioned at the center of the row and column axes.
              </p>
            </section>
            <aside className="ex__aside">
              <div className="vp">
                <div className="vp__example p--r --gba ji--c ai--c">
                  <div className="vp-item">1</div>
                  <div className="vp__lines">
                    <div className="vp-area">
                      <span>content</span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
          <div className="ex__header">
            <p>
              Individual items can be self-aligned with the
              <code>align-self</code> and <code>justify-self</code> properties.
              These properties support the following valuse:
            </p>
            <ul>
              <li>
                <code>auto</code>
              </li>
              <li>
                <code>normal</code>
              </li>
              <li>
                <code>start</code>
              </li>
              <li>
                <code>end</code>
              </li>
              <li>
                <code>center</code>
              </li>
              <li>
                <code>stretch</code>
              </li>
              <li>
                <code>baseline</code>
              </li>
              <li>
                <code>first baseline</code>
              </li>
              <li>
                <code>last baseline</code>
              </li>
            </ul>
          </div>
          <div className="ex">
            <section className="ex__section">
              <div className="mb--1.5">
                <pre>
                  <code className="ex-propval">
                    .item-1 {"{"} justify-self: start {"}"}
                  </code>
                  {"\n"}
                  <code className="ex-propval">
                    .item-2 {"{"} justify-self: center {"}"}
                  </code>
                  {"\n"}
                  <code className="ex-propval">
                    .item-3 {"{"} justify-self: end {"}"}
                  </code>
                </pre>
              </div>
              <p>
                <code>justify-self</code> aligns individual items along the row
                axis.
              </p>
            </section>
            <aside className="ex__aside">
              <div className="vp">
                <div className="vp__example p--r --gba">
                  <div className="vp-item js--s">1</div>
                  <div className="vp-item js--c">2</div>
                  <div className="vp-item js--e">3</div>
                  <div className="vp__lines">
                    <div className="vp-area">
                      <span>content</span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
          <div className="ex">
            <section className="ex__section">
              <div className="mb--1.5">
                <pre>
                  <code className="ex-propval">
                    .item-1 {"{"} align-self: start {"}"}
                  </code>
                  {"\n"}
                  <code className="ex-propval">
                    .item-2 {"{"} align-self: center {"}"}
                  </code>
                  {"\n"}
                  <code className="ex-propval">
                    .item-3 {"{"} align-self: end {"}"}
                  </code>
                </pre>
              </div>
              <p>
                <code>align-self</code> aligns items along the column axis.
              </p>
            </section>
            <aside className="ex__aside">
              <div className="vp">
                <div className="vp__example p--r --gba">
                  <div className="vp-item as--s">1</div>
                  <div className="vp-item as--c">2</div>
                  <div className="vp-item as--e">3</div>
                  <div className="vp__lines">
                    <div className="vp-area">
                      <span>content</span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
          <div className="ex">
            <section className="ex__section">
              <div className="mb--1.5">
                <pre>
                  <code className="ex-propval">.item-1 {"{"}</code>
                  {"\n"}
                  <code className="ex-propval">{"  "}justify-self: center</code>
                  {"\n"}
                  <code className="ex-propval">
                    {"  "}align-self:{"   "}center
                  </code>
                  {"\n"}
                  <code className="ex-propval">{"}"}</code>
                </pre>
              </div>
              <p>
                Item 1 is positioned at the center of the row and column axes.
              </p>
            </section>
            <aside className="ex__aside">
              <div className="vp">
                <div className="vp__example p--r --gba">
                  <div className="vp-item as--c js--c">1</div>
                  <div className="vp__lines">
                    <div className="vp-area">
                      <span>content</span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>
        <section id="aligning-grid-tracks" className="section">
          <header className="ex__header">
            <h2>Aligning Grid Tracks</h2>
            <p>
              Grid tracks can be aligned relative to the grid container along
              the row and column axes.
            </p>
            <p>
              <code>align-content</code> aligns tracks along the row axis and
              <code>justify-content</code> along the column axis. They support
              the following properties:
            </p>
            <ul>
              <li>
                <code>normal</code>
              </li>
              <li>
                <code>start</code>
              </li>
              <li>
                <code>end</code>
              </li>
              <li>
                <code>center</code>
              </li>
              <li>
                <code>stretch</code>
              </li>
              <li>
                <code>space-around</code>
              </li>
              <li>
                <code>space-between</code>
              </li>
              <li>
                <code>space-evenly</code>
              </li>
              <li>
                <code>baseline</code>
              </li>
              <li>
                <code>first baseline</code>
              </li>
              <li>
                <code>last baseline</code>
              </li>
            </ul>
          </header>
          <div className="ex">
            <section className="ex__section">
              <div className="mb--1.5">
                <pre>
                  <code className="ex-propval">.grid {"{"}</code>
                  {"\n"}
                  <code className="ex-propval">{"  "}width: 100%;</code>
                  {"\n"}
                  <code className="ex-propval">{"  "}height: 300px;</code>
                  {"\n"}
                  <code className="ex-propval">
                    {"  "}grid-template-columns: repeat(4, 45px);
                  </code>
                  {"\n"}
                  <code className="ex-propval">
                    {"  "}grid-template-rows: repeat(4, 45px);
                  </code>
                  {"\n"}
                  <code className="ex-propval">{"  "}grid-gap: 0.5em;</code>
                  {"\n"}
                  <code className="ex-propval">
                    {"  "}justify-content: start;
                  </code>
                  {"\n"}
                  <code className="ex-propval">{"}"}</code>
                </pre>
              </div>
              <p>
                <code>start</code> aligns column tracks along and at the start
                of the row axis—it is the default value.
              </p>
            </section>
            <aside className="ex__aside">
              <div className="vp">
                <div className="vp__example --gbajc">
                  <div className="vp-item">1</div>
                  <div className="vp-item">2</div>
                  <div className="vp-item">3</div>
                  <div className="vp-item">4</div>
                  <div className="vp-item">5</div>
                  <div className="vp-item">6</div>
                  <div className="vp-item">7</div>
                  <div className="vp-item">8</div>
                  <div className="vp-item">9</div>
                  <div className="vp-item">10</div>
                  <div className="vp-item">11</div>
                  <div className="vp-item">12</div>
                  <div className="vp-item">13</div>
                  <div className="vp-item">14</div>
                  <div className="vp-item">15</div>
                  <div className="vp-item">16</div>
                  <div className="vp__lines">
                    <div className="vp-area" />
                  </div>
                </div>
              </div>
            </aside>
          </div>
          <div className="ex">
            <section className="ex__section">
              <div className="mb--1.5">
                <pre>
                  <code className="ex-propval">justify-content: end;</code>
                </pre>
              </div>
              <p>Columns are aligned at the end of the row axis.</p>
            </section>
            <aside className="ex__aside">
              <div className="vp">
                <div className="vp__example --gbajc jc--e">
                  <div className="vp-item">1</div>
                  <div className="vp-item">2</div>
                  <div className="vp-item">3</div>
                  <div className="vp-item">4</div>
                  <div className="vp-item">5</div>
                  <div className="vp-item">6</div>
                  <div className="vp-item">7</div>
                  <div className="vp-item">8</div>
                  <div className="vp-item">9</div>
                  <div className="vp-item">10</div>
                  <div className="vp-item">11</div>
                  <div className="vp-item">12</div>
                  <div className="vp-item">13</div>
                  <div className="vp-item">14</div>
                  <div className="vp-item">15</div>
                  <div className="vp-item">16</div>
                  <div className="vp__lines">
                    <div className="vp-area" />
                  </div>
                </div>
              </div>
            </aside>
          </div>
          <div className="ex">
            <section className="ex__section">
              <div className="mb--1.5">
                <pre>
                  <code className="ex-propval">justify-content: center;</code>
                </pre>
              </div>
              <p>Columns are aligned at the center of the row axis.</p>
            </section>
            <aside className="ex__aside">
              <div className="vp">
                <div className="vp__example --gbajc jc--c">
                  <div className="vp-item">1</div>
                  <div className="vp-item">2</div>
                  <div className="vp-item">3</div>
                  <div className="vp-item">4</div>
                  <div className="vp-item">5</div>
                  <div className="vp-item">6</div>
                  <div className="vp-item">7</div>
                  <div className="vp-item">8</div>
                  <div className="vp-item">9</div>
                  <div className="vp-item">10</div>
                  <div className="vp-item">11</div>
                  <div className="vp-item">12</div>
                  <div className="vp-item">13</div>
                  <div className="vp-item">14</div>
                  <div className="vp-item">15</div>
                  <div className="vp-item">16</div>
                  <div className="vp__lines">
                    <div className="vp-area" />
                  </div>
                </div>
              </div>
            </aside>
          </div>
          <div className="ex">
            <section className="ex__section">
              <div className="mb--1.5">
                <pre>
                  <code className="ex-propval">
                    justify-content: space-around;
                  </code>
                </pre>
              </div>
              <p>
                The remaining space of the grid container is distributed and
                applied to the start and end of each column track.
              </p>
            </section>
            <aside className="ex__aside">
              <div className="vp">
                <div className="vp__example --gbajc jc--sa">
                  <div className="vp-item">1</div>
                  <div className="vp-item">2</div>
                  <div className="vp-item">3</div>
                  <div className="vp-item">4</div>
                  <div className="vp-item">5</div>
                  <div className="vp-item">6</div>
                  <div className="vp-item">7</div>
                  <div className="vp-item">8</div>
                  <div className="vp-item">9</div>
                  <div className="vp-item">10</div>
                  <div className="vp-item">11</div>
                  <div className="vp-item">12</div>
                  <div className="vp-item">13</div>
                  <div className="vp-item">14</div>
                  <div className="vp-item">15</div>
                  <div className="vp-item">16</div>
                  <div className="vp__lines">
                    <div className="vp-area" />
                  </div>
                </div>
              </div>
            </aside>
          </div>
          <div className="ex">
            <section className="ex__section">
              <div className="mb--1.5">
                <pre>
                  <code className="ex-propval">
                    justify-content: space-between;
                  </code>
                </pre>
              </div>
              <p>
                The remaining space is distributed between the column tracks.
              </p>
            </section>
            <aside className="ex__aside">
              <div className="vp">
                <div className="vp__example --gbajc jc--sb">
                  <div className="vp-item">1</div>
                  <div className="vp-item">2</div>
                  <div className="vp-item">3</div>
                  <div className="vp-item">4</div>
                  <div className="vp-item">5</div>
                  <div className="vp-item">6</div>
                  <div className="vp-item">7</div>
                  <div className="vp-item">8</div>
                  <div className="vp-item">9</div>
                  <div className="vp-item">10</div>
                  <div className="vp-item">11</div>
                  <div className="vp-item">12</div>
                  <div className="vp-item">13</div>
                  <div className="vp-item">14</div>
                  <div className="vp-item">15</div>
                  <div className="vp-item">16</div>
                  <div className="vp__lines">
                    <div className="vp-area" />
                  </div>
                </div>
              </div>
            </aside>
          </div>
          <div className="ex">
            <section className="ex__section">
              <div className="mb--1.5">
                <pre>
                  <code className="ex-propval">
                    justify-content: space-evenly;
                  </code>
                </pre>
              </div>
              <p>
                The remaining space is distributed where the space between the
                columns are equal to the space at the start and end of the row
                track.
              </p>
            </section>
            <aside className="ex__aside">
              <div className="vp">
                <div className="vp__example --gbajc jc--se">
                  <div className="vp-item">1</div>
                  <div className="vp-item">2</div>
                  <div className="vp-item">3</div>
                  <div className="vp-item">4</div>
                  <div className="vp-item">5</div>
                  <div className="vp-item">6</div>
                  <div className="vp-item">7</div>
                  <div className="vp-item">8</div>
                  <div className="vp-item">9</div>
                  <div className="vp-item">10</div>
                  <div className="vp-item">11</div>
                  <div className="vp-item">12</div>
                  <div className="vp-item">13</div>
                  <div className="vp-item">14</div>
                  <div className="vp-item">15</div>
                  <div className="vp-item">16</div>
                  <div className="vp__lines">
                    <div className="vp-area" />
                  </div>
                </div>
              </div>
            </aside>
          </div>
          <div className="ex">
            <section className="ex__section">
              <div className="mb--1.5">
                <pre>
                  <code className="ex-propval">align-content: start;</code>
                </pre>
              </div>
              <p>
                <code>start</code> aligns rows at the start of the column axis
                and is the default value.
              </p>
            </section>
            <aside className="ex__aside">
              <div className="vp">
                <div className="vp__example --gbajc ai--s">
                  <div className="vp-item">1</div>
                  <div className="vp-item">2</div>
                  <div className="vp-item">3</div>
                  <div className="vp-item">4</div>
                  <div className="vp-item">5</div>
                  <div className="vp-item">6</div>
                  <div className="vp-item">7</div>
                  <div className="vp-item">8</div>
                  <div className="vp-item">9</div>
                  <div className="vp-item">10</div>
                  <div className="vp-item">11</div>
                  <div className="vp-item">12</div>
                  <div className="vp-item">13</div>
                  <div className="vp-item">14</div>
                  <div className="vp-item">15</div>
                  <div className="vp-item">16</div>
                  <div className="vp__lines">
                    <div className="vp-area" />
                  </div>
                </div>
              </div>
            </aside>
          </div>
          <div className="ex">
            <section className="ex__section">
              <div className="mb--1.5">
                <pre>
                  <code className="ex-propval">align-content: end;</code>
                </pre>
              </div>
              <p>Rows are aligned at the end of the column axis.</p>
            </section>
            <aside className="ex__aside">
              <div className="vp">
                <div className="vp__example --gbajc ac--e o--h">
                  <div className="vp-item">1</div>
                  <div className="vp-item">2</div>
                  <div className="vp-item">3</div>
                  <div className="vp-item">4</div>
                  <div className="vp-item">5</div>
                  <div className="vp-item">6</div>
                  <div className="vp-item">7</div>
                  <div className="vp-item">8</div>
                  <div className="vp-item">9</div>
                  <div className="vp-item">10</div>
                  <div className="vp-item">11</div>
                  <div className="vp-item">12</div>
                  <div className="vp-item">13</div>
                  <div className="vp-item">14</div>
                  <div className="vp-item">15</div>
                  <div className="vp-item">16</div>
                  <div className="vp__lines">
                    <div className="vp-area" />
                  </div>
                </div>
              </div>
            </aside>
          </div>
          <div className="ex">
            <section className="ex__section">
              <div className="mb--1.5">
                <pre>
                  <code className="ex-propval">align-content: center;</code>
                </pre>
              </div>
              <p>Rows are aligned at the center of the column axis.</p>
            </section>
            <aside className="ex__aside">
              <div className="vp">
                <div className="vp__example --gbajc ac--c">
                  <div className="vp-item">1</div>
                  <div className="vp-item">2</div>
                  <div className="vp-item">3</div>
                  <div className="vp-item">4</div>
                  <div className="vp-item">5</div>
                  <div className="vp-item">6</div>
                  <div className="vp-item">7</div>
                  <div className="vp-item">8</div>
                  <div className="vp-item">9</div>
                  <div className="vp-item">10</div>
                  <div className="vp-item">11</div>
                  <div className="vp-item">12</div>
                  <div className="vp-item">13</div>
                  <div className="vp-item">14</div>
                  <div className="vp-item">15</div>
                  <div className="vp-item">16</div>
                  <div className="vp__lines">
                    <div className="vp-area" />
                  </div>
                </div>
              </div>
            </aside>
          </div>
          <div className="ex">
            <section className="ex__section">
              <div className="mb--1.5">
                <pre>
                  <code className="ex-propval">
                    align-content: space-around;
                  </code>
                </pre>
              </div>
              <p>
                The remaining space of the grid container is distributed and
                applied to the start and end of each row track.
              </p>
            </section>
            <aside className="ex__aside">
              <div className="vp">
                <div className="vp__example --gbajc ac--sa">
                  <div className="vp-item">1</div>
                  <div className="vp-item">2</div>
                  <div className="vp-item">3</div>
                  <div className="vp-item">4</div>
                  <div className="vp-item">5</div>
                  <div className="vp-item">6</div>
                  <div className="vp-item">7</div>
                  <div className="vp-item">8</div>
                  <div className="vp-item">9</div>
                  <div className="vp-item">10</div>
                  <div className="vp-item">11</div>
                  <div className="vp-item">12</div>
                  <div className="vp-item">13</div>
                  <div className="vp-item">14</div>
                  <div className="vp-item">15</div>
                  <div className="vp-item">16</div>
                  <div className="vp__lines">
                    <div className="vp-area" />
                  </div>
                </div>
              </div>
            </aside>
          </div>
          <div className="ex">
            <section className="ex__section">
              <div className="mb--1.5">
                <pre>
                  <code className="ex-propval">
                    align-content: space-between;
                  </code>
                </pre>
              </div>
              <p>The remaining space is distributed between the row tracks.</p>
            </section>
            <aside className="ex__aside">
              <div className="vp">
                <div className="vp__example --gbajc ac--sb o--h">
                  <div className="vp-item">1</div>
                  <div className="vp-item">2</div>
                  <div className="vp-item">3</div>
                  <div className="vp-item">4</div>
                  <div className="vp-item">5</div>
                  <div className="vp-item">6</div>
                  <div className="vp-item">7</div>
                  <div className="vp-item">8</div>
                  <div className="vp-item">9</div>
                  <div className="vp-item">10</div>
                  <div className="vp-item">11</div>
                  <div className="vp-item">12</div>
                  <div className="vp-item">13</div>
                  <div className="vp-item">14</div>
                  <div className="vp-item">15</div>
                  <div className="vp-item">16</div>
                  <div className="vp__lines">
                    <div className="vp-area" />
                  </div>
                </div>
              </div>
            </aside>
          </div>
          <div className="ex">
            <section className="ex__section">
              <div className="mb--1.5">
                <pre>
                  <code className="ex-propval">
                    align-content: space-evenly;
                  </code>
                </pre>
              </div>
              <p>
                The remaining space is distributed where the space between the
                rows are equal to the space at the start and end of the column
                track.
              </p>
            </section>
            <aside className="ex__aside">
              <div className="vp">
                <div className="vp__example --gbajc ac--se">
                  <div className="vp-item">1</div>
                  <div className="vp-item">2</div>
                  <div className="vp-item">3</div>
                  <div className="vp-item">4</div>
                  <div className="vp-item">5</div>
                  <div className="vp-item">6</div>
                  <div className="vp-item">7</div>
                  <div className="vp-item">8</div>
                  <div className="vp-item">9</div>
                  <div className="vp-item">10</div>
                  <div className="vp-item">11</div>
                  <div className="vp-item">12</div>
                  <div className="vp-item">13</div>
                  <div className="vp-item">14</div>
                  <div className="vp-item">15</div>
                  <div className="vp-item">16</div>
                  <div className="vp__lines">
                    <div className="vp-area" />
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>
        <section className="section">
          <div className="ex__header mb--0">
            <p>
              This guide is designed to give you a fairly comprehensive overview
              of Grid; however, it doesn’t pretend to be a complete technical
              documentation. Be sure to check out the specs of
              <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout">
                Mozilla Developer Network
              </a>
              and <a href="https://www.w3.org/TR/css3-grid-layout/">W3C</a> for
              an even deeper dive.
            </p>
            <p>Here are some other fantastic resources on CSS Grid:</p>
            <ul>
              <li>
                <a href="https://css-tricks.com/snippets/css/complete-guide-grid/">
                  Complete Guide to Grid on CSS Tricks
                </a>
              </li>
              <li>
                <a href="http://gridbyexample.com">
                  Grid by Example by Rachel Andrew
                </a>
              </li>
              <li>
                <a href="https://thecssworkshop.com/">
                  The CSS Workshop by Jen Simmons
                </a>
              </li>
              <li>
                <a href="https://cssgridgarden.com/">Grid Garden by Codepip</a>
              </li>
              <li>
                <a href="http://jonibologna.com/spring-into-css-grid/">
                  Spring Into CSS Grid by Joni Trythall
                </a>
              </li>
            </ul>
            {/* <p>
        I’m susceptible to making mistakes or being wrong. If you see a typo
        or a mistake, please reach out to me on
        <a href="https://twitter.com/fadeomar">Twitter</a> or
        <a href="https://github.com/fadeomar">via github</a>.
      </p> */}
          </div>
        </section>
      </main>
      <footer className="footer" role="contentinfo">
        <div className="footer__info">
          <b>Learn CSS Grid</b>
          <span
            role="img"
            aria-label="Built"
            style={{ marginLeft: "0.25rem", marginRight: "0.5rem" }}
          >
            🔨
          </span>
          {/* by <a href="https://github.com/fadeomar">Fadi Omar</a> ·
    <a href="https://github.com/fadeomar">@fadeomar</a> */}
        </div>
      </footer>
    </div>
  );
}
