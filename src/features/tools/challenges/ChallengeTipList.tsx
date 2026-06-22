import { type ReactNode } from "react";
import { ChallengeCard } from "./ChallengeCard";

export type ChallengeTip = {
  icon?: ReactNode;
  text: ReactNode;
};

export function ChallengeTipList({
  eyebrow,
  tips,
}: {
  eyebrow: string;
  tips: ChallengeTip[];
}) {
  return (
    <ChallengeCard className="p-5 sm:p-5">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--color-text-tertiary)]">{eyebrow}</p>
      <div className="mt-4 space-y-3 text-sm leading-6 text-[var(--color-text-secondary)]">
        {tips.map((tip, index) => (
          <p key={index} className="flex gap-3">
            {tip.icon}
            {tip.text}
          </p>
        ))}
      </div>
    </ChallengeCard>
  );
}
