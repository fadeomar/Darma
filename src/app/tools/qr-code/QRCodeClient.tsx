"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
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

type QROptions = {
  size: number;
  margin: number;
  foreground: string;
  background: string;
  errorCorrectionLevel: QRErrorCorrectionLevel;
  transparentBackground: boolean;
};

const DEFAULT_OPTIONS: QROptions = {
  size: 320,
  margin: 3,
  foreground: "#111827",
  background: "#ffffff",
  errorCorrectionLevel: "M",
  transparentBackground: false,
};

const qrTypes: Array<{ value: QRContentType; label: string; description: string }> = [
  { value: "url", label: "Website URL", description: "Links, menus, forms, profiles" },
  { value: "text", label: "Plain text", description: "Notes, codes, short instructions" },
  { value: "whatsapp", label: "WhatsApp message", description: "Start a chat with a prepared message" },
  { value: "email", label: "Email", description: "Pre-fill an email recipient and body" },
  { value: "phone", label: "Phone", description: "Open a phone call prompt" },
  { value: "sms", label: "SMS", description: "Pre-fill a text message" },
  { value: "wifi", label: "WiFi", description: "Share network details" },
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

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-xs font-semibold text-[var(--color-text-secondary)]">
      <span>{label}</span>
      {children}
    </label>
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

export default function QRCodeClient() {
  const [form, setForm] = useState<QRFormState>(DEFAULT_QR_FORM);
  const [options, setOptions] = useState<QROptions>(DEFAULT_OPTIONS);
  const [pngUrl, setPngUrl] = useState("");
  const [svgText, setSvgText] = useState("");
  const [generationError, setGenerationError] = useState("");

  const payload = useMemo(() => buildQRPayload(form), [form]);
  const validationMessages = useMemo(() => validateQRForm(form), [form]);
  const activeType = qrTypes.find((type) => type.value === form.type) ?? qrTypes[0];
  const canGenerate = validationMessages.length === 0 && payload.trim().length > 0;

  const patchForm = (patch: Partial<QRFormState>) => setForm((current) => ({ ...current, ...patch }));
  const patchOptions = (patch: Partial<QROptions>) => setOptions((current) => ({ ...current, ...patch }));

  useEffect(() => {
    let cancelled = false;

    async function generate() {
      if (!canGenerate) {
        setPngUrl("");
        setSvgText("");
        setGenerationError("");
        return;
      }

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
      }
    }

    generate();
    return () => {
      cancelled = true;
    };
  }, [canGenerate, options.background, options.errorCorrectionLevel, options.foreground, options.margin, options.size, options.transparentBackground, payload]);

  function reset() {
    setForm(DEFAULT_QR_FORM);
    setOptions(DEFAULT_OPTIONS);
  }

  function sample() {
    const preset = QR_PRESETS.find((item) => item.id === "restaurant-menu") ?? QR_PRESETS[0];
    setForm({ ...DEFAULT_QR_FORM, ...preset.values });
  }

  function applyPreset(id: string) {
    const preset = QR_PRESETS.find((item) => item.id === id);
    if (!preset) return;
    setForm({ ...DEFAULT_QR_FORM, ...preset.values });
  }

  return (
    <ToolLayoutSingleUtility
      resultSlot={
        <ResultPanel
          title="Live QR preview"
          description="Preview updates locally as you edit. Test important QR codes with a phone camera before printing."
          value={
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(220px,320px)] lg:items-center">
              <div className="min-w-0 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={canGenerate ? "success" : "warning"}>{canGenerate ? "Ready" : "Needs input"}</Badge>
                  <Badge variant="outline">{activeType.label}</Badge>
                  <Badge variant="outline">{payload.length}/1800 chars</Badge>
                </div>
                <Textarea
                  value={payload}
                  readOnly
                  minRows={7}
                  variant="output"
                  placeholder="QR payload will appear here."
                />
              </div>
              <div className="flex justify-center">
                {pngUrl ? (
                  <div
                    className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] p-4 shadow-[var(--shadow-sm)]"
                    style={{ background: options.transparentBackground ? "var(--color-surface-base)" : options.background }}
                  >
                    <Image
                      src={pngUrl}
                      alt="Generated QR code"
                      width={options.size}
                      height={options.size}
                      className="h-auto max-h-[360px] w-full max-w-[360px]"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="flex aspect-square w-full max-w-[320px] items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-6 text-center text-sm leading-6 text-[var(--color-text-tertiary)]">
                    Choose a QR type and fill the required fields to see a preview.
                  </div>
                )}
              </div>
            </div>
          }
          actions={
            <Button
              size="sm"
              variant="secondary"
              disabled={!svgText}
              onClick={() => downloadTextFile({ content: svgText, filename: "darma-qr-code.svg", mimeType: "image/svg+xml;charset=utf-8" })}
            >
              Download SVG
            </Button>
          }
        />
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
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <ToolControlPanel title="QR content" description="Pick what the QR code should open, then fill only the fields that matter." sticky={false}>
            <ControlSection title="QR type">
              <div className="grid gap-3 md:grid-cols-2">
                {qrTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    aria-pressed={form.type === type.value}
                    onClick={() => patchForm({ type: type.value })}
                    className={`rounded-[var(--radius-md)] border p-3 text-left transition focus:outline-none focus:shadow-[var(--focus-ring)] ${
                      form.type === type.value
                        ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]"
                        : "border-[var(--color-border-default)] bg-[var(--color-surface-base)] hover:border-[var(--color-border-strong)]"
                    }`}
                  >
                    <span className="block text-sm font-black text-[var(--color-text-primary)]">{type.label}</span>
                    <span className="mt-1 block text-xs leading-5 text-[var(--color-text-secondary)]">{type.description}</span>
                  </button>
                ))}
              </div>
            </ControlSection>

            <ControlSection title={`${activeType.label} details`}>
              <QRFields form={form} patchForm={patchForm} />
            </ControlSection>
          </ToolControlPanel>

          <div className="space-y-5">
            <ToolControlPanel title="Presets" description="Start with common real-world QR use cases." sticky={false}>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                {QR_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset.id)}
                    className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-3 text-left transition hover:border-[var(--color-border-strong)] focus:outline-none focus:shadow-[var(--focus-ring)]"
                  >
                    <span className="block text-sm font-black text-[var(--color-text-primary)]">{preset.title}</span>
                    <span className="mt-1 block text-xs leading-5 text-[var(--color-text-secondary)]">{preset.description}</span>
                  </button>
                ))}
              </div>
            </ToolControlPanel>

            <ToolControlPanel title="Design options" description="Keep strong contrast for reliable scanning." sticky={false}>
              <ControlSection title="Size and quiet zone">
                <ControlGrid columns={2}>
                  <Field label={`Size: ${options.size}px`}>
                    <Slider min={160} max={640} step={16} value={options.size} onChange={(event) => patchOptions({ size: Number(event.target.value) })} />
                  </Field>
                  <Field label={`Margin: ${options.margin}`}>
                    <Slider min={0} max={8} step={1} value={options.margin} onChange={(event) => patchOptions({ margin: Number(event.target.value) })} />
                  </Field>
                </ControlGrid>
              </ControlSection>
              <ControlSection title="Color">
                <ControlGrid columns={2}>
                  <ColorField label="Foreground" value={options.foreground} onChange={(value) => patchOptions({ foreground: value })} />
                  <ColorField label="Background" value={options.background} onChange={(value) => patchOptions({ background: value })} disabled={options.transparentBackground} />
                </ControlGrid>
                <label className="mt-3 flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                  <input
                    type="checkbox"
                    checked={options.transparentBackground}
                    onChange={(event) => patchOptions({ transparentBackground: event.target.checked })}
                    className="h-4 w-4 accent-[var(--color-primary)]"
                  />
                  Transparent background for PNG/SVG
                </label>
              </ControlSection>
              <ControlSection title="Reliability">
                <Field label="Error correction">
                  <Select value={options.errorCorrectionLevel} onChange={(event) => patchOptions({ errorCorrectionLevel: event.target.value as QRErrorCorrectionLevel })} size="sm">
                    <option value="L">Low - smallest QR</option>
                    <option value="M">Medium - balanced</option>
                    <option value="Q">Quartile - more resilient</option>
                    <option value="H">High - best for print</option>
                  </Select>
                </Field>
              </ControlSection>
            </ToolControlPanel>
          </div>
        </div>
      }
      infoSlot={
        <div className="space-y-5">
          <WarningPanel
            messages={[
              ...validationMessages.map((message, index) => ({ id: `validation-${index}`, severity: "warning" as const, title: "Check input", message })),
              ...(generationError ? [{ id: "generation", severity: "danger" as const, title: "Preview error", message: generationError }] : []),
              { id: "privacy", severity: "info" as const, title: "Local-first", message: "QR codes are generated in your browser. Darma does not need login for this tool." },
            ]}
          />
          <Card padding="md">
            <Badge variant="soft">Continue with</Badge>
            <div className="mt-3 grid gap-2 text-sm leading-6 text-[var(--color-text-secondary)]">
              <a className="font-semibold text-[var(--color-text-primary)] hover:underline" href="/tools/color-palette-generator">Color Palette Generator</a>
              <a className="font-semibold text-[var(--color-text-primary)] hover:underline" href="/tools/image-converter">Image Converter</a>
              <a className="font-semibold text-[var(--color-text-primary)] hover:underline" href="/tools/meta-tag-generator">Meta Tag Generator</a>
              <a className="font-semibold text-[var(--color-text-primary)] hover:underline" href="/tools/text-cleaner">Text Cleaner</a>
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
