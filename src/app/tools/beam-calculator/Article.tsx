export default function BeamCalculatorArticle() {
  return (
    <div className="space-y-7 text-sm leading-7 text-[var(--color-text-secondary)]">
      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">What this tool calculates</h2>
        <p>
          Beam Calculator Studio solves statically determinate beams for support reactions, shear force, and bending
          moment, then draws the shear force diagram (SFD) and bending moment diagram (BMD). It reports the maximum shear,
          the maximum sagging and hogging moments, the fixed-end moment for cantilevers, and an equilibrium check so you can
          confirm the reactions balance the applied loads.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">Who it is for</h2>
        <p>
          Students learning statics and structural mechanics, civil and structural engineering learners checking homework,
          makers sizing a simple beam or shelf, and anyone who wants an intuitive feel for how loads turn into reactions,
          shear, and bending.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">Supported beams and loads</h2>
        <ul className="list-inside list-disc space-y-2">
          <li><strong>Simply supported beam</strong> — a pin and a roller (two pin/roller supports at distinct positions).</li>
          <li><strong>Cantilever beam</strong> — a single fixed support at either end.</li>
          <li><strong>Point loads</strong> — a concentrated force at a position, up or down.</li>
          <li><strong>Uniformly distributed loads (UDL)</strong> — a constant intensity over a range.</li>
          <li><strong>Applied moments</strong> — a concentrated moment, clockwise or counter-clockwise.</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">How to use it</h2>
        <ol className="list-inside list-decimal space-y-2">
          <li>Pick a preset, or set the beam length and add supports.</li>
          <li>Add point loads, UDLs, or applied moments and set their values.</li>
          <li>Read the reactions, diagrams, and key stations — they update automatically.</li>
          <li>Copy the results, or download a JSON file or Markdown report.</li>
        </ol>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">How to read the diagrams</h2>
        <p>
          The <strong>shear force diagram</strong> shows the internal vertical force. Point loads cause sudden steps; a UDL
          makes the line slope. The <strong>bending moment diagram</strong> shows how much the beam wants to bend. Positive
          (sagging) moment is plotted above the zero line and means tension on the bottom face; negative (hogging) moment
          means tension on top. The largest absolute moment marks where the beam works hardest.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">Limitations</h2>
        <p>
          This pass handles single-span, statically determinate beams with vertical loads and in-plane moments. It does not
          cover continuous beams, indeterminate supports, axial or torsional effects, deflection, material or section
          properties, dynamic loads, or load combinations and safety factors.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">Disclaimer</h2>
        <p>
          Results are for educational and preliminary analysis only. They are not a substitute for a licensed structural
          engineer. Always consult a qualified professional for real-world design or any safety-critical decision.
        </p>
      </section>
    </div>
  );
}
