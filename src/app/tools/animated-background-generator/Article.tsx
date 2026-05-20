export default function Article() {
  return (
    <div className="space-y-4 text-sm leading-7 text-[var(--color-text-muted)]">
      <p>
        Pick a preset, adjust the speed, colors, particle count, and blend mode, then copy the generated HTML and CSS directly into your project. The preview updates live as you change settings.
      </p>
      <p>
        The output is plain HTML with a single <code className="rounded bg-[var(--color-surface-strong)] px-1 font-mono text-xs">&lt;div&gt;</code> and a set of <code className="rounded bg-[var(--color-surface-strong)] px-1 font-mono text-xs">&lt;span&gt;</code> children. The CSS uses custom properties for drift and rotation so the animation is GPU-friendly and works in all modern browsers. A <code className="rounded bg-[var(--color-surface-strong)] px-1 font-mono text-xs">prefers-reduced-motion</code> media query disables animation for users who prefer less motion.
      </p>
      <p>
        All generation runs in your browser. Nothing is sent to a server.
      </p>
    </div>
  );
}
