"use client";

import { useEffect, useMemo, useState, type ComponentType } from "react";
import { AlertTriangle, CheckCircle2, Clipboard, Database, MonitorSmartphone, RefreshCw, Share2, Volume2, Zap } from "lucide-react";
import { Button, Card } from "@/components/ui";
import {
  formatEdgeCaseTime,
  getBrowserCapabilitySnapshot,
  getEdgeCaseNotices,
  subscribeEdgeCaseNotices,
  type BrowserCapabilitySnapshot,
  type EdgeCaseNotice,
} from "./reactionEdgeCases";

const CAPABILITY_COPY: Record<keyof Omit<BrowserCapabilitySnapshot, "checkedAt">, { label: string; icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>; ok: string; fallback: string }> = {
  storage: {
    label: "Local storage",
    icon: Database,
    ok: "Progress can persist",
    fallback: "Memory-only fallback",
  },
  fullscreen: {
    label: "Fullscreen",
    icon: MonitorSmartphone,
    ok: "Fullscreen supported",
    fallback: "Use normal view",
  },
  clipboard: {
    label: "Clipboard",
    icon: Clipboard,
    ok: "Copy supported",
    fallback: "Manual copy fallback",
  },
  nativeShare: {
    label: "Native share",
    icon: Share2,
    ok: "Share sheet supported",
    fallback: "Copy/download fallback",
  },
  webAudio: {
    label: "Web Audio",
    icon: Volume2,
    ok: "Sound supported",
    fallback: "Silent mode safe",
  },
  haptics: {
    label: "Haptics",
    icon: Zap,
    ok: "Vibration supported",
    fallback: "Visual feedback only",
  },
};

export function ReactionEdgeCasePanel() {
  const [snapshot, setSnapshot] = useState<BrowserCapabilitySnapshot | null>(null);
  const [notices, setNotices] = useState<EdgeCaseNotice[]>([]);

  const refresh = () => {
    setSnapshot(getBrowserCapabilitySnapshot());
    setNotices(getEdgeCaseNotices());
  };

  useEffect(() => {
    setSnapshot(getBrowserCapabilitySnapshot());
    setNotices(getEdgeCaseNotices());
    return subscribeEdgeCaseNotices((notice) => {
      setNotices((current) => [notice, ...current].slice(0, 8));
      setSnapshot(getBrowserCapabilitySnapshot());
    });
  }, []);

  const capabilityEntries = useMemo(() => {
    if (!snapshot) return [];
    return (Object.keys(CAPABILITY_COPY) as (keyof Omit<BrowserCapabilitySnapshot, "checkedAt">)[]).map((key) => ({
      key,
      state: snapshot[key],
      ...CAPABILITY_COPY[key],
    }));
  }, [snapshot]);

  return (
    <section className="rtp-edgecases" aria-labelledby="rtp-edgecases-title">
      <Card variant="default" padding="lg" className="rtp-edgecases-card">
        <div className="rtp-panel-head rtp-edgecases-head">
          <AlertTriangle className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
          <div>
            <h3 id="rtp-edgecases-title" className="rtp-panel-title">Runtime safety checks</h3>
            <p className="rtp-edgecases-sub">
              Sprint 20 adds non-blocking fallbacks for blocked storage, share/download failures, fullscreen limits, and interrupted timing-sensitive runs.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={refresh} leftIcon={<RefreshCw className="h-4 w-4" aria-hidden />}>
            Re-check
          </Button>
        </div>

        <div className="rtp-edgecases-grid" aria-label="Browser feature support">
          {capabilityEntries.map((entry) => {
            const Icon = entry.icon;
            const available = entry.state === "available";
            return (
              <div key={entry.key} className="rtp-edgecase-capability" data-state={available ? "ok" : "fallback"}>
                <Icon className="h-4 w-4" aria-hidden />
                <span>{entry.label}</span>
                <strong>{available ? entry.ok : entry.fallback}</strong>
              </div>
            );
          })}
        </div>

        <div className="rtp-edgecases-log" aria-live="polite">
          <h4>
            <CheckCircle2 className="h-4 w-4" aria-hidden /> Recent runtime notes
          </h4>
          {notices.length > 0 ? (
            <ul>
              {notices.map((notice) => (
                <li key={notice.id} data-severity={notice.severity}>
                  <span>{formatEdgeCaseTime(notice.at)}</span>
                  <strong>{notice.title}</strong>
                  <p>{notice.detail}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rtp-edgecases-empty">No runtime warnings in this session. The game will still fall back safely if a browser feature becomes unavailable.</p>
          )}
        </div>
      </Card>
    </section>
  );
}
