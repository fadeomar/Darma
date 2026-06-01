import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import LoaderCard from "./LoaderCard";
import type { LoaderGalleryMode, LoaderIndexItem, LoaderPreviewItem } from "../types";

type LoaderGalleryProps = {
  loaders: LoaderIndexItem[];
  loaderPreviewById: Map<string, LoaderPreviewItem>;
  visibleCount: number;
  galleryMode: LoaderGalleryMode;
  highlightedLoaderId?: string | null;
  favoriteIds: Set<string>;
  isLoadingVisiblePreviews?: boolean;
  onLoadMore: () => void;
  onOpenLoader: (loader: LoaderIndexItem) => void;
  onToggleFavorite: (loaderId: string) => void;
  onCopyPreview: (loader: LoaderPreviewItem, format: "css" | "html") => Promise<void>;
  onCopySuccess: (message: string) => void;
};

export default function LoaderGallery({
  loaders,
  loaderPreviewById,
  visibleCount,
  galleryMode,
  highlightedLoaderId,
  favoriteIds,
  isLoadingVisiblePreviews = false,
  onLoadMore,
  onOpenLoader,
  onToggleFavorite,
  onCopyPreview,
  onCopySuccess,
}: LoaderGalleryProps) {
  const visibleLoaders = loaders.slice(0, visibleCount);
  const hasMore = visibleLoaders.length < loaders.length;

  return (
    <section aria-label="CSS loaders gallery" className={cn("css-loaders-gallery", `css-loaders-gallery-${galleryMode}`)}>
      <div className="css-loaders-performance-note" aria-live="polite">
        <span>{visibleLoaders.length} cards rendered</span>
        <span>{loaderPreviewById.size} previews cached</span>
        {isLoadingVisiblePreviews ? <strong>Loading visible previews…</strong> : <strong>Visible CSS only</strong>}
      </div>

      <div className={cn("css-loaders-grid", `css-loaders-grid-${galleryMode}`)}>
        {visibleLoaders.map((loader) => (
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

      {hasMore ? (
        <div className="mt-6 flex justify-center">
          <Button variant="secondary" onClick={onLoadMore}>
            Load more loaders
          </Button>
        </div>
      ) : null}
    </section>
  );
}
