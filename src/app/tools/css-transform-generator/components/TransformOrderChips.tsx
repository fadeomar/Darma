import { Button } from "@/components/ui";
import type { Transform2DFunction } from "../types";

export function TransformOrderChips({ order, onChange }: { order: Transform2DFunction[]; onChange?: (order: Transform2DFunction[]) => void }) {
  const move = (index: number, direction: -1 | 1) => {
    if (!onChange) return;
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= order.length) return;
    const next = [...order];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {order.map((item, index) => (
          <div key={`${item}-${index}`} className="flex min-w-0 items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-2.5 py-1 text-xs font-bold text-[var(--color-text-soft)]">
            <span className="whitespace-nowrap">{index + 1}. {item}</span>
            {onChange ? (
              <span className="flex items-center gap-0.5 border-l border-[var(--color-border-subtle)] pl-1">
                <button type="button" className="rounded px-1 text-xs hover:bg-[var(--color-control-hover)] disabled:opacity-40" disabled={index === 0} onClick={() => move(index, -1)} aria-label={`Move ${item} earlier`}>←</button>
                <button type="button" className="rounded px-1 text-xs hover:bg-[var(--color-control-hover)] disabled:opacity-40" disabled={index === order.length - 1} onClick={() => move(index, 1)} aria-label={`Move ${item} later`}>→</button>
              </span>
            ) : null}
          </div>
        ))}
      </div>
      {onChange ? (
        <Button size="sm" variant="ghost" onClick={() => onChange(["translate", "rotate", "scale", "skew"])}>
          Reset order
        </Button>
      ) : null}
    </div>
  );
}
