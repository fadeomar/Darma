import type { PortalHeroSignal } from "./PortalHero";

/**
 * The signal strip renders one cell per supplied item — never a padded row.
 * Routes used to hand over three signals into a grid that always reserved four
 * columns, so `/tools` shipped an empty fourth rectangle. The count is passed
 * to CSS instead of being hard-coded there, so three items produce three
 * columns and four produce a 2x2 (laptop) or 4-up (wide desktop) block.
 */
export const MAX_PORTAL_HERO_SIGNALS = 4;

export function resolvePortalHeroSignals(signals: PortalHeroSignal[] = []) {
  return signals.slice(0, MAX_PORTAL_HERO_SIGNALS);
}
