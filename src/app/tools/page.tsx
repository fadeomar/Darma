import type { Metadata } from "next";
import { getToolRegistry } from "@/features/tools";
import ToolsDirectoryPage from "@/features/tools/ui/ToolsDirectoryPage";

export const metadata: Metadata = {
  title: "Darma Tools | Free Developer, Design, and Utility Tools",
  description:
    "Browse Darma's free browser tools for code previews, JSON formatting, CSS generation, colors, QR codes, passwords, text cleanup, image conversion, and more.",
  keywords: [
    "Darma tools",
    "developer tools",
    "design tools",
    "CSS generator",
    "JSON formatter",
    "QR code generator",
    "password generator",
    "browser utilities",
  ],
  alternates: { canonical: "/tools" },
  openGraph: {
    title: "Darma Tools",
    description:
      "Free browser tools for developers, designers, creators, and everyday utility work.",
    url: "/tools",
    type: "website",
  },
};

export default function ToolsPage() {
  const tools = getToolRegistry()
    .list()
    .filter((tool) => tool.visibility === "public");

  return <ToolsDirectoryPage tools={tools} />;
}
