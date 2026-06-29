"use client";

import { ArrowRight, Eye, MousePointerClick, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui";

export function ReactionOnboardingCard({
  onStartClassic,
  onSkip,
}: {
  onStartClassic: () => void;
  onSkip: () => void;
}) {
  return (
    <section className="rtp-onboarding" aria-labelledby="rtp-onboarding-title">
      <div className="rtp-onboarding-header">
        <span className="rtp-onboarding-icon" aria-hidden>
          <Sparkles className="h-5 w-5" />
        </span>
        <div>
          <span className="rtp-eyebrow">First time here?</span>
          <h2 id="rtp-onboarding-title" className="rtp-onboarding-title">
            Start with Classic Reaction
          </h2>
        </div>
      </div>

      <p className="rtp-onboarding-copy">
        Learn the core flow in under a minute, then explore Precision, Target Hunter,
        Daily Challenge, and Local Battle when you are ready.
      </p>

      <ol className="rtp-onboarding-steps" aria-label="How to play Classic Reaction">
        <li>
          <Eye className="h-4 w-4" aria-hidden />
          <span>Wait for the visual signal.</span>
        </li>
        <li>
          <MousePointerClick className="h-4 w-4" aria-hidden />
          <span>Tap, click, or press Space as soon as it appears.</span>
        </li>
        <li>
          <Zap className="h-4 w-4" aria-hidden />
          <span>Review your result, then try to improve your average.</span>
        </li>
      </ol>

      <div className="rtp-onboarding-actions">
        <Button size="lg" onClick={onStartClassic} leftIcon={<Zap className="h-5 w-5" aria-hidden />}>
          Try Classic first
        </Button>
        <Button size="lg" variant="ghost" onClick={onSkip} rightIcon={<ArrowRight className="h-4 w-4" aria-hidden />}>
          Skip tutorial
        </Button>
      </div>

      <p className="rtp-onboarding-note">
        Your progress stays local on this browser. No account, no global leaderboard.
      </p>
    </section>
  );
}

export function ReactionFirstRunGuide() {
  return (
    <section className="rtp-first-run-guide" aria-labelledby="rtp-first-run-title">
      <span className="rtp-first-run-badge">First official run saved</span>
      <h3 id="rtp-first-run-title">Nice — now you have a baseline.</h3>
      <p>
        Your next runs will compare against this result locally. Try one replay for
        consistency, then explore Precision Timer or today’s Daily Challenge.
      </p>
      <div className="rtp-first-run-next">
        <span>Suggested next:</span>
        <strong>Replay Classic → check average → try Precision.</strong>
      </div>
    </section>
  );
}
