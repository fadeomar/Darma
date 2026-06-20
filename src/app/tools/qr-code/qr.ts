export type QRContentType =
  | "url"
  | "text"
  | "whatsapp"
  | "email"
  | "phone"
  | "sms"
  | "wifi"
  | "vcard"
  | "location"
  | "event";

export type QRErrorCorrectionLevel = "L" | "M" | "Q" | "H";
export type QRWifiEncryption = "WPA" | "WEP" | "nopass";

export type QRFormState = {
  type: QRContentType;
  url: string;
  text: string;
  whatsappPhone: string;
  whatsappMessage: string;
  emailTo: string;
  emailSubject: string;
  emailBody: string;
  phone: string;
  smsPhone: string;
  smsMessage: string;
  wifiSsid: string;
  wifiPassword: string;
  wifiEncryption: QRWifiEncryption;
  wifiHidden: boolean;
  contactFirstName: string;
  contactLastName: string;
  contactOrg: string;
  contactTitle: string;
  contactPhone: string;
  contactEmail: string;
  contactWebsite: string;
  contactAddress: string;
  latitude: string;
  longitude: string;
  locationLabel: string;
  eventTitle: string;
  eventStart: string;
  eventEnd: string;
  eventLocation: string;
  eventDescription: string;
};

export const DEFAULT_QR_FORM: QRFormState = {
  type: "url",
  url: "",
  text: "",
  whatsappPhone: "",
  whatsappMessage: "",
  emailTo: "",
  emailSubject: "",
  emailBody: "",
  phone: "",
  smsPhone: "",
  smsMessage: "",
  wifiSsid: "",
  wifiPassword: "",
  wifiEncryption: "WPA",
  wifiHidden: false,
  contactFirstName: "",
  contactLastName: "",
  contactOrg: "",
  contactTitle: "",
  contactPhone: "",
  contactEmail: "",
  contactWebsite: "",
  contactAddress: "",
  latitude: "",
  longitude: "",
  locationLabel: "",
  eventTitle: "",
  eventStart: "",
  eventEnd: "",
  eventLocation: "",
  eventDescription: "",
};

export type QRPreset = {
  id: string;
  title: string;
  description: string;
  values: Partial<QRFormState>;
};

export const QR_PRESETS: QRPreset[] = [
  {
    id: "restaurant-menu",
    title: "Restaurant menu QR",
    description: "A menu link customers can scan at a table.",
    values: { type: "url", url: "https://example.com/menu" },
  },
  {
    id: "wifi",
    title: "WiFi QR",
    description: "Share guest WiFi without reading out the password.",
    values: { type: "wifi", wifiSsid: "Guest WiFi", wifiPassword: "guest-password", wifiEncryption: "WPA" },
  },
  {
    id: "whatsapp-order",
    title: "WhatsApp order QR",
    description: "Start an order message in WhatsApp.",
    values: { type: "whatsapp", whatsappPhone: "+15551234567", whatsappMessage: "Hi, I would like to place an order." },
  },
  {
    id: "lesson-link",
    title: "Teacher lesson link QR",
    description: "Share a lesson resource with students.",
    values: { type: "url", url: "https://example.com/lesson" },
  },
  {
    id: "business-contact",
    title: "Business contact QR",
    description: "A quick vCard for a business owner or team member.",
    values: {
      type: "vcard",
      contactFirstName: "Darma",
      contactLastName: "Tools",
      contactOrg: "Darma",
      contactTitle: "Creator",
      contactPhone: "+15551234567",
      contactEmail: "hello@example.com",
      contactWebsite: "https://example.com",
    },
  },
  {
    id: "event-invite",
    title: "Event invitation QR",
    description: "Create a calendar event scan target.",
    values: {
      type: "event",
      eventTitle: "Open Studio",
      eventStart: "2026-07-01T18:00",
      eventEnd: "2026-07-01T20:00",
      eventLocation: "Main Hall",
      eventDescription: "Bring your ticket and a friend.",
    },
  },
  {
    id: "simple-website",
    title: "Simple website QR",
    description: "A plain website QR for flyers, posters, or profiles.",
    values: { type: "url", url: "https://example.com" },
  },
];

function clean(value: string) {
  return value.trim();
}

function stripPhone(value: string) {
  return value.replace(/[^\d+]/g, "");
}

function stripPhoneDigits(value: string) {
  return value.replace(/\D/g, "");
}

