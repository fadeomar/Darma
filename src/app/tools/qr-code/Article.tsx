export default function Article() {
  return (
    <div className="space-y-8 text-sm leading-7 text-[var(--color-text-secondary)]">
      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">Build the destination before styling the pattern</h2>
        <p>
          A QR code is only a visual encoding of a payload. Start by choosing the
          correct destination type: a full HTTPS URL, WiFi credentials, a vCard,
          coordinates, an email, or a calendar event. Darma shows the exact encoded
          payload beside the preview so you can review what a scanner will receive.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">Quiet zones, contrast, and export size</h2>
        <p>
          Reliable QR artwork needs clear separation from its surroundings. Keep at
          least four empty modules around the pattern, use a dark foreground on a
          light background, and avoid placing artwork over the finder squares. A
          transparent export can work, but its final page, sign, or package must
          preserve the contrast that the editor cannot verify in advance.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">Payload density and error correction</h2>
        <p>
          Long text, contact cards, and calendar events create denser patterns than
          short links. Shortening a URL often improves scanning more than increasing
          the image dimensions. Error correction levels Q and H can recover from more
          damage, but they also add modules, so the highest setting is not automatically
          the best choice for every code.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">Production workflow</h2>
        <ol className="ml-5 list-decimal space-y-2">
          <li>Choose a preset or enter the final destination details.</li>
          <li>Resolve every error and review warnings in Production Checks.</li>
          <li>Scan the live preview and the final downloaded asset on a real phone.</li>
          <li>Export SVG for scalable print work or PNG for normal digital placement.</li>
          <li>Save the project JSON when the code may need future edits.</li>
        </ol>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">Developer and handoff exports</h2>
        <p>
          The production pack contains the PNG and SVG artwork, an editable Darma
          project file, semantic HTML, responsive CSS, a typed React component, and a
          Markdown audit report. These files keep the generated asset, implementation
          example, and review notes together during handoff.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">Privacy and sensitive payloads</h2>
        <p>
          Generation and project imports run locally in the browser. The resulting QR
          image is not private, however: anyone who can photograph or decode it can
          read the payload. Treat WiFi passwords, personal addresses, phone numbers,
          and calendar details as public once the code is distributed.
        </p>
      </section>
    </div>
  );
}
