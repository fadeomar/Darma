import { LayoutGrid, Maximize2, Pause, Play, Rows3, Search, Shuffle, SlidersHorizontal } from "lucide-react";
import { Button, Input, Select } from "@/components/ui";
import { cn } from "@/lib/cn";
import { getLoaderFormatLabel, LOADER_FORMATS } from "../loader-utils";
import type { LoaderFilterState } from "../filter-utils";
import type { LoaderGalleryMode } from "../types";

type LoaderToolbarProps = {
  filters: LoaderFilterState;
  totalCount: number;
  resultCount: number;
  pageStart: number;
  pageEnd: number;
  isPaused: boolean;
  galleryMode: LoaderGalleryMode;
  hasActiveFilters: boolean;
  onFiltersChange: (patch: Partial<LoaderFilterState>) => void;
  onModeChange: (mode: LoaderGalleryMode) => void;
  onReset: () => void;
  onRandom: () => void;
  onTogglePause: () => void;
};

const GALLERY_MODE_ITEMS: Array<{ value: LoaderGalleryMode; label: string; icon: typeof LayoutGrid }> = [
  { value: "grid", label: "Grid", icon: LayoutGrid },
  { value: "compact", label: "Compact", icon: Rows3 },
  { value: "focus", label: "Focus", icon: Maximize2 },
];

export default function LoaderToolbar({
  filters,
  totalCount,
  resultCount,
  pageStart,
  pageEnd,
  isPaused,
  galleryMode,
  hasActiveFilters,
  onFiltersChange,
  onModeChange,
  onReset,
  onRandom,
  onTogglePause,
}: LoaderToolbarProps) {
  return (
    <section className="css-loaders-toolbar" aria-label="Search and gallery controls">
      <div className="css-loaders-search-wrap">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-soft)]" aria-hidden />
        <Input
          value={filters.query}
          onChange={(event) => onFiltersChange({ query: event.target.value })}
          placeholder="Search loaders by name, tag, format, or flag..."
          aria-label="Search loaders"
          width="full"
          className="css-loaders-search-input pl-10"
        />
      </div>

      <div className="css-loaders-toolbar-actions">
        <div className="css-loaders-mode-toggle" aria-label="Gallery density">
          {GALLERY_MODE_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = galleryMode === item.value;

            return (
              <button
                key={item.value}
                type="button"
                aria-pressed={isActive}
                onClick={() => onModeChange(item.value)}
                className={cn("css-loaders-mode-button", isActive && "css-loaders-mode-button-active")}
              >
                <Icon className="h-4 w-4" aria-hidden />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <Select
          value={filters.format}
          onChange={(event) => onFiltersChange({ format: event.target.value as LoaderFilterState["format"] })}
          size="sm"
          width="auto"
          aria-label="Filter by format"
        >
          {LOADER_FORMATS.map((format) => (
            <option key={format} value={format}>
              {getLoaderFormatLabel(format)}
            </option>
          ))}
        </Select>

        <Select
          value={filters.sort}
          onChange={(event) => onFiltersChange({ sort: event.target.value as LoaderFilterState["sort"] })}
          size="sm"
          width="auto"
          aria-label="Sort loaders"
        >
          <option value="popular">Popular first</option>
          <option value="name">Name A-Z</option>
          <option value="category">Category</option>
        </Select>

        <Button variant="secondary" size="sm" onClick={onRandom} leftIcon={<Shuffle className="h-4 w-4" />}>
          Random
        </Button>

        <Button
          variant={isPaused ? "primary" : "soft"}
          size="sm"
          onClick={onTogglePause}
          leftIcon={isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        >
          {isPaused ? "Resume" : "Pause"}
        </Button>

        {hasActiveFilters ? (
          <Button variant="ghost" size="sm" onClick={onReset} leftIcon={<SlidersHorizontal className="h-4 w-4" />}>
            Reset
          </Button>
        ) : null}
      </div>

      <p className="css-loaders-toolbar-count" aria-live="polite">
        {resultCount ? (
          <>
            Showing <strong>{pageStart + 1}</strong>-<strong>{pageEnd}</strong> of <strong>{resultCount}</strong> matching loaders from {totalCount} total.
          </>
        ) : (
          <>
            Showing <strong>0</strong> of <strong>0</strong> matching loaders from {totalCount} total.
          </>
        )}
      </p>
    </section>
  );
}
