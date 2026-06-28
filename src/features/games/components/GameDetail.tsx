import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Gamepad2,
  Keyboard,
  Lightbulb,
  MonitorSmartphone,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { Badge, Card } from "@/components/ui";
import {
  CATEGORY_LABELS,
  DEVICE_LABELS,
  DIFFICULTY_LABELS,
  INPUT_LABELS,
  type GameDefinition,
} from "../domain/game";
import { FavoriteGameButton } from "./FavoriteGameButton";
import { GamePlayerShell } from "./GamePlayerShell";
import { GamePlayLink } from "./GamePlayLink";
import { GameThumbnail } from "./GameThumbnail";
import { RelatedGames } from "./RelatedGames";

type DetailRowProps = {
  label: string;
  value: React.ReactNode;
};

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border-subtle)] py-3 last:border-0">
      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
        {label}
      </span>
      <span className="text-right text-sm font-semibold text-[var(--color-text-primary)]">{value}</span>
    </div>
  );
}

function FeaturePill({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <span className="inline-flex min-h-9 items-center gap-2 rounded-[var(--radius-full)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-3 text-xs font-bold text-[var(--color-text-secondary)]">
      <Icon className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
      {label}
    </span>
  );
}

function InfoCard({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card variant="default" padding="lg" className="game-detail-info-card h-full">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] text-[var(--color-primary)]">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h2 className="text-lg font-black tracking-[-0.02em] text-[var(--color-text-primary)]">{title}</h2>
          <div className="mt-2 text-sm leading-7 text-[var(--color-text-secondary)]">{children}</div>
        </div>
      </div>
    </Card>
  );
}

function getGameFeatures(game: GameDefinition) {
  const features = [
    `${DIFFICULTY_LABELS[game.difficulty]} to start`,
    `${game.playTime} average rounds`,
    `${game.input.map((input) => INPUT_LABELS[input]).join(" + ")} controls`,
  ];

  if (game.categories.includes("quick-break")) features.push("Great for quick breaks");
  if (game.categories.includes("brain")) features.push("Good for focus and thinking");
  if (game.categories.includes("2-players")) features.push("Works well with friends");
  if (game.devices.includes("mobile")) features.push("Touch-friendly layout");

  return Array.from(new Set(features)).slice(0, 6);
}

function getTips(game: GameDefinition) {
  const tips = [
    "Start with a short round to learn the rhythm before chasing high scores.",
    "Use the controls slowly at first, then increase speed once the pattern feels natural.",
  ];

  if (game.categories.includes("puzzle") || game.categories.includes("brain")) {
    tips.push("Look for patterns instead of reacting randomly; most puzzle games reward planning.");
  }
  if (game.categories.includes("arcade")) {
    tips.push("Keep your eyes on the next move, not only the current obstacle.");
  }
  if (game.categories.includes("2-players")) {
    tips.push("For two-player rounds, agree on controls before starting to avoid confusion.");
  }

  return tips.slice(0, 3);
}

