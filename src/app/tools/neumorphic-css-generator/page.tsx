import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getToolRegistry } from "@/features/tools";
import { buildToolMetadata } from "@/features/tools/seo";
import ToolPageShell from "@/features/tools/ui/ToolPageShell";
import NeumorphicCssGeneratorClient from "./NeumorphicCssGeneratorClient";
import "./style.css";

const tool = getToolRegistry().getById("neumorphic-css-generator");

export const metadata: Metadata = tool
  ? buildToolMetadata(tool)
  : { title: "Tool not found | Darma Tools" };

export default function NeumorphicCssGeneratorPage() {
  if (!tool) notFound();

  return (
    <ToolPageShell tool={tool}>
      <NeumorphicCssGeneratorClient />
    </ToolPageShell>
  );
}
