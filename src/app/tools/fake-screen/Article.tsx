import Link from "next/link";

export default function Article() {
  return (
    <div className="space-y-4 text-sm leading-7 text-[var(--color-text-muted)]">
      <p>
        Fake Screen combines what used to be many separate small pages into one focused tool. Choose a category, see the large preview, then use the action bar for fullscreen, share link, and reset.
      </p>
      <p>
        The fake update examples use CSS-only, Darma-built approximations of familiar update layouts — Windows 11/10/XP-inspired, Mac-style, Ubuntu-style, Chrome OS-style, Android-style, and terminal update screens. The spinner and progress behavior was improved to feel more natural while keeping everything safe and browser-only.
      </p>
      <p>
        The Canvas backgrounds category includes ten animated examples: circles, starfield, particle network, waves, aurora, fireflies, bubbles, snowfall, plasma, and confetti. These work well as fullscreen backgrounds for demos, video scenes, and ambient displays.
      </p>
      <h3 className="text-base font-bold text-[var(--color-text)]">Responsible use</h3>
      <p>
        Use prank-style screens only for harmless jokes, videos, demos, and creative scenes. Fullscreen requires a click and can always be exited with Esc. The tool does not open popups, block keyboard shortcuts, or modify the user device.
      </p>
      <div className="flex flex-wrap gap-2 pt-1">
        <Link href="/tools/color-shades" className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text)] hover:bg-[var(--color-surface-strong)]">Color Shades Generator</Link>
        <Link href="/tools/animated-background-generator" className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text)] hover:bg-[var(--color-surface-strong)]">Animated Background Generator</Link>
        <Link href="/tools/qr-code" className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text)] hover:bg-[var(--color-surface-strong)]">QR Code Generator</Link>
      </div>
    </div>
  );
}
