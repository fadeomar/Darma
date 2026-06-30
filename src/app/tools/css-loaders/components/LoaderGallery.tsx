import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import LoaderCard from "./LoaderCard";
import type { LoaderGalleryMode, LoaderIndexItem, LoaderPreviewItem } from "../types";

type LoaderGalleryProps = {
  loaders: LoaderIndexItem[];
  currentPageLoaders: LoaderIndexItem[];
  loaderPreviewById: Map<string, LoaderPreviewItem>;
  currentPage: number;
  totalPages: number;
  pageStart: number;
  pageEnd: number;
  galleryMode: LoaderGalleryMode;
  highlightedLoaderId?: string | null;
  favoriteIds: Set<string>;
  isLoadingVisiblePreviews?: boolean;
  onPageChange: (page: number) => void;
  onOpenLoader: (loader: LoaderIndexItem) => void;
  onToggleFavorite: (loaderId: string) => void;
  onCopyPreview: (loader: LoaderPreviewItem, format: "css" | "html") => Promise<void>;
  onCopySuccess: (message: string) => void;
};

export default function LoaderGallery({
  loaders,
  currentPageLoaders,
  loaderPreviewById,
  currentPage,
  totalPages,
  pageStart,
  pageEnd,
  galleryMode,
  highlightedLoaderId,
  favoriteIds,
  isLoadingVisiblePreviews = false,
  onPageChange,
  onOpenLoader,
  onToggleFavorite,
  onCopyPreview,
  onCopySuccess,
}: LoaderGalleryProps) {
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;
  const pageWindowStart = Math.max(1, currentPage - 2);
  const pageWindowEnd = Math.min(totalPages, currentPage + 2);
  const pageNumbers = Array.from({ length: pageWindowEnd - pageWindowStart + 1 }, (_, index) => pageWindowStart + index);

  return (
    <section aria-label="CSS loaders gallery" className={cn("css-loaders-gallery", `css-loaders-gallery-${galleryMode}`)}>
      <div className="css-loaders-performance-note" aria-live="polite">
        <span>
          {currentPageLoaders.length} cards rendered
          {loaders.length ? ` (${pageStart + 1}-${pageEnd})` : ""}
        </span>
        <span>{loaderPreviewById.size} previews cached</span>
        {isLoadingVisiblePreviews ? <strong>Loading visible previews...</strong> : <strong>Visible CSS only</strong>}
      </div>

      <div className={cn("css-loaders-grid", `css-loaders-grid-${galleryMode}`)}>
        {currentPageLoaders.map((loader) => (
          <LoaderCard
            key={loader.id}
            loader={loader}
            loaderPreview={loaderPreviewById.get(loader.id)}
            highlighted={loader.id === highlightedLoaderId}
            favorite={favoriteIds.has(loader.id)}
            onOpen={onOpenLoader}
            onToggleFavorite={onToggleFavorite}
            onCopyPreview={onCopyPreview}
            onCopySuccess={onCopySuccess}
          />
        ))}
      </div>

      <nav className="css-loaders-pagination" aria-label="Loader result pages">
        <Button variant="secondary" size="sm" onClick={() => onPageChange(currentPage - 1)} disabled={!canGoPrevious}>
          Previous
        </Button>

        <div className="css-loaders-pagination-pages" aria-label={`Page ${currentPage} of ${totalPages}`}>
          {pageWindowStart > 1 ? <span aria-hidden>...</span> : null}
          {pageNumbers.map((page) => (
            <button
              key={page}
              type="button"
              aria-current={page === currentPage ? "page" : undefined}
              className={cn("css-loaders-pagination-page", page === currentPage && "css-loaders-pagination-page-active")}
              onClick={() => onPageChange(page)}
            >
              {page}
            </button>
          ))}
          {pageWindowEnd < totalPages ? <span aria-hidden>...</span> : null}
        </div>

        <span className="css-loaders-pagination-status">
          Page {currentPage} of {totalPages}
        </span>

        <Button variant="secondary" size="sm" onClick={() => onPageChange(currentPage + 1)} disabled={!canGoNext}>
          Next
        </Button>
      </nav>
    </section>
  );
}
