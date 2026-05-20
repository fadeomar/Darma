import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import { buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("qr-code");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const QRCodeClient = dynamic(() => import("./QRCodeClient"), { ssr: false });

export default function QRCodePage() {
  const tool = getToolRegistry().getById("qr-code");
  if (!tool) notFound();

  return (
    <ToolPage tool={tool} maxWidth="wide">
      <QRCodeClient />
    </ToolPage>
  );
}
