
"use client";

import React from "react";
import { ChevronsLeftIcon, ChevronsRightIcon } from "lucide-react";
import { getPaginationRange } from "@/utils/pagination";

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
    <div className="mb-10">
      <div
        className={`grid grid-cols-1 gap-5 ${
          itemsByRow === 2 ? "lg:grid-cols-2" : "md:grid-cols-2 xl:grid-cols-3"
        }`}
      >
        {items.map((item, idx) => (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          <React.Fragment key={(item as any)?.id ?? idx}>{renderItem(item)}</React.Fragment>
        ))}
      </div>

      {totalPages > 1 ? (
        <nav aria-label="Pagination" className="mt-8 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => handlePageClick(currentPage - 1)}
            disabled={currentPage === 1}
            className="inline-flex h-9 min-w-9 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] px-3 text-sm font-semibold text-[var(--color-text-secondary)] transition hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)] disabled:cursor-not-allowed disabled:opacity-45"
            title="Previous"
          >
            <ChevronsLeftIcon className="h-4 w-4" aria-hidden />
          </button>

          {paginationRange.map((page, index) =>
            page === "..." ? (
              <span key={`ellipsis-${index}`} className="px-2 text-sm text-[var(--color-text-tertiary)]">
                ...
              </span>
            ) : (
              <button
                key={page}
                type="button"
                onClick={() => handlePageClick(page as number)}
                className={`inline-flex h-9 min-w-9 items-center justify-center rounded-[var(--radius-sm)] px-3 text-sm font-semibold transition ${
                  page === currentPage
                    ? "bg-[var(--color-primary)] text-[var(--color-primary-text)]"
                    : "border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)]"
                }`}
                aria-current={page === currentPage ? "page" : undefined}
              >
                {page}
              </button>
            ),
          )}

          <button
            type="button"
            onClick={() => handlePageClick(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="inline-flex h-9 min-w-9 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] px-3 text-sm font-semibold text-[var(--color-text-secondary)] transition hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)] disabled:cursor-not-allowed disabled:opacity-45"
            title="Next"
          >
            <ChevronsRightIcon className="h-4 w-4" aria-hidden />
          </button>
        </nav>
      ) : null}
    </div>
  );
}

export default CardsPagination;