function escapeWifi(value: string) {
  return value.replace(/([\\;,:"])/g, "\\$1");
}

function escapeVCard(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

function formatCalendarDate(value: string) {
  return value.replace(/[-:]/g, "").replace(/\.\d+$/, "");
}

function appendQuery(base: string, params: Record<string, string>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });
  const suffix = query.toString();
  return suffix ? `${base}?${suffix}` : base;
}

export function isValidUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function buildQRPayload(form: QRFormState): string {
  if (form.type === "url") return clean(form.url);
  if (form.type === "text") return form.text;
  if (form.type === "whatsapp") {
    const phone = stripPhoneDigits(form.whatsappPhone);
    return appendQuery(`https://wa.me/${phone}`, { text: form.whatsappMessage });
  }
  if (form.type === "email") {
    return appendQuery(`mailto:${clean(form.emailTo)}`, {
      subject: form.emailSubject,
      body: form.emailBody,
    });
  }
  if (form.type === "phone") return `tel:${stripPhone(form.phone)}`;
  if (form.type === "sms") {
    const phone = stripPhone(form.smsPhone);
    return form.smsMessage ? `SMSTO:${phone}:${form.smsMessage}` : `SMSTO:${phone}`;
  }
  if (form.type === "wifi") {
    const security = form.wifiEncryption === "nopass" ? "nopass" : form.wifiEncryption;
    const password = security === "nopass" ? "" : `P:${escapeWifi(form.wifiPassword)};`;
    const hidden = form.wifiHidden ? "H:true;" : "";
    return `WIFI:T:${security};S:${escapeWifi(form.wifiSsid)};${password}${hidden};`;
  }
  if (form.type === "vcard") {
    const firstName = clean(form.contactFirstName);
    const lastName = clean(form.contactLastName);
    const fullName = clean(`${firstName} ${lastName}`) || clean(form.contactOrg);
    return [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `N:${escapeVCard(lastName)};${escapeVCard(firstName)};;;`,
      fullName ? `FN:${escapeVCard(fullName)}` : "",
      form.contactOrg ? `ORG:${escapeVCard(form.contactOrg)}` : "",
      form.contactTitle ? `TITLE:${escapeVCard(form.contactTitle)}` : "",
      form.contactPhone ? `TEL:${escapeVCard(form.contactPhone)}` : "",
      form.contactEmail ? `EMAIL:${escapeVCard(form.contactEmail)}` : "",
      form.contactWebsite ? `URL:${escapeVCard(form.contactWebsite)}` : "",
      form.contactAddress ? `ADR:;;${escapeVCard(form.contactAddress)};;;;` : "",
      "END:VCARD",
    ].filter(Boolean).join("\n");
  }
  if (form.type === "location") {
    const lat = clean(form.latitude);
    const lng = clean(form.longitude);
    const label = clean(form.locationLabel);
    return label ? `geo:${lat},${lng}?q=${encodeURIComponent(`${lat},${lng} (${label})`)}` : `geo:${lat},${lng}`;
  }

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    `SUMMARY:${escapeVCard(form.eventTitle)}`,
    `DTSTART:${formatCalendarDate(form.eventStart)}`,
    form.eventEnd ? `DTEND:${formatCalendarDate(form.eventEnd)}` : "",
    form.eventLocation ? `LOCATION:${escapeVCard(form.eventLocation)}` : "",
    form.eventDescription ? `DESCRIPTION:${escapeVCard(form.eventDescription)}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean).join("\n");
}

export function validateQRForm(form: QRFormState): string[] {
  const messages: string[] = [];

  if (form.type === "url") {
    if (!clean(form.url)) messages.push("Enter a website URL.");
    else if (!isValidUrl(clean(form.url))) messages.push("Use a full URL starting with http:// or https://.");
  }
  if (form.type === "text" && !form.text.trim()) messages.push("Enter text to encode.");
  if (form.type === "whatsapp" && !stripPhoneDigits(form.whatsappPhone)) messages.push("Enter a WhatsApp phone number with country code.");
  if (form.type === "email") {
    if (!clean(form.emailTo)) messages.push("Enter an email address.");
    else if (!isValidEmail(clean(form.emailTo))) messages.push("Enter a valid email address.");
  }
  if (form.type === "phone" && !stripPhone(form.phone)) messages.push("Enter a phone number.");
  if (form.type === "sms" && !stripPhone(form.smsPhone)) messages.push("Enter an SMS phone number.");
  if (form.type === "wifi") {
    if (!clean(form.wifiSsid)) messages.push("Enter the WiFi network name.");
    if (form.wifiEncryption !== "nopass" && !form.wifiPassword) messages.push("Enter the WiFi password, or choose No password.");
  }
  if (form.type === "vcard") {
    if (!clean(`${form.contactFirstName}${form.contactLastName}${form.contactOrg}`)) messages.push("Enter a contact name or organization.");
    if (form.contactEmail && !isValidEmail(clean(form.contactEmail))) messages.push("Enter a valid contact email address.");
    if (form.contactWebsite && !isValidUrl(clean(form.contactWebsite))) messages.push("Enter a valid contact website URL.");
  }
  if (form.type === "location") {
    const lat = Number(form.latitude);
    const lng = Number(form.longitude);
    if (!form.latitude || !form.longitude) messages.push("Enter latitude and longitude.");
    else if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) messages.push("Enter valid coordinates.");
  }
  if (form.type === "event") {
    if (!clean(form.eventTitle)) messages.push("Enter an event title.");
    if (!form.eventStart) messages.push("Enter an event start date and time.");
  }

  const payload = buildQRPayload(form);
  if (payload.length > 1800) messages.push("This QR content is long. Shorten it for more reliable scanning.");

  return messages;
}
