"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Braces,
  CheckCircle2,
  Clock3,
  Download,
  FileCode2,
  FileJson,
  Fingerprint,
  KeyRound,
  LockKeyhole,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";
import { Button, CopyButton, Input, Select, Tabs, Textarea } from "@/components/ui";
import { downloadText, formatBytes } from "../_shared/clientUtils";
import {
  buildJwtChecks,
  buildVerificationSnippet,
  decodeJwt,
  encodeJwtSample,
  verifyJwtSignature,
} from "./jwt";
import { DEFAULT_JWT, getJwtSamples } from "./presets";
import type {
  JwtCheck,
  JwtSampleDefinition,
  JwtTab,
  JwtVerificationMode,
  JwtVerificationResult,
} from "./types";

const CHECK_STYLES: Record<JwtCheck["severity"], string> = {
  success: "border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-text)]",
  info: "border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-[var(--color-info-text)]",
  warning: "border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]",
  danger: "border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]",
};

const CLAIM_STYLES = {
  success: "border-[var(--color-success-border)] bg-[var(--color-success-bg)]",
  info: "border-[var(--color-info-border)] bg-[var(--color-info-bg)]",
  warning: "border-[var(--color-warning-border)] bg-[var(--color-warning-bg)]",
  danger: "border-[var(--color-danger-border)] bg-[var(--color-danger-bg)]",
};

const EMPTY_VERIFICATION: JwtVerificationResult = {
  status: "idle",
  message: "Verification has not been run.",
  verifiedAt: null,
  algorithm: null,
  payload: null,
  header: null,
};

function SummaryCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-3 py-2.5 shadow-[var(--shadow-xs)]">
      <div className="truncate font-mono text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{label}</div>
      <div className="mt-1 truncate text-xl font-black tracking-tight text-[var(--color-text-primary)]">{value}</div>
      <div className="mt-0.5 truncate text-xs text-[var(--color-text-tertiary)]">{hint}</div>
    </div>
  );
}

function CheckIcon({ severity }: { severity: JwtCheck["severity"] }) {
  if (severity === "success") return <CheckCircle2 className="h-4 w-4" aria-hidden />;
  if (severity === "danger") return <XCircle className="h-4 w-4" aria-hidden />;
  if (severity === "warning") return <AlertTriangle className="h-4 w-4" aria-hidden />;
  return <ShieldCheck className="h-4 w-4" aria-hidden />;
}

