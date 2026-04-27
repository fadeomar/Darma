"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Check,
  Clock3,
  Copy,
  FileText,
  RefreshCw,
  Trash2,
} from "lucide-react";
import {
  convertDateInputs,
  convertTimestampInput,
  formatTimestampDate,
  getBrowserTimeZone,
  toDateTimeLocalValue,
  type DateInputResult,
  type TimestampResult,
  type TimestampUnitMode,
} from "./timestamp";

const TIMESTAMP_EXAMPLES = ["0", "1700000000", "1700000000000"];
const ISO_EXAMPLE = "2030-01-01T00:00:00.000Z";

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--textColor)]/40">
      {children}
    </p>
  );
}

function CopyButton({
  value,
  copyKey,
  copiedKey,
  onCopy,
  label = "Copy",
}: {
  value?: string;
  copyKey: string;
  copiedKey: string | null;
  onCopy: (value: string, key: string) => void;
  label?: string;
}) {
  const disabled = !value;
  const copied = copiedKey === copyKey;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => value && onCopy(value, copyKey)}
      className={[
        "inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-35",
        copied
          ? "border-emerald-400 bg-emerald-500 text-white"
          : "border-black/10 bg-white text-[var(--textColor)]/65 hover:bg-black/5 hover:text-[var(--textColor)]",
      ].join(" ")}
      aria-label={`${label} ${copyKey}`}
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : label}
    </button>
  );
}

function ResultRow({
  label,
  value,
  copyKey,
  copiedKey,
  onCopy,
  mono = true,
}: {
  label: string;
  value?: string;
  copyKey: string;
  copiedKey: string | null;
  onCopy: (value: string, key: string) => void;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-black/10 bg-white px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--textColor)]/35">
          {label}
        </p>
        <p
          className={[
            "mt-1 break-words text-sm text-[var(--textColor)]",
            mono ? "font-mono" : "font-semibold",
          ].join(" ")}
        >
          {value || "No value"}
        </p>
      </div>
      <CopyButton
        value={value}
        copyKey={copyKey}
        copiedKey={copiedKey}
        onCopy={onCopy}
      />
    </div>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-black/15 bg-slate-50 px-4 py-8 text-center text-sm text-[var(--textColor)]/45">
      {children}
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      <strong>Invalid input.</strong> {message}
    </div>
  );
}

function TimestampStatus({ result }: { result: TimestampResult }) {
  if (result.status === "empty") {
    return (
      <div className="rounded-xl border border-black/10 bg-white/60 px-4 py-2.5 text-xs text-[var(--textColor)]/50">
        Empty timestamp. Enter seconds or milliseconds to convert.
      </div>
    );
  }

  if (result.status === "invalid") {
    return <ErrorState message={result.error.message} />;
  }

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs text-emerald-700">
      <strong>Valid timestamp.</strong> {result.note}
    </div>
  );
}

function DateStatus({ result }: { result: DateInputResult }) {
  if (result.status === "empty") {
    return (
      <div className="rounded-xl border border-black/10 bg-white/60 px-4 py-2.5 text-xs text-[var(--textColor)]/50">
        Empty date. Choose a browser local time or paste an ISO timestamp with timezone.
      </div>
    );
  }

  if (result.status === "invalid") {
    return <ErrorState message={result.error.message} />;
  }

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs text-emerald-700">
      <strong>Valid date.</strong> Interpreting input as {result.sourceLabel}.
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs text-[var(--textColor)]/60">
      <strong className="text-[var(--textColor)]/80">{label}:</strong> {value}
    </span>
  );
}

