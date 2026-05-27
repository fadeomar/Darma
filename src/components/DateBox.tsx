
const DateBox = ({ date, label }: { date: Date; label: string }) => {
  const value = new Date(date);

  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-3 shadow-[var(--shadow-xs)]">
      <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-primary-border)] bg-[var(--color-primary-soft)]">
        <span className="font-mono text-sm font-bold text-[var(--color-primary)]">
          {value.toLocaleString("default", { day: "2-digit" })}
        </span>
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
          {value.toLocaleString("default", { month: "short" })}
        </span>
      </div>
      <div>
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{label}</p>
        <p className="mt-1 text-sm font-semibold text-[var(--color-text-primary)]">
          {value.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
};

export default DateBox;
