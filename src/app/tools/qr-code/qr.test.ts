import { describe, expect, it } from "vitest";
import { DEFAULT_QR_FORM, buildQRPayload, validateQRForm } from "./qr";

describe("buildQRPayload", () => {
  it("builds URL payloads", () => {
    expect(buildQRPayload({ ...DEFAULT_QR_FORM, type: "url", url: "https://example.com/menu" })).toBe("https://example.com/menu");
  });

  it("builds WhatsApp payloads", () => {
    expect(buildQRPayload({ ...DEFAULT_QR_FORM, type: "whatsapp", whatsappPhone: "+1 (555) 123-4567", whatsappMessage: "Hello there" })).toBe("https://wa.me/15551234567?text=Hello+there");
  });

  it("builds email payloads", () => {
    expect(buildQRPayload({ ...DEFAULT_QR_FORM, type: "email", emailTo: "hi@example.com", emailSubject: "Hello", emailBody: "Body text" })).toBe("mailto:hi@example.com?subject=Hello&body=Body+text");
  });

  it("builds WiFi payloads", () => {
    expect(buildQRPayload({ ...DEFAULT_QR_FORM, type: "wifi", wifiSsid: "Guest;WiFi", wifiPassword: "pass:word", wifiEncryption: "WPA" })).toBe("WIFI:T:WPA;S:Guest\\;WiFi;P:pass\\:word;;");
  });

  it("builds vCard payloads", () => {
    const payload = buildQRPayload({
      ...DEFAULT_QR_FORM,
      type: "vcard",
      contactFirstName: "Ada",
      contactLastName: "Lovelace",
      contactOrg: "Analytical Engines",
      contactEmail: "ada@example.com",
    });

    expect(payload).toContain("BEGIN:VCARD");
    expect(payload).toContain("FN:Ada Lovelace");
    expect(payload).toContain("ORG:Analytical Engines");
    expect(payload).toContain("EMAIL:ada@example.com");
  });

  it("builds SMS payloads", () => {
    expect(buildQRPayload({ ...DEFAULT_QR_FORM, type: "sms", smsPhone: "+1 555 123 4567", smsMessage: "Meet me here" })).toBe("SMSTO:+15551234567:Meet me here");
  });
});

describe("validateQRForm", () => {
  it("requires complete HTTP(S) URLs", () => {
    expect(validateQRForm({ ...DEFAULT_QR_FORM, type: "url", url: "example.com" })).toContain(
      "Use a full URL starting with http:// or https://.",
    );
  });

  it("validates coordinate ranges", () => {
    expect(validateQRForm({ ...DEFAULT_QR_FORM, type: "location", latitude: "95", longitude: "20" })).toContain(
      "Enter valid coordinates.",
    );
  });

  it("requires event end times to be after the start", () => {
    expect(
      validateQRForm({
        ...DEFAULT_QR_FORM,
        type: "event",
        eventTitle: "Launch",
        eventStart: "2026-07-14T18:00",
        eventEnd: "2026-07-14T17:00",
      }),
    ).toContain("Event end must be after the start time.");
  });

  it("warns when payloads exceed the reliable length budget", () => {
    expect(validateQRForm({ ...DEFAULT_QR_FORM, type: "text", text: "x".repeat(1801) })).toContain(
      "This QR content is long. Shorten it for more reliable scanning.",
    );
  });
});
