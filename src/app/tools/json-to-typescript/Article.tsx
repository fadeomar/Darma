export default function JsonToTypescriptArticle() {
  return (
    <div className="space-y-6 text-sm leading-7 text-[var(--color-text-muted)]">
      <section className="space-y-2">
        <h2 className="text-xl font-black text-[var(--color-text)]">Why generate TypeScript from JSON?</h2>
        <p>
          API responses, seed data, fixtures, and configuration files often start as JSON. Generating TypeScript interfaces from those examples gives developers a quick starting point for typed fetch functions, React components, test mocks, and backend integration code.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-black text-[var(--color-text)]">Interfaces and type aliases</h2>
        <p>
          Interfaces are a familiar choice for object shapes and public API contracts. Type aliases are useful when the top-level result is an array, union, primitive, or when your team prefers one consistent declaration style. This tool supports both so you can match your project conventions.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-black text-[var(--color-text)]">Optional fields and null values</h2>
        <p>
          Real API data is often inconsistent. A field may be missing from one array item, present in another, or explicitly set to null. The generator marks missing array fields as optional and lets you choose whether null should stay in the type union or be treated like an optional value.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-black text-[var(--color-text)]">Nested API responses</h2>
        <p>
          Nested objects and arrays are converted into named TypeScript declarations. Mixed arrays become union item types, empty arrays use unknown items, and property names that are not valid TypeScript identifiers are safely quoted.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-black text-[var(--color-text)]">Privacy</h2>
        <p>
          JSON is parsed and converted locally in your browser. The input is not sent to a server, which makes the tool useful for private fixtures and development data. Avoid pasting secrets or sensitive production payloads into any tool unless you are sure it is appropriate for your workflow.
        </p>
      </section>
    </div>
  );
}
