import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getToolRegistry } from "@/features/tools";
import { buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";
import BeamCalculatorShell from "./BeamCalculatorShell";
import "./style.css";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("beam-calculator");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

export default function BeamCalculatorPage() {
  const tool = getToolRegistry().getById("beam-calculator");
  if (!tool) notFound();
  return (
    <ToolPage tool={tool} maxWidth="full">
      <BeamCalculatorShell />
    </ToolPage>
  );
}
