"use client";

/**
 * Neon Core Defense — the progression screen.
 *
 * Pure presentation: it renders a `ProgressState` and calls back to the parent for
 * every mutation. All the logic it leans on (level maths, catalog, mission/daily
 * definitions, unlock checks) comes from the pure `neonCoreProgression` module, so
 * this file never computes or persists progression itself — it only displays it and
 * forwards intent. The parent owns the single write-through to storage.
 */

import { useState } from "react";
import { Check, Coins, Download, Lock, RotateCcw, Target, Trophy, Upload, X } from "lucide-react";
import { Button, CopyButton } from "@/components/ui";
import { cn } from "@/lib/cn";
import {
  ACHIEVEMENTS,
  CATALOG,
  dailyChallengesFor,
  isMissionComplete,
  levelForXp,
  MAX_LEVEL,
  MISSIONS,
  MODIFIER_SLOTS,
  THEME_PALETTES,
  type CatalogItem,
  type ModifierId,
  type ProgressState,
  type ThemeId,
} from "./neonCoreProgression";
import type { WeaponId } from "./neonCoreTypes";

type Handlers = {
  onClose: () => void;
  onPurchase: (itemId: string) => void;
  onEquipWeapon: (weapon: WeaponId) => void;
  onEquipTheme: (theme: ThemeId) => void;
  onToggleModifier: (id: ModifierId) => void;
  onClaimMission: (id: string) => void;
  onImport: (json: string) => boolean;
  onReset: () => void;
  exportText: string;
};

type Tab = "overview" | "achievements" | "missions" | "store" | "data";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "achievements", label: "Achievements" },
  { id: "missions", label: "Missions & daily" },
  { id: "store", label: "Store & loadout" },
  { id: "data", label: "Data" },
];

