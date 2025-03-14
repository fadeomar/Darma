"use client";

import { useState, useEffect } from "react";
import elements1 from "../data/elements.json";
import Card from "../components/TestCard";
import { searchFunction } from "../utils/search";
import categories from "../data/category.json";
import { CodeElement } from "@/types";

import "./homepage_style.css";

const getGradientColor = (index: number) => {
  const gradients = [
    { from: "#6366F1", to: "#A855F7" }, // Indigo to Purple
    { from: "#3B82F6", to: "#60A5FA" }, // Blue to Light Blue
    { from: "#10B981", to: "#34D399" }, // Green to Light Green
    { from: "#F59E0B", to: "#FBBF24" }, // Amber to Yellow
    { from: "#EF4444", to: "#F87171" }, // Red to Light Red
    { from: "#8B5CF6", to: "#C4B5FD" }, // Violet to Light Violet
  ];
  return gradients[index % gradients.length];
};

interface Category {
  name: string;
  types: string[];
}

export default function HomePage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedMainCats, setSelectedMainCats] = useState<string[]>([]);
  const [selectedSecCats, setSelectedSecCats] = useState<string[]>([]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const mainCategories = categories.categories as Category[];

  const { exactMatches, relatedMatches } = searchFunction({
    elements: elements1.elements as CodeElement[],
    searchText: debouncedSearch,
    selectedMainCats,
    selectedSecCats,
  });

  const handleSelectMainCat = (value: string) => {
    setSelectedMainCats((prev) =>
      prev.includes(value) ? prev.filter((n) => n !== value) : [...prev, value]
    );
  };

  const handleSelectSecCat = (mainCat: string, type: string) => {
    setSelectedSecCats((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );

    if (!selectedMainCats.includes(mainCat)) {
      setSelectedMainCats((prev) => [...prev, mainCat]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Search Header */}
      <div className="max-w-4xl mx-auto mb-2">
        <div className="relative">
          <input
            type="text"
            placeholder="Search elements..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-6 py-4 rounded-xl shadow-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
          />
          <svg
            className="absolute right-4 top-4 h-6 w-6 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Selected Filters */}
        <div className="flex flex-wrap gap-2 mt-4">
          {[...selectedMainCats, ...selectedSecCats].map((filter) => (
            <button
              key={filter}
              onClick={() => {
                if (selectedMainCats.includes(filter)) {
                  handleSelectMainCat(filter);
                } else {
                  const mainCat = mainCategories.find((c) =>
                    c.types.includes(filter)
                  )?.name;
                  if (mainCat) handleSelectSecCat(mainCat, filter);
                }
              }}
              className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm flex items-center hover:bg-blue-200 transition-colors"
            >
              {filter}
              <span className="ml-2 text-lg">×</span>
            </button>
          ))}
        </div>
      </div>

      {/* Categories Section */}
      <div className="max-w-6xl mx-auto mb-8 px-4">
        <div className="flex flex-wrap gap-x-2 gap-y-1">
          {mainCategories.map((category, index) => (
            <div
              key={category.name}
              className="category-group rounded-md relative min-w-[140px] max-w-[300px] px-1 py-0.5  shadow-lg border-2 border-white hover:border-gray-200 transition-all duration-300 hover:shadow-xl"
              style={{
                background: `linear-gradient(135deg, ${
                  getGradientColor(index).from
                }, ${getGradientColor(index).to})`,
              }}
            >
              <button
                onClick={() => handleSelectMainCat(category.name)}
                className="w-full text-left p-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors duration-200"
              >
                <h5 className="text-[14px] font-semibold text-lg text-white flex items-center justify-between">
                  {category.name}
                  <span className="ml-2 text-sm transition-transform duration-300 group-hover:rotate-180">
                    ▼
                  </span>
                </h5>
              </button>

              {/* Subcategories Dropdown */}
              <div className="subcategories-container absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-2 space-y-1 mt-2">
                {category.types.map((type) => (
                  <button
                    key={type}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectSecCat(category.name, type);
                    }}
                    className={`w-full text-left p-2 rounded-md ${
                      selectedSecCats.includes(type)
                        ? "bg-blue-50 text-blue-700"
                        : "hover:bg-gray-50"
                    } transition-colors duration-200 text-sm flex items-center gap-2`}
                  >
                    <span
                      className={`w-4 h-4 border rounded-sm flex items-center justify-center ${
                        selectedSecCats.includes(type)
                          ? "bg-blue-500 border-blue-500 text-white"
                          : "border-gray-300"
                      }`}
                    >
                      {selectedSecCats.includes(type) && (
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </span>
                    {type}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Updated Results Grid */}
      <div className="max-w-4xl mx-auto">
        {exactMatches.length > 0 && (
          <>
            <h3 className="text-xl font-semibold mb-4">Exact Matches</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {exactMatches.slice(-20).map((element) => (
                <Card key={element.id} element={element} />
              ))}
            </div>
          </>
        )}

        {relatedMatches.length > 0 && (
          <>
            <h3 className="text-xl font-semibold mb-4">Related Matches</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {relatedMatches.slice(-20).map((element) => (
                <Card key={element.id} element={element} />
              ))}
            </div>
          </>
        )}

        {exactMatches.length === 0 && relatedMatches.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No elements found matching your criteria
          </div>
        )}
      </div>
    </div>
  );
}
