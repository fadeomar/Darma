"use client";

import { Star } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui";
import { useFavoriteTools } from "@/features/tools/hooks/useFavoriteTools";
import type { ToolId } from "@/features/tools/domain/tool";
import { cn } from "@/lib/cn";

export function FavoriteToolButton({
  toolId,
  toolTitle,
  size = "sm",
  variant = "secondary",
  className,
  showLabel = true,
}: {
  toolId: ToolId;
  toolTitle: string;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
  className?: string;
  showLabel?: boolean;
}) {
  const { isFavorite, toggleFavorite } = useFavoriteTools();
  const favorited = isFavorite(toolId);
  const label = favorited ? "Favorited" : "Add to favorites";

  return (
    <Button
      size={showLabel ? size : "icon"}
      variant={favorited ? "soft" : variant}
      className={cn("shrink-0", className)}
      aria-pressed={favorited}
      aria-label={`${label}: ${toolTitle}`}
      title={`${label}: ${toolTitle}`}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleFavorite(toolId);
      }}
      leftIcon={<Star className={cn("h-4 w-4", favorited && "fill-current")} aria-hidden />}
    >
      {showLabel ? label : label}
    </Button>
  );
}
