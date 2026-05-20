import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getToolRegistry } from "@/features/tools";
import { buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";
import ButtonsCssGeneratorClient from "./ButtonsCssGeneratorClient";
import ButtonCSSGeneratorArticle from "./ButtonCSSGeneratorArticle";
import "./style.css";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("buttons-css-generator");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

export default function ButtonsCssGeneratorPage() {
  const tool = getToolRegistry().getById("buttons-css-generator");
  if (!tool) notFound();
  return (
    <ToolPage tool={tool} maxWidth="wide" article={<ButtonCSSGeneratorArticle />}>
      <ButtonsCssGeneratorClient />
    </ToolPage>
  );
}
