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
        badges={["Free tools", "No signup", "Result-first UI"]}
        title="Turn the task in front of you into a clear, usable result."
        description="Open focused workspaces for code, text, images, design, calculations, generators, and everyday digital tasks. Controls stay connected to previews, results, and export actions."
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
          { label: "Privacy", value: "Visible per tool" },
          { label: "Output", value: "Copy and export ready" },
          { label: "Discovery", value: "Search by task" },
        ]}
      />
      <ToolLayoutDirectory tools={tools} />
    </>
  );
}
