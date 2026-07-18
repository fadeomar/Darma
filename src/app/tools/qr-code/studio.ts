import {
  DEFAULT_QR_FORM,
  buildQRPayload,
  validateQRForm,
  type QRContentType,
  type QRErrorCorrectionLevel,
  type QRFormState,
  type QRWifiEncryption,
} from "./qr";

export type QROptions = {
  size: number;
  margin: number;
  foreground: string;
  background: string;
  errorCorrectionLevel: QRErrorCorrectionLevel;
  transparentBackground: boolean;
};

export type QRAuditSeverity = "error" | "warning" | "info" | "pass";

export type QRAuditCheck = {
  id: string;
  title: string;
  message: string;
  severity: QRAuditSeverity;
};

export type QRSummaryCard = {
  label: string;
  value: string;
  detail: string;
};

export type QRProjectFile = {
  schema: "darma.qr-code";
  version: 1;
  exportedAt: string;
  form: QRFormState;
  options: QROptions;
};

type JsonRecord = Record<string, unknown>;

const CONTENT_TYPES: readonly QRContentType[] = [
  "url",
  "text",
  "whatsapp",
  "email",
  "phone",
  "sms",
  "wifi",
  "vcard",
  "location",
  "event",
];

const WIFI_ENCRYPTION: readonly QRWifiEncryption[] = ["WPA", "WEP", "nopass"];
const ERROR_LEVELS: readonly QRErrorCorrectionLevel[] = ["L", "M", "Q", "H"];

export const DEFAULT_QR_OPTIONS: QROptions = {
  size: 320,
  margin: 4,
  foreground: "#111827",
  background: "#ffffff",
  errorCorrectionLevel: "M",
  transparentBackground: false,
};

export const QR_TYPE_LABELS: Record<QRContentType, string> = {
  url: "Website URL",
  text: "Plain text",
  whatsapp: "WhatsApp message",
  email: "Email",
  phone: "Phone",
  sms: "SMS",
  wifi: "WiFi",
  vcard: "Contact card",
  location: "Location",
  event: "Calendar event",
};

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function choice<T extends string>(value: unknown, fallback: T, allowed: readonly T[]): T {
  return typeof value === "string" && allowed.includes(value as T) ? (value as T) : fallback;
}

function cleanString(value: unknown, fallback: string, maxLength = 4000): string {
  if (typeof value !== "string") return fallback;
  return value.replace(/\u0000/g, "").slice(0, maxLength);
}

function cleanBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function clampNumber(value: unknown, fallback: number, min: number, max: number, step = 1): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  const clamped = Math.min(max, Math.max(min, parsed));
  return Math.round(clamped / step) * step;
}

