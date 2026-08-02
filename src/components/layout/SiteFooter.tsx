import Link from "next/link";
import { ArrowRight, ExternalLink, Github, Search, Sparkles, Wrench } from "lucide-react";
import { DarmaSymbol } from "@/components/visuals";
import { getPublicTools } from "@/features/tools";
import { getGames } from "@/features/games";
import { getLearningPaths } from "@/features/learning-paths";
import { getResourceCatalog } from "@/features/resources";

const FOOTER_GROUPS = [
  {
    title: "Work",
    links: [
      { href: "/tools", label: "Browser tools" },
      { href: "/explore", label: "Explore snippets" },
      { href: "/workflows", label: "Connected workflows" },
      { href: "/games", label: "Browser games" },
      { href: "/search", label: "Search everything" },
    ],
  },
  {
    title: "Tech Atlas",
    links: [
      { href: "/tech-atlas", label: "Atlas home" },
      { href: "/resources", label: "Resource library" },
      { href: "/learning-paths", label: "Learning paths" },
      { href: "/tech-careers", label: "Tech careers" },
      { href: "/tech-teams", label: "Teams and delivery" },
      { href: "/tech-glossary", label: "Tech glossary" },
    ],
  },
  {
    title: "Decide and learn",
    links: [
      { href: "/guides", label: "Practical guides" },
      { href: "/comparisons", label: "Comparisons" },
      { href: "/career-pathfinder", label: "Career Pathfinder" },
      { href: "/ways-of-working", label: "Ways of working" },
      { href: "/editorial-policy", label: "Editorial policy" },
    ],
  },
  {
    title: "Project",
    links: [
      { href: "/about", label: "About Darma" },
      { href: "/contribute", label: "Contribute" },
      { href: "https://github.com/fadeomar/Darma", label: "GitHub repository", external: true },
    ],
  },
] as const;

