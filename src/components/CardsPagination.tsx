"use client";

import React from "react";
import { getPaginationRange } from "@/utils/pagination";
import { ChevronsLeftIcon, ChevronsRightIcon } from "lucide-react";

type PaginatedListProps<T> = {
  items: T[];
  renderItem: (item: T) => React.ReactNode;

  itemsByRow?: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

function CardsPagination<T>({
  items,
  renderItem,
  itemsByRow = 3,
  currentPage,
  totalPages,
  onPageChange,
}: PaginatedListProps<T>) {
  const paginationRange = getPaginationRange({ totalPages, currentPage });

  const handlePageClick = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  return (
    <div className="mb-11">
      <div
        className={`grid grid-cols-1 md:grid-cols-1 ${
          itemsByRow === 2 ? "lg:grid-cols-2" : "lg:grid-cols-3"
        } gap-4 mb-10`}
      >
        {items.map((item, idx) => (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          <React.Fragment key={(item as any)?.id ?? idx}>
            {renderItem(item)}
          </React.Fragment>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-6 space-x-2 max-w-fulls">
          <button
            onClick={() => handlePageClick(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50"
            title="Previous"
          >
            <ChevronsLeftIcon />
          </button>

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
                className={`px-3 py-1 rounded sm:rounded sm:px-3 sm:py-1 w-5 h-5 sm:w-auto sm:h-auto flex items-center justify-center text-xs sm:text-base ${
                  page === currentPage
                    ? "bg-blue-500 dark:bg-yellow-500 text-white dark:text-gray-800"
                    : "bg-gray-200 dark:bg-gray-700"
                }`}
              >
                {page}
              </button>
            ),
          )}

          <button
            onClick={() => handlePageClick(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50"
            title="Next"
          >
            <ChevronsRightIcon />
          </button>
        </div>
      )}
    </div>
  );
}

export default CardsPagination;
