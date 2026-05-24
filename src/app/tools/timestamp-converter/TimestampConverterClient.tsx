"use client";

import { useMemo, useState } from "react";
import { Button, CopyButton, Input } from "@/components/ui";
import {
  CodeOutputPanel,
  ControlSection,
  SegmentedControl,
  ToolControlPanel,
  WarningPanel,
} from "@/features/tools/components";
import { ToolLayoutSingleUtility } from "@/features/tools/layouts";
import {
  convertDateInputs,
  convertTimestampInput,
  getBrowserTimeZone,
  toDateTimeLocalValue,
  type TimestampUnitMode,
} from "./timestamp";

export default function TimestampConverterClient() {
  const initialNow = useMemo(() => new Date(), []);

  const [timestamp, setTimestamp] = useState(
    String(Math.floor(initialNow.getTime() / 1000)),
  );
  const [mode, setMode] = useState<TimestampUnitMode>("auto");
  const [localDate, setLocalDate] = useState(toDateTimeLocalValue(initialNow));
  const [isoDate, setIsoDate] = useState("");

  const result = useMemo(
    () => convertTimestampInput(timestamp, mode),
    [timestamp, mode],
  );

  const reverse = useMemo(
    () => convertDateInputs(localDate, isoDate),
    [localDate, isoDate],
  );

  const timestampError = "error" in result ? result.error.message : undefined;

  const dateError = "error" in reverse ? reverse.error.message : undefined;

  const formats =
    result.ok && result.status === "valid"
      ? result.formats
      : reverse.ok && reverse.status === "valid"
        ? reverse.formats
        : null;

  const code = formats
    ? [
        `Local: ${formats.local}`,
        `UTC: ${formats.utc}`,
        `ISO: ${formats.iso}`,
        `Unix seconds: ${formats.unixSeconds}`,
        `Unix milliseconds: ${formats.unixMilliseconds}`,
        `Timezone: ${formats.timezoneOffset}`,
        `Relative: ${formats.relative}`,
      ].join("\n")
    : "";

  return (
    <ToolLayoutSingleUtility
      resultSlot={
        <CodeOutputPanel
          title="Converted timestamp"
          description={`Browser timezone: ${getBrowserTimeZone()}`}
          tabs={[{ id: "formats", label: "Formats", code, language: "txt" }]}
          emptyMessage="Enter a timestamp or date to see conversions."
        />
      }
      actionsSlot={
        <>
          <Button
            size="sm"
            onClick={() => {
              const currentDate = new Date();
              setTimestamp(String(Math.floor(currentDate.getTime() / 1000)));
              setLocalDate(toDateTimeLocalValue(currentDate));
              setIsoDate("");
            }}
          >
            Use current time
          </Button>

          <CopyButton
            text={formats?.unixSeconds ?? ""}
            size="sm"
            variant="secondary"
          >
            Copy seconds
          </CopyButton>

          <CopyButton text={formats?.iso ?? ""} size="sm" variant="secondary">
            Copy ISO
          </CopyButton>
        </>
      }
      controlsSlot={
        <ToolControlPanel title="Timestamp inputs">
          <ControlSection title="Unix timestamp">
            <div className="flex flex-wrap items-end gap-3">
              <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                Timestamp
                <Input
                  size="sm"
                  width="medium"
                  className="mt-1"
                  value={timestamp}
                  onChange={(event) => setTimestamp(event.target.value)}
                />
              </label>

              <SegmentedControl<TimestampUnitMode>
                ariaLabel="Timestamp unit"
                value={mode}
                onChange={setMode}
                options={[
                  { value: "auto", label: "Auto" },
                  { value: "seconds", label: "Seconds" },
                  { value: "milliseconds", label: "Milliseconds" },
                ]}
              />
            </div>
          </ControlSection>

          <ControlSection title="Date to timestamp">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                Local date/time
                <Input
                  type="datetime-local"
                  size="sm"
                  className="mt-1"
                  value={localDate}
                  onChange={(event) => {
                    setLocalDate(event.target.value);
                    setIsoDate("");
                  }}
                />
              </label>

              <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                ISO with timezone
                <Input
                  size="sm"
                  className="mt-1"
                  value={isoDate}
                  onChange={(event) => setIsoDate(event.target.value)}
                  placeholder="2026-05-24T12:00:00Z"
                />
              </label>
            </div>
          </ControlSection>
        </ToolControlPanel>
      }
      infoSlot={
        <WarningPanel
          messages={[
            ...(!result.ok
              ? [
                  {
                    id: "timestamp-error",
                    severity: "danger" as const,
                    title: "Invalid timestamp",
                    message: timestampError ?? "Invalid timestamp.",
                  },
                ]
              : []),
            ...(!reverse.ok
              ? [
                  {
                    id: "date-error",
                    severity: "danger" as const,
                    title: "Invalid date",
                    message: dateError ?? "Invalid date.",
                  },
                ]
              : []),
            {
              id: "unit",
              severity: "info" as const,
              title: "Seconds vs milliseconds",
              message:
                "Unix seconds are usually 10 digits; JavaScript timestamps are usually 13-digit milliseconds.",
            },
          ]}
        />
      }
    />
  );
}
