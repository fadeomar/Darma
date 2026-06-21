export default function TimezoneConverterArticle() {
  return (
    <div className="space-y-7 text-sm leading-7 text-[var(--color-text-secondary)]">
      <section><h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">What does this converter do?</h2><p>It takes one local date and time and displays that exact moment across several cities. You can add or remove common IANA time zones and copy the comparison for a message or invitation.</p></section>
      <section><h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">How it works</h2><p>Your browser's internationalization engine applies the selected region's UTC offset and daylight-saving rules for that date. A next-day or previous-day label highlights comparisons that cross a calendar boundary.</p></section>
      <section><h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">Common uses</h2><ul className="list-inside list-disc space-y-2"><li>Schedule remote meetings across cities.</li><li>Publish event times for an international audience.</li><li>Plan travel calls and arrival times.</li><li>Share a clear multi-zone comparison.</li></ul></section>
    </div>
  );
}
