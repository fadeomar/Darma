import { Metadata } from "next";
import QRCodeClient from "./QRCodeClient";

export const metadata: Metadata = {
  title: "QR Code Generator | Darma Tools",
  description:
    "Generate QR codes quickly for URLs and text with a fast browser-based tool.",
  keywords: [
    "QR code generator",
    "free QR code",
    "create QR codes",
    "scannable QR codes",
    "online QR tool",
  ],
  openGraph: {
    title: "QR Code Generator | Darma Tools",
    description:
      "Create QR codes for URLs and text with a fast, simple browser-based tool.",
    type: "website",
  },
};

export default function QRCodePage() {
  return <QRCodeClient />;
}
