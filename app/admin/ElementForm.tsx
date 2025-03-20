// components/ElementForm.tsx
import Dropdown from "@/components/Dropdown";
import CodeEditor from "@/components/CodeEditor";
import { ElementFormProps } from "@/types";
import PreviewCard from "@/components/TestCard";

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
}: ElementFormProps) {
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
          value={formData.title || ""}
          onChange={onInputChange}
          className="p-2 border rounded"
          required
        />
        <input
          type="text"
          name="tags"
          placeholder="Tags (comma separated)"
          value={formData.tags?.join(", ") || ""}
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
        />
      </div>

      <textarea
        name="description"
        placeholder="Description"
        value={formData.description || ""}
        onChange={onInputChange}
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
              onInputChange({
                target: { name: "html", value: value || "" }, // Handle undefined
              } as React.ChangeEvent<HTMLInputElement>)
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
              onInputChange({
                target: { name: "css", value: value || "" }, // Handle undefined
              } as React.ChangeEvent<HTMLInputElement>)
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
              onInputChange({
                target: { name: "js", value: value || "" }, // Handle undefined
              } as React.ChangeEvent<HTMLInputElement>)
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
      {formData.html && (
        <PreviewCard element={{ ...formData, id: "test" }} status={"create"} />
      )}
    </form>
  );
}
