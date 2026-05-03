import { Metadata } from "next";
import { getToolRegistry } from "@/features/tools";
import { ToolPage } from "@/features/tools/layouts";
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
  const tool = getToolRegistry().getById("qr-code");
  if (!tool) return null;

  return (
    <ToolPage tool={tool} maxWidth="wide">
      <QRCodeClient />
    </ToolPage>
  );
}
