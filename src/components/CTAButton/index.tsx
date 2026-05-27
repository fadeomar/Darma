import Link from "next/link";

interface FancyCTAButtonProps {
  href: string;
  label: string;
}

export default function FancyCTAButton({ href, label }: FancyCTAButtonProps) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-full)] border border-transparent bg-[var(--color-primary)] px-6 text-lg font-semibold text-[var(--color-primary-text)] shadow-[var(--shadow-xs)] transition hover:bg-[var(--color-primary-hover)]"
      aria-label={`Navigate to ${label} page`}
    >
      {label}
    </Link>
  );
}
