import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-black/10 bg-white/50">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-[var(--textColor)]/75 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <p className="font-semibold text-[var(--textColor)]">Darma</p>
          <p>Practical front-end ideas, mini projects, and free browser tools.</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Link href="/explore">Explore</Link>
          <Link href="/tools">Tools</Link>
          <Link href="/categories">Categories</Link>
          <Link href="/about">About</Link>
        </div>
      </div>
    </footer>
  );
}
