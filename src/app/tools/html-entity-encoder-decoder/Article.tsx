export default function Article() {
  return (
    <div className="prose prose-slate max-w-none dark:prose-invert">
      <p>
        HTML entities are text-safe codes for characters that have special meaning in HTML. For example, <code>&amp;lt;</code> represents <code>&lt;</code>, <code>&amp;gt;</code> represents <code>&gt;</code>, and <code>&amp;amp;</code> represents an ampersand.
      </p>
      <h2>Why encode HTML characters?</h2>
      <p>
        Characters such as <code>&lt;</code>, <code>&gt;</code>, <code>&amp;</code>, and quotes can be interpreted as markup when placed inside HTML. Encoding them lets you show snippets, examples, comments, and user-provided text safely as readable content.
      </p>
      <h2>Named vs numeric entities</h2>
      <p>
        Named entities such as <code>&amp;copy;</code> are human-readable, while decimal entities such as <code>&amp;#169;</code> and hexadecimal entities such as <code>&amp;#xA9;</code> refer to the character code point. Numeric entities are useful when a named entity is not available.
      </p>
      <h2>Browser-only privacy</h2>
      <p>
        This tool is a string utility. Encoding and decoding run locally in your browser, with no server route and no upload step.
      </p>
    </div>
  );
}
