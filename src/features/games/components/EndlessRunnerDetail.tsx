import Link from "next/link";
import {
  ArrowDown,
  ArrowLeft,
  ChevronRight,
  Clock3,
  Gamepad2,
  Heart,
  Keyboard,
  MonitorSmartphone,
  Pause,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Badge, Card } from "@/components/ui";
import type { GameDefinition } from "../domain/game";
import { DIFFICULTY_LABELS } from "../domain/game";
import { FavoriteGameButton } from "./FavoriteGameButton";
import { GamePlayerShell } from "./GamePlayerShell";
import { GamePlayLink } from "./GamePlayLink";
import { GameThumbnail } from "./GameThumbnail";
import { RelatedGames } from "./RelatedGames";

function MetaPill({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <span className="inline-flex min-h-9 items-center gap-2 rounded-[var(--radius-full)] border border-[var(--color-border-subtle)] bg-[color-mix(in_srgb,var(--color-surface-base)_88%,transparent)] px-3 text-xs font-bold text-[var(--color-text-secondary)] backdrop-blur-sm">
      <Icon className="h-4 w-4 text-[var(--color-primary-text-strong)]" aria-hidden />
      {children}
    </span>
  );
}

function ActionRow({
  icon: Icon,
  title,
  shortcut,
  children,
}: {
  icon: LucideIcon;
  title: string;
  shortcut: string;
  children: React.ReactNode;
}) {
  return (
    <li className="grid gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-primary-soft)] text-[var(--color-primary-text-strong)]">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-black text-[var(--color-text-primary)]">{title}</p>
        <p className="mt-0.5 text-xs leading-5 text-[var(--color-text-secondary)]">{children}</p>
      </div>
      <kbd className="w-fit rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] px-2 py-1 font-mono text-xs font-black uppercase tracking-[0.08em] text-[var(--color-text-secondary)] shadow-[var(--shadow-xs)]">
        {shortcut}
      </kbd>
    </li>
  );
}

function RuleItem({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] text-[var(--color-primary-text-strong)]">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div>
        <p className="text-sm font-black text-[var(--color-text-primary)]">{title}</p>
        <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">{children}</p>
      </div>
    </li>
  );
}

