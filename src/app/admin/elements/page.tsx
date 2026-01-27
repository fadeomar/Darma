/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import categoriesData from "@/data/category.json";
import type { ElementDTO } from "@/features/projects/dto/element.dto";
import ElementForm from "../ElementForm";
import ElementList from "../ElementList";
import { DropdownOption } from "@/components/Dropdown";
import type { MultiValue, SingleValue } from "react-select";
import { slugify } from "@/lib/slug";
import PreviewCard from "@/components/TestCard";
import { CheckCircle2, Eye, Plus, Trash2, RotateCcw } from "lucide-react";

type PaginatedApiResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

type CreateElementPayload = {
  id?: string;
  title: string;
  description: string;
  shortDescription?: string | null;
  html: string;
  css: string;
  js?: string | null;
  tags: string[];
  mainCategory: string[];
  secondaryCategory: string[];
  reviewed?: boolean;
  deleted?: boolean;
  slug?: string | null;
};

type Filter = "all" | "pending" | "reviewed" | "deleted";

function optionsToValues(
  value:
    | MultiValue<DropdownOption>
    | SingleValue<DropdownOption>
    | null
    | undefined,
): string[] {
  if (!value) return [];
  if (Array.isArray(value))
    return value.map((o) => (o as DropdownOption).value);
  return [(value as DropdownOption).value];
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function AdminElementsPage() {
  const [elements, setElements] = useState<ElementDTO[]>([]);
  const [previewedElement, setPreviewedElement] = useState<ElementDTO | null>(
    null,
  );

  const [formData, setFormData] = useState<Partial<ElementDTO>>({
    title: "",
    description: "",
    shortDescription: "",
    html: "",
    css: "",
    js: "",
    tags: [],
    mainCategory: [],
    secondaryCategory: [],
    deleted: false,
    reviewed: false,
    slug: "",
  });

  const [filter, setFilter] = useState<Filter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [elementToDelete, setElementToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [selectedMainCategories, setSelectedMainCategories] = useState<
    DropdownOption[]
  >([]);
  const [selectedSecondaryCategories, setSelectedSecondaryCategories] =
    useState<DropdownOption[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const categories = (categoriesData as any).categories ?? [];

  // --- counts for tabs ---
  const counts = useMemo(() => {
    const all = elements.length;
    const pending = elements.filter((e) => !e.reviewed && !e.deleted).length;
    const reviewed = elements.filter((e) => !!e.reviewed && !e.deleted).length;
    const deleted = elements.filter((e) => !!e.deleted).length;
    return { all, pending, reviewed, deleted };
  }, [elements]);

  // --- fetch list (still your public endpoint for now) ---
  useEffect(() => {
    let cancelled = false;

    const fetchElements = async () => {
      setIsLoading(true);
      try {
        const url = `/api/elements?page=${currentPage}&pageSize=${pageSize}&search=${encodeURIComponent(
          searchQuery,
        )}`;
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);

        const json = (await response.json()) as
          | PaginatedApiResponse<ElementDTO>
          | { elements?: ElementDTO[]; data?: ElementDTO[]; total?: number };

        const itemsRaw =
          (json as any).items ??
          (json as any).elements ??
          (json as any).data ??
          [];
        const items: ElementDTO[] = Array.isArray(itemsRaw) ? itemsRaw : [];

        const totalRaw = (json as any).total;
        const total = Number.isFinite(totalRaw)
          ? Number(totalRaw)
          : items.length;

        if (!cancelled) {
          setElements(items);
          setTotalPages(Math.max(1, Math.ceil(total / pageSize)));
        }
      } catch (error) {
        console.error("Failed to fetch elements:", error);
        if (!cancelled) {
          setElements([]);
          setTotalPages(1);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchElements();
    return () => {
      cancelled = true;
    };
  }, [currentPage, searchQuery, pageSize]);

  // --- filter client-side (until admin list API exists) ---
  const visibleElements = useMemo(() => {
    return elements.filter((el) => {
      if (filter === "pending") return !el.reviewed && !el.deleted;
      if (filter === "reviewed") return !!el.reviewed && !el.deleted;
      if (filter === "deleted") return !!el.deleted;
      return true;
    });
  }, [elements, filter]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleMainCategoryChange = (
    newValue: MultiValue<DropdownOption> | SingleValue<DropdownOption>,
  ) => {
    const asArray = Array.isArray(newValue)
      ? newValue
      : newValue
        ? [newValue]
        : [];
    setSelectedMainCategories(asArray);
    setFormData((prev) => ({
      ...prev,
      mainCategory: optionsToValues(newValue),
    }));
  };

  const handleSecondaryCategoryChange = (
    newValue: MultiValue<DropdownOption> | SingleValue<DropdownOption>,
  ) => {
    const asArray = Array.isArray(newValue)
      ? newValue
      : newValue
        ? [newValue]
        : [];
    setSelectedSecondaryCategories(asArray);
    setFormData((prev) => ({
      ...prev,
      secondaryCategory: optionsToValues(newValue),
    }));
  };

  const getSecondaryCategoryOptions = (): DropdownOption[] => {
    return selectedMainCategories.flatMap((mainCat) => {
      const category = categories.find(
        (cat: any) => cat.name === mainCat.value,
      );
      return category
        ? (category.types ?? category.subcategories ?? []).map(
            (type: string) => ({
              value: type,
              label: type,
            }),
          )
        : [];
    });
  };

  const isCheckbox = (target: EventTarget): target is HTMLInputElement =>
    (target as HTMLInputElement).type === "checkbox";

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    if (isCheckbox(e.target)) {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
      return;
    }

    if (name === "title") {
      setFormData((prev) => ({
        ...prev,
        slug: slugify(value) ?? "",
        [name]: value,
      }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    setFormData((prev) => ({ ...prev, tags }));
  };

  const resetForm = () => {
    setFormData({
      id: "",
      title: "",
      description: "",
      shortDescription: "",
      html: "",
      css: "",
      js: "",
      tags: [],
      mainCategory: [],
      secondaryCategory: [],
      deleted: false,
      reviewed: false,
      slug: "",
    });
    setSelectedMainCategories([]);
    setSelectedSecondaryCategories([]);
  };

  const handleTextEditorChange = (value: string, key: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: CreateElementPayload = {
      id: formData.id || undefined,
      title: formData.title || "",
      description: (formData.description as any) || "",
      shortDescription: (formData.shortDescription as any) ?? null,
      html: formData.html || "",
      css: formData.css || "",
      js: (formData.js as any) ?? null,
      tags: formData.tags || [],
      mainCategory: formData.mainCategory || [],
      secondaryCategory: formData.secondaryCategory || [],
      reviewed: !!formData.reviewed,
      deleted: !!formData.deleted,
      slug: formData.slug ? (slugify(formData.slug) ?? "") : "",
    };

    const url = formData.id ? `/api/elements/${formData.id}` : "/api/elements";
    const method = formData.id ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(
        "Failed to save element:",
        response.status,
        response.statusText,
      );
      return;
    }

    const updated: ElementDTO = await response.json();

    setElements((prev) =>
      formData.id
        ? prev.map((el) => (el.id === formData.id ? updated : el))
        : [updated, ...prev],
    );

    resetForm();
    setShowCreateForm(false);
  };

  const handleEdit = (element: ElementDTO) => {
    setFormData({
      ...element,
      description: element.description ?? "",
      shortDescription: element.shortDescription ?? "",
      tags: element.tags ?? [],
      mainCategory: element.mainCategory ?? [],
      secondaryCategory: element.secondaryCategory ?? [],
      js: element.js ?? "",
      reviewed: element.reviewed ?? false,
      deleted: element.deleted ?? false,
      slug: element.slug ?? "",
    });

    setSelectedMainCategories(
      (element.mainCategory ?? []).map((cat) => ({ value: cat, label: cat })),
    );
    setSelectedSecondaryCategories(
      (element.secondaryCategory ?? []).map((cat) => ({
        value: cat,
        label: cat,
      })),
    );

    setShowCreateForm(true);
    setPreviewedElement(null);
  };

  const handleDeleteClick = (id: string) => {
    setElementToDelete(id);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!elementToDelete) return;

    try {
      const response = await fetch(`/api/elements/${elementToDelete}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        console.error(
          "Failed to delete element:",
          response.status,
          response.statusText,
        );
        return;
      }
      setElements((prev) => prev.filter((el) => el.id !== elementToDelete));
      resetForm();
    } finally {
      setIsDeleteConfirmOpen(false);
      setElementToDelete(null);
    }
  };

  const restore = async (id: string) => {
    const res = await fetch(`/api/elements/${id}/restore`, { method: "POST" });
    if (!res.ok) return;
    // quick refresh current page
    setCurrentPage(1);
  };

  const approve = async (id: string) => {
    const res = await fetch(`/api/elements/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewed: true }),
    });
    if (!res.ok) return;
    setCurrentPage(1);
  };

  const toggleView = () => {
    if (!showCreateForm) resetForm();
    setShowCreateForm((v) => !v);
  };

  if (isLoading) {
    return (
      <div className="py-10 text-center text-sm text-zinc-600">
        Loading elements…
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">Elements</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Create, review, and manage your code library — safely.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleView}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition",
              showCreateForm
                ? "border bg-white text-zinc-900 hover:bg-zinc-50"
                : "bg-zinc-900 text-white hover:bg-zinc-800",
            )}
          >
            <Plus className="h-4 w-4" />
            {showCreateForm ? "Back to list" : "New element"}
          </button>
        </div>
      </div>

      {/* Tabs + Controls */}
      {!showCreateForm && (
        <div className="mb-4 rounded-2xl border bg-white p-3">
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                ["all", `All (${counts.all})`],
                ["pending", `Pending (${counts.pending})`],
                ["reviewed", `Reviewed (${counts.reviewed})`],
                ["deleted", `Deleted (${counts.deleted})`],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => {
                  setFilter(key as Filter);
                  setCurrentPage(1);
                }}
                className={cn(
                  "rounded-xl px-3 py-2 text-sm font-semibold transition",
                  filter === key
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-50 text-zinc-800 hover:bg-zinc-100",
                )}
              >
                {label}
              </button>
            ))}

            <div className="ml-auto flex flex-1 items-center gap-2 sm:flex-none">
              <input
                type="text"
                placeholder="Search title / tags…"
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10 sm:w-[260px]"
              />
              <select
                value={pageSize}
                onChange={(e) => {
                  setCurrentPage(1);
                  setPageSize(Number(e.target.value));
                }}
                className="rounded-xl border px-3 py-2 text-sm"
              >
                <option value={6}>6 / page</option>
                <option value={8}>8 / page</option>
                <option value={12}>12 / page</option>
              </select>
            </div>
          </div>

          <div className="mt-3 text-xs text-zinc-500">
            Tip: Pending items should be previewed before approving.
          </div>
        </div>
      )}

      {/* Confirm delete modal */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <div className="text-lg font-semibold">Confirm delete</div>
            <p className="mt-1 text-sm text-zinc-600">
              This is a soft delete in your system — you can restore later.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview modal */}
      {previewedElement && (
        <div className="fixed inset-0 z-50 bg-black/50 p-4">
          <div className="mx-auto flex h-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between gap-3 border-b px-5 py-4">
              <div className="min-w-0">
                <div className="text-xs font-semibold text-zinc-500">
                  Preview
                </div>
                <div className="truncate text-lg font-semibold">
                  {previewedElement.title}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!previewedElement.reviewed && !previewedElement.deleted && (
                  <button
                    onClick={() => approve(previewedElement.id)}
                    className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Approve
                  </button>
                )}
                {previewedElement.deleted && (
                  <button
                    onClick={() => restore(previewedElement.id)}
                    className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold hover:bg-zinc-50"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Restore
                  </button>
                )}
                {!previewedElement.deleted && (
                  <button
                    onClick={() => handleDeleteClick(previewedElement.id)}
                    className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold hover:bg-zinc-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                )}
                <button
                  onClick={() => setPreviewedElement(null)}
                  className="rounded-xl border px-3 py-2 text-sm font-semibold hover:bg-zinc-50"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-5">
              <PreviewCard element={previewedElement} status="preview" />
            </div>
          </div>
        </div>
      )}

      {/* Body */}
      {showCreateForm ? (
        <div className="rounded-2xl border bg-white p-4">
          <ElementForm
            formData={formData}
            selectedMainCategories={selectedMainCategories}
            selectedSecondaryCategories={selectedSecondaryCategories}
            categories={categories}
            onSubmit={handleSubmit}
            onInputChange={handleInputChange}
            onTagsChange={handleTagsChange}
            onMainCategoryChange={handleMainCategoryChange as any}
            onSecondaryCategoryChange={handleSecondaryCategoryChange as any}
            onReset={resetForm}
            getSecondaryCategoryOptions={getSecondaryCategoryOptions}
            handleTextEditorChange={handleTextEditorChange as any}
          />
        </div>
      ) : (
        <div className="rounded-2xl border bg-white p-4">
          {/* Small action legend */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm font-semibold text-zinc-900">
              Showing{" "}
              <span className="text-zinc-600">{visibleElements.length}</span>{" "}
              items
            </div>
            <div className="text-xs text-zinc-500">
              Use <Eye className="inline h-3.5 w-3.5" /> preview for safe review
            </div>
          </div>

          {/* Reuse your list (cards) */}
          <ElementList
            elements={visibleElements}
            searchQuery={searchQuery}
            editingElementId={formData.id}
            previewedElement={null} // modal handles preview now
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
            onPreview={setPreviewedElement}
            currentPage={currentPage}
            totalPages={totalPages}
            onSearchChange={handleSearchChange}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}
