import Link from "next/link";
import { prisma } from "@/server/db/prisma";
import { getToolRegistry } from "@/features/tools";
import { Badge, Card } from "@/components/ui";

type ModuleStatus = "published" | "in-progress" | "planned";

const MODULES: Array<{
  name: string;
  slug: string;
  description: string;
  status: ModuleStatus;
}> = [
  {
    name: "Elements Library",
    slug: "elements",
    description: "Reusable UI elements with previews and tags.",
    status: "published",
  },
  {
    name: "Darma Notes",
    slug: "darma",
    description:
      "Privacy-first case notes pipeline (templates + structured notes).",
    status: "in-progress",
  },
  {
    name: "TTS Studio",
    slug: "tts",
    description: "Offline text-to-speech tooling (Piper).",
    status: "planned",
  },
];

const linkButtonBase =
  "inline-flex min-h-[38px] items-center justify-center rounded-[var(--radius-sm)] px-3 text-sm font-semibold transition duration-[var(--duration-fast)]";
const linkButtonSecondary = `${linkButtonBase} border border-[var(--color-border-default)] bg-[var(--color-surface-base)] text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-subtle)]`;
const linkButtonPrimary = `${linkButtonBase} border border-transparent bg-[var(--color-primary)] text-[var(--color-primary-text)] hover:bg-[var(--color-primary-hover)]`;

function statusBadge(status: ModuleStatus) {
  if (status === "published") return <Badge variant="success">Published</Badge>;
  if (status === "in-progress") return <Badge variant="warning">In progress</Badge>;
  return <Badge variant="outline">Planned</Badge>;
}

function toolStatusBadge(status: string) {
  if (status === "ready") return <Badge variant="success">Ready</Badge>;
  if (status === "in_progress") return <Badge variant="warning">In progress</Badge>;
  return <Badge variant="outline">Planned</Badge>;
}

function StatCard({
  label,
  value,
  href,
  hint,
}: {
  label: string;
  value: string | number;
  href?: string;
  hint?: string;
}) {
  const content = (
    <Card padding="sm" className="h-full">
      <div className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
        {label}
      </div>
      <div className="mt-2 text-3xl font-semibold tracking-tight text-[var(--color-text-primary)]">
        {value}
      </div>
      {hint ? (
        <div className="mt-1 text-xs leading-5 text-[var(--color-text-tertiary)]">
          {hint}
        </div>
      ) : null}
    </Card>
  );

  return href ? (
    <Link href={href} className="block h-full transition hover:-translate-y-0.5">
      {content}
    </Link>
  ) : (
    content
  );
}

