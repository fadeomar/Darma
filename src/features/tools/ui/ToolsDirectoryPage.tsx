import { ToolLayoutDirectory } from "@/features/tools/layouts";
import type { ToolDefinition } from "@/features/tools";

export default function ToolsDirectoryPage({ tools }: { tools: ToolDefinition[] }) {
  return <ToolLayoutDirectory tools={tools} />;
}
