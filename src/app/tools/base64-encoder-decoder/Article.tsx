export default function Base64Article() {
  return (
    <div className="space-y-7 text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">Base64 represents bytes as portable text</h2>
        <p>
          Base64 converts every three source bytes into four printable characters. That makes binary data easier to place inside JSON, email, XML, configuration values, and other text-only channels. The tradeoff is predictable size overhead: a normal Base64 payload is roughly one third larger than the original bytes before surrounding markup or metadata is added.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">Text and files require different handling</h2>
        <p>
          Text must first be converted to bytes, normally with UTF-8. Files should be read as raw bytes and must not pass through a text decoder, because arbitrary images, PDFs, archives, and other binary formats may not be valid UTF-8. This studio keeps those workflows separate and exposes a hex preview when decoded bytes are not readable text.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">Standard Base64, Base64URL, and padding</h2>
        <p>
          Standard Base64 uses <code className="font-mono">+</code> and <code className="font-mono">/</code>. Base64URL replaces them with <code className="font-mono">-</code> and <code className="font-mono">_</code>, which is more convenient in URLs and token formats. Trailing <code className="font-mono">=</code> padding is sometimes omitted. Forgiving mode can restore safe missing padding and remove line breaks, while strict mode rejects non-canonical input for validation work.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">Data URLs and MIME inspection</h2>
        <p>
          A Data URL combines a MIME type and a Base64 payload in a single string such as <code className="font-mono">data:image/png;base64,...</code>. They are useful for small inline assets, but large Data URLs increase document size and cannot be cached independently. Darma preserves declared MIME metadata and also checks common file signatures when decoding raw payloads.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">Base64 is not encryption</h2>
        <p>
          Encoded data is immediately reversible and provides no confidentiality, integrity, or authentication. Do not use Base64 to hide passwords, API keys, personal data, or private files. Use established encryption and secure key management when information must be protected.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">Private browser processing and practical limits</h2>
        <p>
          Text conversion, file reading, validation, byte inspection, and downloads run locally in the browser. The file limit protects the page from holding too many simultaneous in-memory copies. For large production files, prefer streaming APIs or command-line tools instead of converting the entire payload in one browser tab.
        </p>
      </section>
    </div>
  );
}
