import { CodeElement } from "@/types";

// utils/search.ts (Enhanced)
export const searchFunction = ({
  elements,
  searchText,
  selectedMainCats,
  selectedSecCats,
}: {
  elements: CodeElement[];
  searchText: string;
  selectedMainCats: string[];
  selectedSecCats: string[];
}) => {
  const lowerSearch = searchText.toLowerCase();

  return elements.reduce(
    (acc, element) => {
      const textMatch = [
        element.title,
        element.description,
        ...element.tags,
        ...(element.secondaryCategory || []),
      ].some((v) => v.toLowerCase().includes(lowerSearch));

      const mainCatMatch =
        selectedMainCats.length === 0 ||
        element.mainCategory.some((c) => selectedMainCats.includes(c));

      const secCatMatch =
        selectedSecCats.length === 0 ||
        (element.secondaryCategory || []).some((c) =>
          selectedSecCats.includes(c)
        );

      if (textMatch && mainCatMatch && secCatMatch) {
        acc.exactMatches.push(element);
      } else if (textMatch || mainCatMatch || secCatMatch) {
        acc.relatedMatches.push(element);
      }

      return acc;
    },
    { exactMatches: [] as CodeElement[], relatedMatches: [] as CodeElement[] }
  );
};
