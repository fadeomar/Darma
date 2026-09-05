export default function BeamCalculatorArticle() {
  return (
    <div className="space-y-7 text-sm leading-7 text-[var(--color-text-secondary)]">
      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">
          What this tool calculates
        </h2>
        <p>
          Beam Calculator Studio solves statically determinate beams
          for support reactions, shear force, and bending moment, then draws the
          shear force diagram (SFD) and bending moment diagram (BMD). It reports
          the maximum shear, maximum sagging and hogging moments, fixed-end
          moment for cantilevers, and an equilibrium check that confirms whether
          the reactions balance the applied loads.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">
          Supported beams and loads
        </h2>
        <ul className="list-inside list-disc space-y-2">
          <li>
            <strong>Simply supported beam</strong> — two distinct pin or roller
            supports.
          </li>
          <li>
            <strong>Cantilever beam</strong> — one fixed support at either end.
          </li>
          <li>
            <strong>Point loads</strong> — concentrated upward or downward
            forces.
          </li>
          <li>
            <strong>Uniformly distributed loads</strong> — constant intensity
            over a selected range.
          </li>
          <li>
            <strong>Applied moments</strong> — clockwise or counter-clockwise
            concentrated moments.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">
          A safer production workflow
        </h2>
        <p>
          Phase 33 separates a mathematically solvable model from a review-ready
          handoff. The production audit checks input validity, zero or unusually
          dense load models, force and moment equilibrium, upward-load sign
          conventions, and the limits of the current analysis scope. Imported
          project files are limited to 1 MB and must use the correct
          tool/version, unique support and load IDs, and non-negative
          magnitudes.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">
          Exports and handoff
        </h2>
        <p>
          Download solved results as JSON, key stations as CSV, a Markdown
          report with readiness findings, or a standalone SVG containing both
          diagrams. The ZIP production pack combines the editable beam project,
          solved data, report, station table, diagrams, and a scope README in
          one portable handoff.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">
          How to read the diagrams
        </h2>
        <p>
          The <strong>shear force diagram</strong> shows the internal vertical
          force. Point loads create steps, while a UDL changes the slope. The{" "}
          <strong>bending moment diagram</strong> shows the internal bending
          action. Positive sagging moment is plotted above the zero line and
          negative hogging moment below it. The largest absolute moment
          identifies the most highly demanded location within this simplified
          statics model.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">
          Limitations
        </h2>
        <p>
          The calculator handles single-span, statically determinate beams with
          vertical loads and in-plane moments. It does not calculate material
          strength, section capacity, stress, deflection, stability, continuous
          or indeterminate beams, axial or torsional effects, dynamic loads,
          code load combinations, or safety factors.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">
          Disclaimer
        </h2>
        <p>
          Results are for education and preliminary analysis only. A passing
          readiness audit does not make a member safe or code-compliant. Always
          use a qualified structural engineer for real-world design,
          construction, assessment, or any safety-critical decision.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">
          Use the scenario library to learn load behavior
        </h2>
        <p>
          The expanded presets deliberately cover centered and off-center point
          loads, full and partial UDLs, applied moments, upward loads, combined
          loading, and cantilevers. Pick the closest loading pattern first, then
          change span and magnitudes instead of rebuilding every support and load
          from a blank model. Every scenario stays an educational starting point
          for preliminary analysis, not a structural design recommendation.
        </p>
      </section>
    </div>
  );
}
