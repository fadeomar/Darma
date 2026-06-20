export default function UnitConverterArticle() {
  return (
    <div className="space-y-7 text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          What does this converter do?
        </h2>
        <p>
          Pick a category — length, mass, temperature, volume, area, speed, digital storage, or
          time — enter a value, and choose what to convert from and to. The result updates as you
          type, and a full table shows the same value in every unit of that category.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          How the conversions work
        </h2>
        <p>
          Each unit is stored as a fixed multiplier of a base unit (for example, a kilometer is
          1,000 meters), so converting is a single multiply-and-divide. Temperature is different:
          Celsius, Fahrenheit, and Kelvin use offsets, so those are converted through a Celsius
          pivot rather than a plain ratio.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          Decimal vs binary storage units
        </h2>
        <p>
          Digital storage includes both decimal units (KB, MB, GB — powers of 1,000) and binary
          units (KiB, MiB, GiB — powers of 1,024). That is why 1 MB is 1,000,000 bytes while
          1 MiB is 1,048,576 bytes. Use the binary units when you need exact memory or file sizes.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          Common uses
        </h2>
        <ul className="list-inside list-disc space-y-2">
          <li>Convert recipe measurements between metric and US customary units.</li>
          <li>Switch a distance or speed between kilometers and miles.</li>
          <li>Read a temperature in Celsius, Fahrenheit, or Kelvin.</li>
          <li>Translate file sizes between megabytes and mebibytes.</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          A note on accuracy
        </h2>
        <p>
          Conversions use standard internationally defined factors and run entirely in your
          browser, so nothing is uploaded. Volume uses US customary units (cups, pints, gallons).
          Very large or very small results switch to scientific notation to stay readable.
        </p>
      </section>
    </div>
  );
}
