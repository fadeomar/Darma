
"use client";

import { useEffect, useState } from "react";
import { CheckCircle, ChevronDown, ChevronUp, Filter, X } from "lucide-react";
import categories from "@/data/category.json";
import { iconMap } from "@/components/iconMap";
import "./style.css";

interface SelectPanelSectionProps {
  mainCats: string[];
  secCats: string[];
  onCategoryChange: (mainCats: string[], secCats: string[]) => void;
  isLoading: boolean;
}

function getLabel(value: string) {
  return iconMap[value]?.label || value.replace(/-/g, " ");
}

const SelectPanelSection: React.FC<SelectPanelSectionProps> = ({
  mainCats,
  secCats,
  onCategoryChange,
  isLoading,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && isOpen) setIsOpen(false);
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
    const newMainCats = mainCats.includes(mainCat) ? mainCats : [...mainCats, mainCat];
    onCategoryChange(newMainCats, newSecCats);
  };

  const clearAll = () => onCategoryChange([], []);
  const selectedItems = [...mainCats, ...secCats];

  return (
    <div className="mt-4 space-y-4">
      {selectedItems.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {selectedItems.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-full)] border border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-semibold text-[var(--color-primary)]"
            >
              {getLabel(item)}
              <button
                type="button"
                onClick={() =>
                  mainCats.includes(item)
                    ? handleMainCatChange(item)
                    : handleSecCatChange(
                        categories.categories.find((c) => c.types.includes(item))?.name || "",
                        item,
                      )
                }
                className="rounded-[var(--radius-full)] p-0.5 text-[var(--color-primary)] transition hover:bg-[var(--color-primary-soft)]"
                aria-label={`Remove ${getLabel(item)}`}
              >
                <X className="h-3 w-3" aria-hidden />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={clearAll}
            className="text-xs font-semibold text-[var(--color-text-tertiary)] transition hover:text-[var(--color-text-primary)]"
          >
            Clear all
          </button>
        </div>
      ) : null}

      <button
        type="button"
        className="flex w-full items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-4 py-3 text-left shadow-[var(--shadow-xs)] transition hover:border-[var(--color-border-strong)] hover:bg-[var(--color-control-hover)]"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
          <Filter className="h-4 w-4 text-[var(--color-text-tertiary)]" aria-hidden />
          Explore categories
        </span>
        {isOpen ? <ChevronUp className="h-4 w-4" aria-hidden /> : <ChevronDown className="h-4 w-4" aria-hidden />}
      </button>

      {isOpen ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {categories.categories.map((cat) => {
            const mainActive = mainCats.includes(cat.name);
            return (
              <div key={cat.name} className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-3 shadow-[var(--shadow-xs)]">
                <button
                  type="button"
                  onClick={() => handleMainCatChange(cat.name)}
                  className={`flex w-full items-center justify-between rounded-[var(--radius-md)] px-3 py-2 text-sm font-bold transition ${
                    mainActive
                      ? "bg-[var(--color-primary)] text-[var(--color-primary-text)]"
                      : "bg-[var(--color-control-hover)] text-[var(--color-text-primary)] hover:bg-[var(--color-control-active)]"
                  }`}
                >
                  <span>{getLabel(cat.name)}</span>
                  {mainActive ? <CheckCircle className="h-4 w-4" aria-hidden /> : null}
                </button>

                <div className="mt-3 flex flex-wrap gap-2">
                  {cat.types.map((type) => {
                    const active = secCats.includes(type);
                    return (
                      <button
                        key={`${cat.name}-${type}`}
                        type="button"
                        onClick={() => handleSecCatChange(cat.name, type)}
                        className={`rounded-[var(--radius-full)] border px-3 py-1 text-xs font-semibold transition ${
                          active
                            ? "border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                            : "border-[var(--color-border-default)] bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)]"
                        }`}
                      >
                        {getLabel(type)}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

export default SelectPanelSection;