export function EndlessRunnerDetail({ game, allGames }: { game: GameDefinition; allGames: GameDefinition[] }) {
  return (
    <div className="game-page-shell runner-page mx-auto w-full max-w-[1520px] px-3 py-6 sm:px-5 sm:py-8 lg:px-7">
      <nav aria-label="Breadcrumb" className="mb-4">
        <ol className="flex flex-wrap items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
          <li>
            <Link
              href="/games"
              className="rounded-[var(--radius-sm)] transition hover:text-[var(--color-text-primary)] focus:outline-none focus-visible:shadow-[var(--focus-ring)]"
            >
              Games
            </Link>
          </li>
          <ChevronRight className="h-3 w-3" aria-hidden />
          <li aria-current="page" className="text-[var(--color-text-secondary)]">
            {game.title}
          </li>
        </ol>
      </nav>

      <header className="runner-detail-hero relative isolate overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] shadow-[var(--shadow-card)]">
        <div className="runner-detail-grid pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,440px)] lg:items-center lg:p-7">
          <div className="min-w-0">
            <Link
              href="/games"
              className="inline-flex min-h-9 items-center gap-2 rounded-[var(--radius-full)] border border-[var(--color-border-subtle)] bg-[color-mix(in_srgb,var(--color-surface-base)_86%,transparent)] px-3 text-xs font-bold text-[var(--color-text-secondary)] backdrop-blur-sm transition hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)] focus:outline-none focus-visible:shadow-[var(--focus-ring)]"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Back to games
            </Link>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {game.isNew ? <Badge variant="accent">New</Badge> : null}
              {game.popular ? <Badge variant="warning">Popular</Badge> : null}
              {game.featured ? <Badge variant="soft">Featured</Badge> : null}
              <Badge variant="outline">Arcade runner</Badge>
            </div>

            <h1 className="mt-3 max-w-3xl text-3xl font-black leading-[0.98] tracking-[-0.05em] text-[var(--color-text-primary)] sm:text-5xl">
              {game.title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)] sm:text-base sm:leading-7">
              Read the obstacle, choose jump or slide, and recover your rhythm as the run accelerates. Three lives keep mistakes fair while coins and local best scores reward cleaner sessions.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <MetaPill icon={Clock3}>{game.playTime} rounds</MetaPill>
              <MetaPill icon={Target}>{DIFFICULTY_LABELS[game.difficulty]}</MetaPill>
              <MetaPill icon={MonitorSmartphone}>Desktop, tablet, mobile</MetaPill>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <GamePlayLink game={game} href="#player" className="min-h-11 px-5 text-base hover:translate-y-0">
                Start a run
              </GamePlayLink>
              <FavoriteGameButton game={game} className="min-h-11 px-5 text-base" />
              <Link
                href="/games"
                className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-5 text-sm font-bold text-[var(--color-text-primary)] transition hover:border-[var(--color-border-strong)] focus:outline-none focus-visible:shadow-[var(--focus-ring)]"
              >
                Browse games
              </Link>
            </div>

            <div className="mt-5 grid max-w-2xl grid-cols-3 divide-x divide-[var(--color-border-subtle)] rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[color-mix(in_srgb,var(--color-surface-base)_76%,transparent)] px-2 py-3 backdrop-blur-sm">
              <div className="px-2 sm:px-4">
                <p className="font-mono text-xs font-black uppercase tracking-[0.1em] text-[var(--color-text-tertiary)]">Lives</p>
                <p className="mt-1 text-sm font-black text-[var(--color-text-primary)]">3 per run</p>
              </div>
              <div className="px-2 sm:px-4">
                <p className="font-mono text-xs font-black uppercase tracking-[0.1em] text-[var(--color-text-tertiary)]">Progress</p>
                <p className="mt-1 text-sm font-black text-[var(--color-text-primary)]">Local best</p>
              </div>
              <div className="px-2 sm:px-4">
                <p className="font-mono text-xs font-black uppercase tracking-[0.1em] text-[var(--color-text-tertiary)]">Privacy</p>
                <p className="mt-1 text-sm font-black text-[var(--color-text-primary)]">Browser only</p>
              </div>
            </div>
          </div>

          <div className="runner-detail-preview group relative overflow-hidden rounded-[var(--radius-lg)] border border-white/15 bg-[#160c08] shadow-[0_24px_60px_rgba(45,20,8,0.24)]">
            <GameThumbnail game={game} aspect="16/9" size="lg" priority />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />
            <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-3 rounded-[var(--radius-md)] border border-white/15 bg-black/35 p-3 text-white backdrop-blur-md sm:inset-x-4 sm:bottom-4">
              <div>
                <p className="font-mono text-xs font-black uppercase tracking-[0.12em] text-amber-100/70">Playable in browser</p>
                <p className="mt-1 inline-flex items-center gap-2 text-sm font-black">
                  <Gamepad2 className="h-4 w-4" aria-hidden />
                  Jump · slide · fast-fall
                </p>
              </div>
              <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 font-mono text-xs font-black uppercase tracking-[0.1em] text-white/80">
                {game.playTime}
              </span>
            </div>
          </div>
        </div>
      </header>

      <section id="player" className="mt-6 scroll-mt-24" aria-labelledby="runner-player-heading">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-xs font-black uppercase tracking-[0.12em] text-[var(--color-primary-text-strong)]">Playable area</p>
            <h2 id="runner-player-heading" className="mt-1 text-2xl font-black tracking-[-0.035em] text-[var(--color-text-primary)]">
              Run, react, recover
            </h2>
          </div>
          <p className="max-w-lg text-sm leading-6 text-[var(--color-text-secondary)]">
            The stage keeps its native 2:1 ratio, with stats, actions, and touch controls attached directly to the play area.
          </p>
        </div>
        <GamePlayerShell game={game} />
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]" aria-label="Endless Runner guide">
        <Card as="article" variant="default" padding="lg" className="runner-guide-card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs font-black uppercase tracking-[0.12em] text-[var(--color-primary-text-strong)]">Controls</p>
              <h2 className="mt-1 text-xl font-black tracking-[-0.03em] text-[var(--color-text-primary)]">Choose the right move</h2>
            </div>
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-soft)] text-[var(--color-primary-text-strong)]">
              <Keyboard className="h-5 w-5" aria-hidden />
            </span>
          </div>
          <ul className="mt-4 grid gap-2">
            <ActionRow icon={Zap} title="Jump" shortcut="Space / ↑ / W">
              Clear rocks, crates, spikes, and logs. Commit late enough to keep the landing readable.
            </ActionRow>
            <ActionRow icon={ArrowDown} title="Slide" shortcut="Hold ↓ / S">
              Stay low beneath birds and hanging branches. Release after the obstacle clears.
            </ActionRow>
            <ActionRow icon={ArrowDown} title="Fast-fall" shortcut="↓ / S in air">
              Shorten a jump and return to the ground sooner when the next obstacle demands it.
            </ActionRow>
            <ActionRow icon={Pause} title="Pause" shortcut="P / Esc">
              Pause safely before leaving the tab; the run also pauses automatically when focus is lost.
            </ActionRow>
          </ul>
        </Card>

        <Card as="article" variant="default" padding="lg" className="runner-guide-card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs font-black uppercase tracking-[0.12em] text-[var(--color-primary-text-strong)]">Run rules</p>
              <h2 className="mt-1 text-xl font-black tracking-[-0.03em] text-[var(--color-text-primary)]">Fair pressure, quick recovery</h2>
            </div>
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-soft)] text-[var(--color-primary-text-strong)]">
              <Trophy className="h-5 w-5" aria-hidden />
            </span>
          </div>
          <ul className="mt-5 space-y-5">
            <RuleItem icon={Heart} title="Three lives">
              A hit costs one life and grants a short shield, so a single mistake does not end the session.
            </RuleItem>
            <RuleItem icon={Sparkles} title="Coins and score">
              Collect coins while distance steadily raises the score. The best result stays on this device.
            </RuleItem>
            <RuleItem icon={Target} title="Readable progression">
              Speed rises gradually and obstacle spacing respects the time needed to jump, land, or slide.
            </RuleItem>
            <RuleItem icon={RotateCcw} title="Instant retry">
              Restart immediately without reloading the page or rebuilding the game canvas.
            </RuleItem>
          </ul>
        </Card>
      </section>

      <details className="runner-more-details mt-5 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-xs)]">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left focus:outline-none focus-visible:shadow-[var(--focus-ring)] sm:px-6">
          <span>
            <span className="font-mono text-xs font-black uppercase tracking-[0.12em] text-[var(--color-primary-text-strong)]">More about the build</span>
            <span className="mt-1 block text-base font-black text-[var(--color-text-primary)]">About, privacy, and technical notes</span>
          </span>
          <span className="runner-details-chevron inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] text-[var(--color-text-secondary)]">
            <ChevronRight className="h-4 w-4" aria-hidden />
          </span>
        </summary>
        <div className="grid gap-5 border-t border-[var(--color-border-subtle)] p-5 sm:p-6 lg:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <Gamepad2 className="h-4 w-4 text-[var(--color-primary-text-strong)]" aria-hidden />
              <h3 className="text-sm font-black text-[var(--color-text-primary)]">About the game</h3>
            </div>
            <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{game.longDescription}</p>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <MonitorSmartphone className="h-4 w-4 text-[var(--color-primary-text-strong)]" aria-hidden />
              <h3 className="text-sm font-black text-[var(--color-text-primary)]">Best experience</h3>
            </div>
            <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
              Use keyboard controls on desktop or the attached Jump and Slide buttons on touch devices. Focus mode enlarges the stage without changing its proportions.
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[var(--color-primary-text-strong)]" aria-hidden />
              <h3 className="text-sm font-black text-[var(--color-text-primary)]">Private by default</h3>
            </div>
            <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{game.privacyNote}</p>
          </div>
        </div>
      </details>

      <div className="mt-9">
        <RelatedGames base={game} all={allGames} />
      </div>
    </div>
  );
}
