import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getToolRegistry } from "@/features/tools";
import { buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";
import BoxShadowsGeneratorClient from "./BoxShadowsGeneratorClient";
import "./styles.css";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("box-shadows-generator");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

export default function BoxShadowsGeneratorPage() {
  const tool = getToolRegistry().getById("box-shadows-generator");
  if (!tool) notFound();
  return (
    <ToolPage tool={tool} maxWidth="wide">
      <BoxShadowsGeneratorClient />
    </ToolPage>
  );
}
