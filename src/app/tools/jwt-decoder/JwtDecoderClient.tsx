"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Download, FileJson, KeyRound, RefreshCw, ShieldAlert, ShieldCheck, Trash2 } from "lucide-react";
import { Badge, Button, CopyButton, Field, Tabs, Textarea } from "@/components/ui";
import { cn } from "@/lib/cn";
import { decodeJwt, JWT_INPUT_LIMIT } from "./jwt";
import { CLAIM_DESCRIPTIONS, DEFAULT_JWT, JWT_SAMPLES } from "./presets";
import type { JwtClaimInsight, JwtDecodeIssue, JwtTab } from "./types";

const TAB_ITEMS: { value: JwtTab; label: string }[] = [
  { value: "header", label: "Header" },
  { value: "payload", label: "Payload" },
  { value: "claims", label: "Claims" },
  { value: "signature", label: "Signature" },
];

function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function issueStyles(level: JwtDecodeIssue["level"]) {
  if (level === "error") return "border-red-200 bg-red-50 text-red-900";
  if (level === "warning") return "border-amber-200 bg-amber-50 text-amber-900";
  return "border-sky-200 bg-sky-50 text-sky-900";
}

function StatusBadge({ resultStatus }: { resultStatus: string }) {
  if (resultStatus === "empty") return <Badge variant="soft">Ready</Badge>;
  if (resultStatus === "invalid") return <Badge variant="danger">Invalid format</Badge>;
  if (resultStatus === "warning") return <Badge variant="warning">Decoded with warnings</Badge>;
  return <Badge variant="success">Valid structure</Badge>;
}

function ClaimBadge({ insight }: { insight: JwtClaimInsight }) {
  const variant = insight.status === "danger" ? "danger" : insight.status === "warning" ? "warning" : insight.status === "success" ? "success" : "outline";
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--color-text-soft)]">{insight.label}</p>
          <p className="mt-1 break-all font-mono text-sm font-bold text-[var(--color-text)]">{insight.value}</p>
        </div>
        <Badge variant={variant}>{insight.key}</Badge>
      </div>
      <p className="mt-2 text-xs leading-5 text-[var(--color-text-muted)]">{insight.description}</p>
    </div>
  );
}

function CodeBlock({ value, emptyText = "Nothing decoded yet." }: { value: string; emptyText?: string }) {
  return (
    <pre className="min-h-[360px] overflow-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-slate-950 p-4 font-mono text-xs leading-5 text-slate-100 shadow-[var(--shadow-soft)]">
      {value || emptyText}
    </pre>
  );
}

