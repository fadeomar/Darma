"use client";

import type { ReactNode } from "react";
import { BookOpen, GraduationCap, Info, MousePointerClick, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui";
import { ACCURACY_NOTE } from "./reactionScoring";
import { buildLifetimeEducationInsights, formatInputMethod, MODE_EDUCATION_NOTES, type InputMethod } from "./reactionInsights";
import type { ReactionStorageV2 } from "./reactionTypes";

function LearnItem({ title, children, open = false }: { title: string; children: ReactNode; open?: boolean }) {
  return (
    <details className="rtp-learn-item" open={open}>
      <summary>{title}</summary>
      <div className="rtp-learn-copy">{children}</div>
    </details>
  );
}

export function ReactionEducationSection({ stats, lastInputMethod }: { stats: ReactionStorageV2; lastInputMethod: InputMethod }) {
  const lifetime = buildLifetimeEducationInsights(stats);
  const inputLabel = formatInputMethod(lastInputMethod) ?? "Input: not detected yet";

  return (
    <section className="rtp-education" aria-labelledby="rtp-education-title">
      <Card variant="default" padding="lg" className="rtp-education-card">
        <div className="rtp-panel-head">
          <BookOpen className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
          <div>
            <h3 id="rtp-education-title" className="rtp-panel-title">Learn about reaction time</h3>
            <p className="rtp-education-sub">Friendly explanations, device notes, and practical coaching for Reaction Timer Pro.</p>
          </div>
        </div>

        <div className="rtp-education-highlight" role="note">
          <ShieldCheck className="h-5 w-5" aria-hidden />
          <p>
            <strong>Accuracy note:</strong> {ACCURACY_NOTE} Use it to practice and compare your own progress over time, not as a medical or diagnostic test.
          </p>
        </div>

        <div className="rtp-education-insights" aria-label="Your recent learning notes">
          <div className="rtp-education-mini">
            <MousePointerClick className="h-4 w-4" aria-hidden />
            <span>{inputLabel}</span>
          </div>
          {lifetime.length ? lifetime.map((line) => (
            <div key={line} className="rtp-education-mini">
              <Info className="h-4 w-4" aria-hidden />
              <span>{line}</span>
            </div>
          )) : (
            <div className="rtp-education-mini">
              <Info className="h-4 w-4" aria-hidden />
              <span>Play a few runs to unlock personalized local insights.</span>
            </div>
          )}
        </div>

        <div className="rtp-learn-grid">
          <LearnItem title="What reaction time means" open>
            Reaction time is the delay between noticing a signal and responding. In this game, it is measured inside your browser using high-resolution timing.
          </LearnItem>
          <LearnItem title="Why results vary">
            Screen refresh rate, browser scheduling, system load, input device, and attention can all change a result. Compare several runs instead of one attempt.
          </LearnItem>
          <LearnItem title="Mouse vs touch vs keyboard">
            Different input methods can feel different. Mouse, touch, pen, and keyboard each have their own hardware and browser timing path.
          </LearnItem>
          <LearnItem title="Why early taps are not counted">
            Early taps usually mean prediction, not reaction. Separating them keeps the score fair and encourages waiting for the actual cue.
          </LearnItem>
          <LearnItem title="How to improve consistency">
            Relax your hand, use fullscreen to reduce distractions, keep your gaze steady, and review averages rather than chasing only one lucky fastest round.
          </LearnItem>
          <LearnItem title="Mode explanations">
            <ul>
              {MODE_EDUCATION_NOTES.map((note) => (
                <li key={note.title}><strong>{note.title}:</strong> {note.body}</li>
              ))}
            </ul>
          </LearnItem>
        </div>

        <div className="rtp-classroom-card">
          <GraduationCap className="h-5 w-5" aria-hidden />
          <div>
            <h4>Try it as a classroom activity</h4>
            <p>
              Students can run several attempts, compare averages, discuss device/input differences, and observe how practice changes consistency. Keep it fun and non-medical.
            </p>
          </div>
        </div>
      </Card>
    </section>
  );
}
