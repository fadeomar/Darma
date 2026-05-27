import Link from "next/link";
import SurfaceCard from "@/components/ui/SurfaceCard";
import { SCREEN_TOOL_LINKS, type ScreenToolId } from "@/lib/tools/screens/types";

export default function RelatedScreenTools({ current }: { current: ScreenToolId }) {
  const related = SCREEN_TOOL_LINKS.filter((tool) => tool.id !== current);
  return (
    <SurfaceCard>
      <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
        Related screen tools
      </h2>
      <div className="mt-4 space-y-3">
        {related.slice(0, 4).map((tool) => (
          <Link
            key={tool.id}
            href={tool.href}
            className="block rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-4 transition hover:-translate-y-0.5 hover:border-[var(--color-primary-border)] hover:shadow-[var(--shadow-card)]"
          >
            <span className="font-bold text-[var(--color-text-primary)]">{tool.title}</span>
            <span className="mt-1 block text-xs leading-5 text-[var(--color-text-secondary)]">
              {tool.description}
            </span>
          </Link>
        ))}
      </div>
    </SurfaceCard>
  );
}
