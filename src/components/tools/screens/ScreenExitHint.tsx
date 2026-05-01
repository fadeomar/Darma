export default function ScreenExitHint({ className = "" }: { className?: string }) {
  return (
    <div
      className={[
        "pointer-events-none fixed right-4 top-4 z-50 rounded-full bg-black/55 px-4 py-2 text-xs font-bold text-white shadow-lg backdrop-blur",
        className,
      ].join(" ")}
    >
      Press Esc to exit fullscreen
    </div>
  );
}
