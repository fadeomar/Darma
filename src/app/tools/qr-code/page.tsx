import { Metadata } from "next";
import { NextToolSuggestions } from "@/features/tools/components/NextToolSuggestions";
import { getToolRegistry } from "@/features/tools";
import { ToolPage } from "@/features/tools/layouts";
import QRCodeClient from "./QRCodeClient";

export const metadata: Metadata = {
  title: "QR Code Generator | Darma Tools",
  description:
    "Create QR codes for websites, WiFi, WhatsApp, email, SMS, contacts, locations, and events locally in your browser.",
  keywords: [
    "QR code generator",
    "WiFi QR code",
    "WhatsApp QR code",
    "vCard QR code",
    "event QR code",
    "free QR code",
    "create QR codes",
    "download QR PNG",
    "download QR SVG",
  ],
  openGraph: {
    title: "QR Code Generator | Darma Tools",
    description:
      "Create polished QR codes for everyday sharing, classrooms, business cards, events, menus, and developer workflows.",
    type: "website",
  },
};

export default function QRCodePage() {
  const tool = getToolRegistry().getById("qr-code");
  if (!tool) return null;

  return (
    <ToolPage
      tool={tool}
      maxWidth="wide"
      intro={
        <p className="max-w-2xl text-sm leading-7 text-[var(--color-text-secondary)]">
          Build scan-ready QR codes for links, WiFi, WhatsApp, email, phone,
          SMS, contacts, locations, and calendar events. Generation happens in
          your browser, with PNG and SVG downloads.
        </p>
      }
      related={<NextToolSuggestions toolIds={["color-palette-generator", "image-converter", "meta-tag-generator", "text-cleaner"]} />}
    >
      <QRCodeClient />
    </ToolPage>
  );
}
