export default function Article() {
  return (
    <div className="space-y-6 text-sm leading-7 text-[var(--color-text-secondary)]">
      <section>
        <h3 className="text-lg font-black tracking-[-0.02em] text-[var(--color-text-primary)]">What is the Mouse Scroll Test?</h3>
        <p className="mt-2">
          Mouse Scroll Test is a small interactive challenge that measures how much mouse-wheel, touchpad, or touch movement your browser receives during a timed run. It is useful as a fun sprint, a quick input check, and a simple comparison between devices.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-black tracking-[-0.02em] text-[var(--color-text-primary)]">How the score works</h3>
        <p className="mt-2">
          The tool captures movement only inside the challenge arena. It converts wheel and touch movement into pixel-like deltas, then calculates total distance, average pixels per second, best short burst, direction, event count, input method, and a friendly smoothness score.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-black tracking-[-0.02em] text-[var(--color-text-primary)]">What changed in the Fun Tools system?</h3>
        <p className="mt-2">
          The challenge UI is now reusable across multiple fun tools. Mouse Scroll Test uses shared challenge cards, mode selectors, stat tiles, history panels, local-history helpers, and tip lists, while Click Speed Test proves the same system can power another interactive challenge.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-black tracking-[-0.02em] text-[var(--color-text-primary)]">Why results may differ</h3>
        <p className="mt-2">
          Scroll data is affected by your operating system, browser, mouse driver, wheel sensitivity, touchpad settings, touch device behavior, and browser zoom. Treat the result as a fun browser-based comparison rather than a certified hardware benchmark.
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