export default function JwtDecoderClient() {
  const [token, setToken] = useState(DEFAULT_JWT);
  const [activeTab, setActiveTab] = useState<JwtTab>("payload");
  const result = useMemo(() => decodeJwt(token), [token]);
  const tooLarge = token.length > JWT_INPUT_LIMIT;

  const headerJson = result.header?.pretty ?? "";
  const payloadJson = result.payload?.pretty ?? "";
  const fullDecodedJson = result.decodedJson;

  function handleTokenChange(value: string) {
    setToken(value.slice(0, JWT_INPUT_LIMIT + 1));
  }

  function handleClear() {
    setToken("");
  }

  function handleLoadSample(sampleToken = DEFAULT_JWT) {
    setToken(sampleToken);
  }

  const currentTabContent = (() => {
    if (activeTab === "header") return <CodeBlock value={headerJson} />;
    if (activeTab === "payload") return <CodeBlock value={payloadJson} />;
    if (activeTab === "signature") {
      return (
        <div className="space-y-3">
          <CodeBlock value={result.signature} emptyText="No signature segment found." />
          <div className="rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            This screen shows the signature segment only. It does not verify whether the signature is correct.
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {result.claimAnalysis.insights.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {result.claimAnalysis.insights.map((insight) => (
              <ClaimBadge key={`${insight.key}-${insight.value}`} insight={insight} />
            ))}
          </div>
        ) : (
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-sm text-[var(--color-text-muted)]">
            No registered claim insights are available for this payload.
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {CLAIM_DESCRIPTIONS.map((claim) => (
            <div key={claim.claim} className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-soft)] p-4">
              <p className="font-mono text-sm font-black text-[var(--color-text)]">{claim.claim}</p>
              <p className="text-xs font-bold text-[var(--color-text-muted)]">{claim.label}</p>
              <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">{claim.description}</p>
            </div>
          ))}
        </div>
      </div>
    );
  })();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-black text-[var(--color-text)]">JWT Decoder</h2>
            <Badge variant="success" className="gap-1">
              <ShieldCheck className="h-3 w-3" aria-hidden /> Browser-only
            </Badge>
            <StatusBadge resultStatus={result.status} />
          </div>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--color-text-muted)]">
            Decode JWT header and payload JSON locally. Signature verification is intentionally not included in this v1 tool.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => handleLoadSample()} leftIcon={<RefreshCw className="h-4 w-4" />}>
            Load sample
          </Button>
          <Button variant="secondary" onClick={handleClear} leftIcon={<Trash2 className="h-4 w-4" />}>
            Clear
          </Button>
          <CopyButton text={token} disabled={!token} variant="secondary">
            Copy token
          </CopyButton>
          <CopyButton text={headerJson} disabled={!headerJson} variant="secondary">
            Copy header JSON
          </CopyButton>
          <CopyButton text={payloadJson} disabled={!payloadJson} variant="secondary">
            Copy payload JSON
          </CopyButton>
          <CopyButton text={fullDecodedJson} disabled={!fullDecodedJson} variant="secondary">
            Copy decoded JSON
          </CopyButton>
          <Button variant="secondary" onClick={() => downloadFile("darma-jwt-decoded.json", fullDecodedJson, "application/json")} disabled={!fullDecodedJson} leftIcon={<Download className="h-4 w-4" />}>
            Download JSON
          </Button>
        </div>
      </div>

      <div className="rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <p>
            This tool decodes JWTs locally. It does not verify the signature, so do not use decoded content as proof the token is authentic.
          </p>
        </div>
      </div>

      <Field label="Encoded JWT" description={`${token.length.toLocaleString()} / ${JWT_INPUT_LIMIT.toLocaleString()} characters. Paste a token in header.payload.signature format.`}>
        <Textarea
          value={token}
          onChange={(event) => handleTokenChange(event.target.value)}
          placeholder="Paste JWT here..."
          className="min-h-[180px] font-mono text-xs leading-5"
          spellCheck={false}
        />
      </Field>

      {tooLarge ? (
        <div className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-900">
          JWT input is over the {JWT_INPUT_LIMIT.toLocaleString()} character limit. Shorten it to resume decoding.
        </div>
      ) : null}

      {result.issues.length ? (
        <div className="grid gap-2">
          {result.issues.map((issue, index) => (
            <div key={`${issue.level}-${index}-${issue.message}`} className={cn("rounded-[var(--radius-md)] border p-3 text-sm leading-6", issueStyles(issue.level))}>
              <div className="flex items-start gap-2">
                {issue.level === "error" ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> : issue.level === "warning" ? <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
                <span>{issue.message}</span>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Tabs items={TAB_ITEMS} value={activeTab} onChange={setActiveTab} ariaLabel="JWT decoded sections" />
            <Badge variant="outline" className="gap-1">
              <FileJson className="h-3 w-3" aria-hidden /> {result.segments.length || 0} segment{result.segments.length === 1 ? "" : "s"}
            </Badge>
          </div>
          {currentTabContent}
        </div>

        <aside className="space-y-4">
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-soft)]">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
              <h3 className="font-black text-[var(--color-text)]">Token structure</h3>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <div>
                <p className="font-bold text-[var(--color-text)]">Header</p>
                <p className="break-all font-mono text-xs text-[var(--color-text-muted)]">{result.segments[0] || "Missing"}</p>
              </div>
              <div>
                <p className="font-bold text-[var(--color-text)]">Payload</p>
                <p className="break-all font-mono text-xs text-[var(--color-text-muted)]">{result.segments[1] || "Missing"}</p>
              </div>
              <div>
                <p className="font-bold text-[var(--color-text)]">Signature</p>
                <p className="break-all font-mono text-xs text-[var(--color-text-muted)]">{result.segments[2] || "Missing or empty"}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-soft)]">
            <h3 className="font-black text-[var(--color-text)]">Samples</h3>
            <div className="mt-3 space-y-2">
              {JWT_SAMPLES.map((sample) => (
                <button
                  key={sample.label}
                  type="button"
                  onClick={() => handleLoadSample(sample.token)}
                  className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-soft)] p-3 text-left transition hover:border-[var(--color-border-strong)]"
                >
                  <span className="block text-sm font-bold text-[var(--color-text)]">{sample.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-[var(--color-text-muted)]">{sample.description}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
