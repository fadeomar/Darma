import { Bookmark } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatLoaderLabel } from "../loader-utils";
import type { LoaderCategory } from "../types";

type LoaderCategoryChipsProps = {
  categories: LoaderCategory[];
  activeCategory: LoaderCategory;
  savedOnly: boolean;
  savedCount: number;
  onChange: (category: LoaderCategory) => void;
  onToggleSaved: () => void;
};

export default function LoaderCategoryChips({ categories, activeCategory, savedOnly, savedCount, onChange, onToggleSaved }: LoaderCategoryChipsProps) {
  return (
    <div className="css-loaders-chip-row" aria-label="Loader categories">
      <button
        type="button"
        aria-pressed={savedOnly}
        onClick={onToggleSaved}
        className={cn("css-loaders-chip css-loaders-chip-saved", savedOnly && "css-loaders-chip-active")}
      >
        <Bookmark className="h-3.5 w-3.5" aria-hidden />
        Saved loaders <strong>{savedCount}</strong>
      </button>

      {categories.map((category) => {
        const isActive = activeCategory === category && !savedOnly;
        const label = category === "all" ? "All" : category === "popular" ? "Popular" : formatLoaderLabel(category);

        return (
          <button
            key={category}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(category)}
            className={cn("css-loaders-chip", isActive && "css-loaders-chip-active")}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
