import { Button } from "@/components/ui";
import type { AlignAction, DistributeAction } from "../editor/objectLayout";

export default function ArrangePanel({ count, onAlign, onDistribute }: {
  count: number;
  onAlign: (action: AlignAction) => void;
  onDistribute: (action: DistributeAction) => void;
}) {
  if (count < 2) return null;

  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4">
      <div className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-text-tertiary)]">Arrange</div>
      <p className="mb-3 text-xs leading-5 text-[var(--color-text-tertiary)]">Align selected objects to their shared bounds. Three or more objects can also be distributed evenly.</p>
      <div className="grid grid-cols-3 gap-2">
        <Button size="sm" variant="ghost" onClick={() => onAlign("left")}>Left</Button>
        <Button size="sm" variant="ghost" onClick={() => onAlign("center-x")}>H center</Button>
        <Button size="sm" variant="ghost" onClick={() => onAlign("right")}>Right</Button>
        <Button size="sm" variant="ghost" onClick={() => onAlign("top")}>Top</Button>
        <Button size="sm" variant="ghost" onClick={() => onAlign("center-y")}>V center</Button>
        <Button size="sm" variant="ghost" onClick={() => onAlign("bottom")}>Bottom</Button>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Button size="sm" variant="secondary" onClick={() => onDistribute("horizontal")} disabled={count < 3}>Distribute H</Button>
        <Button size="sm" variant="secondary" onClick={() => onDistribute("vertical")} disabled={count < 3}>Distribute V</Button>
      </div>
    </section>
  );
}
