import Link from "next/link";
import { prisma } from "@/server/db/prisma";
import { getToolRegistry } from "@/features/tools";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function Badge({
  tone,
  children,
}: {
  tone: "green" | "amber" | "zinc" | "red";
  children: React.ReactNode;
}) {
  const cls =
    tone === "green"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : tone === "amber"
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : tone === "red"
          ? "bg-rose-50 text-rose-700 border-rose-200"
          : "bg-zinc-50 text-zinc-700 border-zinc-200";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${cls}`}
    >
      {children}
    </span>
  );
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
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="text-xs font-medium text-zinc-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
      {hint ? <div className="mt-1 text-xs text-zinc-500">{hint}</div> : null}
    </div>
  );

  return href ? (
    <Link href={href} className="block transition hover:opacity-90">
      {content}
    </Link>
  ) : (
    content
  );
}

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

function statusBadge(status: ModuleStatus) {
  if (status === "published") return <Badge tone="green">Published</Badge>;
  if (status === "in-progress") return <Badge tone="amber">In progress</Badge>;
  return <Badge tone="zinc">Planned</Badge>;
}

export default async function AdminDashboardPage() {
  const [usersCount, elementsCount, pendingCount, deletedCount, recent] =
    await Promise.all([
      prisma.user.count(),
      prisma.element.count(),
      prisma.element.count({ where: { reviewed: false, deleted: false } }),
      prisma.element.count({ where: { deleted: true } }),
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

  // Visitors: no tracking table yet → keep as placeholder without pretending we measured it.
  const visitorsToday = "—";

  const tools = getToolRegistry()
    .list()
    .filter((t) => t.visibility === "public")
    .sort((a, b) => a.title.localeCompare(b.title));

  return (
    <div className="space-y-8">
      {/* Hero / quick actions */}
      <section className="rounded-2xl border bg-zinc-50 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Manage content, review submissions, and monitor project tools.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/elements"
              className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-100"
            >
              Manage Elements
            </Link>
            <Link
              href="/admin/review"
              className="rounded-xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              Open Review Queue
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900">Overview</h2>
          <div className="text-xs text-zinc-500">Updated live from DB</div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Users"
            value={usersCount}
            href="/admin"
            hint="Total registered"
          />
          <StatCard
            label="Elements"
            value={elementsCount}
            href="/admin/elements"
            hint="Total items"
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
            href="/admin/review"
            hint="Soft-deleted items"
          />
        </div>

        <div className="mt-3 text-xs text-zinc-500">
          Visitors today:{" "}
          <span className="font-semibold text-zinc-700">{visitorsToday}</span>{" "}
          (tracking not enabled yet)
        </div>
      </section>

      {/* Project modules */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900">
            Project modules
          </h2>
          <div className="text-xs text-zinc-500">Status board</div>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {MODULES.map((t) => (
            <div
              key={t.slug}
              className="rounded-2xl border bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-base font-semibold">
                    {t.name}
                  </div>
                  <div className="mt-1 text-sm text-zinc-600">
                    {t.description}
                  </div>
                </div>
                <div className="shrink-0">{statusBadge(t.status)}</div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {t.slug === "elements" ? (
                  <Link
                    href="/admin/elements"
                    className="rounded-xl border px-3 py-2 text-sm font-semibold hover:bg-zinc-50"
                  >
                    Open manager
                  </Link>
                ) : (
                  <div className="text-xs text-zinc-500">No admin view yet</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tools catalog */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900">Tools catalog</h2>
          <div className="flex items-center gap-2">
            <Link
              href="/tools"
              className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold hover:bg-zinc-50"
            >
              Open public tools page
            </Link>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="grid grid-cols-12 gap-2 border-b bg-zinc-50 px-4 py-3 text-xs font-semibold text-zinc-600">
            <div className="col-span-5">Tool</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-3">Completion</div>
            <div className="col-span-2 text-right">Visitors</div>
          </div>

          <div className="divide-y">
            {tools.map((t) => {
              const completion = Math.max(
                0,
                Math.min(
                  100,
                  Number.isFinite(t.completion) ? Number(t.completion) : 0,
                ),
              );
              const status = t.status ?? "planned";
              const visitors =
                typeof t.visitors === "number" ? t.visitors : null;

              return (
                <div
                  key={t.id}
                  className="grid grid-cols-12 items-center gap-2 px-4 py-3"
                >
                  <div className="col-span-5 min-w-0">
                    <Link
                      href={t.href}
                      className="block truncate font-semibold hover:underline"
                    >
                      {t.title}
                    </Link>
                    <div className="mt-0.5 truncate text-xs text-zinc-500">
                      {t.description}
                    </div>
                  </div>

                  <div className="col-span-2">
                    {status === "ready" ? (
                      <Badge tone="green">Ready</Badge>
                    ) : status === "in_progress" ? (
                      <Badge tone="amber">In progress</Badge>
                    ) : (
                      <Badge tone="zinc">Planned</Badge>
                    )}
                  </div>

                  <div className="col-span-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-full rounded-full bg-zinc-100">
                        <div
                          className="h-2 rounded-full bg-zinc-900"
                          style={{ width: `${completion}%` }}
                        />
                      </div>
                      <div className="w-10 text-right text-xs font-semibold text-zinc-700">
                        {completion}%
                      </div>
                    </div>
                  </div>

                  <div className="col-span-2 text-right text-sm font-semibold text-zinc-800">
                    {visitors ?? "—"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-2 text-xs text-zinc-500">
          Visitor counts are shown as <span className="font-semibold">—</span>{" "}
          until privacy-first tracking is enabled.
        </div>
      </section>

      {/* Latest changes */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900">
            Latest element changes
          </h2>
          <Link
            href="/admin/elements"
            className="text-sm font-semibold text-zinc-800 hover:underline"
          >
            View all
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="rounded-2xl border bg-white p-6 text-sm text-zinc-600 shadow-sm">
            No elements yet.
          </div>
        ) : (
          <div className="rounded-2xl border bg-white shadow-sm">
            <div className="divide-y">
              {recent.map((el) => {
                const href = el.slug
                  ? `/elements/${el.slug}`
                  : `/element/${el.id}`;
                return (
                  <div
                    key={el.id}
                    className="flex flex-wrap items-center justify-between gap-3 p-4"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{el.title}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                        <span>Updated {el.updatedAt.toLocaleString()}</span>
                        {el.deleted ? <Badge tone="red">Deleted</Badge> : null}
                        {!el.deleted && !el.reviewed ? (
                          <Badge tone="amber">Pending review</Badge>
                        ) : null}
                        {!el.deleted && el.reviewed ? (
                          <Badge tone="green">Reviewed</Badge>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={href}
                        className="rounded-xl border px-3 py-2 text-sm font-semibold hover:bg-zinc-50"
                      >
                        Preview
                      </Link>
                      <Link
                        href="/admin/elements"
                        className="rounded-xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
                      >
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