export default function SiteFooter() {
  const toolCount = getPublicTools().length;
  const gameCount = getGames().length;
  const pathCount = getLearningPaths().length;
  const resourceCount = getResourceCatalog().length;
  const year = new Date().getFullYear();

  return (
    <footer className="darma-footer" aria-labelledby="darma-footer-title">
      <div className="darma-footer-aurora darma-footer-aurora-one" aria-hidden />
      <div className="darma-footer-aurora darma-footer-aurora-two" aria-hidden />

      <div className="darma-footer-inner">
        <section className="darma-footer-lead">
          <div className="darma-footer-brand-copy">
            <span className="darma-footer-kicker"><Sparkles className="h-4 w-4" aria-hidden />Open technology workspace</span>
            <div className="darma-footer-brand-row">
              <span className="darma-footer-mark" aria-hidden>D</span>
              <div><h2 id="darma-footer-title">Darma</h2><p>Use the tool. Understand the system. Keep moving.</p></div>
            </div>
            <p className="darma-footer-description">Practical browser tools, focused games, reviewed references, learning routes, career guidance, and connected workflows in one open workspace.</p>
            <div className="darma-footer-actions">
              <Link href="/tools"><Wrench className="h-4 w-4" aria-hidden />Open tools <ArrowRight className="h-4 w-4" aria-hidden /></Link>
              <Link href="/search" className="darma-footer-search"><Search className="h-4 w-4" aria-hidden />Search Darma</Link>
            </div>
          </div>

          <FooterNetworkArtwork toolCount={toolCount} resourceCount={resourceCount} pathCount={pathCount} gameCount={gameCount} />
        </section>

        <div className="darma-footer-status" aria-label="Darma project principles and catalog totals">
          <span><DarmaSymbol name="secure" className="h-5 w-5" /><strong>Browser-first</strong><small>Core tools need no account</small></span>
          <span><DarmaSymbol name="source" className="h-5 w-5" /><strong>{resourceCount} references</strong><small>Official and durable sources</small></span>
          <span><DarmaSymbol name="learn" className="h-5 w-5" /><strong>{pathCount} learning paths</strong><small>Stages, checkpoints, evidence</small></span>
          <span><DarmaSymbol name="play" className="h-5 w-5" /><strong>{gameCount} games</strong><small>Focused browser breaks</small></span>
        </div>

        <div className="darma-footer-grid">
          {FOOTER_GROUPS.map((group) => (
            <nav key={group.title} aria-label={`${group.title} links`}>
              <h3>{group.title}</h3>
              <ul>
                {group.links.map((link) => (
                  <li key={link.href}>
                    {"external" in link && link.external ? (
                      <a href={link.href} target="_blank" rel="noreferrer">
                        {link.label}<ExternalLink className="h-3.5 w-3.5" aria-hidden />
                      </a>
                    ) : (
                      <Link href={link.href}>{link.label}<ArrowRight className="h-3.5 w-3.5" aria-hidden /></Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="darma-footer-bottom">
          <p>© {year} Darma. Open-source work shaped through visible review and contribution.</p>
          <div>
            <a href="https://github.com/fadeomar/Darma" target="_blank" rel="noreferrer"><Github className="h-4 w-4" aria-hidden />GitHub</a>
            <Link href="/editorial-policy">Editorial policy</Link>
            <Link href="/contribute">Contribution flow</Link>
            <a href="#main-content">Back to top ↑</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterNetworkArtwork({ toolCount, resourceCount, pathCount, gameCount }: { toolCount: number; resourceCount: number; pathCount: number; gameCount: number }) {
  return (
    <div className="darma-footer-art" aria-label={`${toolCount} tools, ${resourceCount} references, ${pathCount} learning paths, and ${gameCount} games connected in Darma`}>
      <svg viewBox="0 0 620 430" role="img" aria-labelledby="darma-footer-art-title darma-footer-art-description">
        <title id="darma-footer-art-title">Darma connected workspace map</title>
        <desc id="darma-footer-art-description">A visual network connecting tools, references, learning paths, games, and practical output.</desc>
        <defs>
          <linearGradient id="footer-node-gradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ff6a3d"/><stop offset="1" stopColor="#2dd4bf"/></linearGradient>
          <filter id="footer-node-shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="18" stdDeviation="18" floodColor="#000" floodOpacity="0.25"/></filter>
        </defs>
        <circle cx="310" cy="215" r="164" fill="none" stroke="rgba(255,255,255,.12)" strokeDasharray="7 12"/>
        <circle cx="310" cy="215" r="108" fill="none" stroke="rgba(45,212,191,.25)" strokeDasharray="4 9"/>
        <path d="M310 215C244 155 198 126 120 112M310 215C378 154 425 128 502 112M310 215C244 276 196 304 121 322M310 215C379 276 425 304 501 322" fill="none" stroke="url(#footer-node-gradient)" strokeWidth="3.2" strokeLinecap="round"/>
        <g filter="url(#footer-node-shadow)"><rect x="244" y="149" width="132" height="132" rx="38" fill="#101715" stroke="url(#footer-node-gradient)" strokeWidth="3"/><text x="310" y="236" textAnchor="middle" fill="#f4f1ea" fontSize="58" fontWeight="950">D</text><circle cx="350" cy="178" r="7" fill="#2dd4bf"/></g>
        <g className="darma-footer-art-node"><rect x="54" y="76" width="132" height="72" rx="20"/><text x="76" y="105">TOOLS</text><text x="76" y="132">{toolCount}</text></g>
        <g className="darma-footer-art-node"><rect x="435" y="76" width="132" height="72" rx="20"/><text x="457" y="105">SOURCES</text><text x="457" y="132">{resourceCount}</text></g>
        <g className="darma-footer-art-node"><rect x="54" y="286" width="132" height="72" rx="20"/><text x="76" y="315">PATHS</text><text x="76" y="342">{pathCount}</text></g>
        <g className="darma-footer-art-node"><rect x="435" y="286" width="132" height="72" rx="20"/><text x="457" y="315">GAMES</text><text x="457" y="342">{gameCount}</text></g>
        <g className="darma-footer-output"><rect x="204" y="374" width="212" height="38" rx="14"/><circle cx="225" cy="393" r="5"/><text x="241" y="398">PRACTICAL OUTPUT</text></g>
      </svg>
    </div>
  );
}
