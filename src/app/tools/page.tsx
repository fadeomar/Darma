import type { Metadata } from "next";
import { getPublicTools } from "@/features/tools";
import ToolsDirectoryPage from "@/features/tools/ui/ToolsDirectoryPage";

export const metadata: Metadata = {
  title: "Free browser-based developer and digital tools | Darma",
  description: "Use focused browser tools for code, design, content, images, calculations, generators, and everyday digital work without installing a separate application.",
  alternates: { canonical: "/tools" },
};

export default function ToolsPage() {
  return <ToolsDirectoryPage tools={getPublicTools()} />;
}
