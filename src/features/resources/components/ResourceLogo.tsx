"use client";

import { useEffect, useMemo, useState } from "react";
import type { Resource } from "../schema";

type ResourceLogoProps = {
  resource: Pick<Resource, "id" | "name" | "icon">;
  size?: "sm" | "md" | "lg";
};

const SIZE_CLASSES = {
  sm: "h-9 w-9 rounded-[var(--radius-sm)] text-xs",
  md: "h-12 w-12 rounded-[var(--radius-md)] text-sm",
  lg: "h-16 w-16 rounded-[var(--radius-lg)] text-base",
};

function initialsFor(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export function ResourceLogo({ resource, size = "md" }: ResourceLogoProps) {
  const candidates = useMemo(
    () => [resource.icon.localPath, resource.icon.logoUrl, resource.icon.faviconUrl].filter(Boolean) as string[],
    [resource.icon.faviconUrl, resource.icon.localPath, resource.icon.logoUrl],
  );
  const [candidateIndex, setCandidateIndex] = useState(0);
  useEffect(() => setCandidateIndex(0), [resource.id]);

  const source = candidates[candidateIndex];
  const baseClass = `${SIZE_CLASSES[size]} shrink-0 border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] shadow-[var(--shadow-xs)]`;

  if (!source) {
    return (
      <span className={`${baseClass} inline-flex items-center justify-center font-mono font-black tracking-tight text-[var(--color-primary)]`} aria-hidden>
        {initialsFor(resource.name)}
      </span>
    );
  }

  return (
    <span className={`${baseClass} inline-flex items-center justify-center overflow-hidden p-1.5`} aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={source}
        alt=""
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        className="h-full w-full object-contain"
        onError={() => setCandidateIndex((current) => current + 1)}
      />
    </span>
  );
}
