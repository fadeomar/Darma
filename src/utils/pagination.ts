export const getPaginationRange = ({
  totalPages,
  currentPage,
  siblingCount = 2,
}: {
  totalPages: number;
  currentPage: number;
  siblingCount?: number;
}) => {
  const totalNumbers = siblingCount * 2 + 5;
  if (totalPages <= totalNumbers) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const leftSiblingIndex = Math.max(currentPage - siblingCount, 2);
  const rightSiblingIndex = Math.min(
    currentPage + siblingCount,
    totalPages - 1
  );

  const range: (number | "...")[] = [1];

  if (leftSiblingIndex > 2) {
    range.push("...");
  }

  for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
    range.push(i);
  }

  if (rightSiblingIndex < totalPages - 1) {
    range.push("...");
  }

  range.push(totalPages);
  return range;
};
