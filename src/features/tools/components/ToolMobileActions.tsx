import { type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ToolMobileActionsProps = {
  children?: ReactNode;
  primary?: ReactNode;
  secondary?: ReactNode;
  className?: string;
};

export function ToolMobileActions({ children, primary, secondary, className }: ToolMobileActionsProps) {
  const content = children ?? (<>
    {primary}
    {secondary}
  </>);
  return (
    <div
      data-tool-mobile-actions
      className={cn(
        "sticky bottom-0 z-30 -mx-4 mt-5 border-y border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] px-4 py-3 shadow-[0_-14px_34px_rgba(25,24,23,0.14)] supports-[backdrop-filter]:backdrop-blur-xl supports-[padding:max(0px)]:pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden",
        className,
      )}
    >
      <div className="mx-auto flex max-w-xl items-center gap-2 [&>*]:min-w-0 [&>*]:flex-1 [&_button]:w-full [&_a]:w-full">{content}</div>
    </div>
  );
}
