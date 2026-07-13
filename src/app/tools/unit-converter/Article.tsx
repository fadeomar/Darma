export default function UnitConverterArticle() {
  return (
    <div className="space-y-7 text-sm leading-7 text-[var(--color-text-secondary)]">
      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">A unit converter that shows its work</h2>
        <p>
          Unit Converter Studio handles length, mass, temperature, volume, area, speed, digital
          storage, and fixed-duration time. In addition to the final answer, it displays the source
          and destination systems, the conversion factor or temperature formula, every equivalent
          unit in the category, and production checks that explain important measurement assumptions.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">Linear conversions and temperature offsets</h2>
        <p>
          Most units are linear: the input is converted to a category base unit and then divided by
          the destination factor. Temperature is different because Celsius and Fahrenheit include
          offsets. The studio therefore uses direct Celsius, Fahrenheit, and Kelvin formulas instead
          of treating temperature as a simple multiplier.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">Metric, US customary, and imperial labels</h2>
        <p>
          The interface labels the system attached to each unit so a cross-system result is explicit.
          Volume entries such as cup, pint, quart, gallon, tablespoon, teaspoon, and fluid ounce use
          US customary definitions. They are not interchangeable with UK imperial liquid measures,
          which have different sizes.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">MB and MiB are not the same</h2>
        <p>
          Decimal SI storage units use powers of 1,000: one MB is 1,000,000 bytes. IEC binary units
          use powers of 1,024: one MiB is 1,048,576 bytes. The production review flags conversions
          that cross between these systems so a file-size or memory calculation does not silently
          mix conventions.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">Batch conversion and unit aliases</h2>
        <p>
          Batch mode accepts one value per line. A line containing only a number uses the selected
          source unit, while a line such as <code>5 km</code>, <code>5280 feet</code>, or
          <code>180 C</code> can override it. Invalid rows remain visible with an explanation instead
          of being silently discarded, and the full table can be exported as CSV.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">Precision, physical checks, and exports</h2>
        <p>
          Calculations retain browser number precision internally while display formatting can use
          automatic, fixed-decimal, significant-digit, or scientific notation. Checks flag values
          below absolute zero, negative physical quantities, extreme scales, unsafe integers, and
          batch errors. Markdown, JSON, CSV, JavaScript, and ZIP exports are generated locally and
          never uploaded.
        </p>
      </section>
    </div>
  );
}
