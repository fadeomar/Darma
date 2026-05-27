import TooltipCard from "@/components/TooltipCard";
import tooltips from "@/data/tooltips/index.json";

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--color-page-bg)] px-4 py-10 text-[var(--color-text-primary)]">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
            Legacy tooltip lab
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Tooltip previews
          </h1>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {tooltips.map((tooltip) => (
            <TooltipCard key={tooltip.id} tooltip={tooltip} />
          ))}
        </div>
      </div>
    </main>
  );
}
