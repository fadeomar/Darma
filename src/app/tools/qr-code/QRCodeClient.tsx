"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import {
  Archive,
  Code2,
  Download,
  FileJson,
  FileText,
  ImageDown,
  LoaderCircle,
  Upload,
} from "lucide-react";
import { Badge, Button, Card, Input, Select, Slider, Textarea } from "@/components/ui";
import {
  ColorField,
  ControlGrid,
  ControlSection,
  ResultPanel,
  ToolActionBar,
  ToolControlPanel,
  WarningPanel,
} from "@/features/tools/components";
import { downloadBlobFile } from "@/features/tools/export/downloadBlob";
import { downloadTextFile } from "@/features/tools/export/downloadText";
import { ToolLayoutSingleUtility } from "@/features/tools/layouts";
import {
  DEFAULT_QR_FORM,
  QR_PRESETS,
  buildQRPayload,
  validateQRForm,
  type QRContentType,
  type QRErrorCorrectionLevel,
  type QRFormState,
  type QRWifiEncryption,
} from "./qr";
import {
  DEFAULT_QR_OPTIONS,
  QR_TYPE_LABELS,
  buildQRAudit,
  buildQRCssSnippet,
  buildQRHtmlSnippet,
  buildQRMarkdownReport,
  buildQRReactComponent,
  buildQRSummary,
  createQRProject,
  parseQRProject,
  summarizeQRAudit,
  type QRAuditCheck,
  type QROptions,
} from "./studio";

const qrTypes: Array<{ value: QRContentType; label: string; description: string }> = [
  { value: "url", label: "Website URL", description: "Links, menus, forms, profiles" },
  { value: "text", label: "Plain text", description: "Notes, codes, short instructions" },
  { value: "whatsapp", label: "WhatsApp", description: "Start a chat with a prepared message" },
  { value: "email", label: "Email", description: "Pre-fill a recipient, subject, and body" },
  { value: "phone", label: "Phone", description: "Open a phone call prompt" },
  { value: "sms", label: "SMS", description: "Pre-fill a text message" },
  { value: "wifi", label: "WiFi", description: "Share network access details" },
  { value: "vcard", label: "Contact card", description: "Save a person or business contact" },
  { value: "location", label: "Location", description: "Open map coordinates" },
  { value: "event", label: "Calendar event", description: "Share event details" },
];

function normalizeHex(value: string) {
  if (/^#[0-9a-fA-F]{3}$/.test(value)) {
    const [, r, g, b] = value;
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000";
}

function qrColor(value: string, alpha = "ff") {
  return `${normalizeHex(value)}${alpha}`;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="grid min-w-0 gap-1.5 text-xs font-semibold text-[var(--color-text-secondary)]">
      <span>{label}</span>
      {children}
      {hint ? <span className="font-normal leading-5 text-[var(--color-text-tertiary)]">{hint}</span> : null}
    </label>
  );
}

function SummaryCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <Card padding="sm" className="min-w-0">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{label}</p>
      <p className="mt-2 truncate text-lg font-black tracking-[-0.02em] text-[var(--color-text-primary)]" title={value}>{value}</p>
      <p className="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">{detail}</p>
    </Card>
  );
}

function downloadDataUrl(dataUrl: string, filename: string) {
  if (!dataUrl || typeof document === "undefined") return;
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
}

function auditVariant(severity: QRAuditCheck["severity"]): "danger" | "warning" | "info" | "success" {
  if (severity === "error") return "danger";
  if (severity === "pass") return "success";
  return severity;
}

