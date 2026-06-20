export default function StatisticsCalculatorArticle() {
  return (
    <div className="space-y-7 text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          What does this calculator do?
        </h2>
        <p>
          Paste a list of numbers and get the most common descriptive statistics at once: count,
          sum, mean, median, mode, minimum, maximum, range, variance, and standard deviation. Numbers
          can be separated by commas, spaces, or new lines.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          Mean, median, and mode
        </h2>
        <p>
          The <strong>mean</strong> is the average — the sum divided by how many numbers there are.
          The <strong>median</strong> is the middle value once the numbers are sorted. The
          <strong> mode</strong> is the value that appears most often; a data set can have more than
          one mode, or none if every value is unique.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          Variance and standard deviation
        </h2>
        <p>
          Variance and standard deviation measure how spread out the numbers are. Use the
          <strong> sample</strong> versions (dividing by n − 1) when your numbers are a sample drawn
          from a larger group, and the <strong>population</strong> versions (dividing by n) when they
          represent the entire group.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          Common uses
        </h2>
        <ul className="list-inside list-disc space-y-2">
          <li>Summarize test scores or survey results.</li>
          <li>Check the spread of measurements in a lab report.</li>
          <li>Find the average and range of a list of values.</li>
          <li>Verify a statistics homework answer.</li>
        </ul>
      </section>
    </div>
  );
}
