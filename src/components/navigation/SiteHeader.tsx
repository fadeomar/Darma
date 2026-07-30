"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  BookOpenText,
  BriefcaseBusiness,
  ChevronDown,
  Compass,
  GitCompareArrows,
  HeartHandshake,
  Layers3,
  Library,
  Menu,
  Network,
  Route,
  Search,
  Shapes,
  Sparkles,
  Wrench,
  X,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { GlobalSearchButton } from "@/features/search/components/GlobalSearchOverlay";
import { loadGsap, userPrefersReducedMotion } from "@/core/motion/gsap-loader";

const PRIMARY_NAV = [
  { href: "/explore", label: "Explore" },
  { href: "/tools", label: "Tools" },
  { href: "/games", label: "Games" },
  { href: "/guides", label: "Guides" },
  { href: "/comparisons", label: "Compare" },
  { href: "/about", label: "About" },
];

const ATLAS_LINKS = [
  { href: "/resources", label: "Resources", text: "Trusted references and official documentation", icon: Library },
  { href: "/learning-paths", label: "Learning paths", text: "Ordered stages, projects, and progress", icon: Route },
  { href: "/career-pathfinder", label: "Career Pathfinder", text: "Match your interests with practical roles", icon: Compass },
  { href: "/tech-careers", label: "Tech careers", text: "Daily work, skills, scope, and growth", icon: BriefcaseBusiness },
  { href: "/ways-of-working", label: "Ways of working", text: "Agile, Scrum, Kanban, delivery, and design", icon: GitCompareArrows },
  { href: "/tech-teams", label: "Teams and delivery", text: "Structures, roles, and end-to-end flow", icon: Network },
  { href: "/tech-glossary", label: "Tech glossary", text: "Practical language for modern teams", icon: BookOpenText },
  { href: "/contribute", label: "Contribute", text: "Improve the open reference with the community", icon: HeartHandshake },
];

const MOBILE_GROUPS = [
  {
    title: "Discover",
    links: [
      { href: "/", label: "Home", icon: Sparkles },
      { href: "/explore", label: "Explore", icon: Shapes },
      { href: "/tools", label: "Tools", icon: Wrench },
      { href: "/games", label: "Games", icon: Layers3 },
      { href: "/search", label: "Search", icon: Search },
    ],
  },
  { title: "Tech Atlas", links: [{ href: "/tech-atlas", label: "Atlas home", icon: Compass }, ...ATLAS_LINKS.map(({ href, label, icon }) => ({ href, label, icon }))] },
  {
    title: "Read and decide",
    links: [
      { href: "/guides", label: "Practical guides", icon: BookOpenText },
      { href: "/comparisons", label: "Comparisons", icon: GitCompareArrows },
      { href: "/about", label: "About Darma", icon: HeartHandshake },
    ],
  },
];

function isPathActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function SiteHeader() {
  const pathname = usePathname();
  const [atlasOpen, setAtlasOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const atlasRef = useRef<HTMLDivElement | null>(null);
  const mobileRef = useRef<HTMLDivElement | null>(null);
  const mobileButtonRef = useRef<HTMLButtonElement | null>(null);
  const mobileCloseRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    setAtlasOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setAtlasOpen(false);
        setMobileOpen(false);
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      if (atlasRef.current && !atlasRef.current.contains(event.target as Node)) setAtlasOpen(false);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    mobileCloseRef.current?.focus();

    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !mobileRef.current) return;
      const focusable = Array.from(
        mobileRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => !element.hasAttribute("hidden"));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", trapFocus);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", trapFocus);
      mobileButtonRef.current?.focus();
    };
  }, [mobileOpen]);

  useLayoutEffect(() => {
    const root = mobileRef.current;
    if (!mobileOpen || !root || userPrefersReducedMotion()) return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;
    loadGsap().then(({ gsap }) => {
      if (cancelled || !mobileRef.current) return;
      const context = gsap.context(() => {
        gsap.fromTo("[data-mobile-backdrop]", { opacity: 0 }, { opacity: 1, duration: 0.28, ease: "power2.out" });
        gsap.fromTo("[data-mobile-drawer]", { y: 28, scale: 0.97, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.5, ease: "power4.out" });
        gsap.fromTo("[data-mobile-link]", { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.38, stagger: 0.035, delay: 0.12, ease: "power3.out" });
      }, root);
      cleanup = () => context.revert();
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [mobileOpen]);

  useLayoutEffect(() => {
    const root = atlasRef.current;
    if (!atlasOpen || !root || userPrefersReducedMotion()) return;
    let cancelled = false;
    let cleanup: (() => void) | undefined;
    loadGsap().then(({ gsap }) => {
      if (cancelled || !atlasRef.current) return;
      const context = gsap.context(() => {
        gsap.fromTo("[data-mega-menu]", { y: -10, opacity: 0, scale: 0.98 }, { y: 0, opacity: 1, scale: 1, duration: 0.34, ease: "power3.out" });
        gsap.fromTo("[data-mega-link]", { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.28, stagger: 0.025, delay: 0.05 });
      }, root);
      cleanup = () => context.revert();
    });
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [atlasOpen]);

  const atlasActive = pathname.startsWith("/tech-atlas") || ATLAS_LINKS.some((item) => isPathActive(pathname, item.href));

  return (
    <header className="darma-site-header sticky top-0 z-[var(--z-header)] border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-overlay)] backdrop-blur-xl" data-scrolled={scrolled}>
      <div className="mx-auto flex min-h-[72px] max-w-[var(--container-wide)] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex shrink-0 items-center gap-3" aria-label="Darma home">
          <span className="darma-brand-mark transition group-hover:rotate-6 group-hover:scale-105 motion-reduce:transition-none">D</span>
          <span className="hidden sm:block">
            <span className="block text-lg font-black leading-none tracking-[-0.04em] text-[var(--color-text-primary)]">Darma</span>
            <span className="mt-1 block font-mono text-[9px] font-bold uppercase tracking-[0.17em] text-[var(--color-text-tertiary)]">Tools • Games • Tech Atlas</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
          {PRIMARY_NAV.slice(0, 3).map((item) => (
            <Link key={item.href} href={item.href} data-active={isPathActive(pathname, item.href)} className="darma-nav-link rounded-full px-3.5 py-2.5 text-sm font-bold text-[var(--color-text-secondary)] transition hover:text-[var(--color-text-primary)]">
              {item.label}
            </Link>
          ))}

          <div ref={atlasRef} className="relative">
            <button
              type="button"
              onClick={() => setAtlasOpen((value) => !value)}
              className="darma-nav-link inline-flex items-center gap-1 rounded-full px-3.5 py-2.5 text-sm font-bold text-[var(--color-text-secondary)] transition hover:text-[var(--color-text-primary)]"
              data-active={atlasActive}
              aria-haspopup="menu"
              aria-expanded={atlasOpen}
            >
              Atlas <ChevronDown className={`h-4 w-4 transition ${atlasOpen ? "rotate-180" : ""}`} aria-hidden />
            </button>
            {atlasOpen ? (
              <div data-mega-menu className="darma-mega-menu" role="navigation" aria-label="Tech Atlas navigation">
                <div className="mb-3 flex items-center justify-between gap-4 rounded-2xl bg-[var(--color-text-primary)] p-4 text-[var(--color-surface-base)]">
                  <div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] opacity-70">Connected reference</p><p className="mt-1 text-lg font-black">Find what to learn, use, and understand.</p></div>
                  <Link href="/tech-atlas" className="shrink-0 rounded-full bg-[var(--color-primary)] px-4 py-2 text-xs font-black text-[var(--color-primary-text)]">Open Atlas</Link>
                </div>
                <div className="grid gap-1 md:grid-cols-2">
                  {ATLAS_LINKS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link key={item.href} href={item.href} data-mega-link className="darma-mega-link">
                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]"><Icon className="h-5 w-5" aria-hidden /></span>
                        <span><span className="block text-sm font-black text-[var(--color-text-primary)]">{item.label}</span><span className="mt-0.5 block text-xs leading-5 text-[var(--color-text-tertiary)]">{item.text}</span></span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>

          {PRIMARY_NAV.slice(3).map((item) => (
            <Link key={item.href} href={item.href} data-active={isPathActive(pathname, item.href)} className="darma-nav-link rounded-full px-3.5 py-2.5 text-sm font-bold text-[var(--color-text-secondary)] transition hover:text-[var(--color-text-primary)]">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <GlobalSearchButton compact showShortcut className="inline-flex" />
          <ThemeToggle />
          <button ref={mobileButtonRef} type="button" onClick={() => setMobileOpen(true)} className="grid h-11 w-11 place-items-center rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] lg:hidden" aria-label="Open navigation menu" aria-expanded={mobileOpen}>
            <Menu className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div ref={mobileRef}>
          <button data-mobile-backdrop type="button" tabIndex={-1} className="darma-mobile-backdrop" aria-label="Close navigation menu" onClick={() => setMobileOpen(false)} />
          <div data-mobile-drawer className="darma-mobile-drawer" role="dialog" aria-modal="true" aria-label="Site navigation">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-overlay)] p-4 backdrop-blur-xl">
              <Link href="/" className="flex items-center gap-3"><span className="darma-brand-mark">D</span><span className="font-black text-[var(--color-text-primary)]">Darma</span></Link>
              <button ref={mobileCloseRef} type="button" onClick={() => setMobileOpen(false)} className="grid h-11 w-11 place-items-center rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-raised)]" aria-label="Close navigation menu"><X className="h-5 w-5" aria-hidden /></button>
            </div>
            <div className="space-y-7 p-4 pb-10 sm:p-6">
              <div data-mobile-link className="visual-grid-bg rounded-[1.4rem] border border-[var(--color-border-default)] p-5">
                <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[var(--color-primary)]">Start with a goal</p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[var(--color-text-primary)]">Search the whole Darma workspace.</h2>
                <button type="button" onClick={() => { setMobileOpen(false); window.setTimeout(() => window.dispatchEvent(new Event("darma:open-global-search")), 80); }} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 text-sm font-black text-[var(--color-primary-text)]"><Search className="h-4 w-4" aria-hidden />Open search</button>
              </div>
              {MOBILE_GROUPS.map((group) => (
                <section key={group.title}>
                  <p data-mobile-link className="mb-3 font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[var(--color-text-tertiary)]">{group.title}</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {group.links.map((item) => {
                      const Icon = item.icon;
                      return <Link key={`${group.title}-${item.href}`} href={item.href} data-mobile-link className="darma-mobile-nav-card" aria-current={isPathActive(pathname, item.href) ? "page" : undefined}><span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]"><Icon className="h-5 w-5" aria-hidden /></span><span className="font-bold text-[var(--color-text-primary)]">{item.label}</span></Link>;
                    })}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
