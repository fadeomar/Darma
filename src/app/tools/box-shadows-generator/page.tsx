import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getToolRegistry } from "@/features/tools";
import { buildToolMetadata } from "@/features/tools/seo";
import ToolPageShell from "@/features/tools/ui/ToolPageShell";
import BoxShadowsGeneratorClient from "./BoxShadowsGeneratorClient";
import "./styles.css";

const tool = getToolRegistry().getById("box-shadows-generator");

export const metadata: Metadata = tool
  ? buildToolMetadata(tool)
  : { title: "Tool not found | Darma Tools" };

export default function BoxShadowsGeneratorPage() {
  if (!tool) notFound();

  return (
    <ToolPageShell tool={tool}>
      <BoxShadowsGeneratorClient />
    </ToolPageShell>
  );
}
