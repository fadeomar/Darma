// utils/search.ts
import { CodeElement } from "@/types";

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
}): {
  exactMatches: CodeElement[];
  relatedMatches: CodeElement[];
} => {
  const cleanSearch = searchText.toLowerCase().trim();
  const hasSearch = cleanSearch.length > 0;

  // Scoring system with priority weights
  const scoredElements = elements.map((element) => {
    let score = 0;
    // const isExactMatch = false;

    // Category matching
    const mainCatMatches = element.mainCategory.filter((mc) =>
      selectedMainCats.includes(mc)
    ).length;
    const secCatMatches =
      element.secondaryCategory?.filter((sc) => selectedSecCats.includes(sc))
        ?.length || 0;

    // Must satisfy active category filters to be considered exact match
    const passesMainCats = selectedMainCats.length === 0 || mainCatMatches > 0;
    const passesSecCats = selectedSecCats.length === 0 || secCatMatches > 0;
    const passesCategories = passesMainCats && passesSecCats;

    // Text matching with different weights
    if (hasSearch) {
      const titleMatch = element.title.toLowerCase().includes(cleanSearch);
      const tagMatch = element.tags.some((t) =>
        t.toLowerCase().includes(cleanSearch)
      );
      const categoryMatch = [
        ...element.mainCategory,
        ...(element.secondaryCategory || []),
      ].some((c) => c.toLowerCase().includes(cleanSearch));

      score += titleMatch ? 4 : 0; // Highest weight for title
      score += tagMatch ? 3 : 0; // High weight for tags
      score += categoryMatch ? 2 : 0; // Moderate weight for categories
      score += element.description.toLowerCase().includes(cleanSearch) ? 1 : 0;
    }

    // Add category-based scoring
    score += mainCatMatches * 2;
    score += secCatMatches * 1;

    return { element, score, passesCategories };
  });

  // Separate and sort matches
  const exactMatches = scoredElements
    .filter(({ passesCategories, score }) => passesCategories && score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ element }) => element);

  const relatedMatches = scoredElements
    .filter(
      ({ element, passesCategories, score }) =>
        !exactMatches.includes(element) && score > 0 && !passesCategories
    )
    .sort((a, b) => b.score - a.score)
    .map(({ element }) => element);

  if (exactMatches.length === 0 && relatedMatches.length === 0) {
    const last20Item = elements.slice(-50).reverse();
    return { exactMatches: last20Item, relatedMatches: [] };
  }
  return { exactMatches, relatedMatches };
};
