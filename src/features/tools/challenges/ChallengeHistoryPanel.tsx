import { type ReactNode } from "react";
import { Badge, Button } from "@/components/ui";
import { ChallengeCard } from "./ChallengeCard";

export function ChallengePersonalBestCard({
  eyebrow = "Personal best",
  title,
  icon,
  emptyLabel = "Empty",
  badge,
  children,
  empty,
}: {
  eyebrow?: string;
  title: ReactNode;
  icon?: ReactNode;
  emptyLabel?: string;
  badge?: ReactNode;
  children?: ReactNode;
  empty?: ReactNode;
}) {
  const hasBest = Boolean(children);

  return (
    <ChallengeCard className="p-5 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">{eyebrow}</p>
          <h3 className="mt-2 flex items-center gap-2 text-lg font-black tracking-[-0.02em] text-[var(--color-text-primary)]">
            {icon}
            {title}
          </h3>
        </div>
        {hasBest ? badge : <Badge variant="outline">{emptyLabel}</Badge>}
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-[var(--radius-full)] bg-[var(--color-surface-subtle)]">
        <div className="h-full w-2/3 rounded-[var(--radius-full)] bg-[linear-gradient(90deg,var(--color-primary),var(--color-accent))] opacity-70" />
      </div>
      {hasBest ? children : empty}
    </ChallengeCard>
  );
}

export function ChallengeHistoryPanel<TAttempt>({
  eyebrow = "Attempts",
  title,
  icon,
  items,
  renderItem,
  empty,
  clearLabel = "Clear",
  onClear,
}: {
  eyebrow?: string;
  title: ReactNode;
  icon?: ReactNode;
  items: TAttempt[];
  renderItem: (item: TAttempt, index: number) => ReactNode;
  empty: ReactNode;
  clearLabel?: string;
  onClear?: () => void;
}) {
  return (
    <ChallengeCard className="p-5 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">{eyebrow}</p>
          <h3 className="mt-2 flex items-center gap-2 text-lg font-black tracking-[-0.02em] text-[var(--color-text-primary)]">
            {icon}
            {title}
          </h3>
        </div>
        {items.length && onClear ? (
          <Button size="sm" variant="ghost" onClick={onClear}>
            {clearLabel}
          </Button>
        ) : null}
      </div>

      {items.length ? (
        <div className="mt-4 space-y-2">
          {items.map((item, index) => (
            <div key={index}>
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      ) : (
        empty
      )}
    </ChallengeCard>
  );
}
