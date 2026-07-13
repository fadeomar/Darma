export default function JsonToTypescriptArticle() {
  return (
    <div className="space-y-8 text-sm leading-7 text-[var(--color-text-secondary)]">
      <section>
        <h2 className="mb-3 text-xl font-black text-[var(--color-text-primary)]">Generate a contract, not a promise</h2>
        <p>
          JSON examples are useful for discovering an initial TypeScript shape, but one response cannot prove every valid response. Arrays may omit fields, empty arrays reveal no item type, and nullable values may have different meaning from missing values. Treat generated declarations as a reviewed starting point for an API contract.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-black text-[var(--color-text-primary)]">How array inference works</h2>
        <p>
          Inspecting all array items usually produces the safest result because the generator can identify mixed item types and properties that are absent from some objects. First-item inference is faster and cleaner for controlled fixtures, but it can silently miss later fields. Empty arrays are emitted with unknown item types because no reliable type evidence exists.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-black text-[var(--color-text-primary)]">Null and optional are different</h2>
        <p>
          A nullable field is present with a null value, while an optional field may be absent entirely. Transport-layer models often preserve null explicitly. Form models and UI state sometimes prefer optional properties. Choose the mode that matches the documented API rather than whichever output looks shorter.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-black text-[var(--color-text-primary)]">Why runtime validation still matters</h2>
        <p>
          TypeScript types are removed during compilation and cannot protect an application from malformed network data. The Zod and JSON Schema exports are runtime-validation starters. Review required fields, formats, unions, error payloads, and versioning rules before using them at a production boundary.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-black text-[var(--color-text-primary)]">Production review checklist</h2>
        <ul className="ml-5 list-disc space-y-1.5">
          <li>Use representative success, empty, partial, and error responses.</li>
          <li>Confirm large identifiers are strings when they exceed JavaScript&apos;s safe integer range.</li>
          <li>Remove tokens, passwords, cookies, and customer data from shared fixtures.</li>
          <li>Compare inferred optional fields and null unions with official API documentation.</li>
          <li>Add automated runtime-schema tests before trusting external payloads.</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-black text-[var(--color-text-primary)]">Privacy</h2>
        <p>
          JSON parsing, TypeScript inference, schema generation, checks, and ZIP creation run locally in the browser. Nothing is intentionally uploaded by this tool. Local processing does not make a real secret safe to paste into screenshots, issue trackers, or exported files, so sanitize production payloads first.
        </p>
      </section>
    </div>
  );
}
