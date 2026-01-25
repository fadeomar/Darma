/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import "./style.css";
import { useState, useEffect } from "react";
import categoriesData from "@/data/category.json";
import type { ElementDTO } from "@/features/projects/dto/element.dto";
import ElementList from "./ElementList";
import ElementForm from "./ElementForm";
import { DropdownOption } from "@/components/Dropdown";
import type { MultiValue, SingleValue } from "react-select";

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
};
function optionsToValues(
  value: MultiValue<DropdownOption> | SingleValue<DropdownOption> | null | undefined,
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
    return <div className="text-center py-8">Loading elements...</div>;
  }

  const handleTextEditorChange = (value: string, key: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Code Elements Collection</h1>
        <button
          onClick={toggleView}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {showCreateForm ? "All Elements" : "Create Element"}
        </button>
      </div>

      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p>Are you sure you want to delete this element?</p>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded"
              >
                Delete
              </button>
            </div>
          </div>
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