export default function QRCodeClient() {
  const importInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<QRFormState>(DEFAULT_QR_FORM);
  const [options, setOptions] = useState<QROptions>(DEFAULT_QR_OPTIONS);
  const [pngUrl, setPngUrl] = useState("");
  const [svgText, setSvgText] = useState("");
  const [generationError, setGenerationError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPacking, setIsPacking] = useState(false);
  const [importMessage, setImportMessage] = useState("");

  const payload = useMemo(() => buildQRPayload(form), [form]);
  const validationMessages = useMemo(() => validateQRForm(form), [form]);
  const canGenerate = validationMessages.length === 0 && payload.trim().length > 0;
  const activeType = qrTypes.find((type) => type.value === form.type) ?? qrTypes[0];
  const auditChecks = useMemo(() => {
    const checks = buildQRAudit(form, options);
    return generationError
      ? [{ id: "generation", title: "QR rendering", message: generationError, severity: "error" as const }, ...checks]
      : checks;
  }, [form, generationError, options]);
  const summary = useMemo(() => buildQRSummary(form, options, auditChecks), [auditChecks, form, options]);
  const auditCounts = useMemo(() => summarizeQRAudit(auditChecks), [auditChecks]);
  const projectJson = useMemo(() => JSON.stringify(createQRProject(form, options), null, 2), [form, options]);
  const markdownReport = useMemo(() => buildQRMarkdownReport(form, options, auditChecks), [auditChecks, form, options]);

  const patchForm = (patch: Partial<QRFormState>) => {
    setImportMessage("");
    setForm((current) => ({ ...current, ...patch }));
  };
  const patchOptions = (patch: Partial<QROptions>) => {
    setImportMessage("");
    setOptions((current) => ({ ...current, ...patch }));
  };

  useEffect(() => {
    let cancelled = false;

    async function generate() {
      if (!canGenerate) {
        setPngUrl("");
        setSvgText("");
        setGenerationError("");
        setIsGenerating(false);
        return;
      }

      setIsGenerating(true);
      try {
        const renderOptions = {
          width: options.size,
          margin: options.margin,
          errorCorrectionLevel: options.errorCorrectionLevel,
          color: {
            dark: qrColor(options.foreground),
            light: options.transparentBackground ? qrColor(options.background, "00") : qrColor(options.background),
          },
        };
        const [nextPng, nextSvg] = await Promise.all([
          QRCode.toDataURL(payload, { ...renderOptions, type: "image/png" }),
          QRCode.toString(payload, { ...renderOptions, type: "svg" }),
        ]);

        if (!cancelled) {
          setPngUrl(nextPng);
          setSvgText(nextSvg);
          setGenerationError("");
        }
      } catch {
        if (!cancelled) {
          setPngUrl("");
          setSvgText("");
          setGenerationError("Could not generate this QR code. Try shorter content or a simpler payload.");
        }
      } finally {
        if (!cancelled) setIsGenerating(false);
      }
    }

    void generate();
    return () => {
      cancelled = true;
    };
  }, [canGenerate, options, payload]);

  function reset() {
    setForm(DEFAULT_QR_FORM);
    setOptions(DEFAULT_QR_OPTIONS);
    setImportMessage("");
  }

  function sample() {
    const preset = QR_PRESETS.find((item) => item.id === "restaurant-menu") ?? QR_PRESETS[0];
    setForm({ ...DEFAULT_QR_FORM, ...preset.values });
    setOptions(DEFAULT_QR_OPTIONS);
    setImportMessage("");
  }

  function applyPreset(id: string) {
    const preset = QR_PRESETS.find((item) => item.id === id);
    if (!preset) return;
    setForm({ ...DEFAULT_QR_FORM, ...preset.values });
    setImportMessage("");
  }

  async function importProject(file: File | undefined) {
    if (!file) return;
    if (file.size > 1024 * 1024) {
      setImportMessage("Import failed: JSON project files must be 1 MB or smaller.");
      return;
    }

    try {
      const project = parseQRProject(await file.text());
      setForm(project.form);
      setOptions(project.options);
      setImportMessage(`Imported ${file.name}. Review the preview and production checks before exporting.`);
    } catch (error) {
      setImportMessage(`Import failed: ${error instanceof Error ? error.message : "Unknown project format."}`);
    } finally {
      if (importInputRef.current) importInputRef.current.value = "";
    }
  }

  async function downloadPack() {
    if (!canGenerate || auditCounts.error > 0 || !pngUrl || !svgText || isPacking) return;
    setIsPacking(true);
    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      zip.file("qr-code.svg", svgText);
      zip.file("qr-code.png", pngUrl.split(",")[1] ?? "", { base64: true });
      zip.file("qr-project.json", projectJson);
      zip.file("production-report.md", markdownReport);
      zip.file("embed.html", buildQRHtmlSnippet({ size: options.size }));
      zip.file("qr-code.css", buildQRCssSnippet());
      zip.file("QrCodeCard.tsx", buildQRReactComponent({ size: options.size }));
      const blob = await zip.generateAsync({ type: "blob" });
      downloadBlobFile({ blob, filename: "darma-qr-code-production-pack.zip" });
    } finally {
      setIsPacking(false);
    }
  }

  const readinessVariant = auditCounts.error ? "danger" : auditCounts.warning ? "warning" : "success";

  return (
    <ToolLayoutSingleUtility
      resultSlot={
        <div className="space-y-4">
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="QR project summary">
            {summary.map((item) => <SummaryCard key={item.label} {...item} />)}
          </section>

          <ResultPanel
            title="Live QR preview"
            description="The preview updates locally. Scan-test the final exported file before printing or publishing."
            actions={
              <div className="flex flex-wrap gap-2">
                <Badge variant={readinessVariant}>{auditCounts.error ? "Blocked" : auditCounts.warning ? "Review" : "Ready"}</Badge>
                <Button size="sm" variant="secondary" disabled={!pngUrl} onClick={() => downloadDataUrl(pngUrl, "darma-qr-code.png")} leftIcon={<ImageDown className="h-4 w-4" aria-hidden />}>
                  PNG
                </Button>
                <Button size="sm" variant="secondary" disabled={!svgText} onClick={() => downloadTextFile({ content: svgText, filename: "darma-qr-code.svg", mimeType: "image/svg+xml;charset=utf-8" })} leftIcon={<Download className="h-4 w-4" aria-hidden />}>
                  SVG
                </Button>
              </div>
            }
            value={
              <div className="grid gap-5 lg:grid-cols-[minmax(220px,360px)_minmax(0,1fr)] lg:items-center">
                <div className="flex min-h-[260px] items-center justify-center">
                  {isGenerating ? (
                    <div className="flex aspect-square w-full max-w-[320px] flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-default)] bg-[var(--color-surface-base)] text-sm text-[var(--color-text-tertiary)]">
                      <LoaderCircle className="h-7 w-7 animate-spin" aria-hidden />
                      Generating preview…
                    </div>
                  ) : pngUrl ? (
                    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] p-4 shadow-[var(--shadow-sm)]" style={{ background: options.transparentBackground ? "var(--color-surface-base)" : options.background }}>
                      <Image src={pngUrl} alt={`Generated ${QR_TYPE_LABELS[form.type]} QR code`} width={options.size} height={options.size} className="h-auto max-h-[360px] w-full max-w-[360px]" unoptimized />
                    </div>
                  ) : (
                    <div className="flex aspect-square w-full max-w-[320px] items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-6 text-center text-sm leading-6 text-[var(--color-text-tertiary)]">
                      Complete the required {activeType.label.toLowerCase()} fields to generate a preview.
                    </div>
                  )}
                </div>

                <div className="min-w-0 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{activeType.label}</Badge>
                    <Badge variant="outline">{payload.length} characters</Badge>
                    <Badge variant="outline">{options.size}px</Badge>
                    <Badge variant="outline">EC {options.errorCorrectionLevel}</Badge>
                  </div>
                  <Field label="Encoded payload" hint="This is the exact text a scanner receives. It may include structured WiFi, vCard, geo, or calendar syntax.">
                    <Textarea value={payload} readOnly minRows={8} variant="output" placeholder="The encoded payload will appear here." />
                  </Field>
                </div>
              </div>
            }
          />
        </div>
      }
      actionsSlot={
        <ToolActionBar
          copyText={canGenerate ? payload : ""}
          onDownload={() => downloadDataUrl(pngUrl, "darma-qr-code.png")}
          onReset={reset}
          onSample={sample}
        />
      }
      controlsSlot={
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <ToolControlPanel title="QR content" description="Choose the destination, then complete only the fields required by that format." sticky={false}>
            <ControlSection title="Content type">
              <div className="grid gap-2 sm:grid-cols-2">
                {qrTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    aria-pressed={form.type === type.value}
                    onClick={() => patchForm({ type: type.value })}
                    className={`min-w-0 rounded-[var(--radius-md)] border px-3 py-2.5 text-left transition focus:outline-none focus:shadow-[var(--focus-ring)] ${form.type === type.value ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]" : "border-[var(--color-border-default)] bg-[var(--color-surface-base)] hover:border-[var(--color-border-strong)]"}`}
                  >
                    <span className="block truncate text-sm font-black text-[var(--color-text-primary)]">{type.label}</span>
                    <span className="mt-0.5 block text-xs leading-5 text-[var(--color-text-secondary)]">{type.description}</span>
                  </button>
                ))}
              </div>
            </ControlSection>
            <ControlSection title={`${activeType.label} details`}>
              <QRFields form={form} patchForm={patchForm} />
            </ControlSection>
          </ToolControlPanel>

          <div className="space-y-5">
            <ToolControlPanel title="Practical presets" description="Load a common real-world starting point, then replace its sample data." sticky={false}>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                {QR_PRESETS.map((preset) => (
                  <button key={preset.id} type="button" onClick={() => applyPreset(preset.id)} className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-3 text-left transition hover:border-[var(--color-border-strong)] focus:outline-none focus:shadow-[var(--focus-ring)]">
                    <span className="block text-sm font-black text-[var(--color-text-primary)]">{preset.title}</span>
                    <span className="mt-1 block text-xs leading-5 text-[var(--color-text-secondary)]">{preset.description}</span>
                  </button>
                ))}
              </div>
            </ToolControlPanel>

            <ToolControlPanel title="Design and reliability" description="Keep the pattern large, quiet, and high-contrast for dependable scanning." sticky={false}>
              <ControlSection title="Output">
                <ControlGrid columns={2}>
                  <Field label={`Size: ${options.size}px`}><Slider min={160} max={1024} step={16} value={options.size} onChange={(event) => patchOptions({ size: Number(event.target.value) })} /></Field>
                  <Field label={`Quiet zone: ${options.margin}`}><Slider min={0} max={12} step={1} value={options.margin} onChange={(event) => patchOptions({ margin: Number(event.target.value) })} /></Field>
                </ControlGrid>
              </ControlSection>
              <ControlSection title="Color">
                <ControlGrid columns={2}>
                  <ColorField label="Foreground" value={options.foreground} onChange={(value) => patchOptions({ foreground: value })} />
                  <ColorField label="Background" value={options.background} onChange={(value) => patchOptions({ background: value })} disabled={options.transparentBackground} />
                </ControlGrid>
                <label className="mt-3 flex items-start gap-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                  <input type="checkbox" checked={options.transparentBackground} onChange={(event) => patchOptions({ transparentBackground: event.target.checked })} className="mt-1 h-4 w-4 accent-[var(--color-primary)]" />
                  Transparent background. The final page or print surface must still provide strong contrast.
                </label>
              </ControlSection>
              <ControlSection title="Error correction">
                <Field label="Resilience level" hint="Higher levels recover from more damage but create denser patterns.">
                  <Select value={options.errorCorrectionLevel} onChange={(event) => patchOptions({ errorCorrectionLevel: event.target.value as QRErrorCorrectionLevel })} size="sm">
                    <option value="L">L — smallest pattern</option>
                    <option value="M">M — balanced default</option>
                    <option value="Q">Q — more resilient</option>
                    <option value="H">H — maximum recovery</option>
                  </Select>
                </Field>
              </ControlSection>
            </ToolControlPanel>
          </div>
        </div>
      }
      infoSlot={
        <div className="space-y-5">
          <Card padding="md">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <Badge variant="soft">Project portability</Badge>
                <p className="mt-2 text-sm font-bold text-[var(--color-text-primary)]">Import or export editable settings</p>
              </div>
              <input ref={importInputRef} type="file" accept="application/json,.json" className="hidden" onChange={(event) => void importProject(event.target.files?.[0])} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => importInputRef.current?.click()} leftIcon={<Upload className="h-4 w-4" aria-hidden />}>Import JSON</Button>
              <Button size="sm" variant="secondary" onClick={() => downloadTextFile({ content: projectJson, filename: "darma-qr-project.json", mimeType: "application/json;charset=utf-8" })} leftIcon={<FileJson className="h-4 w-4" aria-hidden />}>Project JSON</Button>
            </div>
            {importMessage ? <p className={`mt-3 text-xs leading-5 ${importMessage.startsWith("Import failed") ? "text-[var(--color-danger-text)]" : "text-[var(--color-success-text)]"}`} role="status">{importMessage}</p> : null}
          </Card>

          <Card padding="md">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <Badge variant={readinessVariant}>Production checks</Badge>
                <p className="mt-2 text-sm font-bold text-[var(--color-text-primary)]">{auditCounts.error} errors · {auditCounts.warning} warnings · {auditCounts.pass} passes</p>
              </div>
            </div>
            <WarningPanel
              className="mt-4"
              messages={auditChecks.map((check) => ({ id: check.id, severity: auditVariant(check.severity), title: check.title, message: check.message }))}
            />
          </Card>

          <Card padding="md">
            <Badge variant="accent">Developer exports</Badge>
            <p className="mt-2 text-sm font-bold text-[var(--color-text-primary)]">Reusable integration files</p>
            <p className="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">Export semantic markup, responsive CSS, a typed React component, a report, or the complete production pack.</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button size="sm" variant="secondary" onClick={() => downloadTextFile({ content: buildQRHtmlSnippet({ size: options.size }), filename: "qr-code.html", mimeType: "text/html;charset=utf-8" })} leftIcon={<Code2 className="h-4 w-4" aria-hidden />}>HTML</Button>
              <Button size="sm" variant="secondary" onClick={() => downloadTextFile({ content: buildQRCssSnippet(), filename: "qr-code.css", mimeType: "text/css;charset=utf-8" })} leftIcon={<FileText className="h-4 w-4" aria-hidden />}>CSS</Button>
              <Button size="sm" variant="secondary" onClick={() => downloadTextFile({ content: buildQRReactComponent({ size: options.size }), filename: "QrCodeCard.tsx", mimeType: "text/plain;charset=utf-8" })} leftIcon={<Code2 className="h-4 w-4" aria-hidden />}>React</Button>
              <Button size="sm" variant="secondary" onClick={() => downloadTextFile({ content: markdownReport, filename: "qr-production-report.md", mimeType: "text/markdown;charset=utf-8" })} leftIcon={<FileText className="h-4 w-4" aria-hidden />}>Report</Button>
              <Button className="col-span-2" size="sm" disabled={!canGenerate || auditCounts.error > 0 || !pngUrl || !svgText || isPacking} onClick={() => void downloadPack()} leftIcon={isPacking ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden /> : <Archive className="h-4 w-4" aria-hidden />}>
                {isPacking ? "Packing…" : "ZIP production pack"}
              </Button>
            </div>
          </Card>
        </div>
      }
    />
  );
}

