import { getPublicTools } from "@/features/tools";
import ToolsDirectoryPage from "@/features/tools/ui/ToolsDirectoryPage";

export default function ToolsPage() {
  return <ToolsDirectoryPage tools={getPublicTools()} />;
}
