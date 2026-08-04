import type { Resource } from "@/features/resources";
import { DarmaSymbol, type DarmaSymbolName } from "./DarmaSymbol";

type ResourceCardArtworkProps = {
  resource: Pick<Resource, "resourceType" | "publisherType" | "categories" | "name">;
  compact?: boolean;
};

const TYPE_SYMBOLS: Record<Resource["resourceType"], DarmaSymbolName> = {
  documentation: "source",
  course: "learn",
  tutorial: "route",
  tool: "build",
  generator: "performance",
  community: "play",
  reference: "resource",
  "asset-library": "color",
};

function accentFor(resource: ResourceCardArtworkProps["resource"]) {
  const text = `${resource.name} ${resource.categories.join(" ")}`.toLowerCase();
  if (text.includes("accessib")) return "mint";
  if (text.includes("security") || text.includes("owasp")) return "rose";
  if (text.includes("performance") || text.includes("vitals")) return "amber";
  if (text.includes("design") || text.includes("color") || text.includes("asset")) return "violet";
  if (text.includes("data") || text.includes("api")) return "blue";
  return resource.publisherType === "official" ? "teal" : "orange";
}

/**
 * Decorative identity panel for a resource card.
 *
 * It used to print the resource type and first category as text, which the card
 * body states again a few rows below — so every resource card said "reference"
 * and its pillar name twice. The panel now carries the type only through its
 * symbol and accent, leaving the words to the card's own metadata row.
 *
 * The panel keeps a stable aspect ratio so a future local logo can drop into
 * this slot without changing card dimensions.
 */
export function ResourceCardArtwork({ resource, compact = false }: ResourceCardArtworkProps) {
  const symbol = TYPE_SYMBOLS[resource.resourceType];
  const accent = accentFor(resource);

  return (
    <div className={`resource-card-artwork resource-card-artwork-${accent} ${compact ? "resource-card-artwork-compact" : ""}`} aria-hidden>
      <div className="resource-card-artwork-grid" />
      <div className="resource-card-artwork-orbit"><span /><span /><span /></div>
      <div className="resource-card-artwork-symbol"><DarmaSymbol name={symbol} /></div>
      <div className="resource-card-artwork-pulse"><i /><i /><i /></div>
    </div>
  );
}