export function NeonCoreProgressionScreen({
  progress,
  handlers,
}: {
  progress: ProgressState;
  handlers: Handlers;
}) {
  const [tab, setTab] = useState<Tab>("overview");
  const level = levelForXp(progress.xp);

  return (
    <div className="dncd-prog" role="dialog" aria-modal="true" aria-label="Progression">
      <div className="dncd-prog-head">
        <div className="dncd-prog-identity">
          <span className="dncd-prog-level">Lv {level.level}</span>
          <div className="dncd-prog-xp">
            <div className="dncd-prog-xp-track">
              <div className="dncd-prog-xp-fill" style={{ width: `${level.ratio * 100}%` }} />
            </div>
            <span className="dncd-prog-xp-label">
              {level.atMax ? `Max level ${MAX_LEVEL}` : `${level.intoLevel} / ${level.span} XP to Lv ${level.level + 1}`}
            </span>
          </div>
        </div>
        <div className="dncd-prog-head-right">
          <span className="dncd-prog-cores">
            <Coins className="h-4 w-4" aria-hidden /> {progress.currency}
          </span>
          <Button variant="ghost" size="sm" onClick={handlers.onClose} leftIcon={<X className="h-4 w-4" aria-hidden />}>
            Close
          </Button>
        </div>
      </div>

      <div className="dncd-prog-tabs" role="tablist">
        {TABS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            role="tab"
            aria-selected={tab === entry.id}
            className={cn("dncd-prog-tab", tab === entry.id && "dncd-prog-tab--active")}
            onClick={() => setTab(entry.id)}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <div className="dncd-prog-body">
        {tab === "overview" ? <OverviewTab progress={progress} /> : null}
        {tab === "achievements" ? <AchievementsTab progress={progress} /> : null}
        {tab === "missions" ? <MissionsTab progress={progress} handlers={handlers} /> : null}
        {tab === "store" ? <StoreTab progress={progress} handlers={handlers} /> : null}
        {tab === "data" ? <DataTab handlers={handlers} /> : null}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="dncd-prog-stat">
      <span className="dncd-stat-label">{label}</span>
      <span className="dncd-prog-stat-value">{value}</span>
    </div>
  );
}

function OverviewTab({ progress }: { progress: ProgressState }) {
  const l = progress.lifetime;
  const accuracy = l.totalShotsFired > 0 ? Math.round((l.totalShotsHit / l.totalShotsFired) * 100) : 0;
  const survivalMins = Math.floor(l.totalSurvival / 60);
  const unlockedCount = ACHIEVEMENTS.filter((a) => progress.achievements.includes(a.id)).length;
  return (
    <div className="dncd-prog-section">
      <h3 className="dncd-prog-section-title">Lifetime statistics</h3>
      <div className="dncd-prog-stat-grid">
        <Stat label="Runs" value={l.runs} />
        <Stat label="Best score" value={l.bestScore} />
        <Stat label="Best wave" value={l.bestWave} />
        <Stat label="Best combo" value={`${l.bestCombo}×`} />
        <Stat label="Drones destroyed" value={l.totalEnemiesDestroyed} />
        <Stat label="Lifetime score" value={l.totalScore} />
        <Stat label="Accuracy" value={`${accuracy}%`} />
        <Stat label="Power-ups" value={l.totalPowerUps} />
        <Stat label="Flawless waves" value={l.flawlessWaves} />
        <Stat label="Accurate runs" value={l.accurateRuns} />
        <Stat label="Best survival" value={`${Math.floor(l.bestSurvival / 60)}:${`${l.bestSurvival % 60}`.padStart(2, "0")}`} />
        <Stat label="Time played" value={`${survivalMins} min`} />
        <Stat label="Achievements" value={`${unlockedCount}/${ACHIEVEMENTS.length}`} />
        <Stat label="Pulse shots" value={l.weaponShots.pulse} />
        <Stat label="Rapid shots" value={l.weaponShots.rapid} />
        <Stat label="Heavy shots" value={l.weaponShots.heavy} />
      </div>
    </div>
  );
}

function AchievementsTab({ progress }: { progress: ProgressState }) {
  const unlocked = new Set(progress.achievements);
  return (
    <div className="dncd-prog-section">
      <h3 className="dncd-prog-section-title">
        Achievements <span className="dncd-prog-count">{unlocked.size}/{ACHIEVEMENTS.length}</span>
      </h3>
      <ul className="dncd-prog-list">
        {ACHIEVEMENTS.map((a) => {
          const done = unlocked.has(a.id);
          return (
            <li key={a.id} className={cn("dncd-prog-row", done && "dncd-prog-row--done")}>
              <span className="dncd-prog-row-icon">
                {done ? <Trophy className="h-4 w-4" aria-hidden /> : <Lock className="h-4 w-4" aria-hidden />}
              </span>
              <span className="dncd-prog-row-copy">
                <strong>{a.label}</strong>
                <span>{a.description}</span>
              </span>
              <span className="dncd-prog-row-reward">
                <Coins className="h-3.5 w-3.5" aria-hidden /> {a.reward}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function MissionsTab({ progress, handlers }: { progress: ProgressState; handlers: Handlers }) {
  const daily = dailyChallengesFor(progress.daily.dateKey);
  return (
    <div className="dncd-prog-section">
      <h3 className="dncd-prog-section-title">Daily challenges</h3>
      <p className="dncd-prog-hint">Three new challenges every day. Progress resets at local midnight.</p>
      <ul className="dncd-prog-list">
        {daily.map((challenge, i) => {
          const entry = progress.daily.entries[i] ?? { progress: 0, completed: false };
          const ratio = Math.min(1, entry.progress / challenge.target);
          return (
            <li key={challenge.key} className={cn("dncd-prog-row", entry.completed && "dncd-prog-row--done")}>
              <span className="dncd-prog-row-icon">
                {entry.completed ? <Check className="h-4 w-4" aria-hidden /> : <Target className="h-4 w-4" aria-hidden />}
              </span>
              <span className="dncd-prog-row-copy">
                <strong>{challenge.label}</strong>
                <span className="dncd-prog-bar">
                  <span className="dncd-prog-bar-fill" style={{ width: `${ratio * 100}%` }} />
                </span>
                <span className="dncd-prog-bar-label">
                  {Math.min(entry.progress, challenge.target).toLocaleString()} / {challenge.target.toLocaleString()}
                </span>
              </span>
              <span className="dncd-prog-row-reward">
                <Coins className="h-3.5 w-3.5" aria-hidden /> {challenge.reward}
              </span>
            </li>
          );
        })}
      </ul>

      <h3 className="dncd-prog-section-title dncd-prog-section-title--spaced">Missions</h3>
      <ul className="dncd-prog-list">
        {MISSIONS.map((mission) => {
          const value = mission.progress(progress.lifetime);
          const complete = isMissionComplete(progress, mission.id);
          const claimed = progress.missions[mission.id]?.claimed;
          const ratio = Math.min(1, value / mission.target);
          return (
            <li key={mission.id} className={cn("dncd-prog-row", claimed && "dncd-prog-row--done")}>
              <span className="dncd-prog-row-copy dncd-prog-row-copy--wide">
                <strong>{mission.label}</strong>
                <span>{mission.description}</span>
                <span className="dncd-prog-bar">
                  <span className="dncd-prog-bar-fill" style={{ width: `${ratio * 100}%` }} />
                </span>
                <span className="dncd-prog-bar-label">
                  {Math.min(value, mission.target).toLocaleString()} / {mission.target.toLocaleString()}
                </span>
              </span>
              <span className="dncd-prog-row-action">
                <span className="dncd-prog-row-reward">
                  <Coins className="h-3.5 w-3.5" aria-hidden /> {mission.reward}
                </span>
                {claimed ? (
                  <span className="dncd-prog-claimed">Claimed</span>
                ) : (
                  <Button size="sm" variant={complete ? "primary" : "outline"} disabled={!complete} onClick={() => handlers.onClaimMission(mission.id)}>
                    {complete ? "Claim" : "Locked"}
                  </Button>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function StoreTab({ progress, handlers }: { progress: ProgressState; handlers: Handlers }) {
  const owned = new Set(progress.unlocks);
  const weapons = CATALOG.filter((c) => c.kind === "weapon");
  const modifiers = CATALOG.filter((c) => c.kind === "modifier");
  const themes = CATALOG.filter((c) => c.kind === "theme");
  const equippedMods = new Set(progress.loadout.modifiers);

  return (
    <div className="dncd-prog-section">
      <p className="dncd-prog-hint">
        <Coins className="h-3.5 w-3.5" aria-hidden /> {progress.currency} cores available. Earn more from runs,
        missions, achievements, and daily challenges.
      </p>

      <h3 className="dncd-prog-section-title">Weapons</h3>
      <div className="dncd-prog-cards">
        {weapons.map((item) => {
          const weapon = item.id.split(":")[1] as WeaponId;
          const isOwned = owned.has(item.id);
          const equipped = progress.loadout.weapon === weapon;
          return (
            <StoreCard
              key={item.id}
              item={item}
              owned={isOwned}
              currency={progress.currency}
              equipped={equipped}
              equipLabel="Equip"
              onBuy={() => handlers.onPurchase(item.id)}
              onEquip={() => handlers.onEquipWeapon(weapon)}
            />
          );
        })}
      </div>

      <h3 className="dncd-prog-section-title dncd-prog-section-title--spaced">
        Passive modifiers <span className="dncd-prog-count">{equippedMods.size}/{MODIFIER_SLOTS} equipped</span>
      </h3>
      <div className="dncd-prog-cards">
        {modifiers.map((item) => {
          const mod = item.id.split(":")[1] as ModifierId;
          const isOwned = owned.has(item.id);
          const equipped = equippedMods.has(mod);
          const slotsFull = equippedMods.size >= MODIFIER_SLOTS && !equipped;
          return (
            <StoreCard
              key={item.id}
              item={item}
              owned={isOwned}
              currency={progress.currency}
              equipped={equipped}
              equipLabel={equipped ? "Unequip" : slotsFull ? "Slots full" : "Equip"}
              equipDisabled={slotsFull}
              onBuy={() => handlers.onPurchase(item.id)}
              onEquip={() => handlers.onToggleModifier(mod)}
            />
          );
        })}
      </div>

      <h3 className="dncd-prog-section-title dncd-prog-section-title--spaced">Themes</h3>
      <div className="dncd-prog-cards">
        {themes.map((item) => {
          const theme = item.id.split(":")[1] as ThemeId;
          const isOwned = owned.has(item.id);
          const equipped = progress.loadout.theme === theme;
          const palette = THEME_PALETTES[theme];
          return (
            <StoreCard
              key={item.id}
              item={item}
              owned={isOwned}
              currency={progress.currency}
              equipped={equipped}
              equipLabel="Select"
              swatch={palette ? `hsl(${palette.coreHue}, 85%, 55%)` : undefined}
              onBuy={() => handlers.onPurchase(item.id)}
              onEquip={() => handlers.onEquipTheme(theme)}
            />
          );
        })}
      </div>
    </div>
  );
}

function StoreCard({
  item,
  owned,
  currency,
  equipped,
  equipLabel,
  equipDisabled,
  swatch,
  onBuy,
  onEquip,
}: {
  item: CatalogItem;
  owned: boolean;
  currency: number;
  equipped: boolean;
  equipLabel: string;
  equipDisabled?: boolean;
  swatch?: string;
  onBuy: () => void;
  onEquip: () => void;
}) {
  const affordable = currency >= item.cost;
  return (
    <div className={cn("dncd-store-card", equipped && "dncd-store-card--equipped")}>
      {swatch ? <span className="dncd-store-swatch" style={{ background: swatch }} aria-hidden /> : null}
      <strong className="dncd-store-title">{item.label}</strong>
      <span className="dncd-store-blurb">{item.description}</span>
      {owned ? (
        <Button
          size="sm"
          variant={equipped ? "primary" : "outline"}
          disabled={equipDisabled}
          onClick={onEquip}
          leftIcon={equipped ? <Check className="h-3.5 w-3.5" aria-hidden /> : undefined}
        >
          {equipped ? "Equipped" : equipLabel}
        </Button>
      ) : (
        <Button size="sm" variant="secondary" disabled={!affordable} onClick={onBuy} leftIcon={<Coins className="h-3.5 w-3.5" aria-hidden />}>
          {item.cost} {affordable ? "" : "· short"}
        </Button>
      )}
    </div>
  );
}

function DataTab({ handlers }: { handlers: Handlers }) {
  const [importText, setImportText] = useState("");
  const [importState, setImportState] = useState<"idle" | "ok" | "error">("idle");
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="dncd-prog-section">
      <h3 className="dncd-prog-section-title">Export progress</h3>
      <p className="dncd-prog-hint">Copy this to move your progress to another browser or keep a backup.</p>
      <textarea className="dncd-prog-textarea" readOnly value={handlers.exportText} rows={5} aria-label="Exported progress JSON" />
      <div className="dncd-prog-actions">
        <CopyButton text={handlers.exportText} size="sm" variant="secondary" copiedLabel="Copied progress">
          Copy JSON
        </CopyButton>
      </div>

      <h3 className="dncd-prog-section-title dncd-prog-section-title--spaced">Import progress</h3>
      <p className="dncd-prog-hint">Paste exported JSON to restore. This overwrites your current progress.</p>
      <textarea
        className="dncd-prog-textarea"
        value={importText}
        onChange={(event) => {
          setImportText(event.target.value);
          setImportState("idle");
        }}
        rows={5}
        placeholder="Paste progress JSON here"
        aria-label="Import progress JSON"
      />
      <div className="dncd-prog-actions">
        <Button
          size="sm"
          variant="secondary"
          leftIcon={<Upload className="h-4 w-4" aria-hidden />}
          disabled={importText.trim().length === 0}
          onClick={() => setImportState(handlers.onImport(importText) ? "ok" : "error")}
        >
          Import
        </Button>
        {importState === "ok" ? <span className="dncd-prog-ok">Progress imported.</span> : null}
        {importState === "error" ? <span className="dncd-prog-error">That JSON could not be read.</span> : null}
      </div>

      <h3 className="dncd-prog-section-title dncd-prog-section-title--spaced">Reset progress</h3>
      <p className="dncd-prog-hint">Permanently erases every level, unlock, achievement, and statistic on this device.</p>
      <div className="dncd-prog-actions">
        {confirmReset ? (
          <>
            <span className="dncd-prog-error">This cannot be undone.</span>
            <Button
              size="sm"
              variant="danger"
              leftIcon={<RotateCcw className="h-4 w-4" aria-hidden />}
              onClick={() => {
                handlers.onReset();
                setConfirmReset(false);
              }}
            >
              Erase everything
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirmReset(false)}>
              Cancel
            </Button>
          </>
        ) : (
          <Button size="sm" variant="outline" leftIcon={<Download className="h-4 w-4" aria-hidden />} onClick={() => setConfirmReset(true)}>
            Reset progress…
          </Button>
        )}
      </div>
    </div>
  );
}