export function normalizeHexColor(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const input = value.trim();
  if (/^#[0-9a-f]{6}$/i.test(input)) return input.toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(input)) {
    const [, r, g, b] = input;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return fallback;
}

export function normalizeQRForm(input: unknown, fallback: QRFormState = DEFAULT_QR_FORM): QRFormState {
  const source = isRecord(input) ? input : {};
  return {
    type: choice(source.type, fallback.type, CONTENT_TYPES),
    url: cleanString(source.url, fallback.url),
    text: cleanString(source.text, fallback.text, 8000),
    whatsappPhone: cleanString(source.whatsappPhone, fallback.whatsappPhone, 80),
    whatsappMessage: cleanString(source.whatsappMessage, fallback.whatsappMessage, 2000),
    emailTo: cleanString(source.emailTo, fallback.emailTo, 320),
    emailSubject: cleanString(source.emailSubject, fallback.emailSubject, 500),
    emailBody: cleanString(source.emailBody, fallback.emailBody, 4000),
    phone: cleanString(source.phone, fallback.phone, 80),
    smsPhone: cleanString(source.smsPhone, fallback.smsPhone, 80),
    smsMessage: cleanString(source.smsMessage, fallback.smsMessage, 2000),
    wifiSsid: cleanString(source.wifiSsid, fallback.wifiSsid, 320),
    wifiPassword: cleanString(source.wifiPassword, fallback.wifiPassword, 1000),
    wifiEncryption: choice(source.wifiEncryption, fallback.wifiEncryption, WIFI_ENCRYPTION),
    wifiHidden: cleanBoolean(source.wifiHidden, fallback.wifiHidden),
    contactFirstName: cleanString(source.contactFirstName, fallback.contactFirstName, 240),
    contactLastName: cleanString(source.contactLastName, fallback.contactLastName, 240),
    contactOrg: cleanString(source.contactOrg, fallback.contactOrg, 320),
    contactTitle: cleanString(source.contactTitle, fallback.contactTitle, 320),
    contactPhone: cleanString(source.contactPhone, fallback.contactPhone, 80),
    contactEmail: cleanString(source.contactEmail, fallback.contactEmail, 320),
    contactWebsite: cleanString(source.contactWebsite, fallback.contactWebsite, 2000),
    contactAddress: cleanString(source.contactAddress, fallback.contactAddress, 2000),
    latitude: cleanString(source.latitude, fallback.latitude, 40),
    longitude: cleanString(source.longitude, fallback.longitude, 40),
    locationLabel: cleanString(source.locationLabel, fallback.locationLabel, 500),
    eventTitle: cleanString(source.eventTitle, fallback.eventTitle, 500),
    eventStart: cleanString(source.eventStart, fallback.eventStart, 80),
    eventEnd: cleanString(source.eventEnd, fallback.eventEnd, 80),
    eventLocation: cleanString(source.eventLocation, fallback.eventLocation, 1000),
    eventDescription: cleanString(source.eventDescription, fallback.eventDescription, 4000),
  };
}

export function normalizeQROptions(input: unknown, fallback: QROptions = DEFAULT_QR_OPTIONS): QROptions {
  const source = isRecord(input) ? input : {};
  return {
    size: clampNumber(source.size, fallback.size, 160, 1024, 16),
    margin: clampNumber(source.margin, fallback.margin, 0, 12),
    foreground: normalizeHexColor(source.foreground, fallback.foreground),
    background: normalizeHexColor(source.background, fallback.background),
    errorCorrectionLevel: choice(source.errorCorrectionLevel, fallback.errorCorrectionLevel, ERROR_LEVELS),
    transparentBackground: cleanBoolean(source.transparentBackground, fallback.transparentBackground),
  };
}

export function parseQRProject(input: string): { form: QRFormState; options: QROptions } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch {
    throw new Error("The selected file is not valid JSON.");
  }

  if (!isRecord(parsed)) throw new Error("The project file must contain a JSON object.");
  if (parsed.schema !== "darma.qr-code") throw new Error("This is not a Darma QR Code project file.");
  if (parsed.version !== 1) throw new Error("This QR project version is not supported.");

  return {
    form: normalizeQRForm(parsed.form),
    options: normalizeQROptions(parsed.options),
  };
}

export function createQRProject(form: QRFormState, options: QROptions, exportedAt = new Date().toISOString()): QRProjectFile {
  return {
    schema: "darma.qr-code",
    version: 1,
    exportedAt,
    form: normalizeQRForm(form),
    options: normalizeQROptions(options),
  };
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = normalizeHexColor(hex, "#000000");
  return [
    Number.parseInt(normalized.slice(1, 3), 16),
    Number.parseInt(normalized.slice(3, 5), 16),
    Number.parseInt(normalized.slice(5, 7), 16),
  ];
}

