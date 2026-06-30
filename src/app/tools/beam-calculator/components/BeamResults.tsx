import type { BeamModel, BeamResult, UnitLabels } from "../lib/beamTypes";
import { formatNumber, formatSigned } from "../lib/beamFormatting";
import { buildBeamExplanation } from "../lib/beamExplain";

type BeamResultsProps = {
  model: BeamModel;
  result: BeamResult;
  units: UnitLabels;
};

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3 text-center">
      <div className="font-mono text-lg font-black tabular-nums text-[var(--color-text-primary)]">{value}</div>
      <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{label}</div>
      {sub ? <div className="mt-0.5 text-[10px] text-[var(--color-text-tertiary)]">{sub}</div> : null}
    </div>
  );
}

export function BeamResults({ model, result, units }: BeamResultsProps) {
  const fixedReaction = result.reactions.find((r) => r.moment !== undefined);

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {result.reactions.map((r) => (
          <StatCard
            key={r.supportId}
            label={`Reaction ${r.supportId}`}
            value={`${formatSigned(r.fy)} ${units.force}`}
            sub={`${r.type} @ x = ${formatNumber(r.x)} ${units.length}`}
          />
        ))}
        {fixedReaction ? (
          <StatCard
            label="Fixed-end moment"
            value={`${formatSigned(fixedReaction.moment ?? 0)} ${units.moment}`}
            sub={`@ x = ${formatNumber(fixedReaction.x)} ${units.length}`}
          />
        ) : null}
        <StatCard label="Max shear" value={`${formatSigned(result.maxShear.value)} ${units.force}`} sub={`@ x = ${formatNumber(result.maxShear.x)} ${units.length}`} />
        <StatCard
          label="Max |moment|"
          value={`${formatNumber(Math.abs(result.maxAbsMoment.value))} ${units.moment}`}
          sub={`@ x = ${formatNumber(result.maxAbsMoment.x)} ${units.length}`}
        />
        <StatCard
          label="Equilibrium"
          value={result.equilibrium.balanced ? "Balanced" : "Check inputs"}
          sub={`ΣFy = ${formatNumber(result.equilibrium.sumFy, 3)} · ΣM = ${formatNumber(result.equilibrium.sumMoment, 3)}`}
        />
      </div>

      {/* Detailed station table */}
      <section className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]">
        <div className="border-b border-[var(--color-border-subtle)] px-3 py-2">
          <h3 className="text-xs font-bold text-[var(--color-text-primary)]">Key stations</h3>
        </div>
        <div className="max-h-72 overflow-y-auto">
          <table className="w-full min-w-[28rem] border-collapse text-right text-xs">
            <thead className="sticky top-0 bg-[var(--color-surface-subtle)] text-[var(--color-text-tertiary)]">
              <tr>
                {[`x (${units.length})`, `Shear (${units.force})`, `Moment (${units.moment})`, "Station"].map((h) => (
                  <th key={h} className="px-3 py-2 font-semibold first:text-left last:text-left">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.keyStations.map((s, i) => (
                <tr key={`${s.x}-${i}`} className="border-t border-[var(--color-border-subtle)]">
                  <td className="px-3 py-2 text-left font-mono font-bold text-[var(--color-text-primary)]">{formatNumber(s.x)}</td>
                  <td className="px-3 py-2 font-mono tabular-nums">{formatSigned(s.shear)}</td>
                  <td className="px-3 py-2 font-mono tabular-nums">{formatSigned(s.moment)}</td>
                  <td className="px-3 py-2 text-left text-[var(--color-text-secondary)]">{s.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Plain-language explanation */}
      <section className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]/60 p-4">
        <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.06em] text-[var(--color-text-tertiary)]">What this means</h3>
        <p className="text-sm leading-6 text-[var(--color-text-secondary)]">{buildBeamExplanation(model, result, units)}</p>
      </section>
    </div>
  );
}
