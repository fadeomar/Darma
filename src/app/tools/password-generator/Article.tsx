export default function Article() {
  return (
    <div className="space-y-8 text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          What makes a password strong?
        </h2>
        <p>
          Password strength is determined by two things: the size of the
          character pool and the length of the password. Together these
          determine{" "}
          <strong className="text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">entropy</strong>{" "}
          — measured in bits — which represents how many guesses an attacker
          would need to try in the worst case.
        </p>
        <p className="mt-3">
          A 16-character password using uppercase, lowercase, numbers, and
          symbols draws from a pool of roughly 90 characters. That gives
          approximately{" "}
          <strong className="text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
            104 bits of entropy
          </strong>{" "}
          — more than enough to defeat even the most powerful offline attack
          rigs running billions of guesses per second.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          Password vs. passphrase — which is better?
        </h2>
        <p>
          Both are strong when generated correctly. The practical difference is
          usability:
        </p>
        <ul className="mt-3 space-y-2 list-disc list-inside">
          <li>
            <strong className="text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
              Random passwords
            </strong>{" "}
            are maximally dense — short strings pack a lot of entropy. They are
            ideal for password manager storage where you never need to type or
            remember them.
          </li>
          <li>
            <strong className="text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
              Passphrases
            </strong>{" "}
            trade density for memorability. Four or five random common words
            joined by a separator (e.g. <code className="text-xs bg-[var(--color-surface-subtle)] px-1 py-0.5 rounded">Silver-Castle-Thunder-Forest</code>)
            are genuinely random, surprisingly strong, and human-typeable
            — good for master passwords or device unlock codes.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          Why exclude similar characters?
        </h2>
        <p>
          Characters like <code className="text-xs bg-[var(--color-surface-subtle)] px-1 py-0.5 rounded">l</code>,{" "}
          <code className="text-xs bg-[var(--color-surface-subtle)] px-1 py-0.5 rounded">1</code>,{" "}
          <code className="text-xs bg-[var(--color-surface-subtle)] px-1 py-0.5 rounded">I</code>,{" "}
          <code className="text-xs bg-[var(--color-surface-subtle)] px-1 py-0.5 rounded">O</code>, and{" "}
          <code className="text-xs bg-[var(--color-surface-subtle)] px-1 py-0.5 rounded">0</code> are
          visually indistinguishable in many fonts, especially in printed or
          handwritten passwords. Excluding them trades a small amount of entropy
          for a much lower chance of transcription errors. For passwords stored
          in a manager, you don&apos;t need this — enable it when the password
          will be read by a human.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          How secure is this generator?
        </h2>
        <p>
          This tool generates passwords entirely in your browser using the{" "}
          <strong className="text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
            Web Crypto API
          </strong>{" "}
          (<code className="text-xs bg-[var(--color-surface-subtle)] px-1 py-0.5 rounded">crypto.getRandomValues</code>),
          which produces cryptographically secure random numbers. No password is
          ever sent to a server, stored, or logged. The page has no backend
          contact when you generate.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          Frequently asked questions
        </h2>
        <div className="space-y-5">
          {[
            {
              q: "How long should my password be?",
              a: "16 characters is a solid baseline for most accounts. For high-value accounts — email, banking, password manager master password — use 20+ characters or a 5-word passphrase.",
            },
            {
              q: "Should I use a password manager?",
              a: "Yes. A password manager lets you use a unique, randomly generated password for every site without having to remember any of them. The only password you need to remember is the master password — make it a strong passphrase.",
            },
            {
              q: "What is the crack time estimate based on?",
              a: "It assumes an offline attack at 10 billion guesses per second — roughly the throughput of a high-end GPU cluster running a fast hash like MD5. Against bcrypt or Argon2 (which good services use), the real crack time would be vastly longer.",
            },
            {
              q: "Is it safe to use this generator for real passwords?",
              a: "Yes. All generation happens client-side using the Web Crypto API. Nothing leaves your browser. You can also disconnect from the internet before generating if you want complete certainty.",
            },
            {
              q: "Why does the colour coding in the password display matter?",
              a: "Colour coding makes it easier to confirm at a glance that the password contains the character types you selected — especially useful when you need to type it manually somewhere.",
            },
          ].map(({ q, a }) => (
            <div key={q}>
              <h3 className="font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">{q}</h3>
              <p className="mt-1">{a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
