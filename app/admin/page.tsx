"use client";
import { useState, useEffect } from "react";
import { MultiValue, SingleValue } from "react-select";
import categoriesData from "@/data/category.json";
import { CodeElement } from "@/types";
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

  const categories = categoriesData.categories;

  // Data fetching
  useEffect(() => {
    const fetchElements = async () => {
      try {
        const response = await fetch("/api/elements");
        const data = await response.json();
        setElements(data);
      } catch (error) {
        console.error("Failed to fetch elements:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchElements();
  }, []);

  // Category handlers
  const handleMainCategoryChange = (
    newValue: MultiValue<DropdownOption> | SingleValue<DropdownOption>
    // _actionMeta: ActionMeta<DropdownOption> // Renamed to _actionMeta to silence unused var warning
  ) => {
    const selectedOptions = newValue as MultiValue<DropdownOption>; // Safe cast since isMulti={true}
    const selectedValues = selectedOptions.map((option) => option.value);
    setSelectedMainCategories([...selectedOptions]); // Spread to convert readonly to mutable
    setFormData((prev) => ({ ...prev, mainCategory: selectedValues }));
    setSelectedSecondaryCategories([]);
  };

  const handleSecondaryCategoryChange = (
    newValue: MultiValue<DropdownOption> | SingleValue<DropdownOption>
    // _actionMeta: ActionMeta<DropdownOption> // Renamed to _actionMeta to silence unused var warning
  ) => {
    const selectedOptions = newValue as MultiValue<DropdownOption>; // Safe cast since isMulti={true}
    const selectedValues = selectedOptions.map((option) => option.value);
    setSelectedSecondaryCategories([...selectedOptions]); // Spread to convert readonly to mutable
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

    const url = formData.id ? `/api/elements/${formData.id}` : "/api/elements";
    const method = formData.id ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
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
        />
      ) : (
        <ElementList
          elements={filteredElements.slice(-20)}
          searchQuery={searchQuery}
          editingElementId={formData.id}
          previewedElement={previewedElement}
          onSearchChange={(e) => setSearchQuery(e.target.value)}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          onPreview={setPreviewedElement}
        />
      )}
    </div>
  );
}
