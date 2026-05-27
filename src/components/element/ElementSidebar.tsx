
"use client";

import React from "react";
import DateBox from "@/components/DateBox";
import { FiCodepen, FiGithub, FiLink, FiTwitter } from "react-icons/fi";
import type { ElementDTO } from "@/features/elements/dto/element.dto";

type Props = {
  element: ElementDTO;
};

const MetadataCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-4 shadow-[var(--shadow-card)]">
    <h3 className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">
      {title}
    </h3>
    <div className="mt-3 space-y-2 text-sm text-[var(--color-text-secondary)]">{children}</div>
  </section>
);

function copyToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    return;
  }
  fallbackCopy(text);

  function fallbackCopy(value: string) {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }
}

export default function ElementSidebar({ element }: Props) {
  const summary = element.shortDescription || element.description || "No summary available yet.";
  const tags = Array.isArray(element.tags) ? element.tags : [];

  const shareButtons = [
    { icon: FiGithub, label: "GitHub (coming soon)" },
    { icon: FiTwitter, label: "Twitter (coming soon)" },
    { icon: FiCodepen, label: "CodePen (coming soon)" },
  ];

  return (
    <aside className="space-y-4 pb-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
      <MetadataCard title="Quick summary">
        <p className="leading-7">{summary}</p>
      </MetadataCard>

      <div className="grid grid-cols-1 gap-3">
        <DateBox date={new Date(element.createdAt)} label="Created" />
        <DateBox date={new Date(element.updatedAt)} label="Updated" />
      </div>

      <MetadataCard title="Share">
        <div className="flex flex-wrap gap-2">
          {shareButtons.map(({ icon: Icon, label }) => (
            <button
              key={label}
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] transition hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)]"
              aria-label={label}
              title="Coming soon"
            >
              <Icon className="h-4 w-4" aria-hidden />
            </button>
          ))}
          <button
            type="button"
            className="inline-flex h-9 items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] px-3 text-sm font-semibold text-[var(--color-primary)] transition hover:border-[var(--color-primary)]"
            onClick={() => copyToClipboard(window.location.href)}
          >
            <FiLink className="h-4 w-4" aria-hidden />
            Copy link
          </button>
        </div>
      </MetadataCard>

      {tags.length > 0 ? (
        <MetadataCard title="Tags">
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag} className="rounded-[var(--radius-full)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-3 py-1 text-xs font-semibold text-[var(--color-text-secondary)]">
                #{tag}
              </span>
            ))}
          </div>
        </MetadataCard>
      ) : null}

      <MetadataCard title="Categories">
        <div className="flex flex-wrap gap-2">
          {[...(element.mainCategory ?? []), ...(element.secondaryCategory ?? [])].map((category) => (
            <span key={category} className="rounded-[var(--radius-full)] border border-[var(--color-accent-border)] bg-[var(--color-accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--color-accent)]">
              {category}
            </span>
          ))}
        </div>
      </MetadataCard>
    </aside>
  );
}
