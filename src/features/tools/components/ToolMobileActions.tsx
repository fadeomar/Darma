import { type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ToolMobileActionsProps = {
  children: ReactNode;
  className?: string;
};

export function ToolMobileActions({ children, className }: ToolMobileActionsProps) {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-30 -mx-4 mt-6 border-t border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] px-4 py-3 shadow-[0_-12px_30px_rgba(25,24,23,0.10)] supports-[backdrop-filter]:backdrop-blur-md supports-[padding:max(0px)]:pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden",
        className,
      )}
    >
      <div className="flex items-center gap-2 [&>*]:min-w-0 [&>*]:flex-1">{children}</div>
    </div>
  );
}