export default async function AdminDashboardPage() {
  const [
    usersCount,
    elementsCount,
    publishedCount,
    pendingCount,
    deletedCount,
    missingCategoryCount,
    missingShortDescriptionCount,
    missingTagsCount,
    recent,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.element.count(),
    prisma.element.count({ where: { reviewed: true, deleted: false } }),
    prisma.element.count({ where: { reviewed: false, deleted: false } }),
    prisma.element.count({ where: { deleted: true } }),
    // Content-health checks (live, non-deleted items only)
    prisma.element.count({
      where: { deleted: false, mainCategory: { isEmpty: true } },
    }),
    prisma.element.count({
      where: {
        deleted: false,
        OR: [{ shortDescription: null }, { shortDescription: "" }],
      },
    }),
    prisma.element.count({
      where: { deleted: false, tags: { isEmpty: true } },
    }),
    prisma.element.findMany({
      take: 6,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        updatedAt: true,
        reviewed: true,
        deleted: true,
      },
    }),
  ]);

  const visitorsToday = "—";

  const tools = getToolRegistry()
    .list()
    .filter((t) => t.visibility === "public")
    .sort((a, b) => a.title.localeCompare(b.title));

  // The Elements module is the dashboard's main focus; other internal modules
  // are kept secondary so the dashboard centers on Explore content.
  const primaryModule = MODULES.find((m) => m.slug === "elements") ?? null;
  const secondaryModules = MODULES.filter((m) => m.slug !== "elements");

  return (
    <div className="space-y-8">
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-subtle)] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text-primary)]">
              Dashboard
            </h1>
            <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">
              Manage content, review submissions, and monitor project tools.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link href="/admin/review" className={linkButtonSecondary}>
              Review Queue
            </Link>
            <Link href="/admin/elements" className={linkButtonSecondary}>
              Manage Elements
            </Link>
            <Link href="/admin/elements?new=1" className={linkButtonPrimary}>
              + Add Explore element
            </Link>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Overview
          </h2>
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
            Live DB
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total elements"
            value={elementsCount}
            href="/admin/elements"
            hint="All Explore items"
          />
          <StatCard
            label="Published"
            value={publishedCount}
            href="/admin/review?status=approved"
            hint="Reviewed & live in Explore"
          />
          <StatCard
            label="Pending review"
            value={pendingCount}
            href="/admin/review"
            hint="Unreviewed, not deleted"
          />
          <StatCard
            label="Deleted"
            value={deletedCount}
            href="/admin/review?status=deleted"
            hint="Soft-deleted items"
          />
        </div>

        <div className="mt-3 text-xs leading-5 text-[var(--color-text-tertiary)]">
          {usersCount} admin {usersCount === 1 ? "account" : "accounts"} ·
          Visitors today: <strong>{visitorsToday}</strong> (tracking not enabled yet).
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Content health
          </h2>
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
            Live items
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <StatCard
            label="Missing category"
            value={missingCategoryCount}
            href="/admin/elements"
            hint="No main category set"
          />
          <StatCard
            label="Missing short description"
            value={missingShortDescriptionCount}
            href="/admin/elements"
            hint="Empty card summary"
          />
          <StatCard
            label="Missing tags"
            value={missingTagsCount}
            href="/admin/elements"
            hint="No tags for discovery"
          />
        </div>

        <div className="mt-3 text-xs leading-5 text-[var(--color-text-tertiary)]">
          These counts highlight Explore items that need cleanup before they look
          their best. Excludes deleted items.
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Primary workspace
          </h2>
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
            Explore / Elements
          </div>
        </div>

        {primaryModule ? (
          <Card padding="sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="truncate text-base font-semibold text-[var(--color-text-primary)]">
                    {primaryModule.name}
                  </div>
                  {statusBadge(primaryModule.status)}
                </div>
                <div className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">
                  {primaryModule.description}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link href="/admin/elements" className={linkButtonSecondary}>
                  Open manager
                </Link>
                <Link href="/admin/elements?new=1" className={linkButtonPrimary}>
                  Add element
                </Link>
              </div>
            </div>
          </Card>
        ) : null}

        {secondaryModules.length > 0 ? (
          <div className="mt-2 text-xs leading-5 text-[var(--color-text-tertiary)]">
            Other internal modules (no admin view yet):{" "}
            {secondaryModules.map((m) => m.name).join(", ")}.
          </div>
        ) : null}
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Tools catalog
          </h2>
          <Link href="/tools" className={linkButtonSecondary}>
            Open public tools page
          </Link>
        </div>

        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] shadow-[var(--shadow-card)]">
          <div className="grid grid-cols-12 gap-2 border-b border-[var(--color-border-default)] bg-[var(--color-surface-subtle)] px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
            <div className="col-span-5">Tool</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-3">Completion</div>
            <div className="col-span-2 text-right">Visitors</div>
          </div>

          <div className="divide-y divide-[var(--color-border-default)]">
            {tools.map((tool) => {
              const completion = Math.max(
                0,
                Math.min(
                  100,
                  Number.isFinite(tool.completion) ? Number(tool.completion) : 0,
                ),
              );
              const status = tool.status ?? "planned";
              const visitors = typeof tool.visitors === "number" ? tool.visitors : null;

              return (
                <div
                  key={tool.id}
                  className="grid grid-cols-12 items-center gap-2 px-4 py-3"
                >
                  <div className="col-span-5 min-w-0">
                    <Link
                      href={tool.href}
                      className="block truncate font-semibold text-[var(--color-text-primary)] hover:text-[var(--color-primary)]"
                    >
                      {tool.title}
                    </Link>
                    <div className="mt-0.5 truncate text-xs text-[var(--color-text-tertiary)]">
                      {tool.description}
                    </div>
                  </div>

                  <div className="col-span-2">{toolStatusBadge(status)}</div>

                  <div className="col-span-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-full overflow-hidden rounded-[var(--radius-full)] bg-[var(--color-control-track)]">
                        <div
                          className="h-2 rounded-[var(--radius-full)] bg-[var(--color-primary)]"
                          style={{ width: `${completion}%` }}
                        />
                      </div>
                      <div className="w-10 text-right font-mono text-[10px] font-bold text-[var(--color-text-secondary)]">
                        {completion}%
                      </div>
                    </div>
                  </div>

                  <div className="col-span-2 text-right text-sm font-semibold text-[var(--color-text-secondary)]">
                    {visitors ?? "—"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-2 text-xs leading-5 text-[var(--color-text-tertiary)]">
          Visitor counts remain hidden until privacy-first tracking is enabled.
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Latest element changes
          </h2>
          <Link
            href="/admin/elements"
            className="text-sm font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]"
          >
            View all
          </Link>
        </div>

        {recent.length === 0 ? (
          <Card className="text-sm text-[var(--color-text-secondary)]">
            No elements yet.
          </Card>
        ) : (
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] shadow-[var(--shadow-card)]">
            <div className="divide-y divide-[var(--color-border-default)]">
              {recent.map((element) => {
                const href = element.slug
                  ? `/elements/${element.slug}`
                  : `/element/${element.id}`;
                return (
                  <div
                    key={element.id}
                    className="flex flex-wrap items-center justify-between gap-3 p-4"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-[var(--color-text-primary)]">
                        {element.title}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-tertiary)]">
                        <span>Updated {element.updatedAt.toLocaleString()}</span>
                        {element.deleted ? <Badge variant="danger">Deleted</Badge> : null}
                        {!element.deleted && !element.reviewed ? (
                          <Badge variant="warning">Pending review</Badge>
                        ) : null}
                        {!element.deleted && element.reviewed ? (
                          <Badge variant="success">Reviewed</Badge>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link href={href} className={linkButtonSecondary}>
                        Preview
                      </Link>
                      <Link href="/admin/elements" className={linkButtonPrimary}>
                        Manage
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
