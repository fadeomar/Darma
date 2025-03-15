"use client";
import categoriesData from "@/data/category.json";
import { MultiValue, SingleValue } from "react-select";
import { useState, useEffect } from "react";
import CodeEditor from "@/components/CodeEditor";
import { CodeElement } from "@/types";
import Dropdown, { DropdownOption } from "@/components/Dropdown";
import AdminElementList from "@/components/AdminElementList";
import PreviewCard from "@/components/TestCard";
import CategoryBadge from "@/components/CategoryBadge";

export default function ElementsPage() {
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

  const categories = categoriesData.categories;

  const [selectedMainCategories, setSelectedMainCategories] = useState<
    DropdownOption[]
  >([]);
  const [selectedSecondaryCategories, setSelectedSecondaryCategories] =
    useState<DropdownOption[]>([]);

  useEffect(() => {
    const fetchElements = async () => {
      try {
        const response = await fetch("/api/elements");
        const data = (await response.json()) as { elements: CodeElement[] };
        setElements(data.elements); // Adjust if API structure differs
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
  ) => {
    const selectedOptions = newValue as MultiValue<DropdownOption>; // Safe cast since isMulti={true}
    const selectedValues = selectedOptions.map((option) => option.value);
    setSelectedMainCategories([...selectedOptions]); // Spread to handle readonly -> mutable conversion
    setFormData((prev) => ({ ...prev, mainCategory: selectedValues }));
    setSelectedSecondaryCategories([]);
  };

  const handleSecondaryCategoryChange = (
    newValue: MultiValue<DropdownOption> | SingleValue<DropdownOption>
  ) => {
    const selectedOptions = newValue as MultiValue<DropdownOption>; // Safe cast since isMulti={true}
    const selectedValues = selectedOptions.map((option) => option.value);
    setSelectedSecondaryCategories([...selectedOptions]); // Spread to handle readonly -> mutable conversion
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
      if (!response.ok) throw new Error("Failed to save element");
      const updatedElement = (await response.json()) as CodeElement;
      setElements((prev) =>
        formData.id
          ? prev.map((el) => (el.id === formData.id ? updatedElement : el))
          : [...prev, updatedElement]
      );
      resetForm();
    } catch (error) {
      console.error("Failed to save element:", error);
    }
  };

  const handleEdit = (element: CodeElement) => {
    setFormData(element);
    setSelectedMainCategories(
      element.mainCategory.map((cat) => ({ value: cat, label: cat }))
    );
    setSelectedSecondaryCategories(
      element.secondaryCategory.map((cat) => ({ value: cat, label: cat }))
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
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
        if (!response.ok) throw new Error("Failed to delete");
        setElements((prev) => prev.filter((el) => el.id !== elementToDelete));
        resetForm();
      } catch (error) {
        console.error("Failed to delete element:", error);
      } finally {
        setIsDeleteConfirmOpen(false);
        setElementToDelete(null);
      }
    }
  };

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
      <h1 className="text-2xl font-bold mb-4">Code Elements Collection</h1>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search elements..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>

      {previewedElement && (
        <div className="mb-8 p-4 bg-gray-100 rounded">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              Previewing: {previewedElement.title}
            </h2>
            <button
              onClick={() => setPreviewedElement(null)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Close Preview
            </button>
          </div>
          <PreviewCard element={previewedElement} />
        </div>
      )}

      <AdminElementList
        elements={filteredElements.slice(-20)}
        itemsPerPage={6}
        renderElement={(element: CodeElement) => (
          <div
            key={element.id}
            className={`p-4 border rounded shadow-sm ${
              formData.id === element.id
                ? "bg-blue-50 border-blue-300"
                : "bg-white"
            }`}
          >
            <h3 className="text-lg font-semibold mb-2">{element.title}</h3>
            <p className="text-gray-600 mb-2">{element.description}</p>
            {element?.mainCategory && element?.mainCategory?.length > 0 && (
              <div className="flex gap-2">
                Main Cats:
                {element.mainCategory.map((cat) => (
                  <CategoryBadge key={cat} category={cat} />
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-2 mb-3">
              {element.tags?.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-gray-100 rounded text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(element)}
                className={`px-3 py-1 text-sm ${
                  formData.id === element.id
                    ? "bg-blue-500 text-white"
                    : "bg-yellow-500 text-white"
                } rounded`}
              >
                {formData.id === element.id ? "Editing..." : "Edit"}
              </button>
              <button
                onClick={() => handleDeleteClick(element.id)}
                className="px-3 py-1 text-sm bg-red-500 text-white rounded"
              >
                Delete
              </button>
              <button
                onClick={() => setPreviewedElement(element)}
                className={`px-3 py-1 text-sm ${
                  previewedElement?.id === element.id
                    ? "bg-green-500 text-white"
                    : "bg-gray-500 text-white"
                } rounded`}
              >
                {previewedElement?.id === element.id
                  ? "Previewing..."
                  : "Preview"}
              </button>
            </div>
          </div>
        )}
      />

      <form onSubmit={handleSubmit} className="mb-8 p-4 bg-gray-100 rounded">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {formData.id ? `Editing: ${formData.title}` : "Create New Element"}
          </h2>
          {formData.id && (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Create New Element Instead
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <input
            type="text"
            name="title"
            placeholder="Title"
            value={formData.title || ""}
            onChange={handleInputChange}
            className="p-2 border rounded"
            required
          />
          <input
            type="text"
            name="tags"
            placeholder="Tags (comma separated)"
            value={formData.tags?.join(", ") || ""}
            onChange={handleTagsChange}
            className="p-2 border rounded"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-2 font-semibold">Main Category</label>
          <Dropdown
            options={categories.map((cat) => ({
              value: cat.name,
              label: cat.name,
            }))}
            value={selectedMainCategories}
            onChange={handleMainCategoryChange}
            placeholder="Select main categories..."
          />
        </div>

        <div className="mb-4">
          <label className="block mb-2 font-semibold">Secondary Category</label>
          <Dropdown
            options={getSecondaryCategoryOptions()}
            value={selectedSecondaryCategories}
            onChange={handleSecondaryCategoryChange}
            placeholder="Select secondary categories..."
            isDisabled={selectedMainCategories.length === 0}
          />
        </div>

        <textarea
          name="description"
          placeholder="Description"
          value={formData.description || ""}
          onChange={handleInputChange}
          className="w-full p-2 border rounded mb-4"
          rows={3}
          required
        />

        <div className="space-y-4">
          <div>
            <label className="block mb-2 font-semibold">HTML</label>
            <CodeEditor
              key={`html-${formData.id}`}
              code={formData.html || ""}
              setCode={(value) =>
                setFormData((prev) => ({ ...prev, html: value ?? "" }))
              }
              language="html"
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold">CSS</label>
            <CodeEditor
              key={`css-${formData.id}`}
              code={formData.css || ""}
              setCode={(value) =>
                setFormData((prev) => ({ ...prev, css: value ?? "" }))
              }
              language="css"
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold">JavaScript</label>
            <CodeEditor
              key={`js-${formData.id}`}
              code={formData.js || ""}
              setCode={(value) =>
                setFormData((prev) => ({ ...prev, js: value ?? "" }))
              }
              language="javascript"
            />
          </div>
        </div>

        <button
          type="submit"
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {formData.id ? "Update Element" : "Create Element"}
        </button>
      </form>

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
    </div>
  );
}
