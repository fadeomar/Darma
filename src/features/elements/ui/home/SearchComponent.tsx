
import { Search } from "lucide-react";
import SelectPanelSection from "./SelectPanelSection";
import ToggleSwitch from "@/components/ToggleSwitch";

interface SearchComponentProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  exactMatch: boolean;
  setExactMatch: (exact: boolean) => void;
  mainCats: string[];
  secCats: string[];
  onCategoryChange: (mainCats: string[], secCats: string[]) => void;
  onSearch: () => void;
  isLoading: boolean;
  isDirty: boolean;
}

const SearchComponent: React.FC<SearchComponentProps> = ({
  searchQuery,
  setSearchQuery,
  exactMatch,
  setExactMatch,
  mainCats,
  secCats,
  onCategoryChange,
  onSearch,
  isLoading,
  isDirty,
}) => {
  return (
    <section className="rounded-[var(--radius-xl)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-4 shadow-[var(--shadow-card)] sm:p-5">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <label className="relative block">
          <span className="sr-only">Search collection</span>
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-tertiary)]" aria-hidden />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !isLoading && onSearch()}
            placeholder="Search the project collection..."
            className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-control-bg)] px-11 text-base text-[var(--color-text-primary)] shadow-[var(--shadow-xs)] outline-none transition placeholder:text-[var(--color-text-tertiary)] hover:border-[var(--color-border-strong)] focus:border-[var(--color-primary)]"
            aria-label="Search input"
            disabled={isLoading}
          />
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <ToggleSwitch
            checked={exactMatch}
            onChange={(e) => setExactMatch(e.target.checked)}
            label="Exact match"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={onSearch}
            className="inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] px-5 text-sm font-semibold text-[var(--color-primary-text)] shadow-[var(--shadow-xs)] transition hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Search button"
            disabled={isLoading || !isDirty}
          >
            {isLoading ? "Searching..." : "Search"}
          </button>
        </div>
      </div>

      <SelectPanelSection
        mainCats={mainCats}
        secCats={secCats}
        onCategoryChange={onCategoryChange}
        isLoading={isLoading}
      />
    </section>
  );
};

export default SearchComponent;
