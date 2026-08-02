import { DarmaSymbol } from "./DarmaSymbol";

type SearchConstellationArtworkProps = {
  total: number;
  live: number;
  kinds: number;
};

export function SearchConstellationArtwork({ total, live, kinds }: SearchConstellationArtworkProps) {
  return (
    <div className="search-constellation-artwork" aria-hidden>
      <svg viewBox="0 0 520 330" fill="none" focusable="false">
        <defs>
          <linearGradient id="search-constellation-gradient" x1="74" y1="62" x2="448" y2="278" gradientUnits="userSpaceOnUse">
            <stop stopColor="var(--color-primary)" />
            <stop offset="1" stopColor="var(--color-accent)" />
          </linearGradient>
        </defs>
        <path className="search-constellation-line" d="M104 93 205 145l105-82 105 96-76 90-129-9-106-147Z" />
        <path className="search-constellation-line search-constellation-line-soft" d="m205 145 5 95M310 63l29 186M104 93l235 156M415 159l-210-14" />
        <circle cx="104" cy="93" r="29" className="search-constellation-node" />
        <circle cx="205" cy="145" r="38" className="search-constellation-node search-constellation-node-main" />
        <circle cx="310" cy="63" r="26" className="search-constellation-node" />
        <circle cx="415" cy="159" r="31" className="search-constellation-node" />
        <circle cx="339" cy="249" r="28" className="search-constellation-node" />
        <circle cx="210" cy="240" r="24" className="search-constellation-node" />
        <circle cx="205" cy="145" r="56" className="search-constellation-ring" />
        <text x="205" y="140" textAnchor="middle" className="search-constellation-value">{total}</text>
        <text x="205" y="159" textAnchor="middle" className="search-constellation-label">ENTITIES</text>
        <text x="104" y="98" textAnchor="middle" className="search-constellation-small">TOOLS</text>
        <text x="310" y="68" textAnchor="middle" className="search-constellation-small">GAMES</text>
        <text x="415" y="164" textAnchor="middle" className="search-constellation-small">ATLAS</text>
        <text x="339" y="254" textAnchor="middle" className="search-constellation-small">{kinds} KINDS</text>
        <text x="210" y="245" textAnchor="middle" className="search-constellation-small">{live} LIVE</text>
      </svg>
      <span className="search-constellation-symbol search-constellation-symbol-a"><DarmaSymbol name="search" /></span>
      <span className="search-constellation-symbol search-constellation-symbol-b"><DarmaSymbol name="resource" /></span>
    </div>
  );
}
