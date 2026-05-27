import { ReactNode } from "react";
import type { ToolDefinition } from "@/features/tools/domain/tool";
import { ToolPage } from "@/features/tools/layouts";

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
    <ToolPage tool={tool} intro={intro} maxWidth="wide">
      {sidebar ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
          <div className="min-w-0 space-y-6">{children}</div>
          <aside className="min-w-0 space-y-6 xl:sticky xl:top-24">{sidebar}</aside>
        </div>
      ) : (
        <div className="min-w-0 space-y-6">{children}</div>
      )}
    </ToolPage>
  );
}
