export default function Article() {
  return (
    <div className="space-y-8 text-sm leading-7 text-slate-700 dark:text-slate-300">
      <section>
        <h2 className="mb-3 text-xl font-bold text-slate-900 dark:text-slate-100">
          What is Base64?
        </h2>
        <p>
          Base64 is a text-encoding format that converts binary or Unicode data
          into plain ASCII characters. It is commonly used when systems accept
          text only, such as JSON payloads, data URLs, email MIME content, or
          token-like values.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-slate-900 dark:text-slate-100">
          When to use Base64 encoding
        </h2>
        <ul className="ml-4 list-disc space-y-1.5">
          <li>Embedding text-like payloads into APIs that expect safe characters</li>
          <li>Transporting binary-like data through text-only channels</li>
          <li>Creating data URLs for small assets</li>
          <li>Interoperating with legacy systems or protocols</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-slate-900 dark:text-slate-100">
          Base64 vs encryption
        </h2>
        <p>
          Base64 is <strong>not encryption</strong>. It does not protect data and
          is not a security measure. Anyone with basic tools can decode Base64
          back to the original text. Use proper cryptography (encryption + key
          management) when confidentiality is required.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-slate-900 dark:text-slate-100">
          URL-safe Base64 explained
        </h2>
        <p>
          Standard Base64 uses{" "}
          <code className="rounded bg-slate-100 px-1 font-mono text-xs dark:bg-slate-800">
            +
          </code>{" "}
          and{" "}
          <code className="rounded bg-slate-100 px-1 font-mono text-xs dark:bg-slate-800">
            /
          </code>
          , which can be awkward in URLs. URL-safe Base64 replaces them with{" "}
          <code className="rounded bg-slate-100 px-1 font-mono text-xs dark:bg-slate-800">
            -
          </code>{" "}
          and{" "}
          <code className="rounded bg-slate-100 px-1 font-mono text-xs dark:bg-slate-800">
            _
          </code>
          . Optional padding removal (
          <code className="rounded bg-slate-100 px-1 font-mono text-xs dark:bg-slate-800">
            =
          </code>
          ) is also common for compact URL tokens.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-slate-900 dark:text-slate-100">
          Common examples
        </h2>
        <div className="space-y-3">
          {[
            ["Hello world", "SGVsbG8gd29ybGQ="],
            ['{"name":"Darma","tool":"Base64"}', "eyJuYW1lIjoiRGFybWEiLCJ0b29sIjoiQmFzZTY0In0="],
            ["مرحبا بالعالم", "2YXYsdit2KjYpyDYqNin2YTYudin2YTZhQ=="],
          ].map(([plain, encoded]) => (
            <div
              key={plain}
              className="rounded-xl border border-black/8 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-900/40"
            >
              <p className="text-xs text-slate-500">Text</p>
              <p className="font-medium text-slate-800 dark:text-slate-200">{plain}</p>
              <p className="mt-2 text-xs text-slate-500">Base64</p>
              <p className="font-mono text-xs text-slate-700 dark:text-slate-300">{encoded}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-slate-900 dark:text-slate-100">
          Privacy note
        </h2>
        <p>
          All encoding and decoding happens locally in your browser. Your text is
          never sent to a server.
        </p>
      </section>
    </div>
  );
}