export default function TimestampConverterClient() {
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [browserTimeZone, setBrowserTimeZone] = useState("Browser local time");
  const [timestampInput, setTimestampInput] = useState("");
  const [unitMode, setUnitMode] = useState<TimestampUnitMode>("auto");
  const [localDateTime, setLocalDateTime] = useState("");
  const [isoDateTime, setIsoDateTime] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copyError, setCopyError] = useState("");

  useEffect(() => {
    setCurrentDate(new Date());
    setBrowserTimeZone(getBrowserTimeZone());

    const intervalId = window.setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  const currentFormats = useMemo(
    () => (currentDate ? formatTimestampDate(currentDate, currentDate) : null),
    [currentDate],
  );

  const timestampResult = useMemo(
    () => convertTimestampInput(timestampInput, unitMode),
    [timestampInput, unitMode],
  );

  const dateResult = useMemo(
    () => convertDateInputs(localDateTime, isoDateTime),
    [localDateTime, isoDateTime],
  );

  const handleCopy = async (value: string, key: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopyError("");
      setCopiedKey(key);
      window.setTimeout(() => {
        setCopiedKey((current) => (current === key ? null : current));
      }, 1800);
    } catch {
      setCopiedKey(null);
      setCopyError("Clipboard copy failed. Select the value and copy it manually.");
    }
  };

  const setTimestampExample = (value: string) => {
    setTimestampInput(value);
    setCopiedKey(null);
    setCopyError("");
  };

  const useCurrentLocalDate = () => {
    const now = new Date();
    setLocalDateTime(toDateTimeLocalValue(now));
    setIsoDateTime("");
    setCopiedKey(null);
    setCopyError("");
  };

  const clearDateInputs = () => {
    setLocalDateTime("");
    setIsoDateTime("");
    setCopiedKey(null);
    setCopyError("");
  };

  const timestampFormats = timestampResult.ok && timestampResult.status === "valid"
    ? timestampResult.formats
    : null;
  const dateFormats = dateResult.ok && dateResult.status === "valid"
    ? dateResult.formats
    : null;

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-black/10 bg-slate-50 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <SectionLabel>Live current timestamp</SectionLabel>
            <h3 className="flex items-center gap-2 text-lg font-bold text-[var(--textColor)]">
              <Clock3 className="h-5 w-5" />
              Current browser time
            </h3>
          </div>
          <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[var(--textColor)]/60">
            Updates every second
          </span>
        </div>

        {currentFormats ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <ResultRow
              label="Unix seconds"
              value={currentFormats.unixSeconds}
              copyKey="current-seconds"
              copiedKey={copiedKey}
              onCopy={handleCopy}
            />
            <ResultRow
              label="Unix milliseconds"
              value={currentFormats.unixMilliseconds}
              copyKey="current-milliseconds"
              copiedKey={copiedKey}
              onCopy={handleCopy}
            />
            <ResultRow
              label="Browser local time"
              value={currentFormats.local}
              copyKey="current-local"
              copiedKey={copiedKey}
              onCopy={handleCopy}
              mono={false}
            />
            <ResultRow
              label="UTC time"
              value={currentFormats.utc}
              copyKey="current-utc"
              copiedKey={copiedKey}
              onCopy={handleCopy}
              mono={false}
            />
          </div>
        ) : (
          <EmptyState>Syncing current timestamp...</EmptyState>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          <StatPill label="Browser timezone" value={browserTimeZone} />
          <StatPill
            label="UTC offset"
            value={currentFormats?.timezoneOffset ?? "Detecting"}
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-4">
          <div>
            <SectionLabel>Timestamp to date</SectionLabel>
            <label htmlFor="timestamp-input" className="sr-only">
              Unix timestamp input
            </label>
            <input
              id="timestamp-input"
              value={timestampInput}
              onChange={(event) => {
                setTimestampInput(event.target.value);
                setCopiedKey(null);
                setCopyError("");
              }}
              inputMode="numeric"
              placeholder="Paste Unix timestamp, like 1700000000"
              className="w-full rounded-2xl border border-black/10 bg-slate-50 px-4 py-3 font-mono text-sm text-[var(--textColor)] outline-none transition placeholder:font-sans placeholder:text-[var(--textColor)]/25 focus:border-[var(--textColor)]/30"
            />
          </div>

          <div>
            <SectionLabel>Unit mode</SectionLabel>
            <div className="grid gap-2 sm:grid-cols-3">
              {(
                [
                  ["auto", "Auto"],
                  ["seconds", "Seconds"],
                  ["milliseconds", "Milliseconds"],
                ] as [TimestampUnitMode, string][]
              ).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    setUnitMode(mode);
                    setCopiedKey(null);
                    setCopyError("");
                  }}
                  className={[
                    "rounded-xl border px-3 py-2 text-sm font-semibold transition",
                    unitMode === mode
                      ? "border-[var(--textColor)] bg-[var(--textColor)] text-[var(--baseColor)]"
                      : "border-black/10 bg-white text-[var(--textColor)]/70 hover:border-[var(--textColor)]/30",
                  ].join(" ")}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <SectionLabel>Quick examples</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              {TIMESTAMP_EXAMPLES.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setTimestampExample(example)}
                  className="rounded-xl border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-[var(--textColor)]/70 transition hover:border-[var(--textColor)]/30 hover:text-[var(--textColor)]"
                >
                  {example}
                </button>
              ))}
              <button
                type="button"
                disabled={!currentFormats}
                onClick={() =>
                  currentFormats && setTimestampExample(currentFormats.unixSeconds)
                }
                className="rounded-xl border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-[var(--textColor)]/70 transition hover:border-[var(--textColor)]/30 hover:text-[var(--textColor)] disabled:opacity-35"
              >
                Current seconds
              </button>
              <button
                type="button"
                disabled={!currentFormats}
                onClick={() =>
                  currentFormats && setTimestampExample(currentFormats.unixMilliseconds)
                }
                className="rounded-xl border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-[var(--textColor)]/70 transition hover:border-[var(--textColor)]/30 hover:text-[var(--textColor)] disabled:opacity-35"
              >
                Current milliseconds
              </button>
            </div>
          </div>

          <TimestampStatus result={timestampResult} />

          {timestampFormats ? (
            <div className="grid gap-3">
              <ResultRow
                label="Browser local date/time"
                value={timestampFormats.local}
                copyKey="timestamp-local"
                copiedKey={copiedKey}
                onCopy={handleCopy}
                mono={false}
              />
              <ResultRow
                label="UTC date/time"
                value={timestampFormats.utc}
                copyKey="timestamp-utc"
                copiedKey={copiedKey}
                onCopy={handleCopy}
                mono={false}
              />
              <ResultRow
                label="ISO 8601"
                value={timestampFormats.iso}
                copyKey="timestamp-iso"
                copiedKey={copiedKey}
                onCopy={handleCopy}
              />
              <div className="grid gap-3 md:grid-cols-2">
                <ResultRow
                  label="Unix seconds"
                  value={timestampFormats.unixSeconds}
                  copyKey="timestamp-seconds"
                  copiedKey={copiedKey}
                  onCopy={handleCopy}
                />
                <ResultRow
                  label="Unix milliseconds"
                  value={timestampFormats.unixMilliseconds}
                  copyKey="timestamp-milliseconds"
                  copiedKey={copiedKey}
                  onCopy={handleCopy}
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <ResultRow
                  label="Timezone offset"
                  value={timestampFormats.timezoneOffset}
                  copyKey="timestamp-offset"
                  copiedKey={copiedKey}
                  onCopy={handleCopy}
                  mono={false}
                />
                <ResultRow
                  label="Relative time"
                  value={timestampFormats.relative}
                  copyKey="timestamp-relative"
                  copiedKey={copiedKey}
                  onCopy={handleCopy}
                  mono={false}
                />
              </div>
            </div>
          ) : timestampResult.status === "empty" ? (
            <EmptyState>Converted date output will appear here.</EmptyState>
          ) : null}
        </div>

        <aside className="rounded-2xl border border-black/10 bg-white p-4">
          <SectionLabel>Timestamp info</SectionLabel>
          <div className="flex flex-col gap-2">
            <StatPill
              label="Status"
              value={timestampResult.status === "valid" ? "Valid" : timestampResult.status}
            />
            <StatPill
              label="Detected unit"
              value={
                timestampResult.ok && timestampResult.status === "valid"
                  ? timestampResult.detectedLabel
                  : "None"
              }
            />
            <StatPill
              label="Timestamp length"
              value={`${timestampResult.digitLength} digit${
                timestampResult.digitLength === 1 ? "" : "s"
              }`}
            />
            <StatPill label="Browser timezone" value={browserTimeZone} />
            <StatPill
              label="UTC offset"
              value={timestampFormats?.timezoneOffset ?? currentFormats?.timezoneOffset ?? "Detecting"}
            />
          </div>
        </aside>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <SectionLabel>Date to timestamp</SectionLabel>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={useCurrentLocalDate}
                  className="inline-flex items-center gap-1 rounded-lg border border-black/10 bg-white px-2 py-1 text-xs font-semibold text-[var(--textColor)]/60 transition hover:bg-black/5"
                >
                  <RefreshCw className="h-3 w-3" />
                  Use current
                </button>
                <button
                  type="button"
                  onClick={clearDateInputs}
                  className="inline-flex items-center gap-1 rounded-lg border border-black/10 bg-white px-2 py-1 text-xs font-semibold text-[var(--textColor)]/60 transition hover:bg-black/5"
                >
                  <Trash2 className="h-3 w-3" />
                  Clear
                </button>
              </div>
            </div>
            <label htmlFor="local-date-input" className="text-xs font-semibold text-[var(--textColor)]/65">
              Browser local date/time
            </label>
            <input
              id="local-date-input"
              type="datetime-local"
              step={1}
              value={localDateTime}
              onChange={(event) => {
                setLocalDateTime(event.target.value);
                setCopiedKey(null);
                setCopyError("");
              }}
              className="w-full rounded-2xl border border-black/10 bg-slate-50 px-4 py-3 text-sm text-[var(--textColor)] outline-none transition focus:border-[var(--textColor)]/30"
            />
          </div>

          <div>
            <label htmlFor="iso-date-input" className="text-xs font-semibold text-[var(--textColor)]/65">
              ISO date with timezone
            </label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                id="iso-date-input"
                value={isoDateTime}
                onChange={(event) => {
                  setIsoDateTime(event.target.value);
                  setCopiedKey(null);
                  setCopyError("");
                }}
                placeholder={ISO_EXAMPLE}
                className="min-w-0 flex-1 rounded-2xl border border-black/10 bg-slate-50 px-4 py-3 font-mono text-sm text-[var(--textColor)] outline-none transition placeholder:font-mono placeholder:text-[var(--textColor)]/25 focus:border-[var(--textColor)]/30"
              />
              <button
                type="button"
                onClick={() => {
                  setIsoDateTime(ISO_EXAMPLE);
                  setCopiedKey(null);
                  setCopyError("");
                }}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-[var(--textColor)]/70 transition hover:bg-black/5"
              >
                <FileText className="h-3.5 w-3.5" />
                2030 example
              </button>
            </div>
          </div>

          <DateStatus result={dateResult} />

          {dateFormats ? (
            <div className="grid gap-3">
              <div className="grid gap-3 md:grid-cols-2">
                <ResultRow
                  label="Unix seconds"
                  value={dateFormats.unixSeconds}
                  copyKey="date-seconds"
                  copiedKey={copiedKey}
                  onCopy={handleCopy}
                />
                <ResultRow
                  label="Unix milliseconds"
                  value={dateFormats.unixMilliseconds}
                  copyKey="date-milliseconds"
                  copiedKey={copiedKey}
                  onCopy={handleCopy}
                />
              </div>
              <ResultRow
                label="ISO 8601"
                value={dateFormats.iso}
                copyKey="date-iso"
                copiedKey={copiedKey}
                onCopy={handleCopy}
              />
              <ResultRow
                label="UTC date/time"
                value={dateFormats.utc}
                copyKey="date-utc"
                copiedKey={copiedKey}
                onCopy={handleCopy}
                mono={false}
              />
              <ResultRow
                label="Browser local date/time"
                value={dateFormats.local}
                copyKey="date-local"
                copiedKey={copiedKey}
                onCopy={handleCopy}
                mono={false}
              />
              <div className="grid gap-3 md:grid-cols-2">
                <ResultRow
                  label="Timezone offset"
                  value={dateFormats.timezoneOffset}
                  copyKey="date-offset"
                  copiedKey={copiedKey}
                  onCopy={handleCopy}
                  mono={false}
                />
                <ResultRow
                  label="Relative time"
                  value={dateFormats.relative}
                  copyKey="date-relative"
                  copiedKey={copiedKey}
                  onCopy={handleCopy}
                  mono={false}
                />
              </div>
            </div>
          ) : dateResult.status === "empty" ? (
            <EmptyState>Timestamp output will appear after selecting a date.</EmptyState>
          ) : null}
        </div>

        <aside className="rounded-2xl border border-black/10 bg-white p-4">
          <SectionLabel>Date info</SectionLabel>
          <div className="flex flex-col gap-2">
            <StatPill
              label="Status"
              value={dateResult.status === "valid" ? "Valid" : dateResult.status}
            />
            <StatPill
              label="Input source"
              value={
                dateResult.ok && dateResult.status === "valid"
                  ? dateResult.sourceLabel
                  : "None"
              }
            />
            <StatPill label="Browser timezone" value={browserTimeZone} />
            <StatPill
              label="UTC offset"
              value={dateFormats?.timezoneOffset ?? currentFormats?.timezoneOffset ?? "Detecting"}
            />
          </div>
        </aside>
      </section>

      {copyError ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-800">
          {copyError}
        </p>
      ) : null}

      <p className="text-center text-xs text-[var(--textColor)]/35">
        Timestamp conversion runs entirely in your browser. No dates or timestamps are uploaded.
      </p>
    </div>
  );
}
