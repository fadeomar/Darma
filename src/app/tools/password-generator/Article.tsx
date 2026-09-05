const sectionTitle =
  "mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]";

const faqs = [
  {
    question: "Does Darma send generated passwords to a server?",
    answer:
      "No. Generation uses the browser Web Crypto API and fails closed when secure randomness is unavailable. The value stays in page memory unless you deliberately copy it.",
  },
  {
    question: "Do policy exports contain the generated secret?",
    answer:
      "No. JSON, Markdown, JavaScript, TypeScript, environment templates, and ZIP packs contain settings and guidance only. The secret is intentionally excluded from every downloaded file.",
  },
  {
    question: "Which preset should I use?",
    answer:
      "Use Everyday for ordinary accounts, Important for primary email and cloud storage, Admin or finance for privileged access, Service secret for automation, and Memorable passphrase when manual typing matters.",
  },
  {
    question: "Is the crack-time estimate a guarantee?",
    answer:
      "No. It is an illustrative offline brute-force estimate based on the configured random search space. Real security also depends on rate limits, hashing, breaches, reuse, phishing resistance, and storage practices.",
  },
  {
    question: "Should I add a name or custom phrase?",
    answer:
      "Avoid it for important secrets. Custom fragments are predictable, so Darma treats them as contributing zero estimated entropy and raises a policy warning or error.",
  },
];

export default function Article() {
  return (
    <div className="space-y-8 text-sm leading-7 text-[var(--color-text-secondary)]">
      <section>
        <h2 className={sectionTitle}>What makes a generated password strong?</h2>
        <p>
          Strong generated secrets combine trustworthy randomness with enough search space. In random
          password mode, length and the enabled character pool drive the estimate. In passphrase mode,
          the number of independently selected words is the main factor. A longer value is usually
          more useful than complicated rules that make the result harder to store or enter.
        </p>
      </section>

      <section>
        <h2 className={sectionTitle}>Choose a policy based on account impact</h2>
        <p>
          There is no single minimum that fits every situation. A low-risk forum account, a primary
          email address, an administrator login, and a machine credential have different consequences
          if compromised. Darma&apos;s policy profiles translate those use cases into transparent
          entropy, length, and word-count checks without claiming that one number guarantees safety.
        </p>
      </section>

      <section>
        <h2 className={sectionTitle}>Passwords versus passphrases</h2>
        <p>
          Use a random password when a password manager will save and autofill the value. Use a
          randomized passphrase when a human must type or remember it temporarily. Machine secrets
          should generally use compact random-password mode because words offer no usability advantage
          to software and may create unnecessary formatting constraints.
        </p>
      </section>

      <section>
        <h2 className={sectionTitle}>Why custom fragments reduce confidence</h2>
        <p>
          Names, dates, company terms, and familiar phrases are not random. The generator can include a
          custom fragment for compatibility with unusual workflows, but the strength calculation treats
          that fragment as predictable. For important, privileged, or automated credentials, leave the
          field empty and let secure randomness create the entire value.
        </p>
      </section>

      <section>
        <h2 className={sectionTitle}>Start from where the secret will be used</h2>
        <p>
          The preset library distinguishes ordinary accounts, password-manager logins, important accounts, legacy form constraints, shared Wi-Fi, privileged access, temporary bootstrap credentials, human-entered passphrases, and machine secrets such as database or CI/CD credentials. Start with the destination, then adjust only for a documented compatibility requirement.
        </p>
        <p className="mt-3">
          Presets describe generation settings, not storage policy. A strong generated value can still be mishandled if it is reused, committed to source control, pasted into tickets, or left in an insecure environment file.
        </p>
      </section>

      <section>
        <h2 className={sectionTitle}>Safe handling after generation</h2>
        <ul className="list-inside list-disc space-y-2">
          <li>Use a unique secret for every account or service.</li>
          <li>Save it directly in a trusted password manager or deployment secret manager.</li>
          <li>Enable phishing-resistant multi-factor authentication where available.</li>
          <li>Never paste real secrets into tickets, chat, screenshots, source files, or reports.</li>
          <li>Rotate a secret immediately when it may have been exposed or shared.</li>
        </ul>
      </section>

      <section>
        <h2 className={sectionTitle}>What the production pack is for</h2>
        <p>
          The ZIP pack documents the chosen policy and provides JSON, Markdown, JavaScript, TypeScript,
          and an empty environment-file template. It is designed for review and implementation without
          turning the generated password into an unsafe downloadable artifact. Generate the real secret
          where it will be stored, then inject it using the destination platform&apos;s secret-management
          workflow.
        </p>
      </section>

      <section>
        <h2 className={sectionTitle}>Frequently asked questions</h2>
        <dl className="space-y-4">
          {faqs.map((faq) => (
            <div key={faq.question}>
              <dt className="font-semibold text-[var(--color-text-primary)]">{faq.question}</dt>
              <dd className="mt-1">{faq.answer}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
