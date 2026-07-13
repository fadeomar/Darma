import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import ToolPageShell from "@/features/tools/ui/ToolPageShell";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";
import SurfaceCard from "@/components/ui/SurfaceCard";

export const metadata: Metadata = {
  title: "Timestamp Converter Studio - Unix Seconds, Milliseconds, Microseconds & Nanoseconds",
  description:
    "Convert Unix timestamps in seconds, milliseconds, microseconds, and nanoseconds. Compare time zones, process timestamp batches, inspect unit ambiguity, and export CSV, JSON, Markdown, JavaScript, or ZIP reports locally.",
  keywords: [
    "timestamp converter",
    "unix timestamp converter",
    "epoch converter",
    "seconds to date",
    "milliseconds to date",
    "microseconds timestamp",
    "nanoseconds timestamp",
    "timestamp batch converter",
    "iso date converter",
    "unix time zones",
  ],
  openGraph: {
    title: "Timestamp Converter Studio",
    description:
      "Convert epoch values and ISO dates, compare time zones, inspect unit ambiguity, and export production-ready timestamp reports.",
  },
};

const TimestampConverterClient = dynamic(
  () => import("./TimestampConverterClient"),
  {
    loading: () => (
      <div className="h-[760px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)]" />
    ),
  },
);

const Article = dynamic(() => import("./Article"));

export default function TimestampConverterPage() {
  const tool = getToolRegistry().getById("timestamp-converter");
  if (!tool) return null;

  return (
    <ToolPageShell
      tool={tool}
      intro={
        <p className="max-w-3xl text-sm leading-7 text-[var(--color-text-secondary)]">
          Convert epoch values in seconds, milliseconds, microseconds, or
          nanoseconds; turn ISO and browser-local dates back into Unix formats;
          compare the same instant across time zones; and validate mixed batch
          data without uploading anything.
        </p>
      }
      sidebar={
        <div className="flex flex-col gap-5">
          <SurfaceCard>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Built for real timestamp data</h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--color-text-secondary)]">
              <li>Seconds, milliseconds, microseconds, and nanoseconds</li>
              <li>ISO 8601 and browser-local date conversion</li>
              <li>Batch rows with per-line unit aliases</li>
              <li>IANA time-zone comparison</li>
              <li>CSV, JSON, Markdown, JavaScript, and ZIP exports</li>
            </ul>
          </SurfaceCard>

          <SurfaceCard>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Precision note</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
              JavaScript dates store whole milliseconds. Microsecond and
              nanosecond inputs can be interpreted safely, but sub-millisecond
              digits are reported as precision loss in the date preview.
            </p>
          </SurfaceCard>

          <SurfaceCard>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Local and private</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
              All conversion, time-zone formatting, validation, and export work
              runs in your browser. Timestamp data is not sent to a server.
            </p>
          </SurfaceCard>
        </div>
      }
    >
      <ToolContentCard
        title="Timestamp Converter Studio"
        description="Convert, inspect, batch-process, compare, and export epoch timestamps and dates."
      >
        <TimestampConverterClient />
      </ToolContentCard>

      <ToolContentCard title="Timestamp conversion guide">
        <Article />
      </ToolContentCard>
    </ToolPageShell>
  );
}
