import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getToolRegistry } from "@/features/tools";
import { ToolPage } from "@/features/tools/layouts";
import BeamCalculatorShell from "./BeamCalculatorShell";
import "./style.css";

export const metadata: Metadata = {
  title: "Beam Calculator | Darma Tools",
  description: "Canvas-first beam calculator with reactions, shear force, and bending moment diagrams.",
};


export default function BeamCalculatorPage() {
  const tool = getToolRegistry().getById("beam-calculator");
  if (!tool) notFound();
  return (
    <ToolPage tool={tool} maxWidth="full" intro={<div className="beam-intro"><b>Phase 1.5:</b> drag supports and vertical loads on the beam, then verify reactions, SFD, and BMD from equilibrium equations.</div>}>
      <BeamCalculatorShell />
    </ToolPage>
  );
}
