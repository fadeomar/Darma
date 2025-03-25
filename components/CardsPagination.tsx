// components/CardsPagination.tsx (Client Component)
"use client";

import React from "react";
import { CodeElement } from "@/types";
import { getPaginationRange } from "@/utils/pagination";
import Card from "./TestCard";

interface PaginatedListProps {
  elements: CodeElement[];
  renderElement?: (element: CodeElement) => React.ReactNode;
  itemsByRow?: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const CardsPagination: React.FC<PaginatedListProps> = ({
  elements,
  renderElement,
  itemsByRow = 3,
  currentPage,
  totalPages,
  onPageChange,
}) => {
  // Get pagination range
  const paginationRange = getPaginationRange({ totalPages, currentPage });

  const handlePageClick = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  return (
    <div className="mb-11">
      {/* Render the current elements */}
      <div
        className={`grid grid-cols-1 md:grid-cols-2 ${
          itemsByRow === 2
            ? "lg:grid-cols-2 max-lg:grid-cols-3"
            : "lg:grid-cols-3"
        } gap-4 mb-10`}
      >
        {elements.map((element) =>
          renderElement ? (
            renderElement(element)
          ) : (
            <Card key={element.id} element={element} status={"preview"} />
          )
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-6 space-x-2">
          {/* Previous Button */}
          <button
            onClick={() => handlePageClick(currentPage - 1)}
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
                onClick={() => handlePageClick(page as number)}
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
            onClick={() => handlePageClick(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm bg-gray-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default CardsPagination;
