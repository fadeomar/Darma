export default function StatisticsCalculatorArticle() {
  return (
    <div className="space-y-7 text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">From a quick average to a data-quality review</h2>
        <p>
          Darma&apos;s Statistics Analysis Studio calculates descriptive statistics locally in your browser and keeps parser diagnostics visible. Invalid tokens are not silently ignored: the tool identifies them before you copy or export a result. You can paste values separated by commas, semicolons, spaces, tabs, pipes, or new lines.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">Center, spread, and distribution</h2>
        <p>
          The mean and median describe the center of a data set, while range, interquartile range, variance, and standard deviation describe spread. The histogram and five-number box plot make it easier to see skew, clusters, and unusually distant observations that a single average can hide.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">Sample versus population variance</h2>
        <p>
          Choose population variance when the values represent the entire group you care about. Choose sample variance when the observations are a sample used to estimate a larger population. The studio calculates both and lets you choose which one is emphasized in summary cards and reports.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">Percentiles and outliers</h2>
        <p>
          Percentiles show where an observation sits relative to the rest of the data. Q1, the median, and Q3 form the interquartile range. Darma flags values below Q1 − 1.5×IQR or above Q3 + 1.5×IQR for review, but a flag does not prove that a value is wrong. Measurement context should determine whether an outlier is corrected, retained, or investigated separately.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">Production-ready exports</h2>
        <p>
          Export a Markdown summary, machine-readable metrics CSV, JSON audit report, or a ZIP analysis pack containing the original input and cleaned values. These artifacts are useful for QA notes, classroom reports, experiment reviews, operational metrics, and reproducible handoffs.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">Privacy and limits</h2>
        <p>
          All parsing, calculations, charts, and downloads run locally. Browser-based descriptive analysis is designed for compact and medium data sets; very large files, inferential statistics, weighted samples, or regulated decisions should use a dedicated statistical environment with documented methodology.
        </p>
      </section>
    </div>
  );
}
