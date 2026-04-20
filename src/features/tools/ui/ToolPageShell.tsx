import { ReactNode } from "react";
import Link from "next/link";
import type { ToolDefinition } from "@/features/tools/domain/tool";
import SurfaceCard from "@/components/ui/SurfaceCard";

const audienceLabels: Record<string, string> = {
  developer: "Developer",
  designer: "Designer",
  student: "Student",
  creator: "Creator",
  general: "General",
};

export default function ToolPageShell({
  tool,
  intro,
  children,
  sidebar,
}: {
  tool: ToolDefinition;
  intro?: ReactNode;
  children: ReactNode;
  sidebar?: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-black/10 bg-white/70 p-8 shadow-sm backdrop-blur">
        <Link
          href="/tools"
          className="inline-flex text-sm font-semibold text-slate-600 transition hover:text-slate-900"
        >
          ← Back to tools
        </Link>
        <div className="mt-4 flex flex-wrap gap-2">
          {(tool.audiences ?? []).map((audience) => (
            <span
              key={audience}
              className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-700"
            >
              {audienceLabels[audience] ?? audience}
            </span>
          ))}
          {tool.secondaryCategory.map((category) => (
            <span
              key={category}
              className="rounded-full border border-black/10 px-3 py-1 text-xs font-semibold text-slate-700"
            >
              {category}
            </span>
          ))}
        </div>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900 dark:text-slate-100">
          {tool.title}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700 dark:text-slate-300">
          {tool.description}
        </p>
        {intro ? <div className="mt-6">{intro}</div> : null}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">{children}</div>
        <aside className="space-y-6">
          {sidebar ? (
            sidebar
          ) : (
            <SurfaceCard>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                How to use it
              </h2>
              <ol className="mt-3 space-y-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
                <li>1. Adjust the settings.</li>
                <li>2. Preview the result live.</li>
                <li>3. Copy the output into your project.</li>
              </ol>
            </SurfaceCard>
          )}
        </aside>
      </div>
    </div>
  );
}
