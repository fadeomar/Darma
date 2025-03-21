import { CodeElement } from "@/types";
import CardsPagination from "@/components/CardsPagination";
import PreviewCard from "@/components/TestCard";
import CategoryBadge from "@/components/CategoryBadge";
// import PreviewHTML from "@/components/PreviewHTML";

interface ElementListProps {
  elements: CodeElement[];
  searchQuery: string;
  editingElementId?: string;
  previewedElement: CodeElement | null;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEdit: (element: CodeElement) => void;
  onDelete: (id: string) => void;
  onPreview: (element: CodeElement | null) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function ElementList({
  elements,
  searchQuery,
  editingElementId,
  previewedElement,
  onSearchChange,
  onEdit,
  onDelete,
  onPreview,
  currentPage,
  totalPages,
  onPageChange,
}: ElementListProps) {
  return (
    <>
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search elements..."
          value={searchQuery}
          onChange={onSearchChange}
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
              onClick={() => onPreview(null)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Close Preview
            </button>
          </div>
          <PreviewCard element={previewedElement} status={"preview"} />
        </div>
      )}

      <CardsPagination
        elements={elements}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        renderElement={(element: CodeElement) => (
          <div
            key={element.id}
            className={`p-4 border rounded shadow-sm ${
              editingElementId === element.id
                ? "bg-blue-50 border-blue-300"
                : "bg-white"
            }`}
          >
            <h3 className="text-lg font-semibold mb-2">{element.title}</h3>
            <p className="text-gray-600 mb-2">{element.shortDescription}</p>
            {/* <PreviewHTML html={element.description} /> */}
            {element?.mainCategory?.length > 0 && (
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
                onClick={() => onEdit(element)}
                className="px-3 py-1 text-sm bg-yellow-500 text-white rounded"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(element.id)}
                className="px-3 py-1 text-sm bg-red-500 text-white rounded"
              >
                Delete
              </button>
              <button
                onClick={() => onPreview(element)}
                className="px-3 py-1 text-sm bg-gray-500 text-white rounded"
              >
                Preview
              </button>
            </div>
          </div>
        )}
      />
    </>
  );
}
