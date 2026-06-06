import Image from "next/image";
import { cn } from "@/lib/cn";

export function PasswordHeroIllustration({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] shadow-[var(--shadow-card)]",
        compact ? "min-h-[150px] p-3" : "min-h-[260px] p-5 sm:p-6",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,var(--color-primary-soft),transparent_34%),radial-gradient(circle_at_82%_20%,var(--color-accent-soft),transparent_30%)]" />

      <div className={cn("relative mx-auto", compact ? "max-w-[260px]" : "max-w-[420px]")}> 
        <svg
          viewBox="0 0 420 300"
          className="h-auto w-full"
        >
          <rect x="76" y="38" width="268" height="190" rx="28" fill="var(--color-surface-raised)" stroke="var(--color-border-strong)" strokeWidth="3" />
          <rect x="98" y="70" width="224" height="116" rx="18" fill="var(--color-accent-soft)" stroke="var(--color-primary-border)" strokeWidth="2" />
          <rect x="124" y="108" width="172" height="28" rx="14" fill="var(--color-surface-base)" stroke="var(--color-border-default)" />
          <text x="144" y="128" fill="var(--color-text-primary)" fontSize="22" fontFamily="monospace" fontWeight="700">
            ••••••••••••
          </text>
          <path d="M210 152c34-14 62 2 76 29" fill="none" stroke="var(--color-accent)" strokeWidth="4" strokeLinecap="round" />
          <path d="M286 181l-15-2 9-12" fill="none" stroke="var(--color-accent)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="160" y="206" width="100" height="16" rx="8" fill="var(--color-border-default)" />
          <rect x="126" y="240" width="168" height="22" rx="11" fill="var(--color-surface-raised)" stroke="var(--color-border-default)" />
          <path d="M210 82c24 14 48 15 48 15v33c0 34-28 50-48 58-20-8-48-24-48-58V97s24-1 48-15Z" fill="var(--color-primary-soft)" stroke="var(--color-primary)" strokeWidth="4" />
          <path d="m191 131 13 13 28-31" fill="none" stroke="var(--color-success)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="318" cy="58" r="36" fill="var(--color-success)" stroke="var(--color-surface-base)" strokeWidth="7" />
          <path d="m302 58 11 11 22-24" fill="none" stroke="var(--color-primary-text)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="38" y="134" width="96" height="54" rx="16" fill="var(--color-surface-raised)" stroke="var(--color-border-default)" />
          <rect x="58" y="164" width="56" height="7" rx="3.5" fill="var(--color-border-strong)" />
          <circle cx="86" cy="151" r="13" fill="var(--color-accent-soft)" />
          <rect x="286" y="128" width="92" height="70" rx="18" fill="var(--color-surface-raised)" stroke="var(--color-border-default)" />
          <rect x="304" y="154" width="48" height="8" rx="4" fill="var(--color-primary-border)" />
          <rect x="304" y="170" width="34" height="8" rx="4" fill="var(--color-accent-border)" />
        </svg>

        {!compact ? (
          <div className="absolute -bottom-5 -right-3 hidden w-32 rotate-3 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-2 shadow-[var(--shadow-md)] sm:block">
            <Image
              src="/assets/tools/password-generator/security-phone.png"
              width={301}
              height={240}
              alt=""
              className="h-auto w-full"
              priority={false}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
