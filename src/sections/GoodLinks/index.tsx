import { getResourceCatalog, RESOURCE_CATEGORIES } from "@/features/resources";
import { ResourceExplorer } from "@/features/resources/components";

/** Backward-compatible wrapper for the previous About-page reference section. */
export default function GoodLinks() {
  return <ResourceExplorer resources={getResourceCatalog()} categories={RESOURCE_CATEGORIES} />;
}
