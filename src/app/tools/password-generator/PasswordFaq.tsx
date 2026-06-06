const faqItems = [
  {
    question: "Is this password generator safe?",
    answer:
      "Yes. Generation happens in your browser with secure random values. The result is not uploaded to Darma, embedded in a URL, or saved by the tool.",
  },
  {
    question: "Does Darma store the generated password?",
    answer:
      "No. The generated password only exists in the page state and your clipboard after you copy it. Store it in a trusted password manager before leaving the page.",
  },
  {
    question: "How long should my password be?",
    answer:
      "Use at least 16 random characters for important accounts. Use 20+ characters or a longer passphrase for email, banking, cloud storage, and password manager master passwords.",
  },
  {
    question: "What is better: password or passphrase?",
    answer:
      "Use a random password when a password manager can fill it for you. Use a passphrase when you must type it manually, such as Wi‑Fi, TV apps, or a device unlock flow.",
  },
  {
    question: "Should I use a password manager?",
    answer:
      "Yes. A password manager makes it realistic to keep every account unique without memorizing dozens of secrets.",
  },
  {
    question: "Why exclude similar or ambiguous characters?",
    answer:
      "It reduces typing mistakes when a password must be read, printed, or spoken. Keep the option off when your password manager will autofill the password.",
  },
  {
    question: "Can I use this for real accounts?",
    answer:
      "Yes, as long as you save the generated value safely and use a unique password for each account. Avoid sending passwords over chat or screenshots.",
  },
  {
    question: "What does entropy mean?",
    answer:
      "Entropy is an estimate of how hard a generated secret is to guess. More bits usually means more possible combinations and a stronger password.",
  },
  {
    question: "Why should every account have a unique password?",
    answer:
      "If one website leaks a reused password, attackers may try the same password on your email, banking, and social accounts. Unique passwords limit the damage.",
  },
  {
    question: "What should I do after copying the password?",
    answer:
      "Paste it into the account form and save it in your password manager. Avoid keeping it in notes, screenshots, spreadsheets, or messages.",
  },
];

export function PasswordFaq() {
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-5 shadow-[var(--shadow-card)] sm:p-7">
      <div className="max-w-3xl">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--color-primary)]">FAQ</p>
        <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-[var(--color-text-primary)] sm:text-3xl">
          Password generator questions
        </h2>
        <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
          Quick answers for using generated passwords safely without turning the page into a wall of text.
        </p>
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        {faqItems.map((item) => (
          <details
            key={item.question}
            className="group rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 shadow-[var(--shadow-xs)] open:border-[var(--color-primary-border)]"
          >
            <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-semibold text-[var(--color-text-primary)] outline-none transition focus-visible:rounded-[var(--radius-sm)] focus-visible:shadow-[var(--focus-ring)] [&::-webkit-details-marker]:hidden">
              {item.question}
              <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--color-border-default)] bg-[var(--color-surface-subtle)] font-mono text-sm text-[var(--color-text-secondary)] group-open:hidden">
                +
              </span>
              <span className="mt-0.5 hidden h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] font-mono text-sm text-[var(--color-primary)] group-open:inline-flex">
                −
              </span>
            </summary>
            <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
