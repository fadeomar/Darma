import { Kbd } from "./Kbd";

export function KeyboardHint({ keys, label }: { keys: string[]; label: string }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1 text-xs text-[var(--color-text-tertiary)]">
      {keys.map((key) => <Kbd key={key}>{key}</Kbd>)}
      <span>{label}</span>
    </span>
  );
}
