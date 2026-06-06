export default function Article() {
  return (
    <div className="space-y-8 text-sm leading-7 text-[var(--color-text-secondary)]">
      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">
          What makes a generated password strong?
        </h2>
        <p>
          Strong generated passwords combine randomness and length. Randomness
          makes each character or word unpredictable, while length increases the
          number of possible combinations an attacker would need to try.
        </p>
        <p className="mt-3">
          Darma estimates strength with entropy bits. Higher entropy means a
          larger search space. The estimate is useful for comparing settings,
          but it should not replace good habits: use a unique secret per
          account, save it safely, and enable two-factor authentication for
          high-value services.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">
          Why length usually matters most
        </h2>
        <p>
          Adding a few extra characters usually improves strength more than
          swapping between small character preferences. For important accounts,
          a long random password is ideal when a password manager can fill it.
          When the password must be typed manually, a longer passphrase can be
          easier to use without giving up practical security.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">
          Why exclude similar characters?
        </h2>
        <p>
          Similar characters such as <code className="rounded bg-[var(--color-surface-subtle)] px-1 py-0.5 text-xs">l</code>,{" "}
          <code className="rounded bg-[var(--color-surface-subtle)] px-1 py-0.5 text-xs">1</code>,{" "}
          <code className="rounded bg-[var(--color-surface-subtle)] px-1 py-0.5 text-xs">O</code>, and{" "}
          <code className="rounded bg-[var(--color-surface-subtle)] px-1 py-0.5 text-xs">0</code> can be confused in some fonts or on paper. Excluding
          them slightly reduces the character pool, but it can prevent typing
          mistakes when a human has to read the password.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">
          Local generation and safe handling
        </h2>
        <p>
          The generator uses secure browser randomness and does not submit the
          generated value to a server. After copying, paste the password into
          the account form and save it in a trusted password manager. Avoid
          storing real passwords in screenshots, shared documents, chat
          messages, or plain notes.
        </p>
      </section>
    </div>
  );
}
