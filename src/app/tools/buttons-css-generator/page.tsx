import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getToolRegistry } from "@/features/tools";
import { buildToolMetadata } from "@/features/tools/seo";
import ToolPageShell from "@/features/tools/ui/ToolPageShell";
import ButtonsCssGeneratorClient from "./ButtonsCssGeneratorClient";
import "./style.css";

const tool = getToolRegistry().getById("buttons-css-generator");

export const metadata: Metadata = tool
  ? buildToolMetadata(tool)
  : { title: "Tool not found | Darma Tools" };

export default function ButtonsCssGeneratorPage() {
  if (!tool) notFound();

  return (
    <ToolPageShell tool={tool}>
      <ButtonsCssGeneratorClient />
    </ToolPageShell>
  );
}
