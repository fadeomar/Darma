export default function Article() {
  return (
    <article className="prose prose-slate max-w-none dark:prose-invert">
      <h2>How the word finder works</h2>
      <p>
        Enter the letters on your rack and the tool finds every word in the dictionary that you can actually
        build from those tiles. Unlike a simple substring search, it respects how many of each letter you have,
        supports blank (wildcard) tiles with <code>?</code>, and scores each result using standard English
        Scrabble letter values.
      </p>

      <h2>Blank tiles</h2>
      <p>
        Type <code>?</code> (or <code>*</code>) for each blank tile. Blanks fill in letters you are missing, and
        because blanks are worth zero points, the score shown accounts for exactly which letters a blank covered.
      </p>

      <h2>Scoring</h2>
      <p>
        Scores use the standard tile values: most vowels and common consonants are 1 point, up to Q and Z at 10.
        The score shown is the sum of tile values for the word; it does not include board bonuses like
        double-word or triple-letter squares, which depend on where you play.
      </p>

      <h2>Filters and sorting</h2>
      <p>
        Narrow results with contains, starts-with, ends-with, and minimum-length filters, then sort by highest
        score, longest word, or alphabetically. Grouping by length makes it easy to scan for the longest plays.
      </p>

      <h2>Bring your own dictionary</h2>
      <p>
        The built-in list is a small, curated set of common words so the tool works instantly. For serious or
        tournament play, load a full word list such as TWL (North America) or SOWPODS (international) as a plain
        text file with one word per line. The file is read locally in your browser and never uploaded.
      </p>

      <h2>Privacy</h2>
      <p>Everything — your rack, filters, and any dictionary you load — stays in your browser.</p>
    </article>
  );
}
