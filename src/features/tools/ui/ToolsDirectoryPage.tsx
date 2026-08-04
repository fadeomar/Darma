import { PortalHero } from "@/components/portals";
import { ToolLayoutDirectory } from "@/features/tools/layouts";
import type { ToolDefinition } from "@/features/tools";

export default function ToolsDirectoryPage({ tools }: { tools: ToolDefinition[] }) {
  const featuredCount = tools.filter((tool) => tool.featured).length;
  const challengeCount = tools.filter((tool) => tool.layoutType === "interactive-challenge").length;
  const localCount = tools.filter((tool) => tool.privacy === "client-only" || tool.privacy === "local-storage").length;

  return (
    <>
      <PortalHero
        variant="tools"
        eyebrow="Darma browser workspaces"
        badges={["Free tools", "No signup"]}
        title="Turn the task in front of you into a clear, usable result."
        description="Focused workspaces for code, text, images, design, and everyday calculations — with controls beside the result."
        actions={[
          { href: "#tool-directory-filters", label: "Find a tool", icon: "search", tone: "primary" },
          { href: "/workflows", label: "Follow a workflow", icon: "route", tone: "secondary" },
          { href: "/tools/fun", label: "Try a challenge", icon: "games", tone: "quiet" },
        ]}
        metrics={[
          { value: tools.length, label: "browser tools" },
          { value: featuredCount, label: "featured workspaces" },
          { value: localCount, label: "local-first tools" },
          { value: challengeCount, label: "interactive challenges" },
        ]}
        signals={[
          { label: "Interaction", value: "Controls beside results" },
          { label: "Output", value: "Copy and export ready" },
          { label: "Discovery", value: "Search by task" },
        ]}
      />
      <ToolLayoutDirectory tools={tools} />
    </>
  );
}
