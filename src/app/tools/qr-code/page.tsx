import { Metadata } from "next";
import QRCodeClient from "./QRCodeClient";

export const metadata: Metadata = {
  title: "Free QR Code Generator - Create Scannable QR Codes Online",
  description:
    "Generate QR codes instantly with our free, easy-to-use tool. Create scannable QR codes for URLs, text, Wi-Fi, or contact details in seconds.",
  keywords: [
    "QR code generator",
    "free QR code",
    "create QR codes",
    "scannable QR codes",
    "online QR tool",
  ],
  openGraph: {
    title: "Free QR Code Generator - Tools",
    description:
      "Create QR codes for URLs, text, or contact details with our free online tool. Fast, simple, and reliable.",
    url: "https://yourwebsite.com/tools/qr-code",
    type: "website",
  },
};

export default function QRCodePage() {
  return <QRCodeClient />;
}
