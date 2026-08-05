"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { resolveResourceIcon, resourceMonogram } from "../lib/resourceIconPolicy";
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

/** Rendered pixel box per size, used so next/image reserves stable space. */
const SIZE_PIXELS = { sm: 36, md: 48, lg: 64 } as const;

export function ResourceLogo({ resource, size = "md" }: ResourceLogoProps) {
  const icon = resolveResourceIcon(resource.icon, resource.name);
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [resource.id]);

  const baseClass = `${SIZE_CLASSES[size]} shrink-0 border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] shadow-[var(--shadow-xs)]`;

  // The adjacent resource title always supplies the accessible name, so the tile
  // is decorative and must never announce itself twice.
  if (icon.kind !== "image" || failed) {
    return (
      <span
        className={`${baseClass} inline-flex items-center justify-center font-mono font-black tracking-tight text-[var(--color-primary-text-strong)]`}
        aria-hidden
      >
        {resourceMonogram(resource.name)}
      </span>
    );
  }

  return (
    <span className={`${baseClass} inline-flex items-center justify-center overflow-hidden p-1.5`} aria-hidden>
      <Image
        src={icon.src}
        alt=""
        width={SIZE_PIXELS[size]}
        height={SIZE_PIXELS[size]}
        loading="lazy"
        className="h-full w-full object-contain"
        onError={() => setFailed(true)}
      />
    </span>
  );
}
