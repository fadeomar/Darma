"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/cn";
import LoaderCategoryChips from "./components/LoaderCategoryChips";
import LoaderDetailModal from "./components/LoaderDetailModal";
import LoaderEmptyState from "./components/LoaderEmptyState";
import LoaderGallery from "./components/LoaderGallery";
import LoaderToolbar from "./components/LoaderToolbar";
import { copyTextToClipboard } from "./copy-utils";
import { filterLoaders, hasActiveLoaderFilters, type LoaderFilterState } from "./filter-utils";
import { loadLoaderDetail, loadLoaderPreviewCategories } from "./loader-data";
import { DEFAULT_LOADER_FILTERS, formatLoaderLabel, LOADER_CATEGORIES } from "./loader-utils";
import loaderIndexJson from "./data/generated/loader-index.json";
import sourceStatsJson from "./data/generated/source-stats.json";
import type { LoaderCategory, LoaderDefinition, LoaderGalleryMode, LoaderIndexItem, LoaderPreviewItem } from "./types";

const LOADERS_PAGE_SIZE = 48;
const FAVORITES_STORAGE_KEY = "darma-css-loader-favorites";

const loaderIndex = loaderIndexJson as LoaderIndexItem[];
const loaderIds = new Set(loaderIndex.map((loader) => loader.id));

const availableCategories = LOADER_CATEGORIES.filter((category) => {
  if (category === "all" || category === "popular") return true;
  return loaderIndex.some((loader) => loader.category === category);
});

const categoryStats = loaderIndex.reduce<Partial<Record<LoaderCategory, number>>>((stats, loader) => {
  stats[loader.category] = (stats[loader.category] ?? 0) + 1;
  return stats;
}, {});

const sourceStats = sourceStatsJson as { total: number; groups: Record<string, number> };
const sourceGroupCount = Object.keys(sourceStats.groups).length;

function readFavoriteIds() {
  if (typeof window === "undefined") return new Set<string>();

  try {
    const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    if (!Array.isArray(parsed)) return new Set<string>();
    return new Set(parsed.filter((value): value is string => typeof value === "string" && loaderIds.has(value)));
  } catch {
    return new Set<string>();
  }
}

function getCategoriesRequiredForVisibleLoaders(loaders: LoaderIndexItem[], activeCategory: LoaderCategory) {
  if (activeCategory === "popular") return ["popular"];

  if (activeCategory === "all") {
    // In the "all" view, use the popular chunk for popular loaders so all popular cards
    // get their previews from one request instead of waiting for many per-category chunks.
    // Non-popular visible loaders still load via their individual category chunks.
    const nonPopularCategories = [...new Set(loaders.filter((l) => !l.flags.popular).map((l) => l.category))];
    const hasPopularLoaders = loaders.some((l) => l.flags.popular);
    return hasPopularLoaders ? ["popular", ...nonPopularCategories] : nonPopularCategories;
  }

  return [...new Set(loaders.map((loader) => loader.category))];
}

