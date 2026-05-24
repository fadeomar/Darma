import { notFound } from "next/navigation";
import { getToolRegistry } from "@/features/tools";
import { buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";
import ButtonsCssGeneratorClient from "./ButtonsCssGeneratorClient";
import ButtonCSSGeneratorArticle from "./ButtonCSSGeneratorArticle";

const tool = getToolRegistry().getById("buttons-css-generator");

export const metadata = tool ? buildToolMetadata(tool) : {};

export default function ButtonsCssGeneratorPage() {
  if (!tool) notFound();

  return (
    <ToolPage
      tool={tool}
      intro={
        <p className="max-w-2xl text-sm leading-7 text-[var(--color-text-muted)]">
          Design production-ready buttons visually, compare variants, preview interaction states, and copy CSS, Tailwind, React, or HTML snippets.
        </p>
      }
      article={<ButtonCSSGeneratorArticle />}
      maxWidth="wide"
    >
      <ToolContentCard
        title="Design and export"
        description="Choose a preset, tune typography and spacing, then copy the output format that best fits your project."
      >
        <ButtonsCssGeneratorClient />
      </ToolContentCard>
    </ToolPage>
  );
}
