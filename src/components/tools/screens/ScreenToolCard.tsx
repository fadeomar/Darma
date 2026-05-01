import Link from "next/link";
import type { ReactNode } from "react";

export default function ScreenToolCard({
  href,
  title,
  description,
  children,
}: {
  href: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-[28px] border border-black/10 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="mb-4 h-32 overflow-hidden rounded-3xl border border-black/10 bg-slate-100">
        {children}
      </div>
      <h3 className="text-xl font-black text-[var(--textColor)]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--textColor)]/70">
        {description}
      </p>
    </Link>
  );
}
