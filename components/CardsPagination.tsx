"use client";
import React, { useState } from "react";
import { CodeElement } from "@/types";
import { getPaginationRange } from "@/utils/pagination";
import Card from "./TestCard";

interface PaginatedListProps {
  elements: CodeElement[];
  itemsPerPage: number;
  renderElement?: (element: CodeElement) => React.ReactNode;
  itemsByRow?: number;
}

const CardsPagination: React.FC<PaginatedListProps> = ({
  elements,
  itemsPerPage,
  renderElement,
  itemsByRow = 3,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(elements.length / itemsPerPage);

  // Slice elements for the current page
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentElements = elements.slice(startIndex, endIndex);

  // Get pagination range
  const paginationRange = getPaginationRange({ totalPages, currentPage });

  // Handle page change
  const handlePageChange = (page: number | string) => {
    if (typeof page === "number" && page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="mb-11">
      {/* Render the current elements */}
      <div
        className={`grid grid-cols-1 md:grid-cols-2  ${
          itemsByRow === 2
            ? "lg:grid-cols-2 max-lg:grid-cols-3"
            : "lg:grid-cols-3"
        } gap-4 mb-10`}
      >
        {currentElements.map((element) =>
          renderElement ? (
            renderElement(element)
          ) : (
            <Card key={element.id} element={element} status={"preview"} />
          )
        )}
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-center items-center mt-6 space-x-2">
        {/* Previous Button */}
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 text-sm bg-gray-200 rounded disabled:opacity-50"
        >
          Previous
        </button>

        {/* Page Numbers */}
        {paginationRange.map((page, index) =>
          page === "..." ? (
            <span
              key={index}
              className="px-2 text-gray-500"
              style={{
                flex: 1,
                alignSelf: "center",
                textAlign: "center",
                maxWidth: 30,
              }}
            >
              ...
            </span>
          ) : (
            <button
              key={index}
              onClick={() => handlePageChange(page as number)}
              className={`w-8 h-8 flex items-center justify-center rounded-full text-sm ${
                currentPage === page
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {page}
            </button>
          )
        )}

        {/* Next Button */}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 text-sm bg-gray-200 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default CardsPagination;
