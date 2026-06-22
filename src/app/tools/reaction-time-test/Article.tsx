export default function Article() {
  return (
    <div className="space-y-6 text-sm leading-7 text-[var(--color-text-secondary)]">
      <section>
        <h2 className="text-xl font-black tracking-[-0.02em] text-[var(--color-text-primary)]">What is a reaction time test?</h2>
        <p className="mt-3">
          Reaction Time Test is a small browser challenge that measures how quickly you respond after a visual signal appears. Start the test, wait for the arena to turn green, then tap the arena or press Space/Enter as fast as you can.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black tracking-[-0.02em] text-[var(--color-text-primary)]">How Darma measures the score</h2>
        <p className="mt-3">
          The tool uses browser timing to record the moment the signal appears and the moment you react. It reports your average reaction time, best reaction, slowest reaction, consistency, input method, and false starts. Lower milliseconds are better.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black tracking-[-0.02em] text-[var(--color-text-primary)]">Why results can vary</h2>
        <p className="mt-3">
          Reaction scores are useful for comparison and entertainment, but they are not a scientific lab result. Browser performance, monitor refresh rate, keyboard latency, mouse polling, touch delay, operating system settings, and focus can all change the final number.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black tracking-[-0.02em] text-[var(--color-text-primary)]">Fair test tips</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>Use the same device and browser when comparing attempts.</li>
          <li>Do not click early; early taps are counted as false starts.</li>
          <li>Use 5 rounds for a balanced score instead of judging only one lucky attempt.</li>
          <li>Keep the tab focused and close heavy background tasks for smoother timing.</li>
        </ul>
      </section>
    </div>
  );
}
