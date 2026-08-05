import { DarmaSymbol } from "./DarmaSymbol";

export function RouteLostArtwork() {
  return (
    <div className="route-lost-artwork" aria-hidden>
      <svg viewBox="0 0 460 310" fill="none" focusable="false">
        <defs>
          <linearGradient id="route-lost-gradient" x1="64" y1="48" x2="390" y2="260" gradientUnits="userSpaceOnUse">
            <stop stopColor="var(--color-primary)" />
            <stop offset="1" stopColor="var(--color-accent)" />
          </linearGradient>
          <filter id="route-lost-shadow" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="14" stdDeviation="14" floodColor="#111" floodOpacity=".18" />
          </filter>
        </defs>
        <path className="route-lost-grid-line" d="M44 74h372M44 132h372M44 190h372M44 248h372M90 42v230M164 42v230M238 42v230M312 42v230M386 42v230" />
        <path className="route-lost-path" d="M74 238c34-74 74-10 105-78 30-65 83-12 107-72 20-50 64-43 103-17" />
        <path className="route-lost-path route-lost-path-ghost" d="M72 239c38-22 71-18 103 10 49 43 98 27 141-17 22-23 48-28 74-13" />
        <circle cx="74" cy="238" r="12" fill="var(--color-surface-raised)" stroke="var(--color-primary)" strokeWidth="3" filter="url(#route-lost-shadow)" />
        <circle cx="389" cy="71" r="12" fill="var(--color-surface-raised)" stroke="var(--color-accent)" strokeWidth="3" filter="url(#route-lost-shadow)" />
        <g filter="url(#route-lost-shadow)">
          <rect x="185" y="101" width="92" height="92" rx="25" fill="var(--color-text-primary)" />
          <path d="M211 127h40M211 142h26M211 157h32" stroke="var(--color-surface-base)" strokeWidth="6" strokeLinecap="round" />
          <circle cx="259" cy="162" r="11" fill="url(#route-lost-gradient)" />
        </g>
        <text x="230" y="222" textAnchor="middle" fill="var(--color-text-primary)" fontSize="26" fontWeight="900">404</text>
        <text x="230" y="245" textAnchor="middle" fill="var(--color-text-tertiary)" fontSize="11" fontWeight="700" letterSpacing="2">ROUTE NOT FOUND</text>
      </svg>
      <span className="route-lost-symbol route-lost-symbol-a"><DarmaSymbol name="search" /></span>
      <span className="route-lost-symbol route-lost-symbol-b"><DarmaSymbol name="route" /></span>
    </div>
  );
}
