import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Compass,
  ExternalLink,
  GitCompareArrows,
  GraduationCap,
  Network,
  Route,
  Sparkles,
  Workflow,
} from "lucide-react";
import { SplitTextReveal } from "@/components/motion";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/cn";
import { DetailHeroScene } from "./DetailHeroScene";

export type DetailVariant = "guide" | "comparison" | "learning" | "career" | "workflow" | "method";

export type DetailMetric = {
  label: string;
  value: string | number;
};

export type DetailAction = {
  href: string;
  label: string;
  tone?: "primary" | "secondary" | "quiet";
  external?: boolean;
};

export type DetailSignal = {
  label: string;
  value: string;
};

type DetailHeroProps = {
  variant: DetailVariant;
  backHref: string;
  backLabel: string;
  eyebrow: string;
  badges?: Array<{ label: string; tone?: "soft" | "outline" | "success" | "accent" }>;
  title: string;
  description: string;
  metrics: DetailMetric[];
  actions?: DetailAction[];
  signals?: DetailSignal[];
  asideTitle?: string;
  asideItems?: string[];
  className?: string;
};

const VARIANT_ICON = {
  guide: BookOpen,
  comparison: GitCompareArrows,
  learning: GraduationCap,
  career: Network,
  workflow: Workflow,
  method: Route,
};

const VARIANT_LABEL = {
  guide: "Practical guide",
  comparison: "Decision support",
  learning: "Learning route",
  career: "Role map",
  workflow: "Connected workflow",
  method: "Working method",
};

export function DetailHero({
  variant,
  backHref,
  backLabel,
  eyebrow,
  badges = [],
  title,
  description,
  metrics,
  actions = [],
  signals = [],
  asideTitle,
  asideItems = [],
  className,
}: DetailHeroProps) {
  const VariantIcon = VARIANT_ICON[variant];

  return (
    <section className={cn("detail-hero", `detail-hero-${variant}`, className)}>
      <div className="detail-hero-grid" aria-hidden />
      <div className="detail-hero-inner">
        <div className="detail-hero-copy">
          <Link href={backHref} className="detail-hero-back">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            <span>{backLabel}</span>
          </Link>

          <div className="detail-hero-eyebrow">
            <span className="detail-hero-eyebrow-icon" aria-hidden><VariantIcon className="h-4 w-4" /></span>
            <span>{eyebrow}</span>
            <span className="detail-hero-eyebrow-separator" aria-hidden>•</span>
            <span>{VARIANT_LABEL[variant]}</span>
          </div>

          {badges.length ? (
            <div className="detail-hero-badges">
              {badges.map((badge) => (
                <Badge key={badge.label} variant={badge.tone ?? "outline"}>{badge.label}</Badge>
              ))}
            </div>
          ) : null}

          <SplitTextReveal text={title} className="detail-hero-title" />
          <p className="detail-hero-description">{description}</p>

          {actions.length ? (
            <div className="detail-hero-actions">
              {actions.map((action, index) => {
                const isPrimary = (action.tone ?? (index === 0 ? "primary" : "secondary")) === "primary";
                const Icon = action.external ? ExternalLink : ArrowRight;
                return (
                  <Link
                    key={`${action.href}-${action.label}`}
                    href={action.href}
                    target={action.external ? "_blank" : undefined}
                    rel={action.external ? "noopener noreferrer" : undefined}
                    className={`detail-hero-action detail-hero-action-${action.tone ?? (index === 0 ? "primary" : "secondary")}`}
                  >
                    {isPrimary ? <Sparkles className="h-4 w-4" aria-hidden /> : null}
                    <span>{action.label}</span>
                    <Icon className="h-4 w-4" aria-hidden />
                  </Link>
                );
              })}
            </div>
          ) : null}

          {signals.length ? (
            <dl className="detail-hero-signals">
              {signals.slice(0, 4).map((signal) => (
                <div key={signal.label}>
                  <dt>{signal.label}</dt>
                  <dd>{signal.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>

        <div className="detail-hero-visual-column">
          <DetailHeroScene variant={variant} metrics={metrics.slice(0, 4)} />
          {asideTitle && asideItems.length ? (
            <aside className="detail-hero-aside">
              <div className="detail-hero-aside-heading">
                <Compass className="h-4 w-4" aria-hidden />
                <h2>{asideTitle}</h2>
              </div>
              <ul>
                {asideItems.slice(0, 4).map((item) => (
                  <li key={item}>
                    <CheckCircle2 className="h-4 w-4" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </aside>
          ) : null}
        </div>
      </div>
    </section>
  );
}
