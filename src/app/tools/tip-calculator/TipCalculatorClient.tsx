"use client";

import { useMemo, useState } from "react";
import JSZip from "jszip";
import {
  Calculator,
  CheckCircle2,
  Code2,
  Coins,
  Download,
  FileJson,
  FileSpreadsheet,
  PackageCheck,
  Plus,
  ReceiptText,
  RotateCcw,
  Scale,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  WalletCards,
} from "lucide-react";
import { Button, CopyButton, Input, Select } from "@/components/ui";
import { downloadText } from "../_shared/clientUtils";
import {
  buildGuestCsv,
  buildJavaScriptSnippet,
  buildScenarioCsv,
  buildTipChecks,
  buildTipReport,
  buildTipScenarios,
  buildTipSummaryMarkdown,
  computeSplit,
  formatMoney,
} from "./split";
import { DEFAULT_TIP_PRESET_ID, TIP_PRESETS } from "./presets";
import type {
  TipCheckLevel,
  TipCurrency,
  TipGuestInput,
  TipRoundMode,
  TipScenarioInput,
  TipSplitMode,
  TipTab,
  TipBasis,
} from "./types";

const CHECK_STYLES: Record<TipCheckLevel, string> = {
  success: "border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-text)]",
  info: "border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-[var(--color-info-text)]",
  warning: "border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]",
  danger: "border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]",
};

function SummaryCard({ label, value, hint, icon }: { label: string; value: string; hint: string; icon: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-3 py-2.5 shadow-[var(--shadow-xs)]">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate font-mono text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{label}</span>
        <span className="text-[var(--color-primary-text-strong)]">{icon}</span>
      </div>
      <div className="mt-1 truncate text-xl font-black tracking-tight text-[var(--color-text-primary)]" title={value}>{value}</div>
      <div className="mt-0.5 truncate text-xs text-[var(--color-text-tertiary)]">{hint}</div>
    </div>
  );
}

function MetricCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3">
      <div className="truncate text-xs font-bold uppercase tracking-[0.07em] text-[var(--color-text-tertiary)]">{label}</div>
      <div className="mt-1 truncate font-mono text-lg font-black text-[var(--color-text-primary)]" title={value}>{value}</div>
      {hint ? <div className="mt-0.5 truncate text-xs text-[var(--color-text-tertiary)]">{hint}</div> : null}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 flex items-center justify-between gap-2 text-xs font-bold text-[var(--color-text-secondary)]">
        <span>{label}</span>
        {hint ? <span className="font-normal text-[var(--color-text-tertiary)]">{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}

function parseNumber(value: string) {
  return value.trim() ? Number(value) : Number.NaN;
}

function cloneGuests(guests: TipGuestInput[]) {
  return guests.map((guest) => ({ ...guest }));
}

function shareLabel(minimum: number, maximum: number, currency: TipCurrency) {
  if (minimum === maximum) return formatMoney(minimum, currency);
  return `${formatMoney(minimum, currency)}–${formatMoney(maximum, currency)}`;
}

export default function TipCalculatorClient() {
  const initialPreset = TIP_PRESETS.find((preset) => preset.id === DEFAULT_TIP_PRESET_ID) ?? TIP_PRESETS[0];
  const [rawSubtotal, setRawSubtotal] = useState(String(initialPreset.input.subtotal));
  const [rawTax, setRawTax] = useState(String(initialPreset.input.taxPercent));
  const [rawService, setRawService] = useState(String(initialPreset.input.servicePercent));
  const [rawTip, setRawTip] = useState(String(initialPreset.input.tipPercent));
  const [rawPeople, setRawPeople] = useState(String(initialPreset.input.people));
  const [currency, setCurrency] = useState<TipCurrency>(initialPreset.input.currency);
  const [tipBasis, setTipBasis] = useState<TipBasis>(initialPreset.input.tipBasis);
  const [roundMode, setRoundMode] = useState<TipRoundMode>(initialPreset.input.roundMode);
  const [splitMode, setSplitMode] = useState<TipSplitMode>(initialPreset.input.splitMode);
  const [guests, setGuests] = useState<TipGuestInput[]>(cloneGuests(initialPreset.input.guests));
  const [activeTab, setActiveTab] = useState<TipTab>("overview");
  const [showAllPresets, setShowAllPresets] = useState(false);

  const input = useMemo<TipScenarioInput>(() => ({
    subtotal: parseNumber(rawSubtotal),
    taxPercent: parseNumber(rawTax),
    servicePercent: parseNumber(rawService),
    tipPercent: parseNumber(rawTip),
    people: parseNumber(rawPeople),
    currency,
    tipBasis,
    roundMode,
    splitMode,
    guests,
  }), [rawSubtotal, rawTax, rawService, rawTip, rawPeople, currency, tipBasis, roundMode, splitMode, guests]);

  const result = useMemo(() => computeSplit(input), [input]);
  const scenarios = useMemo(() => buildTipScenarios(input), [input]);
  const checks = useMemo(() => buildTipChecks(input, result), [input, result]);
  const report = useMemo(() => buildTipReport(input, result, scenarios, checks), [input, result, scenarios, checks]);
  const markdown = useMemo(() => buildTipSummaryMarkdown(input, result, checks), [input, result, checks]);
  const guestCsv = useMemo(() => buildGuestCsv(result), [result]);
  const scenarioCsv = useMemo(() => buildScenarioCsv(scenarios), [scenarios]);
  const reportJson = useMemo(() => `${JSON.stringify(report, null, 2)}\n`, [report]);
  const jsSnippet = useMemo(() => buildJavaScriptSnippet(), []);
  const reviewCount = checks.filter((check) => check.level === "warning" || check.level === "danger").length;

  function applyPreset(id: string) {
    const preset = TIP_PRESETS.find((item) => item.id === id);
    if (!preset) return;
    setRawSubtotal(String(preset.input.subtotal));
    setRawTax(String(preset.input.taxPercent));
    setRawService(String(preset.input.servicePercent));
    setRawTip(String(preset.input.tipPercent));
    setRawPeople(String(preset.input.people));
    setCurrency(preset.input.currency);
    setTipBasis(preset.input.tipBasis);
    setRoundMode(preset.input.roundMode);
    setSplitMode(preset.input.splitMode);
    setGuests(cloneGuests(preset.input.guests));
    setActiveTab("overview");
  }

  function reset() {
    applyPreset(DEFAULT_TIP_PRESET_ID);
  }

  function updateGuest(id: string, patch: Partial<TipGuestInput>) {
    setGuests((current) => current.map((guest) => guest.id === id ? { ...guest, ...patch } : guest));
  }

  function addGuest() {
    setGuests((current) => [
      ...current,
      { id: `guest-${Date.now()}-${current.length + 1}`, name: `Guest ${current.length + 1}`, weight: 1 },
    ]);
    setSplitMode("weighted");
    setActiveTab("guests");
  }

  function removeGuest(id: string) {
    setGuests((current) => current.length > 1 ? current.filter((guest) => guest.id !== id) : current);
  }

  async function downloadPack() {
    const zip = new JSZip();
    zip.file("bill-split-summary.md", markdown);
    zip.file("guest-shares.csv", guestCsv);
    zip.file("tip-scenarios.csv", scenarioCsv);
    zip.file("bill-split-report.json", reportJson);
    zip.file("split-bill.js", jsSnippet);
    zip.file("README.md", "# Darma tip and bill split pack\n\n- `bill-split-summary.md`: readable bill, shares, and checks\n- `guest-shares.csv`: per-guest weighted or equal allocation\n- `tip-scenarios.csv`: comparison across common tip percentages\n- `bill-split-report.json`: structured inputs, outputs, and production checks\n- `split-bill.js`: implementation starter\n\nConfirm the receipt, tax treatment, automatic gratuity, and payment-terminal rounding before paying.\n");
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "tip-bill-split-pack.zip";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const tabs: Array<{ id: TipTab; label: string }> = [
    { id: "overview", label: "Overview" },
    { id: "guests", label: "Guest shares" },
    { id: "scenarios", label: "Tip scenarios" },
    { id: "exports", label: "Checks & exports" },
  ];

  const breakdown = result ? [
    { label: "Subtotal", value: result.subtotal },
    { label: "Tax", value: result.taxAmount },
    { label: "Service", value: result.serviceAmount },
    { label: "Tip", value: result.tipAmount },
  ] : [];
  const maxBreakdown = Math.max(1, ...breakdown.map((item) => item.value));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <SummaryCard label="Calculated total" value={result ? formatMoney(result.totalBeforeRounding, currency) : "—"} hint="before optional split rounding" icon={<ReceiptText className="h-4 w-4" />} />
        <SummaryCard label="Tip amount" value={result ? formatMoney(result.tipAmount, currency) : "—"} hint={`${Number.isFinite(input.tipPercent) ? input.tipPercent : "—"}% on selected basis`} icon={<Coins className="h-4 w-4" />} />
        <SummaryCard label="Guest share" value={result ? shareLabel(result.minimumShare, result.maximumShare, currency) : "—"} hint={result ? `${result.people} ${splitMode === "weighted" ? "weighted" : "equal"} shares` : "enter valid values"} icon={<Users className="h-4 w-4" />} />
        <SummaryCard label="Production review" value={result ? (reviewCount ? `${reviewCount} review` : "Ready") : "Blocked"} hint={`${checks.length} checks completed`} icon={result && !reviewCount ? <ShieldCheck className="h-4 w-4" /> : <Scale className="h-4 w-4" />} />
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 shadow-[var(--shadow-sm)]">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-black text-[var(--color-text-primary)]"><Sparkles className="h-4 w-4 text-[var(--color-primary-text-strong)]" />Practical presets</h2>
                <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">Load a realistic receipt and edit any value.</p>
              </div>
              <Button size="sm" variant="ghost" onClick={reset} leftIcon={<RotateCcw className="h-3.5 w-3.5" />}>Reset</Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(showAllPresets ? TIP_PRESETS : TIP_PRESETS.slice(0, 6)).map((preset) => (
                <button key={preset.id} type="button" onClick={() => applyPreset(preset.id)} className="min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-2.5 text-left transition hover:border-[var(--color-primary)] hover:bg-[var(--color-control-hover)]">
                  <span className="block truncate text-xs font-bold text-[var(--color-text-primary)]">{preset.name}</span>
                  <span className="mt-1 block line-clamp-2 text-xs leading-4 text-[var(--color-text-tertiary)]">{preset.description}</span>
                </button>
              ))}
            </div>
            {TIP_PRESETS.length > 6 ? (
              <Button className="mt-2 w-full" size="sm" variant="ghost" aria-expanded={showAllPresets} onClick={() => setShowAllPresets((value) => !value)}>
                {showAllPresets ? "Show fewer receipts" : `Show all ${TIP_PRESETS.length} receipts`}
              </Button>
            ) : null}
          </section>

          <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 shadow-[var(--shadow-sm)]">
            <div className="mb-3 flex items-center gap-2">
              <Calculator className="h-4 w-4 text-[var(--color-primary-text-strong)]" />
              <div>
                <h2 className="text-sm font-black text-[var(--color-text-primary)]">Receipt amounts</h2>
                <p className="text-xs text-[var(--color-text-tertiary)]">Enter percentages exactly as shown on the receipt.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Subtotal"><Input type="text" inputMode="decimal" value={rawSubtotal} onChange={(event) => setRawSubtotal(event.target.value)} aria-label="Bill subtotal" /></Field>
              <Field label="Currency"><Select value={currency} onChange={(event) => setCurrency(event.target.value as TipCurrency)} aria-label="Currency"><option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option><option value="ILS">ILS</option><option value="JPY">JPY</option></Select></Field>
              <Field label="Tax" hint="%"><Input type="text" inputMode="decimal" value={rawTax} onChange={(event) => setRawTax(event.target.value)} aria-label="Tax percent" /></Field>
              <Field label="Service charge" hint="%"><Input type="text" inputMode="decimal" value={rawService} onChange={(event) => setRawService(event.target.value)} aria-label="Service charge percent" /></Field>
              <Field label="Additional tip" hint="%"><Input type="text" inputMode="decimal" value={rawTip} onChange={(event) => setRawTip(event.target.value)} aria-label="Tip percent" /></Field>
              <Field label="Tip basis"><Select value={tipBasis} onChange={(event) => setTipBasis(event.target.value as TipBasis)} aria-label="Tip calculation basis"><option value="subtotal">Subtotal only</option><option value="subtotal-tax">Subtotal + tax</option><option value="pretip-total">Subtotal + tax + service</option></Select></Field>
            </div>
          </section>

          <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 shadow-[var(--shadow-sm)]">
            <div className="mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-[var(--color-primary-text-strong)]" />
              <div>
                <h2 className="text-sm font-black text-[var(--color-text-primary)]">Split settings</h2>
                <p className="text-xs text-[var(--color-text-tertiary)]">Use equal shares or weighted guests.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Split mode"><Select value={splitMode} onChange={(event) => { setSplitMode(event.target.value as TipSplitMode); if (event.target.value === "weighted") setActiveTab("guests"); }} aria-label="Split mode"><option value="equal">Equal split</option><option value="weighted">Weighted split</option></Select></Field>
              {splitMode === "equal" ? <Field label="People"><Input type="text" inputMode="numeric" value={rawPeople} onChange={(event) => setRawPeople(event.target.value)} aria-label="Number of people" /></Field> : <Field label="Guests"><div className="flex h-10 items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-control-bg)] px-3 text-sm"><span className="font-mono font-bold text-[var(--color-text-primary)]">{guests.length}</span><Button size="sm" variant="ghost" onClick={() => setActiveTab("guests")}>Edit</Button></div></Field>}
              <div className="col-span-2"><Field label="Per-person rounding"><Select value={roundMode} onChange={(event) => setRoundMode(event.target.value as TipRoundMode)} aria-label="Per-person rounding"><option value="fair">Fair minor-unit allocation</option><option value="up-005">Round each up to 0.05</option><option value="up-050">Round each up to 0.50</option><option value="up-whole">Round each up to whole unit</option></Select></Field></div>
            </div>
          </section>
        </aside>

        <section className="min-w-0 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-sm)]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-3 py-2.5">
            <div className="flex min-w-0 flex-wrap gap-1">
              {tabs.map((tab) => <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`rounded-[var(--radius-md)] px-3 py-1.5 text-xs font-bold transition ${activeTab === tab.id ? "bg-[var(--color-primary)] text-white" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-control-hover)]"}`}>{tab.label}</button>)}
            </div>
            <CopyButton text={markdown} size="sm" variant="secondary" disabled={!result}>Copy summary</CopyButton>
          </div>

          <div className="p-4">
            {activeTab === "overview" ? (
              result ? (
                <div className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-[minmax(0,1.4fr)_minmax(220px,0.6fr)]">
                    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-5">
                      <div className="text-xs font-bold uppercase tracking-[0.09em] text-[var(--color-text-tertiary)]">Total to collect</div>
                      <div className="mt-1 text-4xl font-black tracking-tight text-[var(--color-text-primary)]">{formatMoney(result.totalCollected, currency)}</div>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--color-text-tertiary)]">
                        <span>Calculated: <strong className="text-[var(--color-text-secondary)]">{formatMoney(result.totalBeforeRounding, currency)}</strong></span>
                        <span>Round-up delta: <strong className="text-[var(--color-text-secondary)]">{formatMoney(result.roundingDelta, currency)}</strong></span>
                      </div>
                    </div>
                    <div className="rounded-[var(--radius-lg)] border border-[var(--color-primary)]/25 bg-[var(--color-primary)]/5 p-5 text-center">
                      <div className="text-xs font-bold uppercase tracking-[0.09em] text-[var(--color-primary-text-strong)]">Average per guest</div>
                      <div className="mt-2 text-3xl font-black tracking-tight text-[var(--color-text-primary)]">{formatMoney(result.averagePerPerson, currency)}</div>
                      <div className="mt-1 text-xs text-[var(--color-text-tertiary)]">{result.people} share{result.people === 1 ? "" : "s"}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                    <MetricCard label="Subtotal" value={formatMoney(result.subtotal, currency)} />
                    <MetricCard label="Tax" value={formatMoney(result.taxAmount, currency)} hint={`${input.taxPercent}%`} />
                    <MetricCard label="Service" value={formatMoney(result.serviceAmount, currency)} hint={`${input.servicePercent}%`} />
                    <MetricCard label="Tip" value={formatMoney(result.tipAmount, currency)} hint={`${input.tipPercent}%`} />
                  </div>

                  <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4">
                    <div className="mb-3 flex items-center justify-between gap-2"><h3 className="text-sm font-black text-[var(--color-text-primary)]">Cost breakdown</h3><span className="text-xs text-[var(--color-text-tertiary)]">relative to largest component</span></div>
                    <div className="space-y-3">
                      {breakdown.map((item) => (
                        <div key={item.label} className="grid grid-cols-[74px_minmax(0,1fr)_auto] items-center gap-3">
                          <span className="text-xs font-bold text-[var(--color-text-secondary)]">{item.label}</span>
                          <div className="h-2 overflow-hidden rounded-full bg-[var(--color-surface-subtle)]"><div className="h-full rounded-full bg-[var(--color-primary)]" style={{ width: `${Math.max(item.value > 0 ? 2 : 0, (item.value / maxBreakdown) * 100)}%` }} /></div>
                          <span className="font-mono text-xs font-bold text-[var(--color-text-primary)]">{formatMoney(item.value, currency)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[var(--radius-md)] border border-[var(--color-info-border)] bg-[var(--color-info-bg)] p-3 text-xs text-[var(--color-info-text)]">
                    The tip is calculated on <strong>{tipBasis === "subtotal" ? "the subtotal" : tipBasis === "subtotal-tax" ? "subtotal plus tax" : "subtotal, tax, and service charge"}</strong>, equal to {formatMoney(result.tipBasisAmount, currency)}.
                  </div>
                </div>
              ) : <div className="flex min-h-[420px] items-center justify-center text-sm text-[var(--color-text-tertiary)]">Enter valid receipt and split values.</div>
            ) : null}

            {activeTab === "guests" ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div><h3 className="text-sm font-black text-[var(--color-text-primary)]">Guest allocation</h3><p className="text-xs text-[var(--color-text-tertiary)]">Weights represent relative consumption—not currency amounts.</p></div>
                  <div className="flex gap-2"><Button size="sm" variant={splitMode === "equal" ? "soft" : "secondary"} onClick={() => setSplitMode("equal")}>Equal</Button><Button size="sm" variant={splitMode === "weighted" ? "soft" : "secondary"} onClick={() => setSplitMode("weighted")}>Weighted</Button>{splitMode === "weighted" ? <Button size="sm" variant="secondary" onClick={addGuest} leftIcon={<Plus className="h-3.5 w-3.5" />}>Add guest</Button> : null}</div>
                </div>

                {splitMode === "weighted" ? (
                  <div className="space-y-2">
                    {guests.map((guest, index) => {
                      const share = result?.guestShares[index];
                      return (
                        <div key={guest.id} className="grid gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3 sm:grid-cols-[minmax(150px,1fr)_110px_120px_36px] sm:items-end">
                          <Field label={`Guest ${index + 1}`}><Input value={guest.name} onChange={(event) => updateGuest(guest.id, { name: event.target.value })} aria-label={`Guest ${index + 1} name`} /></Field>
                          <Field label="Weight"><Input type="text" inputMode="decimal" value={Number.isFinite(guest.weight) ? String(guest.weight) : ""} onChange={(event) => updateGuest(guest.id, { weight: parseNumber(event.target.value) })} aria-label={`${guest.name} weight`} /></Field>
                          <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-subtle)] px-3 py-2 text-right"><div className="font-mono text-sm font-black text-[var(--color-text-primary)]">{share ? formatMoney(share.finalShare, currency) : "—"}</div><div className="text-xs text-[var(--color-text-tertiary)]">{share ? `${share.sharePercent.toFixed(1)}% share` : "invalid weight"}</div></div>
                          <Button size="icon" variant="ghost" onClick={() => removeGuest(guest.id)} disabled={guests.length <= 1} aria-label={`Remove ${guest.name}`} leftIcon={<Trash2 className="h-4 w-4" />} />
                        </div>
                      );
                    })}
                  </div>
                ) : null}

                {result ? (
                  <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)]">
                    <table className="w-full min-w-[620px] text-left text-xs">
                      <thead className="bg-[var(--color-surface-subtle)] text-xs uppercase tracking-[0.07em] text-[var(--color-text-tertiary)]"><tr><th className="px-3 py-2">Guest</th><th className="px-3 py-2 text-right">Weight</th><th className="px-3 py-2 text-right">Share</th><th className="px-3 py-2 text-right">Exact</th><th className="px-3 py-2 text-right">Final</th><th className="px-3 py-2 text-right">Rounding</th></tr></thead>
                      <tbody className="divide-y divide-[var(--color-border-subtle)] bg-[var(--color-surface-base)]">
                        {result.guestShares.map((share) => <tr key={share.id}><td className="px-3 py-2.5 font-bold text-[var(--color-text-primary)]">{share.name}</td><td className="px-3 py-2.5 text-right font-mono text-[var(--color-text-secondary)]">{share.weight}</td><td className="px-3 py-2.5 text-right font-mono text-[var(--color-text-secondary)]">{share.sharePercent.toFixed(2)}%</td><td className="px-3 py-2.5 text-right font-mono text-[var(--color-text-secondary)]">{formatMoney(share.exactShare, currency)}</td><td className="px-3 py-2.5 text-right font-mono font-black text-[var(--color-text-primary)]">{formatMoney(share.finalShare, currency)}</td><td className="px-3 py-2.5 text-right font-mono text-[var(--color-text-tertiary)]">{formatMoney(share.roundingDelta, currency)}</td></tr>)}
                      </tbody>
                    </table>
                  </div>
                ) : <div className="rounded-[var(--radius-md)] border border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] p-3 text-xs text-[var(--color-danger-text)]">Fix the bill or guest weights to generate shares.</div>}
              </div>
            ) : null}

            {activeTab === "scenarios" ? (
              <div className="space-y-4">
                <div><h3 className="text-sm font-black text-[var(--color-text-primary)]">Common tip comparison</h3><p className="text-xs text-[var(--color-text-tertiary)]">All scenarios keep the current tax, service, basis, split, currency, and rounding settings.</p></div>
                <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)]">
                  <table className="w-full min-w-[560px] text-left text-xs">
                    <thead className="bg-[var(--color-surface-subtle)] text-xs uppercase tracking-[0.07em] text-[var(--color-text-tertiary)]"><tr><th className="px-3 py-2">Tip rate</th><th className="px-3 py-2 text-right">Tip amount</th><th className="px-3 py-2 text-right">Bill total</th><th className="px-3 py-2 text-right">Average share</th><th className="px-3 py-2 text-right">Action</th></tr></thead>
                    <tbody className="divide-y divide-[var(--color-border-subtle)] bg-[var(--color-surface-base)]">
                      {scenarios.map((scenario) => <tr key={scenario.tipPercent} className={scenario.tipPercent === input.tipPercent ? "bg-[var(--color-primary)]/5" : ""}><td className="px-3 py-2.5 font-mono font-black text-[var(--color-text-primary)]">{scenario.tipPercent}%</td><td className="px-3 py-2.5 text-right font-mono text-[var(--color-text-secondary)]">{formatMoney(scenario.tipAmount, currency)}</td><td className="px-3 py-2.5 text-right font-mono font-bold text-[var(--color-text-primary)]">{formatMoney(scenario.total, currency)}</td><td className="px-3 py-2.5 text-right font-mono text-[var(--color-text-secondary)]">{formatMoney(scenario.averagePerPerson, currency)}</td><td className="px-3 py-2.5 text-right"><Button size="sm" variant="ghost" onClick={() => setRawTip(String(scenario.tipPercent))}>Use</Button></td></tr>)}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {activeTab === "exports" ? (
              <div className="space-y-4">
                <div><h3 className="text-sm font-black text-[var(--color-text-primary)]">Production review</h3><p className="text-xs text-[var(--color-text-tertiary)]">Review assumptions before sharing or collecting money.</p></div>
                <div className="grid gap-2 md:grid-cols-2">
                  {checks.map((check) => <div key={check.id} className={`rounded-[var(--radius-md)] border p-3 ${CHECK_STYLES[check.level]}`}><div className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /><div><div className="text-xs font-black">{check.title}</div><div className="mt-1 text-xs leading-4 opacity-90">{check.message}</div></div></div></div>)}
                </div>

                <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4">
                  <h3 className="flex items-center gap-2 text-sm font-black text-[var(--color-text-primary)]"><PackageCheck className="h-4 w-4 text-[var(--color-primary-text-strong)]" />Practical exports</h3>
                  <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-3">
                    <Button size="sm" variant="secondary" disabled={!result} onClick={() => downloadText("bill-split-summary.md", markdown, "text/markdown;charset=utf-8")} leftIcon={<ReceiptText className="h-4 w-4" />}>Markdown</Button>
                    <Button size="sm" variant="secondary" disabled={!result} onClick={() => downloadText("guest-shares.csv", guestCsv, "text/csv;charset=utf-8")} leftIcon={<FileSpreadsheet className="h-4 w-4" />}>Guest CSV</Button>
                    <Button size="sm" variant="secondary" onClick={() => downloadText("tip-scenarios.csv", scenarioCsv, "text/csv;charset=utf-8")} leftIcon={<FileSpreadsheet className="h-4 w-4" />}>Scenario CSV</Button>
                    <Button size="sm" variant="secondary" onClick={() => downloadText("bill-split-report.json", reportJson, "application/json;charset=utf-8")} leftIcon={<FileJson className="h-4 w-4" />}>JSON report</Button>
                    <Button size="sm" variant="secondary" onClick={() => downloadText("split-bill.js", jsSnippet, "text/javascript;charset=utf-8")} leftIcon={<Code2 className="h-4 w-4" />}>JavaScript</Button>
                    <Button size="sm" variant="primary" onClick={downloadPack} leftIcon={<Download className="h-4 w-4" />}>ZIP pack</Button>
                  </div>
                </div>

                <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4">
                  <div className="mb-2 flex items-center justify-between gap-2"><h3 className="flex items-center gap-2 text-sm font-black text-[var(--color-text-primary)]"><WalletCards className="h-4 w-4 text-[var(--color-primary-text-strong)]" />Shareable summary</h3><CopyButton text={markdown} size="sm" variant="secondary" disabled={!result}>Copy</CopyButton></div>
                  <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-[var(--radius-md)] bg-[var(--color-surface-subtle)] p-3 font-mono text-xs leading-5 text-[var(--color-text-secondary)]">{markdown}</pre>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
