import Link from "next/link";

type ElementUnavailableStateProps = {
  reason?: string;
};

export default function ElementUnavailableState({
  reason = "The content database is temporarily unavailable.",
}: ElementUnavailableStateProps) {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center px-4 py-16">
      <div className="rounded-3xl border border-black/10 bg-white/85 p-8 text-center shadow-sm backdrop-blur">
        <p className="mb-3 inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-amber-700">
          Temporarily unavailable
        </p>
        <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
          This element could not be loaded
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
          {reason} Refresh the page after your database connection is restored.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/explore"
            className="rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            Back to Explore
          </Link>
          <Link
            href="/"
            className="rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-50"
          >
            Go home
          </Link>
        </div>
      </div>
    </section>
  );
}