function QRFields({
  form,
  patchForm,
}: {
  form: QRFormState;
  patchForm: (patch: Partial<QRFormState>) => void;
}) {
  if (form.type === "url") {
    return (
      <Field label="Website URL">
        <Input value={form.url} onChange={(event) => patchForm({ url: event.target.value })} placeholder="https://example.com" />
      </Field>
    );
  }

  if (form.type === "text") {
    return (
      <Field label="Text">
        <Textarea value={form.text} onChange={(event) => patchForm({ text: event.target.value })} minRows={6} placeholder="Type the note, code, or message to encode." />
      </Field>
    );
  }

  if (form.type === "whatsapp") {
    return (
      <div className="grid gap-3">
        <Field label="WhatsApp phone">
          <Input value={form.whatsappPhone} onChange={(event) => patchForm({ whatsappPhone: event.target.value })} placeholder="+15551234567" />
        </Field>
        <Field label="Message">
          <Textarea value={form.whatsappMessage} onChange={(event) => patchForm({ whatsappMessage: event.target.value })} minRows={4} placeholder="Hi, I would like to..." />
        </Field>
      </div>
    );
  }

  if (form.type === "email") {
    return (
      <div className="grid gap-3">
        <Field label="Email address">
          <Input value={form.emailTo} onChange={(event) => patchForm({ emailTo: event.target.value })} placeholder="hello@example.com" />
        </Field>
        <Field label="Subject">
          <Input value={form.emailSubject} onChange={(event) => patchForm({ emailSubject: event.target.value })} placeholder="Question about..." />
        </Field>
        <Field label="Body">
          <Textarea value={form.emailBody} onChange={(event) => patchForm({ emailBody: event.target.value })} minRows={4} placeholder="Write the optional email body." />
        </Field>
      </div>
    );
  }

  if (form.type === "phone") {
    return (
      <Field label="Phone number">
        <Input value={form.phone} onChange={(event) => patchForm({ phone: event.target.value })} placeholder="+15551234567" />
      </Field>
    );
  }

  if (form.type === "sms") {
    return (
      <div className="grid gap-3">
        <Field label="SMS phone number">
          <Input value={form.smsPhone} onChange={(event) => patchForm({ smsPhone: event.target.value })} placeholder="+15551234567" />
        </Field>
        <Field label="Message">
          <Textarea value={form.smsMessage} onChange={(event) => patchForm({ smsMessage: event.target.value })} minRows={4} placeholder="Optional SMS message." />
        </Field>
      </div>
    );
  }

  if (form.type === "wifi") {
    return (
      <div className="grid gap-3">
        <Field label="Network name">
          <Input value={form.wifiSsid} onChange={(event) => patchForm({ wifiSsid: event.target.value })} placeholder="Guest WiFi" />
        </Field>
        <ControlGrid columns={2}>
          <Field label="Security">
            <Select value={form.wifiEncryption} onChange={(event) => patchForm({ wifiEncryption: event.target.value as QRWifiEncryption })} size="sm">
              <option value="WPA">WPA/WPA2</option>
              <option value="WEP">WEP</option>
              <option value="nopass">No password</option>
            </Select>
          </Field>
          <Field label="Password">
            <Input value={form.wifiPassword} onChange={(event) => patchForm({ wifiPassword: event.target.value })} disabled={form.wifiEncryption === "nopass"} placeholder="Network password" />
          </Field>
        </ControlGrid>
        <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
          <input type="checkbox" checked={form.wifiHidden} onChange={(event) => patchForm({ wifiHidden: event.target.checked })} className="h-4 w-4 accent-[var(--color-primary)]" />
          Hidden network
        </label>
      </div>
    );
  }

  if (form.type === "vcard") {
    return (
      <div className="grid gap-3">
        <ControlGrid columns={2}>
          <Field label="First name">
            <Input value={form.contactFirstName} onChange={(event) => patchForm({ contactFirstName: event.target.value })} />
          </Field>
          <Field label="Last name">
            <Input value={form.contactLastName} onChange={(event) => patchForm({ contactLastName: event.target.value })} />
          </Field>
        </ControlGrid>
        <ControlGrid columns={2}>
          <Field label="Organization">
            <Input value={form.contactOrg} onChange={(event) => patchForm({ contactOrg: event.target.value })} />
          </Field>
          <Field label="Role/title">
            <Input value={form.contactTitle} onChange={(event) => patchForm({ contactTitle: event.target.value })} />
          </Field>
        </ControlGrid>
        <ControlGrid columns={2}>
          <Field label="Phone">
            <Input value={form.contactPhone} onChange={(event) => patchForm({ contactPhone: event.target.value })} />
          </Field>
          <Field label="Email">
            <Input value={form.contactEmail} onChange={(event) => patchForm({ contactEmail: event.target.value })} />
          </Field>
        </ControlGrid>
        <Field label="Website">
          <Input value={form.contactWebsite} onChange={(event) => patchForm({ contactWebsite: event.target.value })} placeholder="https://example.com" />
        </Field>
        <Field label="Address">
          <Textarea value={form.contactAddress} onChange={(event) => patchForm({ contactAddress: event.target.value })} minRows={3} />
        </Field>
      </div>
    );
  }

  if (form.type === "location") {
    return (
      <div className="grid gap-3">
        <ControlGrid columns={2}>
          <Field label="Latitude">
            <Input value={form.latitude} onChange={(event) => patchForm({ latitude: event.target.value })} placeholder="31.7683" />
          </Field>
          <Field label="Longitude">
            <Input value={form.longitude} onChange={(event) => patchForm({ longitude: event.target.value })} placeholder="35.2137" />
          </Field>
        </ControlGrid>
        <Field label="Location label">
          <Input value={form.locationLabel} onChange={(event) => patchForm({ locationLabel: event.target.value })} placeholder="Optional place name" />
        </Field>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <Field label="Event title">
        <Input value={form.eventTitle} onChange={(event) => patchForm({ eventTitle: event.target.value })} placeholder="Open Studio" />
      </Field>
      <ControlGrid columns={2}>
        <Field label="Start">
          <Input type="datetime-local" value={form.eventStart} onChange={(event) => patchForm({ eventStart: event.target.value })} />
        </Field>
        <Field label="End">
          <Input type="datetime-local" value={form.eventEnd} onChange={(event) => patchForm({ eventEnd: event.target.value })} />
        </Field>
      </ControlGrid>
      <Field label="Location">
        <Input value={form.eventLocation} onChange={(event) => patchForm({ eventLocation: event.target.value })} />
      </Field>
      <Field label="Description">
        <Textarea value={form.eventDescription} onChange={(event) => patchForm({ eventDescription: event.target.value })} minRows={4} />
      </Field>
    </div>
  );
}
