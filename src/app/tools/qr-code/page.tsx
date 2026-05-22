import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import { ToolPage } from "@/features/tools/layouts";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";
import QRCodeClient from "./QRCodeClient";

const Article = dynamic(() => import("./Article"));

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
    <ToolPage
      tool={tool}
      maxWidth="wide"
      intro={
        <p className="max-w-2xl text-sm leading-7 text-slate-700 dark:text-slate-300">
          Create a scannable QR code for a URL or short text, then download it
          for posters, menus, packaging, presentations, or social posts.
        </p>
      }
      article={
        <ToolContentCard title="QR code tips and best practices">
          <Article />
        </ToolContentCard>
      }
    >
      <ToolContentCard
        title="QR Code Generator"
        description="Enter text or a URL and generate a QR code instantly."
      >
        <QRCodeClient />
      </ToolContentCard>
    </ToolPage>
  );
}
