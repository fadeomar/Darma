export default function Article() {
  return (
    <div className="space-y-6 text-sm leading-7 text-[var(--color-text-secondary)]">
      <section>
        <h3 className="text-lg font-black tracking-[-0.02em] text-[var(--color-text-primary)]">What is the Click Speed Test?</h3>
        <p className="mt-2">
          Click Speed Test is a small interactive challenge that measures how many mouse, touch, or pen pointer presses your browser receives during a timed run. It is designed as a fun sprint, a simple input check, and a quick way to compare your clicking rhythm across devices.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-black tracking-[-0.02em] text-[var(--color-text-primary)]">How the score works</h3>
        <p className="mt-2">
          The tool counts primary pointer presses on the target only while the test is running. It calculates total clicks, clicks per second, best one-second burst, average time between clicks, fastest gap, input method, and a friendly consistency score.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-black tracking-[-0.02em] text-[var(--color-text-primary)]">What changed in Phase 4?</h3>
        <p className="mt-2">
          Phase 4 adds the first second challenge tool to the new Fun Tools system. Click Speed Test reuses the same Darma challenge layout, mode selector, stat tiles, personal best card, history panel, and tips foundation created for Mouse Scroll Test.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-black tracking-[-0.02em] text-[var(--color-text-primary)]">Why results may differ</h3>
        <p className="mt-2">
          CPS results can vary because of mouse switch quality, touch device behavior, browser timing, operating system settings, refresh rate, and physical technique. Treat the result as a fun browser-based comparison rather than a certified hardware benchmark.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-black tracking-[-0.02em] text-[var(--color-text-primary)]">Privacy</h3>
        <p className="mt-2">
          The test runs in the browser. Darma stores only your last five attempts in localStorage so you can compare recent runs on the same device.
        </p>
      </section>
    </div>
  );
}
