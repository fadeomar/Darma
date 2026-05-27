export default function Article() {
  return (
    <div className="space-y-8 text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          When to use a QR code
        </h2>
        <p>
          QR codes are useful when someone needs to move quickly from a printed
          poster, package, slide, receipt, or screen into a digital page. Paste a
          URL or short text, generate the code, then test it with your phone
          before publishing.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          QR code quality checklist
        </h2>
        <ul className="ml-4 list-disc space-y-1.5">
          <li>Use a short URL when possible so the QR pattern stays simple.</li>
          <li>Keep enough white space around the code for reliable scanning.</li>
          <li>Use strong contrast between foreground and background.</li>
          <li>Print large enough for the expected scan distance.</li>
          <li>Scan-test the final exported image before sharing it publicly.</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          Privacy note
        </h2>
        <p>
          QR generation runs in your browser for normal text and URL input. Avoid
          putting passwords, private tokens, or sensitive personal data inside QR
          codes because anyone who can scan the image can read its contents.
        </p>
      </section>
    </div>
  );
}
