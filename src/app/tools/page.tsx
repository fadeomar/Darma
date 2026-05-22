import { getToolRegistry } from "@/features/tools";
import ToolsDirectoryPage from "@/features/tools/ui/ToolsDirectoryPage";

export default function ToolsPage() {
  const tools = getToolRegistry()
    .list()
    .filter((tool) => tool.visibility === "public");

  return <ToolsDirectoryPage tools={tools} />;
}
