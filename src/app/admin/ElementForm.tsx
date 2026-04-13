// components/ElementForm.tsx
import React from "react";
import type { ActionMeta, MultiValue, SingleValue } from "react-select";

import Dropdown, { DropdownOption } from "@/components/Dropdown";
import CodeEditor from "@/components/CodeEditor";
import PreviewCard from "@/components/TestCard";
import Editor from "@/components/Editor";
import type { ElementDTO } from "@/features/elements/dto/element.dto";

/**
 * NOTE:
 * - Dropdown uses react-select types (MultiValue/SingleValue of DropdownOption)
 * - We keep selectedMain/SecondaryCategories as DropdownOption[] for the UI
 * - We store mainCategory/secondaryCategory in formData as string[]
 */
export type ElementFormData = Partial<
  Omit<ElementDTO, "id" | "createdAt" | "updatedAt">
> & {
  id?: string; // optional in create mode
};

type Category = {
  name: string;
  // if you have a different shape, adjust here
  subcategories?: string[];
};

export interface ElementFormProps {
  formData: ElementFormData;

  // These are react-select "selected options" (NOT string[])
  selectedMainCategories: MultiValue<DropdownOption>;
  selectedSecondaryCategories: MultiValue<DropdownOption>;

  categories: Category[];

  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  onTagsChange: (e: React.ChangeEvent<HTMLInputElement>) => void;

  // react-select callback signature
  onMainCategoryChange: (
    newValue: MultiValue<DropdownOption> | SingleValue<DropdownOption>,
    actionMeta: ActionMeta<DropdownOption>,
  ) => void;

  onSecondaryCategoryChange: (
    newValue: MultiValue<DropdownOption> | SingleValue<DropdownOption>,
    actionMeta: ActionMeta<DropdownOption>,
  ) => void;

  onReset: () => void;

  // Secondary options are DropdownOption[]
  getSecondaryCategoryOptions: () => DropdownOption[];

  // used by your Editor component
  handleTextEditorChange: (
    value: string,
    field: "description" | "shortDescription",
  ) => void;
}

type SelectValue<T> = MultiValue<T> | SingleValue<T> | null;

function optionsToValues(value: SelectValue<DropdownOption>): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((o) => o.value);
  // At this point value is a SingleValue<DropdownOption> (DropdownOption | null)
  // null is already handled, so we assert to DropdownOption to access .value
  return [(value as DropdownOption).value];
}

export default function ElementForm({
  formData,
  selectedMainCategories,
  selectedSecondaryCategories,
  categories,
  onSubmit,
  onInputChange,
  onTagsChange,
  onMainCategoryChange,
  onSecondaryCategoryChange,
  onReset,
  getSecondaryCategoryOptions,
  handleTextEditorChange,
}: ElementFormProps) {
  const mainCategoryValues =
    formData.mainCategory ?? optionsToValues(selectedMainCategories);

  const secondaryCategoryValues =
    formData.secondaryCategory ?? optionsToValues(selectedSecondaryCategories);

  return (
    <form onSubmit={onSubmit} className="mb-8 p-4 bg-gray-100 rounded">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">
          {formData.id ? `Editing: ${formData.title}` : "Create New Element"}
        </h2>
        {formData.id && (
          <button
            type="button"
            onClick={onReset}
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
          value={formData.title ?? ""}
          onChange={onInputChange}
          className="p-2 border rounded"
          required
        />
        <input
          type="text"
          name="tags"
          placeholder="Tags (comma separated)"
          value={formData.tags?.join(", ") ?? ""}
          onChange={onTagsChange}
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
          onChange={onMainCategoryChange}
          placeholder="Select main categories..."
          isMulti
        />
      </div>

      <div className="mb-4">
        <label className="block mb-2 font-semibold">Secondary Category</label>
        <Dropdown
          options={getSecondaryCategoryOptions()}
          value={selectedSecondaryCategories}
          onChange={onSecondaryCategoryChange}
          placeholder="Select secondary categories..."
          isDisabled={selectedMainCategories.length === 0}
          isMulti
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium">
          Description
        </label>
        <Editor
          content={formData.description ?? ""}
          onUpdate={(value) => handleTextEditorChange(value, "description")}
          placeholder="Type or paste your description here..."
          className="mt-1"
        />
      </div>

      <textarea
        name="shortDescription"
        placeholder="Short Description"
        value={formData.shortDescription ?? ""}
        onChange={onInputChange}
        className="w-full p-2 border rounded mb-4"
        rows={3}
        required
      />

      <div className="field">
        <label>Slug</label>
        <input
          value={formData.slug ?? ""}
          onChange={onInputChange}
          placeholder="auto-generated-from-title"
        />
        <small style={{ opacity: 0.7 }}>
          Used in the URL: <code>/elements/{formData.slug || "..."}</code>
        </small>
      </div>

      {/* Reviewed Checkbox */}
      <div className="mb-4 flex items-center">
        <input
          type="checkbox"
          name="reviewed"
          checked={formData.reviewed ?? false}
          onChange={onInputChange}
          className="mr-2"
        />
        <label htmlFor="reviewed" className="text-sm font-medium">
          Reviewed
        </label>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block mb-2 font-semibold">HTML</label>
          <CodeEditor
            key={`html-${formData.id ?? "new"}`}
            code={formData.html ?? ""}
            setCode={(value) =>
              onInputChange({
                target: { name: "html", value: value ?? "" },
              } as React.ChangeEvent<HTMLInputElement>)
            }
            language="html"
            analyticsContext="html from element form component"
          />
        </div>

        <div>
          <label className="block mb-2 font-semibold">CSS</label>
          <CodeEditor
            key={`css-${formData.id ?? "new"}`}
            code={formData.css ?? ""}
            setCode={(value) =>
              onInputChange({
                target: { name: "css", value: value ?? "" },
              } as React.ChangeEvent<HTMLInputElement>)
            }
            language="css"
            analyticsContext="css from element form component"
          />
        </div>

        <div>
          <label className="block mb-2 font-semibold">JavaScript</label>
          <CodeEditor
            key={`js-${formData.id ?? "new"}`}
            code={formData.js ?? ""}
            setCode={(value) =>
              onInputChange({
                target: { name: "js", value: value ?? "" },
              } as React.ChangeEvent<HTMLInputElement>)
            }
            language="javascript"
            analyticsContext="js from element form component"
          />
        </div>
      </div>

      <button
        type="submit"
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        {formData.id ? "Update Element" : "Create Element"}
      </button>

      {formData.html && (
        <PreviewCard
          status="create"
          element={{
            id: formData.id ?? "preview",
            title: formData.title ?? "",
            description: formData.description ?? null,
            shortDescription: formData.shortDescription ?? null,
            html: formData.html ?? "",
            css: formData.css ?? "",
            js: formData.js ?? null,
            tags: formData.tags ?? [],
            mainCategory: mainCategoryValues,
            secondaryCategory: secondaryCategoryValues,
            deleted: false,
            reviewed: formData.reviewed ?? false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }}
        />
      )}
    </form>
  );
}
