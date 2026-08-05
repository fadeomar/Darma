
import Link from "next/link";
import { Badge, Card } from "@/components/ui";
import { RouteLostArtwork } from "@/components/visuals";

const suggestions = [
  { href: "/tools", label: "Open tools" },
  { href: "/explore", label: "Browse examples" },
  { href: "/categories", label: "View categories" },
];

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-5xl items-center px-4 py-16 sm:px-6 lg:px-8">
      <Card padding="lg" className="w-full overflow-hidden">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-center">
          <div>
            <Badge variant="warning">404</Badge>
            <h1 className="mt-5 text-4xl font-black tracking-[-0.045em] text-[var(--color-text-primary)] sm:text-5xl">
              This page is not in the workshop.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-[var(--color-text-secondary)]">
              The link may be old, moved, or still waiting to be published. Head back to a useful Darma area and keep working.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/" className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] px-5 text-sm font-semibold text-[var(--color-primary-text)] shadow-[var(--shadow-xs)] transition hover:bg-[var(--color-primary-hover)]">
                Return home
              </Link>
              {suggestions.map((item) => (
                <Link key={item.href} href={item.href} className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] px-5 text-sm font-semibold text-[var(--color-text-primary)] shadow-[var(--shadow-xs)] transition hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-subtle)]">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <RouteLostArtwork />
            <div className="route-lost-console">
              <span>darma/routes</span>
              <strong>status: <i>not_found</i></strong>
              <strong>next: <b>/tools</b></strong>
              <strong>fallback: <em>workshop_home</em></strong>
            </div>
          </div>
        </div>
      </Card>
    </main>
  );
}
