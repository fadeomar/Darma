import type { Metadata } from "next";
import { getToolRegistry } from "@/features/tools";
import ToolsDirectoryPage from "@/features/tools/ui/ToolsDirectoryPage";

export const metadata: Metadata = {
  title: "Free Browser Tools | Darma",
  description:
    "Browse Darma's free browser tools for CSS generation, code previews, JSON formatting, text utilities, image conversion, colors, QR codes, and more.",
  alternates: { canonical: "/tools" },
  openGraph: {
    title: "Free Browser Tools | Darma",
    description:
      "Fast, focused utilities for developers, designers, students, and creators.",
    type: "website",
    url: "/tools",
  },
};

export default function ToolsPage() {
  const tools = getToolRegistry()
    .list()
    .filter((tool) => tool.visibility === "public");

  return <ToolsDirectoryPage tools={tools} />;
}