function linearize(channel: number): number {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map(linearize) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function calculateContrastRatio(foreground: string, background: string): number {
  const a = luminance(foreground);
  const b = luminance(background);
  const light = Math.max(a, b);
  const dark = Math.min(a, b);
  return (light + 0.05) / (dark + 0.05);
}

export function payloadDensityLabel(length: number): string {
  if (length <= 120) return "Light";
  if (length <= 500) return "Medium";
  if (length <= 1000) return "Dense";
  return "Very dense";
}

export function summarizeQRAudit(checks: QRAuditCheck[]) {
  return checks.reduce(
    (summary, check) => {
      summary[check.severity] += 1;
      return summary;
    },
    { error: 0, warning: 0, info: 0, pass: 0 },
  );
}

export function buildQRAudit(form: QRFormState, options: QROptions): QRAuditCheck[] {
  const normalizedOptions = normalizeQROptions(options);
  const payload = buildQRPayload(form);
  const formMessages = validateQRForm(form);
  const checks: QRAuditCheck[] = [];

  if (formMessages.length) {
    checks.push({
      id: "input",
      title: "Input validation",
      message: formMessages.join(" "),
      severity: "error",
    });
  } else {
    checks.push({
      id: "input",
      title: "Input validation",
      message: "The selected content type has all required fields and a usable payload.",
      severity: "pass",
    });
  }

  if (normalizedOptions.transparentBackground) {
    checks.push({
      id: "contrast",
      title: "Background contrast",
      message: "A transparent QR inherits its final background. Test the exported asset on every surface where it will appear.",
      severity: "warning",
    });
  } else {
    const ratio = calculateContrastRatio(normalizedOptions.foreground, normalizedOptions.background);
    checks.push({
      id: "contrast",
      title: "Foreground contrast",
      message: `The foreground/background contrast ratio is ${ratio.toFixed(2)}:1.${ratio < 3 ? " Increase contrast before publishing." : " This is suitable for normal QR artwork."}`,
      severity: ratio < 3 ? "error" : ratio < 4.5 ? "warning" : "pass",
    });
  }

  checks.push({
    id: "quiet-zone",
    title: "Quiet zone",
    message: normalizedOptions.margin >= 4
      ? `${normalizedOptions.margin} modules of margin preserve a reliable quiet zone.`
      : `${normalizedOptions.margin} modules is below the recommended four-module quiet zone.`,
    severity: normalizedOptions.margin >= 4 ? "pass" : normalizedOptions.margin >= 2 ? "warning" : "error",
  });

  checks.push({
    id: "size",
    title: "Export resolution",
    message: normalizedOptions.size >= 256
      ? `${normalizedOptions.size}px provides a practical digital export size.`
      : `${normalizedOptions.size}px may be too small for print, presentation screens, or distant scanning.`,
    severity: normalizedOptions.size >= 256 ? "pass" : normalizedOptions.size >= 192 ? "warning" : "error",
  });

  const length = payload.length;
  checks.push({
    id: "payload",
    title: "Payload density",
    message: `${length} characters produce a ${payloadDensityLabel(length).toLowerCase()} payload.${length > 800 ? " Shorten links or text when possible to simplify the pattern." : ""}`,
    severity: length > 1400 ? "error" : length > 800 ? "warning" : length > 400 ? "info" : "pass",
  });

  if (form.type === "wifi" && form.wifiPassword) {
    checks.push({
      id: "sensitive-data",
      title: "WiFi password visibility",
      message: "Anyone who scans or decodes this QR can read the embedded network password. Share it only in the intended environment.",
      severity: "warning",
    });
  } else if (form.type === "vcard") {
    checks.push({
      id: "sensitive-data",
      title: "Contact data review",
      message: "Confirm every phone number, address, and email is intended for public sharing before publishing the code.",
      severity: "info",
    });
  }

  checks.push({
    id: "scan-test",
    title: "Real-device scan test",
    message: "Scan the final PNG or SVG from at least one phone before printing or distributing it.",
    severity: "info",
  });

  return checks;
}

export function buildQRSummary(form: QRFormState, options: QROptions, checks: QRAuditCheck[]): QRSummaryCard[] {
  const payload = buildQRPayload(form);
  const counts = summarizeQRAudit(checks);
  const ratio = options.transparentBackground ? null : calculateContrastRatio(options.foreground, options.background);
  const readiness = counts.error ? "Blocked" : counts.warning ? "Review" : "Ready";

  return [
    { label: "Content", value: QR_TYPE_LABELS[form.type], detail: payload ? `${payload.length} encoded characters` : "Waiting for valid input" },
    { label: "Density", value: payloadDensityLabel(payload.length), detail: `${options.errorCorrectionLevel} error correction` },
    { label: "Contrast", value: ratio ? `${ratio.toFixed(2)}:1` : "Transparent", detail: ratio && ratio >= 4.5 ? "Strong foreground separation" : "Verify the final background" },
    { label: "Readiness", value: readiness, detail: counts.error ? `${counts.error} error${counts.error === 1 ? "" : "s"}` : counts.warning ? `${counts.warning} warning${counts.warning === 1 ? "" : "s"}` : `${counts.pass} checks passed` },
  ];
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function buildQRHtmlSnippet({ filename = "qr-code.svg", alt = "Scan QR code", size = 320 } = {}): string {
  const safeSize = Math.max(1, Math.round(Number.isFinite(size) ? size : 320));
  return `<figure class="qr-code">\n  <img src="${escapeHtml(filename)}" width="${safeSize}" height="${safeSize}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async" />\n  <figcaption>Scan to open the shared content.</figcaption>\n</figure>`;
}

export function buildQRCssSnippet(): string {
  return `.qr-code {\n  display: grid;\n  justify-items: center;\n  gap: 0.75rem;\n  margin: 0;\n}\n\n.qr-code img {\n  display: block;\n  width: min(100%, 20rem);\n  height: auto;\n  background: #ffffff;\n  padding: 0.75rem;\n  border-radius: 0.75rem;\n}\n\n.qr-code figcaption {\n  font: 500 0.875rem/1.5 system-ui, sans-serif;\n  color: #475569;\n}`;
}

export function buildQRReactComponent({ filename = "/qr-code.svg", componentName = "QrCodeCard", size = 320 } = {}): string {
  const safeName = /^[A-Za-z_$][\w$]*$/.test(componentName) ? componentName : "QrCodeCard";
  const safeSize = Math.max(1, Math.round(Number.isFinite(size) ? size : 320));
  return `type ${safeName}Props = {\n  alt?: string;\n  caption?: string;\n  className?: string;\n};\n\nexport function ${safeName}({\n  alt = "Scan QR code",\n  caption = "Scan to open the shared content.",\n  className,\n}: ${safeName}Props) {\n  return (\n    <figure className={className}>\n      <img\n        src=${JSON.stringify(filename)}\n        width={${safeSize}}\n        height={${safeSize}}\n        alt={alt}\n        loading="lazy"\n        decoding="async"\n      />\n      <figcaption>{caption}</figcaption>\n    </figure>\n  );\n}\n`;
}

export function buildQRMarkdownReport(form: QRFormState, options: QROptions, checks: QRAuditCheck[]): string {
  const payload = buildQRPayload(form);
  const counts = summarizeQRAudit(checks);
  const checkRows = checks.map((check) => `- **${check.severity.toUpperCase()} — ${check.title}:** ${check.message}`).join("\n");

  return `# Darma QR Code production report\n\n## Summary\n\n- Content type: ${QR_TYPE_LABELS[form.type]}\n- Payload length: ${payload.length} characters\n- Export size: ${options.size}px\n- Quiet zone: ${options.margin} modules\n- Error correction: ${options.errorCorrectionLevel}\n- Foreground: ${options.foreground}\n- Background: ${options.transparentBackground ? "transparent" : options.background}\n- Audit: ${counts.error} errors, ${counts.warning} warnings, ${counts.pass} passes\n\n## Production checks\n\n${checkRows}\n\n## Payload\n\n\`\`\`text\n${payload}\n\`\`\`\n\nGenerated locally with Darma Tools.\n`;
}
