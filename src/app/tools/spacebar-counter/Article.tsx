export default function Article() {
  return (
    <div className="space-y-6 text-sm leading-7 text-[var(--color-text-secondary)]">
      <section>
        <h3 className="text-lg font-black tracking-[-0.02em] text-[var(--color-text-primary)]">What is the Spacebar Counter?</h3>
        <p className="mt-2">
          Spacebar Counter is a small interactive keyboard challenge that measures how many clean spacebar taps your browser receives during a timed run. It is designed for fun sprints, keyboard rhythm practice, and quick input checks.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-black tracking-[-0.02em] text-[var(--color-text-primary)]">How the score works</h3>
        <p className="mt-2">
          The tool counts individual spacebar keydown events while the challenge is running. It ignores repeated key events created by holding the key down, then calculates total presses, presses per second, best one-second burst, average gap, fastest gap, input method, and consistency.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-black tracking-[-0.02em] text-[var(--color-text-primary)]">What changed in Phase 5?</h3>
        <p className="mt-2">
          Phase 5 adds the third interactive challenge to the Fun Tools system. Spacebar Counter reuses the same Darma challenge layout, mode selector, stat tiles, personal best card, history panel, and tips foundation created in the earlier phases.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-black tracking-[-0.02em] text-[var(--color-text-primary)]">Why results may differ</h3>
        <p className="mt-2">
          Results can vary because of keyboard switch type, browser timing, operating system repeat settings, device refresh rate, and physical technique. Treat the result as a fun browser-based comparison rather than a certified hardware benchmark.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-black tracking-[-0.02em] text-[var(--color-text-primary)]">Privacy</h3>
        <p className="mt-2">
          The counter runs in the browser. Darma stores only your last five attempts in localStorage so you can compare recent runs on the same device.
        </p>
      </section>
    </div>
  );
}
