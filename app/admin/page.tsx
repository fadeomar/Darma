"use client";
import { useState, useEffect } from "react";
import { MultiValue, SingleValue } from "react-select";
import categoriesData from "@/data/category.json";
import { CodeElement, CreateCodeElement } from "@/types";
import ElementList from "./ElementList";
import ElementForm from "./ElementForm";
import { DropdownOption } from "@/components/Dropdown";

export default function ElementsPage() {
  // State management
  const [elements, setElements] = useState<CodeElement[]>([]);
  const [previewedElement, setPreviewedElement] = useState<CodeElement | null>(
    null
  );
  const [formData, setFormData] = useState<Partial<CodeElement>>({
    id: "",
    title: "",
    description: "",
    html: "",
    css: "",
    js: "",
    tags: [],
    mainCategory: [],
    secondaryCategory: [],
    deleted: false,
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
  const [currentPage, setCurrentPage] = useState(1); // Track current page
  const [totalPages, setTotalPages] = useState(1); // Track total pages
  const itemsPerPage = 6; // Items per page

  const categories = categoriesData.categories;

  // Data fetching
  useEffect(() => {
    const fetchElements = async () => {
      try {
        const response = await fetch(
          `/api/elements?page=${currentPage}&pageSize=${itemsPerPage}&search=${searchQuery}`
        );
        const { data, total } = await response.json();
        setElements(data);
        setTotalPages(Math.ceil(total / itemsPerPage)); // Calculate total pages
      } catch (error) {
        console.error("Failed to fetch elements:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchElements();
  }, [currentPage, searchQuery]); // Refetch when currentPage or searchQuery changes

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to the first page when searching
  };

  // Category handlers
  const handleMainCategoryChange = (
    newValue: MultiValue<DropdownOption> | SingleValue<DropdownOption>
  ) => {
    const selectedOptions = newValue as MultiValue<DropdownOption>;
    const selectedValues = selectedOptions.map((option) => option.value);
    setSelectedMainCategories([...selectedOptions]);
    setFormData((prev) => ({ ...prev, mainCategory: selectedValues }));
    setSelectedSecondaryCategories([]);
  };

  const handleSecondaryCategoryChange = (
    newValue: MultiValue<DropdownOption> | SingleValue<DropdownOption>
  ) => {
    const selectedOptions = newValue as MultiValue<DropdownOption>;
    const selectedValues = selectedOptions.map((option) => option.value);
    setSelectedSecondaryCategories([...selectedOptions]);
    setFormData((prev) => ({ ...prev, secondaryCategory: selectedValues }));
  };

  const getSecondaryCategoryOptions = (): DropdownOption[] => {
    return selectedMainCategories.flatMap((mainCat) => {
      const category = categories.find((cat) => cat.name === mainCat.value);
      return category
        ? category.types.map((type) => ({ value: type, label: type }))
        : [];
    });
  };

  // Form handlers
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value.split(",").map((tag) => tag.trim());
    setFormData((prev) => ({ ...prev, tags }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const element: CreateCodeElement = {
      id: formData.id || "some-default-id", // Provide defaults if needed
      title: formData.title || "", // Ensure required fields are filled
      description: formData.description || "",
      html: formData.html || "",
      css: formData.css || "",
      js: formData.js || "",
      tags: formData.tags || [],
      mainCategory: formData.mainCategory || [],
      secondaryCategory: formData.secondaryCategory || [],
      shortDescription: formData.shortDescription,
      deleted: false,
      createdAt: undefined,
      updatedAt: undefined,
    };
    const url = formData.id ? `/api/elements/${formData.id}` : "/api/elements";
    const method = formData.id ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(element),
      });

      if (response.ok) {
        const updatedElement: CodeElement = await response.json();
        setElements((prev) =>
          formData.id
            ? prev.map((el) => (el.id === formData.id ? updatedElement : el))
            : [...prev, updatedElement]
        );
        resetForm();
        setShowCreateForm(false);
      }
    } catch (error) {
      console.error("Failed to save element:", error);
    }
  };

  // Element actions
  const handleEdit = (element: CodeElement) => {
    setFormData(element);
    setSelectedMainCategories(
      element.mainCategory.map((cat) => ({ value: cat, label: cat }))
    );
    setSelectedSecondaryCategories(
      element.secondaryCategory.map((cat) => ({ value: cat, label: cat }))
    );
    setShowCreateForm(true);
  };

  const handleDeleteClick = (id: string) => {
    setElementToDelete(id);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (elementToDelete) {
      try {
        const response = await fetch(`/api/elements/${elementToDelete}`, {
          method: "DELETE",
        });

        if (response.ok) {
          setElements((prev) => prev.filter((el) => el.id !== elementToDelete));
          resetForm();
        }
      } catch (error) {
        console.error("Failed to delete element:", error);
      } finally {
        setIsDeleteConfirmOpen(false);
        setElementToDelete(null);
      }
    }
  };

  // Form management
  const resetForm = () => {
    setFormData({
      id: "",
      title: "",
      description: "",
      html: "",
      css: "",
      js: "",
      tags: [],
      mainCategory: [],
      secondaryCategory: [],
      deleted: false,
    });
    setSelectedMainCategories([]);
    setSelectedSecondaryCategories([]);
  };

  const toggleView = () => {
    if (!showCreateForm) {
      resetForm();
    }
    setShowCreateForm(!showCreateForm);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Filtering
  const filteredElements = elements.filter(
    (element) =>
      element.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      element.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      element.tags?.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

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

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
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
          elements={filteredElements}
          searchQuery={searchQuery}
          editingElementId={formData.id}
          previewedElement={previewedElement}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          onPreview={setPreviewedElement}
          currentPage={currentPage}
          totalPages={totalPages}
          onSearchChange={handleSearchChange} // Use the new search handler
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
