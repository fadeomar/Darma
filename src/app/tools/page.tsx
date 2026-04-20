import Link from "next/link";
import { getToolRegistry } from "@/features/tools";
import type { ToolAudience } from "@/features/tools/domain/tool";

const audienceLabels: Record<ToolAudience, string> = {
  developer: "Developer",
  designer: "Designer",
  student: "Student",
  creator: "Creator",
  general: "General",
};

function matchesAudience(audiences: ToolAudience[] | undefined, selected: string) {
  if (!selected || selected === "all") return true;
  return audiences?.includes(selected as ToolAudience) ?? false;
}

export default async function ToolsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolved = await searchParams;
  const q = typeof resolved.q === "string" ? resolved.q.toLowerCase() : "";
  const audience = typeof resolved.audience === "string" ? resolved.audience : "all";

  const tools = getToolRegistry()
    .list()
    .filter((tool) => tool.visibility === "public")
    .filter((tool) =>
      !q
        ? true
        : [tool.title, tool.description, ...tool.tags].some((value) =>
            value.toLowerCase().includes(q),
          ),
    )
    .filter((tool) => matchesAudience(tool.audiences, audience));

  const featured = tools.filter((tool) => tool.featured);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-black/10 bg-white/70 p-8 shadow-sm backdrop-blur">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">Tools</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-900">Free one-page tools built for quick work</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700">
          Darma tools are designed to help you preview, generate, and copy results fast. Start with a featured tool or filter the directory by audience.
        </p>

        <form className="mt-6 grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            type="text"
            name="q"
            defaultValue={typeof resolved.q === "string" ? resolved.q : ""}
            placeholder="Search tools by name, tag, or purpose"
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none ring-0"
          />
          <button className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:opacity-90">
            Search tools
          </button>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/tools" className={["rounded-full px-4 py-2 text-sm font-semibold", audience === "all" ? "bg-slate-900 text-white" : "bg-white text-slate-900 border border-black/10"].join(" ")}>
            All
          </Link>
          {(Object.keys(audienceLabels) as ToolAudience[]).map((key) => (
            <Link
              key={key}
              href={`/tools?audience=${key}`}
              className={[
                "rounded-full px-4 py-2 text-sm font-semibold",
                audience === key ? "bg-slate-900 text-white" : "bg-white text-slate-900 border border-black/10",
              ].join(" ")}
            >
              {audienceLabels[key]}
            </Link>
          ))}
        </div>
      </div>

      {featured.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-2xl font-black tracking-tight">Featured tools</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {featured.map((tool) => (
              <Link key={tool.id} href={tool.href} className="rounded-3xl border border-black/10 bg-white/80 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{tool.audiences?.map((a) => audienceLabels[a]).join(" • ")}</p>
                <h3 className="mt-2 text-lg font-bold text-slate-900">{tool.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-700">{tool.description}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-10">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-black tracking-tight">All tools</h2>
          <p className="text-sm text-slate-600">{tools.length} result{tools.length === 1 ? "" : "s"}</p>
        </div>
        <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {tools.map((tool) => (
            <Link key={tool.id} href={tool.href} className="rounded-3xl border border-black/10 bg-white/80 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{tool.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-700">{tool.description}</p>
                </div>
                {tool.status ? (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-600">
                    {tool.status.replace("_", " ")}
                  </span>
                ) : null}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {tool.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    #{tag}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
