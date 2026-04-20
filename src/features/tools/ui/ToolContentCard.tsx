import { ReactNode } from "react";
import SurfaceCard from "@/components/ui/SurfaceCard";

export default function ToolContentCard({
  title,
  description,
  children,
  className = "",
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <SurfaceCard className={className}>
      {title ? (
        <div className="mb-5">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {title}
          </h2>
          {description ? (
            <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
              {description}
            </p>
          ) : null}
        </div>
      ) : null}
      {children}
    </SurfaceCard>
  );
}