function CopyToast({ message }: { message: string }) {
  return (
    <AnimatePresence>
      {message ? (
        <motion.div
          key={message}
          className="css-loaders-copy-toast"
          role="status"
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.2 }}
        >
          <CheckCircle2 className="h-4 w-4" aria-hidden />
          <span>{message}</span>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default function CssLoadersClient() {
  const [filters, setFilters] = useState<LoaderFilterState>(DEFAULT_LOADER_FILTERS);
  const deferredFilters = useDeferredValue(filters);
  const [currentPage, setCurrentPage] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [galleryMode, setGalleryMode] = useState<LoaderGalleryMode>("grid");
  const [highlightedLoaderId, setHighlightedLoaderId] = useState<string | null>(null);
  const [selectedLoaderId, setSelectedLoaderId] = useState<string | null>(null);
  const [selectedLoaderSummary, setSelectedLoaderSummary] = useState<LoaderIndexItem | null>(null);
  const [selectedLoader, setSelectedLoader] = useState<LoaderDefinition | null>(null);
  const [detailError, setDetailError] = useState("");
  const [loaderPreviewById, setLoaderPreviewById] = useState<Map<string, LoaderPreviewItem>>(() => new Map());
  const [loadingPreviewCategories, setLoadingPreviewCategories] = useState<Set<string>>(() => new Set());
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => new Set());
  const [favoritesHydrated, setFavoritesHydrated] = useState(false);
  const [copyToastMessage, setCopyToastMessage] = useState("");
  const loadedPreviewCategoriesRef = useRef(new Set<string>());
  const detailRequestRef = useRef(0);
  const copyToastTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setFavoriteIds(readFavoriteIds());
    setFavoritesHydrated(true);
  }, []);

  useEffect(() => {
    if (!favoritesHydrated || typeof window === "undefined") return;
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([...favoriteIds]));
  }, [favoriteIds, favoritesHydrated]);

  useEffect(() => {
    return () => {
      if (copyToastTimerRef.current) window.clearTimeout(copyToastTimerRef.current);
    };
  }, []);

  const baseFilteredLoaders = useMemo(() => filterLoaders(loaderIndex, deferredFilters), [deferredFilters]);
  const filteredLoaders = useMemo(() => {
    if (!deferredFilters.savedOnly) return baseFilteredLoaders;
    return baseFilteredLoaders.filter((loader) => favoriteIds.has(loader.id));
  }, [baseFilteredLoaders, favoriteIds, deferredFilters.savedOnly]);

  const totalPages = Math.max(1, Math.ceil(filteredLoaders.length / LOADERS_PAGE_SIZE));
  const pageStart = filteredLoaders.length ? (currentPage - 1) * LOADERS_PAGE_SIZE : 0;
  const pageEnd = Math.min(pageStart + LOADERS_PAGE_SIZE, filteredLoaders.length);
  const currentPageLoaders = useMemo(() => filteredLoaders.slice(pageStart, pageEnd), [filteredLoaders, pageStart, pageEnd]);
  const visibleCategories = useMemo(
    () => getCategoriesRequiredForVisibleLoaders(currentPageLoaders, deferredFilters.category),
    [currentPageLoaders, deferredFilters.category],
  );

  useEffect(() => {
    setCurrentPage((page) => Math.min(Math.max(page, 1), totalPages));
  }, [totalPages]);

  useEffect(() => {
    const missingCategories = visibleCategories.filter((category) => !loadedPreviewCategoriesRef.current.has(category));
    if (!missingCategories.length) return;

    let cancelled = false;
    let completed = false;
    missingCategories.forEach((category) => loadedPreviewCategoriesRef.current.add(category));
    setLoadingPreviewCategories((current) => new Set([...current, ...missingCategories]));

    loadLoaderPreviewCategories(missingCategories)
      .then((previews) => {
        if (cancelled) return;
        completed = true;
        setLoaderPreviewById((current) => {
          const next = new Map(current);
          previews.forEach((preview) => next.set(preview.id, preview));
          return next;
        });
      })
      .catch((error) => {
        if (cancelled) return;
        missingCategories.forEach((category) => loadedPreviewCategoriesRef.current.delete(category));
        showCopyToast(error instanceof Error ? error.message : "Could not load loader previews");
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingPreviewCategories((current) => {
          const next = new Set(current);
          missingCategories.forEach((category) => next.delete(category));
          return next;
        });
      });

    return () => {
      cancelled = true;
      // Remove from the ref if the load didn't complete so it can be retried on remount
      // (handles React Strict Mode double-invocation in development)
      if (!completed) {
        missingCategories.forEach((category) => loadedPreviewCategoriesRef.current.delete(category));
      }
    };
  }, [visibleCategories]);

  const activeFilters = hasActiveLoaderFilters(filters);
  const isFilteringDeferred = filters !== deferredFilters;
  const isLoadingVisiblePreviews = currentPageLoaders.some((loader) => !loaderPreviewById.has(loader.id)) || loadingPreviewCategories.size > 0;

  function showCopyToast(message: string) {
    setCopyToastMessage(message);
    if (copyToastTimerRef.current) window.clearTimeout(copyToastTimerRef.current);
    copyToastTimerRef.current = window.setTimeout(() => setCopyToastMessage(""), 2200);
  }

  function patchFilters(patch: Partial<LoaderFilterState>) {
    setFilters((current) => ({ ...current, ...patch }));
    setCurrentPage(1);
    setHighlightedLoaderId(null);
  }

  function resetFilters() {
    setFilters(DEFAULT_LOADER_FILTERS);
    setCurrentPage(1);
    setHighlightedLoaderId(null);
  }

  function openLoader(loader: LoaderIndexItem) {
    const requestId = detailRequestRef.current + 1;
    detailRequestRef.current = requestId;
    setSelectedLoaderId(loader.id);
    setSelectedLoaderSummary(loader);
    setSelectedLoader(null);
    setDetailError("");
    setHighlightedLoaderId(loader.id);

    loadLoaderDetail(loader.id)
      .then((definition) => {
        if (detailRequestRef.current !== requestId) return;
        setSelectedLoader(definition);
      })
      .catch((error) => {
        if (detailRequestRef.current !== requestId) return;
        setDetailError(error instanceof Error ? error.message : "Could not load this loader detail file.");
      });
  }

  function closeLoader() {
    detailRequestRef.current += 1;
    setSelectedLoaderId(null);
    setSelectedLoaderSummary(null);
    setSelectedLoader(null);
    setDetailError("");
  }

  function toggleFavorite(loaderId: string) {
    const wasSaved = favoriteIds.has(loaderId);
    setFavoriteIds((current) => {
      const next = new Set(current);
      if (wasSaved) next.delete(loaderId);
      else next.add(loaderId);
      return next;
    });
    showCopyToast(wasSaved ? "Removed from saved loaders" : "Saved loader locally");
  }

  async function copyPreviewSnippet(loader: LoaderPreviewItem, format: "css" | "html") {
    const text = format === "css" ? loader.previewCss.trim() : loader.previewHtml.trim();

    try {
      await copyTextToClipboard(text);
      showCopyToast(`${format.toUpperCase()} copied from ${loader.name}`);
    } catch (error) {
      showCopyToast("Could not copy automatically. Please copy from the code panel.");
      throw error;
    }
  }

  function highlightRandomLoader() {
    if (!filteredLoaders.length) return;

    const randomIndex = Math.floor(Math.random() * filteredLoaders.length);
    const loader = filteredLoaders[randomIndex];
    setCurrentPage(Math.floor(randomIndex / LOADERS_PAGE_SIZE) + 1);
    openLoader(loader);

    showCopyToast(`Random pick: ${loader.name}`);

    window.requestAnimationFrame(() => {
      document.getElementById(`css-loader-card-${loader.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  return (
    <div className={cn("css-loaders-shell space-y-6", isPaused && "css-loaders-paused")}> 
      <section className="css-loaders-gallery-hero">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="soft">Publish-ready</Badge>
            <Badge variant="outline">{loaderIndex.length} loaders</Badge>
            <Badge variant="outline">{sourceGroupCount} source groups</Badge>
            <Badge variant="outline">{favoriteIds.size} saved</Badge>
          </div>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-[var(--color-text)] sm:text-3xl">
            Browse, customize, and copy CSS loaders without rendering a huge animation wall.
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--color-text-muted)]">
            Browse production-ready CSS loaders with fast metadata loading, category preview chunks, copy shortcuts, favorites, and a customization modal that opens full code only when you choose a loader.
          </p>
        </div>

        <div className="css-loaders-hero-stats" aria-label="Gallery stats">
          <div>
            <strong>{loaderIndex.length}</strong>
            <span>Indexed</span>
          </div>
          <div>
            <strong>{currentPageLoaders.length}</strong>
            <span>On page</span>
          </div>
          <div>
            <strong>{loaderPreviewById.size}</strong>
            <span>Previews</span>
          </div>
          <div>
            <strong>{sourceGroupCount}</strong>
            <span>Sources</span>
          </div>
        </div>
      </section>

      <LoaderToolbar
        filters={filters}
        totalCount={loaderIndex.length}
        resultCount={filteredLoaders.length}
        pageStart={pageStart}
        pageEnd={pageEnd}
        isPaused={isPaused}
        galleryMode={galleryMode}
        hasActiveFilters={activeFilters}
        onFiltersChange={patchFilters}
        onModeChange={setGalleryMode}
        onReset={resetFilters}
        onRandom={highlightRandomLoader}
        onTogglePause={() => setIsPaused((current) => !current)}
      />

      <LoaderCategoryChips
        categories={availableCategories as LoaderCategory[]}
        activeCategory={filters.category}
        savedOnly={filters.savedOnly}
        savedCount={favoriteIds.size}
        onChange={(category) => patchFilters({ category, savedOnly: false })}
        onToggleSaved={() => patchFilters({ savedOnly: !filters.savedOnly })}
      />

      <div className="css-loaders-category-summary" aria-label="Available category counts">
        {Object.entries(categoryStats)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([category, count]) => {
            const loaderCategory = category as LoaderCategory;
            const isActive = filters.category === loaderCategory && !filters.savedOnly;

            return (
              <button
                key={category}
                type="button"
                aria-pressed={isActive}
                onClick={() => patchFilters({ category: loaderCategory, savedOnly: false })}
                className={cn("css-loaders-category-summary-chip", isActive && "css-loaders-category-summary-chip-active")}
              >
                {formatLoaderLabel(category)} <strong>{count}</strong>
              </button>
            );
          })}
      </div>

      {isFilteringDeferred ? <div className="css-loaders-filtering-status">Updating gallery results…</div> : null}

      {filteredLoaders.length ? (
        <LoaderGallery
          loaders={filteredLoaders}
          currentPageLoaders={currentPageLoaders}
          loaderPreviewById={loaderPreviewById}
          currentPage={currentPage}
          totalPages={totalPages}
          pageStart={pageStart}
          pageEnd={pageEnd}
          galleryMode={galleryMode}
          highlightedLoaderId={highlightedLoaderId}
          favoriteIds={favoriteIds}
          isLoadingVisiblePreviews={isLoadingVisiblePreviews}
          onPageChange={setCurrentPage}
          onOpenLoader={openLoader}
          onToggleFavorite={toggleFavorite}
          onCopyPreview={copyPreviewSnippet}
          onCopySuccess={showCopyToast}
        />
      ) : (
        <LoaderEmptyState onReset={resetFilters} />
      )}

      <LoaderDetailModal
        loader={selectedLoader}
        loaderSummary={selectedLoaderSummary}
        loading={Boolean(selectedLoaderId && !selectedLoader && !detailError)}
        error={detailError}
        open={Boolean(selectedLoaderId)}
        onClose={closeLoader}
        onCopySuccess={showCopyToast}
      />
      <CopyToast message={copyToastMessage} />
    </div>
  );
}
