"use client";

import { useEffect, useState } from "react";
import categories from "../../data/category.json";
import { ChevronDown, ChevronUp, CheckCircle, Filter } from "lucide-react";
import "./style.css";
import { getGradientColor } from "@/utils";
import { iconMap } from "@/components/iconMap";

interface SelectPanelSectionProps {
  mainCats: string[];
  secCats: string[];
  onCategoryChange: (mainCats: string[], secCats: string[]) => void;
  isLoading: boolean;
}

const SelectPanelSection: React.FC<SelectPanelSectionProps> = ({
  mainCats,
  secCats,
  onCategoryChange,
  isLoading,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isLoading === false && isOpen === true) {
      setIsOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  const handleMainCatChange = (catName: string) => {
    const newMainCats = mainCats.includes(catName)
      ? mainCats.filter((c) => c !== catName)
      : [...mainCats, catName];
    onCategoryChange(newMainCats, secCats);
  };

  const handleSecCatChange = (mainCat: string, type: string) => {
    const newSecCats = secCats.includes(type)
      ? secCats.filter((c) => c !== type)
      : [...secCats, type];
    const newMainCats = mainCats.includes(mainCat)
      ? mainCats
      : [...mainCats, mainCat];
    onCategoryChange(newMainCats, newSecCats);
  };

  const clearAll = () => {
    onCategoryChange([], []);
  };

  return (
    <div className="mx-auto mt-10 space-y-4">
      {/* Selected Categories Tags */}
      {[...mainCats, ...secCats].length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {[...mainCats, ...secCats].map((item, index) => (
            <span
              key={item}
              className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full flex items-center text-sm"
              style={{
                background: `linear-gradient(135deg, ${
                  getGradientColor(index).from
                }, ${getGradientColor(index).to})`,
              }}
            >
              {iconMap[item]?.label || item}
              <button
                onClick={() =>
                  mainCats.includes(item)
                    ? handleMainCatChange(item)
                    : handleSecCatChange(
                        categories.categories.find((c) =>
                          c.types.includes(item)
                        )?.name || "",
                        item
                      )
                }
                className="ml-1 text-red-500 hover:text-red-700 focus:outline-none"
              >
                ×
              </button>
            </span>
          ))}
          <button
            onClick={clearAll}
            className="ml-2 text-sm text-blue-500 hover:text-blue-700"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Accordion Toggle */}
      <button
        className="w-full p-2 flex items-center justify-between rounded-lg rainbow-border-large transition group hover:shadow-md text-black"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center">
          <Filter className="w-5 h-5 mr-2 text-textColor" />
          <span className="font-bold text-textColor">Explore Categories</span>
        </div>
        {isOpen ? (
          <ChevronUp className="font-bold text-textColor" />
        ) : (
          <ChevronDown className="font-bold text-textColor" />
        )}
      </button>

      {/* Accordion Body */}
      {isOpen && (
        <div className="grid gap-2 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 auto-rows-auto">
          {categories.categories.map((cat) => (
            <div
              key={cat.name}
              className="border border-gray-200 rounded-lg p-2 shadow-inner shadow-gray-400"
            >
              <button
                type="button"
                onClick={() => handleMainCatChange(cat.name)}
                className={`mb-2 w-full flex items-center justify-center group relative p-3 rounded-lg transition duration-300 font-bold shadow-md hover:shadow-lg hover:scale-105 focus:outline-none ${
                  mainCats.includes(cat.name)
                    ? "rainbow-border-active text-green-700"
                    : "rainbow-border bg-white hover:bg-gray-100 text-gray-800"
                }`}
              >
                <span
                  className={
                    mainCats.includes(cat.name) ? "selected-content" : ""
                  }
                >
                  {iconMap[cat.name]?.icon || cat.name}
                </span>
                {mainCats.includes(cat.name) && (
                  <CheckCircle
                    className="absolute -top-2 -left-2 w-5 h-5 text-green-500 bg-white rounded-full"
                    fill="black"
                  />
                )}
                <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-black rounded opacity-0 group-hover:opacity-100 transition z-50">
                  {iconMap[cat.name]?.label || cat.name}
                </span>
              </button>

              <div className="flex flex-wrap gap-2">
                {cat.types.map((type) => (
                  <button
                    key={type + cat.name}
                    onClick={() => handleSecCatChange(cat.name, type)}
                    className={`group relative p-1 rounded-lg transition duration-300 bg-white hover:bg-gray-100 ${
                      secCats.includes(type)
                        ? "rainbow-border-active text-black"
                        : "rainbow-border text-gray-800"
                    }`}
                  >
                    {iconMap[type]?.icon || type}
                    {secCats.includes(type) && (
                      <CheckCircle
                        fill="black"
                        className="absolute -top-1 -left-1 w-4 h-4 text-yellow-500 bg-white rounded-full"
                      />
                    )}
                    <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-black rounded opacity-0 group-hover:opacity-100 transition z-50">
                      {iconMap[type]?.label || type}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SelectPanelSection;
