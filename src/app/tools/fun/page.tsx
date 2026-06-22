import type { Metadata } from "next";
import { ChallengeLandingPage } from "@/features/tools/challenges/ChallengeLandingPage";
import { getToolRegistry } from "@/features/tools/registry";

export const metadata: Metadata = {
  title: "Fun Tools and Interactive Challenges | Darma Tools",
  description:
    "Play browser-only Darma challenges for click speed, scroll speed, spacebar speed, reaction time, and quick input tests with local personal bests.",
  alternates: { canonical: "/tools/fun" },
  openGraph: {
    title: "Fun Tools and Interactive Challenges | Darma Tools",
    description:
      "Play browser-only Darma challenges for click speed, scroll speed, spacebar speed, reaction time, and quick input tests with local personal bests.",
    type: "website",
    url: "/tools/fun",
  },
  twitter: {
    card: "summary",
    title: "Fun Tools and Interactive Challenges | Darma Tools",
    description:
      "Play browser-only Darma challenges for click speed, scroll speed, spacebar speed, reaction time, and quick input tests with local personal bests.",
  },
};

export default function FunToolsPage() {
  const tools = getToolRegistry()
    .list()
    .filter((tool) => tool.visibility === "public");

  return <ChallengeLandingPage tools={tools} />;
}
