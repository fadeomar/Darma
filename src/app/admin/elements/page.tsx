/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import categoriesData from "@/data/category.json";
import type { ElementDTO } from "@/features/elements/dto/element.dto";
import ElementList from "../ElementList";
import ElementForm from "../ElementForm";
import { DropdownOption } from "@/components/Dropdown";
import type { MultiValue, SingleValue } from "react-select";
import { slugify } from "@/lib/slug";
import { Button, Card } from "@/components/ui";

type PaginatedApiResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

// temporary: until you also DTO-ify your create/update payloads
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
function optionsToValues(
  value:
    | MultiValue<DropdownOption>
    | SingleValue<DropdownOption>
    | null
    | undefined,
): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((o) => (o as DropdownOption).value);
  }
  return [(value as DropdownOption).value];
}

export default function ElementsPage() {
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

  const itemsPerPage = 6;
  const categories = (categoriesData as any).categories ?? [];

  useEffect(() => {
    let cancelled = false;

    const fetchElements = async () => {
      setIsLoading(true);

      try {
        const url = `/api/elements?page=${currentPage}&pageSize=${itemsPerPage}&search=${encodeURIComponent(
          searchQuery,
        )}`;

        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) {
          console.error(
            "Failed to fetch elements:",
            response.status,
            response.statusText,
          );
          if (!cancelled) {
            setElements([]);
            setTotalPages(1);
          }
          return;
        }

        // Canonical: { items, total, page, pageSize }
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
          setTotalPages(Math.max(1, Math.ceil(total / itemsPerPage)));
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
  }, [currentPage, searchQuery, itemsPerPage]);

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
        ? category.types.map((type: string) => ({ value: type, label: type }))
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

    try {
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
    } catch (error) {
      console.error("Failed to save element:", error);
    }
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
    } catch (error) {
      console.error("Failed to delete element:", error);
    } finally {
      setIsDeleteConfirmOpen(false);
      setElementToDelete(null);
    }
  };

  const toggleView = () => {
    if (!showCreateForm) resetForm();
    setShowCreateForm(!showCreateForm);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (isLoading) {
    return (
      <Card className="py-10 text-center text-sm text-[var(--color-text-secondary)]">
        Loading elements...
      </Card>
    );
  }

  const handleTextEditorChange = (value: string, key: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            Code Elements Collection
          </h1>
          <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">
            Create, edit, preview, and soft-delete reusable Darma elements.
          </p>
        </div>
        <Button onClick={toggleView} variant={showCreateForm ? "outline" : "primary"}>
          {showCreateForm ? "All Elements" : "Create Element"}
        </Button>
      </div>

      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-black/55 p-4">
          <Card className="w-full max-w-md" padding="md">
            <h3 className="text-lg font-semibold tracking-tight">Confirm Delete</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
              Are you sure you want to delete this element? This uses the soft-delete flow.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDeleteConfirmOpen(false)}
              >
                Cancel
              </Button>
              <Button type="button" variant="danger" onClick={handleConfirmDelete}>
                Delete
              </Button>
            </div>
          </Card>
        </div>
      )}

      {showCreateForm ? (
        <ElementForm
          formData={formData}
          selectedMainCategories={selectedMainCategories}
          selectedSecondaryCategories={selectedSecondaryCategories}
          categories={categories}
          onSubmit={handleSubmit}
          onInputChange={handleInputChange}
          onTagsChange={handleTagsChange}
          onMainCategoryChange={handleMainCategoryChange}
          onSecondaryCategoryChange={handleSecondaryCategoryChange}
          onReset={resetForm}
          getSecondaryCategoryOptions={getSecondaryCategoryOptions}
          handleTextEditorChange={handleTextEditorChange}
        />
      ) : (
        <ElementList
          elements={elements}
          searchQuery={searchQuery}
          editingElementId={formData.id}
          previewedElement={previewedElement}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          onPreview={setPreviewedElement}
          currentPage={currentPage}
          totalPages={totalPages}
          onSearchChange={handleSearchChange}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
