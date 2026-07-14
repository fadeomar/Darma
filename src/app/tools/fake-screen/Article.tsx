export default function Article() {
  return (
    <div className="space-y-8 text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          What is the Fake Screen studio?
        </h2>
        <p>
          Fake Screen is a browser-only visual studio for fullscreen display tests,
          harmless update and error simulations, ambient screensavers, and animated
          canvas backgrounds. It combines preview, presets, configuration controls,
          sharing, auditing, and portable exports without uploading the content you enter.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          Recommended workflow
        </h2>
        <ol className="ml-5 list-decimal space-y-2">
          <li>Choose one of the five categories and start from a practical preset.</li>
          <li>Adjust text, timing, colors, animation speed, density, or brightness while watching the live preview.</li>
          <li>Review the four summary cards and resolve production errors or warnings.</li>
          <li>Use fullscreen only after confirming that the scene remains clearly identifiable as a demo or visual simulation.</li>
          <li>Copy a complete share link, export JSON for later editing, or download standalone HTML and the ZIP production pack.</li>
        </ol>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          Complete share links and JSON import
        </h2>
        <p>
          Share links now preserve the complete editable scene instead of only the basic
          template choice. Custom messages, durations, manual progress, screensaver
          colors, text size, canvas density, animation speed, and background colors all
          survive the round trip. JSON exports use a versioned Darma configuration and
          can be imported back into the tool on the same or another device.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          Production checks and performance
        </h2>
        <p>
          The audit reports errors, warnings, informational behavior, and passing checks.
          It looks for missing scene content, low color contrast, unusually long update
          timelines, non-terminating progress modes, very high canvas density, and missing
          demo disclosures. High-density canvas scenes can be visually rich but may lose
          frames on older phones or laptops, so test the intended device before presenting.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          Responsible use and privacy
        </h2>
        <p>
          Update and error scenes are for harmless jokes, videos, classroom demonstrations,
          mockups, and creative production. Do not use them to deceive someone, impersonate
          a real system warning, hide activity, or obstruct access to a device. Fullscreen
          requires a deliberate click and uses normal browser behavior, so it remains
          escapable with standard controls such as Esc. Preview rendering, imports, audits,
          and exports run locally in the browser.
        </p>
      </section>
    </div>
  );
}
