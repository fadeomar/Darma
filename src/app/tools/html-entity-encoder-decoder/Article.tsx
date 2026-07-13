export default function Article() {
  return (
    <div className="prose prose-slate max-w-none dark:prose-invert">
      <p>
        HTML entities represent characters with text-safe references such as <code>&amp;lt;</code>, <code>&amp;amp;</code>, <code>&amp;copy;</code>, or <code>&amp;#x1F680;</code>. They are useful when markup characters must be displayed as text or when a specific Unicode character needs a portable numeric representation.
      </p>

      <h2>Choose the correct HTML context</h2>
      <p>
        Text content and quoted attribute values do not have identical escaping requirements. Ampersands and angle brackets require attention in HTML text, while the quote that surrounds an attribute value must also be encoded. This studio offers separate text, double-quoted attribute, and single-quoted attribute contexts so the generated result matches the intended location.
      </p>

      <h2>Named, decimal, and hexadecimal entities</h2>
      <p>
        Named references such as <code>&amp;copy;</code> are readable but only exist for defined names. Decimal references use a Unicode code point such as <code>&amp;#169;</code>, while hexadecimal references use values such as <code>&amp;#xA9;</code>. Numeric output is useful for multilingual text and emoji because every valid Unicode scalar value can be represented.
      </p>

      <h2>Double encoding and repeated decoding</h2>
      <p>
        A value such as <code>&amp;amp;lt;</code> may indicate that <code>&amp;lt;</code> was encoded a second time. A second decoding pass can recover the original character, but it should only be used when the input source and encoding history are understood. Repeated decoding can reveal markup that was intentionally escaped.
      </p>

      <h2>Encoding is not sanitization</h2>
      <p>
        HTML entity encoding is context-specific output handling, not a complete HTML sanitizer. Decoded or untrusted content should not be inserted through <code>innerHTML</code> or <code>dangerouslySetInnerHTML</code> without an appropriate sanitization strategy. JavaScript, CSS, URL, and unquoted-attribute contexts require different protections.
      </p>

      <h2>Private browser-only processing</h2>
      <p>
        Conversion, entity inspection, Unicode analysis, reports, and exports run locally in the browser. Your source text is not uploaded to a Darma server.
      </p>
    </div>
  );
}
