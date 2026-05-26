import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-overlay)] backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-[var(--color-text-secondary)] sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <p className="font-semibold text-[var(--color-text-primary)]">Darma</p>
          <p>Practical front-end ideas, mini projects, and free browser tools.</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Link href="/explore" className="transition hover:text-[var(--color-text-primary)]">Explore</Link>
          <Link href="/tools" className="transition hover:text-[var(--color-text-primary)]">Tools</Link>
          <Link href="/categories" className="transition hover:text-[var(--color-text-primary)]">Categories</Link>
          <Link href="/about" className="transition hover:text-[var(--color-text-primary)]">About</Link>
        </div>
      </div>
    </footer>
  );
}