function formatStatus(status: ReturnType<typeof decodeJwt>["status"]) {
  if (status === "not-yet-valid") return "Not active";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function JwtDecoderClient() {
  const samples = useMemo(() => getJwtSamples(), []);
  const [token, setToken] = useState(DEFAULT_JWT);
  const [selectedPreset, setSelectedPreset] = useState(samples[0]?.id ?? "");
  const [tab, setTab] = useState<JwtTab>("payload");
  const [verificationMode, setVerificationMode] = useState<JwtVerificationMode>("secret");
  const [secret, setSecret] = useState("");
  const [jwk, setJwk] = useState("");
  const [issuer, setIssuer] = useState("");
  const [audience, setAudience] = useState("");
  const [verification, setVerification] = useState<JwtVerificationResult>(EMPTY_VERIFICATION);
  const [verifying, setVerifying] = useState(false);

  const decoded = useMemo(() => decodeJwt(token), [token]);
  const checks = useMemo(() => buildJwtChecks(decoded).map((check) => {
    if (check.id !== "signature" || verification.status === "idle") return check;
    return verification.status === "verified"
      ? { ...check, severity: "success" as const, title: "Signature and expectations verified", message: verification.message }
      : { ...check, severity: "danger" as const, title: "Verification failed", message: verification.message };
  }), [decoded, verification.message, verification.status]);
  const verificationSnippet = useMemo(
    () => buildVerificationSnippet(verificationMode, decoded.algorithm, issuer, audience),
    [audience, decoded.algorithm, issuer, verificationMode],
  );
  const reportJson = useMemo(() => JSON.stringify({
    generatedAt: new Date().toISOString(),
    decoder: "Darma JWT Decoder",
    notice: "Decoded content is not proof of authenticity. Verification keys are intentionally excluded.",
    summary: {
      decodeStatus: decoded.status,
      algorithm: decoded.algorithm,
      tokenType: decoded.tokenType,
      tokenBytes: decoded.tokenBytes,
      headerClaims: decoded.headerClaimCount,
      payloadClaims: decoded.payloadClaimCount,
      expired: decoded.claimAnalysis.isExpired,
      notYetValid: decoded.claimAnalysis.isNotYetValid,
      verificationStatus: verification.status,
      verificationMessage: verification.message,
      expectedIssuer: issuer.trim() || null,
      expectedAudience: audience.trim() || null,
    },
    header: decoded.header?.parsed ?? null,
    payload: decoded.payload?.parsed ?? null,
    signaturePresent: Boolean(decoded.signature),
    claimInsights: decoded.claimAnalysis.insights,
    productionChecks: checks,
  }, null, 2), [audience, checks, decoded, issuer, verification.message, verification.status]);

  const activeValue = tab === "header"
    ? decoded.header?.pretty ?? ""
    : tab === "payload"
      ? decoded.payload?.pretty ?? ""
      : tab === "signature"
        ? decoded.signature || "No signature segment."
        : tab === "security"
          ? checks.map((check) => `[${check.severity.toUpperCase()}] ${check.title}\n${check.message}`).join("\n\n")
          : decoded.claimAnalysis.insights.map((claim) => `${claim.label} (${claim.key})\n${claim.value}\n${claim.description}`).join("\n\n");

  const verificationLabel = verification.status === "verified" ? "Verified" : verification.status === "failed" ? "Failed" : "Not run";
  const verificationHint = verification.status === "verified"
    ? `${verification.algorithm ?? decoded.algorithm ?? "Algorithm"} signature passed`
    : verification.status === "failed"
      ? verification.message
      : "Decode does not verify";

  function updateToken(value: string) {
    setToken(value);
    setSelectedPreset("");
    setVerification(EMPTY_VERIFICATION);
  }

  function applyPreset(sample: JwtSampleDefinition) {
    setToken(encodeJwtSample(sample));
    setSelectedPreset(sample.id);
    setTab("payload");
    setVerification(EMPTY_VERIFICATION);
    setSecret("");
    setJwk("");
    setIssuer(typeof sample.payload.iss === "string" ? sample.payload.iss : "");
    const sampleAudience = sample.payload.aud;
    setAudience(typeof sampleAudience === "string" ? sampleAudience : Array.isArray(sampleAudience) ? String(sampleAudience[0] ?? "") : "");
  }

  function resetTool() {
    const first = samples[0];
    if (first) applyPreset(first);
    else updateToken(DEFAULT_JWT);
  }

  async function runVerification() {
    setVerifying(true);
    const result = await verifyJwtSignature({ token, mode: verificationMode, secret, jwk, issuer, audience });
    setVerification(result);
    setVerifying(false);
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
        <div className="min-w-0 space-y-4">
        <section className="flex min-w-0 flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-sm)]">
          <div className="flex flex-col gap-2 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/75 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2"><Fingerprint className="h-4 w-4 text-[var(--color-primary-text-strong)]" aria-hidden /><h2 className="text-sm font-bold text-[var(--color-text-primary)]">1. Paste or inspect a JWT</h2></div>
              <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">Processed locally. The token is not stored in browser storage.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <CopyButton text={token} size="sm" variant="secondary">Copy token</CopyButton>
              <Button size="sm" variant="ghost" onClick={() => updateToken("")}>Clear</Button>
            </div>
          </div>
          <div className="space-y-3 p-3 sm:p-4">
            <Textarea
              aria-label="JWT token"
              value={token}
              onChange={(event) => updateToken(event.target.value)}
              minRows={8}
              spellCheck={false}
              variant="editor"
              placeholder="Paste header.payload.signature"
              aria-invalid={decoded.status === "invalid"}
              className="break-all text-xs"
            />
            {decoded.segments.length === 3 ? (
              <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-inset)] p-3">
                <div className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Token anatomy</div>
                <div className="break-all font-mono text-xs leading-5">
                  <span className="text-[var(--color-danger-text)]">{decoded.segments[0]}</span>
                  <span className="text-[var(--color-text-tertiary)]">.</span>
                  <span className="text-[var(--color-info-text)]">{decoded.segments[1]}</span>
                  <span className="text-[var(--color-text-tertiary)]">.</span>
                  <span className="text-[var(--color-success-text)]">{decoded.segments[2] || "(empty)"}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-[var(--color-text-tertiary)]">
                  <span>Header</span><span>Payload</span><span>Signature</span>
                </div>
              </div>
            ) : null}
            <div className="flex items-start gap-2 rounded-[var(--radius-md)] border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] p-3 text-xs leading-5 text-[var(--color-warning-text)]">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <p><strong>Decode is not verify.</strong> Anyone can Base64URL-encode a payload. Do not authorize a request until a trusted server verifies the signature, algorithm, issuer, audience, and time claims.</p>
            </div>
          </div>
        </section>

        <section className="flex min-w-0 flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-sm)]">
          <div className="flex flex-col gap-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/75 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2"><Braces className="h-4 w-4 text-[var(--color-primary-text-strong)]" aria-hidden /><h2 className="text-sm font-bold text-[var(--color-text-primary)]">2. Inspect decoded content</h2></div>
              <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">Switch between JSON, registered claims, signature data, and security findings.</p>
            </div>
            <CopyButton text={activeValue} size="sm" variant="secondary">Copy current view</CopyButton>
          </div>
          <div className="border-b border-[var(--color-border-subtle)] px-3 py-2">
            <Tabs<JwtTab>
              ariaLabel="JWT sections"
              value={tab}
              onChange={setTab}
              items={[
                { value: "payload", label: "Payload" },
                { value: "header", label: "Header" },
                { value: "claims", label: "Claims" },
                { value: "security", label: "Security" },
                { value: "signature", label: "Signature" },
              ]}
            />
          </div>
          <div className="min-h-[26rem] flex-1 overflow-auto p-3 sm:p-4">
            {tab === "claims" ? (
              decoded.claimAnalysis.insights.length ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {decoded.claimAnalysis.insights.map((claim) => (
                    <article key={claim.key} className={`min-w-0 rounded-[var(--radius-md)] border p-3 ${CLAIM_STYLES[claim.status]}`}>
                      <div className="flex items-center justify-between gap-2"><h3 className="truncate text-xs font-bold text-[var(--color-text-primary)]">{claim.label}</h3><code className="shrink-0 text-xs text-[var(--color-text-tertiary)]">{claim.key}</code></div>
                      <div className="mt-2 break-words text-sm font-semibold text-[var(--color-text-primary)]">{claim.value}</div>
                      <p className="mt-1 text-xs leading-4 text-[var(--color-text-secondary)]">{claim.description}</p>
                    </article>
                  ))}
                </div>
              ) : <div className="grid min-h-72 place-items-center text-center text-sm text-[var(--color-text-tertiary)]">No registered claims are available.</div>
            ) : tab === "security" ? (
              <div className="space-y-2">
                {checks.map((check) => (
                  <article key={check.id} className={`flex gap-2 rounded-[var(--radius-md)] border p-3 ${CHECK_STYLES[check.severity]}`}>
                    <span className="mt-0.5 shrink-0"><CheckIcon severity={check.severity} /></span>
                    <div className="min-w-0"><h3 className="text-xs font-bold">{check.title}</h3><p className="mt-1 text-xs leading-4 opacity-90">{check.message}</p></div>
                  </article>
                ))}
              </div>
            ) : (
              <pre className="min-h-80 whitespace-pre-wrap break-all rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-inset)] p-4 font-mono text-xs leading-6 text-[var(--color-text-primary)]">{activeValue || "Decoded content will appear here."}</pre>
            )}
          </div>
        </section>
        </div>

        <aside className="min-w-0 space-y-4 xl:sticky xl:top-24 xl:max-h-[calc(100vh-7rem)] xl:overflow-y-auto xl:overscroll-contain xl:pr-1">
          <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-sm)]">
            <div className="border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/75 px-4 py-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[var(--color-primary-text-strong)]" aria-hidden />
                <h2 className="text-sm font-bold text-[var(--color-text-primary)]">Analysis status</h2>
              </div>
              <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">Decode health, token metadata, and verification state.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 p-3" aria-label="JWT summary">
              <SummaryCard label="Decode" value={formatStatus(decoded.status)} hint={decoded.status === "decoded" ? "Readable only" : decoded.issues[0]?.message ?? "Review token"} />
              <SummaryCard label="Algorithm" value={decoded.algorithm ?? "—"} hint={decoded.tokenType ? `Type ${decoded.tokenType}` : "No typ header"} />
              <SummaryCard label="Claims" value={decoded.payloadClaimCount.toLocaleString()} hint={`${decoded.headerClaimCount} header · ${formatBytes(decoded.tokenBytes)}`} />
              <SummaryCard label="Verify" value={verificationLabel} hint={verificationHint} />
            </div>
          </section>

          <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-sm)]">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/75 px-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[var(--color-primary-text-strong)]" aria-hidden />
                  <h2 className="text-sm font-bold text-[var(--color-text-primary)]">Safe sample tokens</h2>
                </div>
                <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">Explore lifecycle, identity, privacy, and unsecured-token cases.</p>
              </div>
              <Button size="sm" variant="ghost" leftIcon={<RefreshCcw className="h-3.5 w-3.5" />} onClick={resetTool}>Reset</Button>
            </div>
            <div className="grid gap-2 p-3 sm:grid-cols-2 xl:grid-cols-1">
                {samples.map((sample) => (
                  <button
                    key={sample.id}
                    type="button"
                    aria-pressed={selectedPreset === sample.id}
                    onClick={() => applyPreset(sample)}
                    className={`min-w-0 rounded-[var(--radius-md)] border p-2.5 text-left transition focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)] ${selectedPreset === sample.id ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]" : "border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-raised)]"}`}
                  >
                    <span className="block truncate text-xs font-bold text-[var(--color-text-primary)]">{sample.label}</span>
                    <span className="mt-1 block truncate font-mono text-xs uppercase tracking-[0.06em] text-[var(--color-text-tertiary)]">{sample.category}</span>
                    <span className="mt-1 line-clamp-2 block text-xs leading-4 text-[var(--color-text-secondary)]">{sample.description}</span>
                  </button>
                ))}
            </div>
          </section>
        </aside>
      </div>

      <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-sm)]">
        <div className="flex flex-col gap-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/75 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2"><LockKeyhole className="h-4 w-4 text-[var(--color-primary-text-strong)]" aria-hidden /><h2 className="text-sm font-bold text-[var(--color-text-primary)]">3. Optional signature verification</h2></div>
            <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">Uses the existing jose library locally. Keys remain in this page state and are excluded from reports.</p>
          </div>
          <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${verification.status === "verified" ? CHECK_STYLES.success : verification.status === "failed" ? CHECK_STYLES.danger : CHECK_STYLES.info}`}>
            {verification.status === "verified" ? <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> : verification.status === "failed" ? <ShieldAlert className="h-3.5 w-3.5" aria-hidden /> : <KeyRound className="h-3.5 w-3.5" aria-hidden />}
            {verificationLabel}
          </div>
        </div>
        <div className="grid gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
          <div className="space-y-3">
            <div className="grid gap-3 md:grid-cols-3">
              <label className="space-y-1.5 text-xs font-semibold text-[var(--color-text-secondary)]">Key type<Select value={verificationMode} onChange={(event) => { setVerificationMode(event.target.value as JwtVerificationMode); setVerification(EMPTY_VERIFICATION); }}><option value="secret">HMAC shared secret</option><option value="jwk">Public JWK</option></Select></label>
              <label className="space-y-1.5 text-xs font-semibold text-[var(--color-text-secondary)]">Expected issuer<Input value={issuer} onChange={(event) => { setIssuer(event.target.value); setVerification(EMPTY_VERIFICATION); }} placeholder="Optional exact iss" /></label>
              <label className="space-y-1.5 text-xs font-semibold text-[var(--color-text-secondary)]">Expected audience<Input value={audience} onChange={(event) => { setAudience(event.target.value); setVerification(EMPTY_VERIFICATION); }} placeholder="Optional exact aud" /></label>
            </div>
            {verificationMode === "secret" ? (
              <label className="block space-y-1.5 text-xs font-semibold text-[var(--color-text-secondary)]">Expected HMAC secret<Input type="password" autoComplete="off" value={secret} onChange={(event) => { setSecret(event.target.value); setVerification(EMPTY_VERIFICATION); }} placeholder="Never paste a production secret on an untrusted device" /></label>
            ) : (
              <label className="block space-y-1.5 text-xs font-semibold text-[var(--color-text-secondary)]">Expected public JWK<Textarea value={jwk} onChange={(event) => { setJwk(event.target.value); setVerification(EMPTY_VERIFICATION); }} minRows={5} variant="editor" spellCheck={false} placeholder={'{"kty":"RSA","n":"...","e":"AQAB"}'} /></label>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={runVerification} loading={verifying} leftIcon={<ShieldCheck className="h-4 w-4" />} disabled={decoded.status === "empty" || decoded.status === "invalid"}>Verify signature and claims</Button>
              <Button variant="ghost" onClick={() => { setSecret(""); setJwk(""); setVerification(EMPTY_VERIFICATION); }}>Clear key</Button>
            </div>
            {verification.status !== "idle" ? (
              <div className={`rounded-[var(--radius-md)] border p-3 text-xs leading-5 ${verification.status === "verified" ? CHECK_STYLES.success : CHECK_STYLES.danger}`}>
                <strong>{verification.status === "verified" ? "Verification passed." : "Verification failed."}</strong> {verification.message}
              </div>
            ) : null}
          </div>
          <div className="min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-inset)] p-3">
            <div className="mb-2 flex items-center justify-between gap-2"><div><h3 className="text-xs font-bold text-[var(--color-text-primary)]">Server verification starter</h3><p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">Keep trusted keys and claim expectations on the server.</p></div><CopyButton text={verificationSnippet} size="sm" variant="secondary">Copy</CopyButton></div>
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-5 text-[var(--color-text-secondary)]">{verificationSnippet}</pre>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
        <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-sm)]">
          <div className="border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/75 px-4 py-3"><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[var(--color-primary-text-strong)]" aria-hidden /><h2 className="text-sm font-bold text-[var(--color-text-primary)]">4. Production checks</h2></div><p className="mt-1 text-xs text-[var(--color-text-tertiary)]">Structural, lifecycle, privacy, algorithm, and deployment checks.</p></div>
          <div className="grid gap-2 p-3 sm:grid-cols-2">
            {checks.map((check) => <article key={check.id} className={`flex gap-2 rounded-[var(--radius-md)] border p-3 ${CHECK_STYLES[check.severity]}`}><span className="mt-0.5 shrink-0"><CheckIcon severity={check.severity} /></span><div className="min-w-0"><h3 className="text-xs font-bold">{check.title}</h3><p className="mt-1 text-xs leading-4 opacity-90">{check.message}</p></div></article>)}
          </div>
        </section>

        <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-sm)]">
          <div className="border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/75 px-4 py-3"><div className="flex items-center gap-2"><Download className="h-4 w-4 text-[var(--color-primary-text-strong)]" aria-hidden /><h2 className="text-sm font-bold text-[var(--color-text-primary)]">Safe exports</h2></div><p className="mt-1 text-xs text-[var(--color-text-tertiary)]">Verification secrets and JWK input are never included.</p></div>
          <div className="space-y-2 p-3">
            <Button fullWidth variant="secondary" leftIcon={<FileJson className="h-4 w-4" />} onClick={() => downloadText("jwt-analysis-report.json", reportJson, "application/json;charset=utf-8")}>Download JSON report</Button>
            <Button fullWidth variant="secondary" leftIcon={<FileCode2 className="h-4 w-4" />} onClick={() => downloadText("jwt-verification.mjs", verificationSnippet, "text/javascript;charset=utf-8")}>Download verification starter</Button>
            <CopyButton fullWidth text={decoded.decodedJson} variant="secondary">Copy decoded JSON</CopyButton>
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-inset)] p-3 text-xs leading-5 text-[var(--color-text-tertiary)]">
              <div className="flex items-center gap-2 font-bold text-[var(--color-text-secondary)]"><Clock3 className="h-3.5 w-3.5" aria-hidden />Current lifecycle</div>
              <p className="mt-1">{decoded.claimAnalysis.expiresAt ? `Expires ${decoded.claimAnalysis.expiresIn ?? "at the declared time"}.` : "No exp claim is declared."}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
