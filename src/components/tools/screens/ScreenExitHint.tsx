export default function ScreenExitHint({ className = "" }: { className?: string }) {
  return (
    <div
      className={[
        "pointer-events-none fixed right-4 top-4 z-50 rounded-[var(--radius-full)] border border-[var(--color-code-border)] bg-[var(--color-code-bg)] px-4 py-2 text-xs font-bold text-[var(--color-code-text)] shadow-[var(--shadow-md)]",
        className,
      ].join(" ")}
    >
      Press Esc to exit fullscreen
    </div>
  );
}
