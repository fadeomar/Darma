import { Search } from "lucide-react";
import SelectPanelSection from "./SelectPanelSection";
import ToggleSwitch from "./ToggleSwitch";

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
  isDirty: boolean; // Controls search button state
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
    <div className="container mx-auto p-4 max-w-3xl">
      <div className="search-rainbow-border shadow-md flex items-center mb-6 rounded-md">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && !isLoading && onSearch()}
            placeholder="Search our collection..."
            className="w-full p-3 pl-10 bg-transparent border-none focus:outline-none focus:ring-0 rounded transition text-base lg:text-lg"
            aria-label="Search input"
            disabled={isLoading}
          />
        </div>
        <button
          onClick={onSearch}
          className="p-3 text-white font-bold tracking-wide bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition rounded-r-md text-base lg:text-lg"
          aria-label="Search button"
          disabled={isLoading || !isDirty} // Disabled unless dirty
        >
          Search
        </button>
      </div>

      <ToggleSwitch
        checked={exactMatch}
        onChange={(e) => setExactMatch(e.target.checked)}
        label="Exact Match"
        disabled={isLoading}
      />

      <SelectPanelSection
        mainCats={mainCats}
        secCats={secCats}
        onCategoryChange={onCategoryChange}
        isLoading={isLoading}
      />
    </div>
  );
};

export default SearchComponent;