export function GameDetail({ game, allGames }: { game: GameDefinition; allGames: GameDefinition[] }) {
  const features = getGameFeatures(game);
  const tips = getTips(game);

  return (
    <div className="game-page-shell mx-auto max-w-[var(--container-page)] px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
      <nav aria-label="Breadcrumb" className="mb-5">
        <ol className="flex flex-wrap items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
          <li>
            <Link href="/games" className="rounded-[var(--radius-sm)] transition hover:text-[var(--color-text-primary)] focus:outline-none focus-visible:shadow-[var(--focus-ring)]">
              Games
            </Link>
          </li>
          <ChevronRight className="h-3 w-3" aria-hidden />
          <li aria-current="page" className="max-w-[14rem] truncate text-[var(--color-text-secondary)] sm:max-w-none">{game.title}</li>
        </ol>
      </nav>

      <header className="game-detail-hero relative isolate overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-card)]">
        <div className="game-soft-orb game-soft-orb-a" aria-hidden />
        <div className="game-soft-orb game-soft-orb-b" aria-hidden />
        <div className="relative grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
          <div>
            <Link
              href="/games"
              className="mb-5 inline-flex min-h-9 items-center gap-2 rounded-[var(--radius-full)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-3 text-xs font-bold text-[var(--color-text-secondary)] transition hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)] focus:outline-none focus-visible:shadow-[var(--focus-ring)]"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Back to games
            </Link>

            <div className="flex flex-wrap items-center gap-2">
              {game.isNew ? <Badge variant="accent">New</Badge> : null}
              {game.popular ? <Badge variant="warning">Popular</Badge> : null}
              {game.featured ? <Badge variant="soft">Featured</Badge> : null}
              {game.categories.slice(0, 3).map((category) => (
                <Badge key={category} variant="outline">{CATEGORY_LABELS[category]}</Badge>
              ))}
            </div>

            <h1 className="mt-4 max-w-3xl text-3xl font-black leading-[var(--leading-tight)] tracking-[-0.045em] text-[var(--color-text-primary)] sm:text-5xl">
              {game.title}
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--color-text-secondary)] sm:text-lg">
              {game.description}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <FeaturePill icon={Clock3} label={game.playTime} />
              <FeaturePill icon={Target} label={DIFFICULTY_LABELS[game.difficulty]} />
              <FeaturePill icon={MonitorSmartphone} label={game.devices.map((device) => DEVICE_LABELS[device]).join(" / ")} />
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <GamePlayLink
                game={game}
                href="#player"
                className="min-h-11 w-auto px-5 text-base hover:translate-y-0"
              >
                Play Now
              </GamePlayLink>
              <FavoriteGameButton game={game} className="min-h-11 px-5 text-base" />
              <Link
                href="/games"
                className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-5 text-base font-bold text-[var(--color-text-primary)] transition hover:border-[var(--color-border-strong)] focus:outline-none focus-visible:shadow-[var(--focus-ring)]"
              >
                Explore more
              </Link>
            </div>
          </div>

          <div className="game-detail-preview group relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] shadow-[var(--shadow-card)]">
            <GameThumbnail game={game} aspect="4/3" size="lg" priority />
            <div className="absolute inset-x-4 bottom-4 rounded-[var(--radius-md)] border border-white/20 bg-black/35 p-3 text-white backdrop-blur-md">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 text-sm font-black">
                  <Gamepad2 className="h-4 w-4" aria-hidden />
                  Quick browser game
                </span>
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-white/75">
                  {game.playTime}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div id="player" className="scroll-mt-24">
          <GamePlayerShell game={game} />
        </div>

        <Card as="aside" variant="default" padding="lg" className="lg:sticky lg:top-24">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
            <h2 className="text-lg font-black tracking-[-0.02em] text-[var(--color-text-primary)]">Game details</h2>
          </div>
          <div className="mt-3">
            <DetailRow label="Difficulty" value={DIFFICULTY_LABELS[game.difficulty]} />
            <DetailRow label="Avg. play time" value={game.playTime} />
            <DetailRow label="Best played on" value={game.devices.map((device) => DEVICE_LABELS[device]).join(", ")} />
            <DetailRow label="Controls" value={game.input.map((input) => INPUT_LABELS[input]).join(", ")} />
          </div>
          <div className="mt-5 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-primary)]" aria-hidden />
              <p className="text-sm leading-6 text-[var(--color-text-secondary)]">{game.privacyNote}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <InfoCard icon={Sparkles} title="About this game">
          <p>{game.longDescription}</p>
        </InfoCard>
        <InfoCard icon={Keyboard} title="How to play">
          <p>{game.controls}</p>
        </InfoCard>
        <InfoCard icon={MonitorSmartphone} title="Best experience">
          <p>
            Works best on {game.devices.map((device) => DEVICE_LABELS[device]).join(", ")} with {game.input.map((input) => INPUT_LABELS[input]).join(", ")} input.
          </p>
        </InfoCard>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_0.9fr]">
        <Card variant="default" padding="lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
            <h2 className="text-lg font-black tracking-[-0.02em] text-[var(--color-text-primary)]">Why you’ll like it</h2>
          </div>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {features.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden />
                {feature}
              </li>
            ))}
          </ul>
        </Card>

        <Card variant="default" padding="lg">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
            <h2 className="text-lg font-black tracking-[-0.02em] text-[var(--color-text-primary)]">Quick tips</h2>
          </div>
          <ol className="mt-4 space-y-3">
            {tips.map((tip, index) => (
              <li key={tip} className="flex gap-3 text-sm leading-6 text-[var(--color-text-secondary)]">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[var(--radius-full)] bg-[var(--color-primary)] text-xs font-black text-[var(--color-primary-text)]">
                  {index + 1}
                </span>
                {tip}
              </li>
            ))}
          </ol>
        </Card>
      </div>

      <section className="game-detail-brand-note mt-8 rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-5 shadow-[var(--shadow-card)] sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.1em] text-[var(--color-primary)]">Darma Games</p>
            <h2 className="mt-2 text-xl font-black tracking-[-0.03em] text-[var(--color-text-primary)]">Playful, private, and lightweight.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">This page uses the same Darma product system with a softer game identity layer, so the experience feels fun without becoming noisy or disconnected.</p>
          </div>
          <Link
            href="/games"
            className="inline-flex min-h-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-4 text-sm font-bold text-[var(--color-text-primary)] transition hover:border-[var(--color-border-strong)] focus:outline-none focus-visible:shadow-[var(--focus-ring)]"
          >
            Browse all games
          </Link>
        </div>
      </section>

      <div className="mt-10">
        <RelatedGames base={game} all={allGames} />
      </div>
    </div>
  );
}
