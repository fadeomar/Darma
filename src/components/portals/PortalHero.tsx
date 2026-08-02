import Link from "next/link";
import {
  ArrowRight,
  Compass,
  Gamepad2,
  GitCompareArrows,
  Library,
  Route,
  Search,
  Sparkles,
  Wrench,
} from "lucide-react";
import { SplitTextReveal } from "@/components/motion";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/cn";
import { PortalHeroScene, type PortalVariant } from "./PortalHeroScene";

export type PortalHeroMetric = {
  value: string | number;
  label: string;
};

export type PortalHeroAction = {
  href: string;
  label: string;
  tone?: "primary" | "secondary" | "quiet";
  icon?: "arrow" | "search" | "tools" | "route" | "compare" | "games" | "atlas" | "resources" | "sparkles";
};

export type PortalHeroSignal = {
  label: string;
  value: string;
};

type PortalHeroProps = {
  variant: PortalVariant;
  eyebrow: string;
  badges?: string[];
  title: string;
  description: string;
  actions: PortalHeroAction[];
  metrics: PortalHeroMetric[];
  signals?: PortalHeroSignal[];
  className?: string;
};

const ACTION_ICONS = {
  arrow: ArrowRight,
  search: Search,
  tools: Wrench,
  route: Route,
  compare: GitCompareArrows,
  games: Gamepad2,
  atlas: Compass,
  resources: Library,
  sparkles: Sparkles,
};

export function PortalHero({
  variant,
  eyebrow,
  badges = [],
  title,
  description,
  actions,
  metrics,
  signals = [],
  className,
}: PortalHeroProps) {
  return (
    <section className={cn("portal-hero", `portal-hero-${variant}`, className)}>
      <div className="portal-hero-grid-overlay" aria-hidden />
      <div className="portal-hero-inner">
        <div className="portal-hero-copy">
          <div className="portal-hero-eyebrow"><span aria-hidden>✦</span>{eyebrow}</div>
          {badges.length ? (
            <div className="portal-hero-badges">
              {badges.map((badge, index) => <Badge key={badge} variant={index === 0 ? "soft" : "outline"}>{badge}</Badge>)}
            </div>
          ) : null}
          <SplitTextReveal text={title} className="portal-hero-title" />
          <p className="portal-hero-description">{description}</p>
          <div className="portal-hero-actions">
            {actions.map((action, index) => {
              const Icon = ACTION_ICONS[action.icon ?? (index === 0 ? "arrow" : "sparkles")];
              return (
                <Link key={`${action.href}-${action.label}`} href={action.href} className={`portal-hero-action portal-hero-action-${action.tone ?? (index === 0 ? "primary" : "secondary")}`}>
                  <Icon className="h-4 w-4" aria-hidden />
                  <span>{action.label}</span>
                  {action.icon !== "arrow" && index === 0 ? <ArrowRight className="h-4 w-4" aria-hidden /> : null}
                </Link>
              );
            })}
          </div>
          {signals.length ? (
            <dl className="portal-hero-signals">
              {signals.slice(0, 4).map((signal) => (
                <div key={signal.label}>
                  <dt>{signal.label}</dt>
                  <dd>{signal.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
        <PortalHeroScene variant={variant} metrics={metrics.map((metric) => ({ value: String(metric.value), label: metric.label }))} />
      </div>
    </section>
  );
}
