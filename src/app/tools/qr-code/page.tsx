import { Metadata } from "next";
import { getToolRegistry } from "@/features/tools";
import { ToolPage } from "@/features/tools/layouts";
import { buildToolMetadata } from "@/features/tools/seo";
import QRCodeClient from "./QRCodeClient";

const qrCodeTool = getToolRegistry().getById("qr-code");

export const metadata: Metadata = qrCodeTool
  ? buildToolMetadata(qrCodeTool)
  : {
      title: "QR Code Generator | Darma Tools",
      description:
        "Generate QR codes quickly for URLs and text with a fast browser-based tool.",
    };

export default function QRCodePage() {
  const tool = qrCodeTool;
  if (!tool) return null;

  return (
    <ToolPage tool={tool} maxWidth="wide">
      <QRCodeClient />
    </ToolPage>
  );
}
