import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import ToolPageShell from "@/features/tools/ui/ToolPageShell";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";
import SurfaceCard from "@/components/ui/SurfaceCard";

export const metadata: Metadata = {
  title: "Free Timestamp Converter - Convert Unix Time and Dates",
  description:
    "Convert Unix timestamps to readable dates and convert dates back to Unix time in seconds or milliseconds. View local time, UTC time, ISO format, and copy results instantly.",
  keywords: [
    "timestamp converter",
    "unix timestamp",
    "unix time",
    "epoch time",
    "date converter",
    "utc timestamp",
    "milliseconds timestamp",
    "developer tool",
  ],
  openGraph: {
    title: "Free Timestamp Converter - Convert Unix Time and Dates",
    description:
      "Convert Unix timestamps to readable dates and convert dates back to Unix time in seconds or milliseconds. View local time, UTC time, ISO format, and copy results instantly.",
  },
};

const TimestampConverterClient = dynamic(
  () => import("./TimestampConverterClient"),
  {
    loading: () => (
      <div className="h-[640px] animate-pulse rounded-3xl bg-slate-100" />
    ),
  },
);

const Article = dynamic(() => import("./Article"));

export default function TimestampConverterPage() {
  const tool = getToolRegistry().getById("timestamp-converter");
  if (!tool) notFound();

  return (
    <ToolPageShell
      tool={tool}
      intro={
        <p className="max-w-2xl text-sm leading-7 text-slate-700 dark:text-slate-300">
          Convert Unix timestamps to readable dates, turn browser local dates
          back into Unix time, compare UTC and local displays, and copy the
          format you need. Everything runs locally in your browser.
        </p>
      }
      sidebar={
        <div className="flex flex-col gap-5">
          <SurfaceCard>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              What this tool does
            </h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
              <li>Convert Unix seconds or milliseconds to dates</li>
              <li>Convert browser local dates back to Unix time</li>
              <li>Show local time, UTC time, and ISO 8601</li>
              <li>Auto-detect seconds vs milliseconds</li>
              <li>Copy timestamp and date formats instantly</li>
            </ul>
          </SurfaceCard>

          <SurfaceCard>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Timezone note
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
              A Unix timestamp represents one instant. The same instant can be
              displayed as browser local time or UTC, depending on formatting.
            </p>
          </SurfaceCard>

          <SurfaceCard>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Privacy
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
              Timestamp conversion happens entirely in your browser. No date or
              timestamp input is sent to a server.
            </p>
          </SurfaceCard>
        </div>
      }
    >
      <ToolContentCard
        title="Timestamp Converter"
        description="Convert Unix timestamps, browser local dates, ISO values, seconds, and milliseconds."
      >
        <TimestampConverterClient />
      </ToolContentCard>

      <ToolContentCard title="About Unix timestamps">
        <Article />
      </ToolContentCard>
    </ToolPageShell>
  );
}
