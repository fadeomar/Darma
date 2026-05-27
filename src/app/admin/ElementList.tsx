import type { ElementDTO } from "@/features/elements/dto/element.dto";
import CardsPagination from "@/components/CardsPagination";
import PreviewCard from "@/components/TestCard";
import CategoryBadge from "@/components/CategoryBadge";
import { Badge, Button, Card, Input } from "@/components/ui";
import { CheckCircle } from "lucide-react";

interface ElementListProps {
  elements: ElementDTO[];
  searchQuery: string;
  editingElementId?: string;
  previewedElement: ElementDTO | null;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEdit: (element: ElementDTO) => void;
  onDelete: (id: string) => void;
  onPreview: (element: ElementDTO | null) => void;
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
      <div className="mb-5">
        <Input
          type="text"
          placeholder="Search elements..."
          value={searchQuery}
          onChange={onSearchChange}
        />
      </div>

      {previewedElement && (
        <Card className="mb-6" padding="sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
                Previewing
              </div>
              <h2 className="mt-1 text-xl font-semibold tracking-tight">
                {previewedElement.title}
              </h2>
            </div>
            <Button type="button" variant="outline" onClick={() => onPreview(null)}>
              Close Preview
            </Button>
          </div>
          <PreviewCard element={previewedElement} status="preview" />
        </Card>
      )}

      <CardsPagination
        items={elements}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        renderItem={(element: ElementDTO) => (
          <Card
            key={element.id}
            padding="sm"
            className={
              editingElementId === element.id
                ? "relative border-[var(--color-primary-border)] bg-[var(--color-primary-soft)]"
                : "relative"
            }
          >
            {element.reviewed && (
              <CheckCircle
                fill="var(--color-success)"
                className="absolute -right-1 -top-1 h-7 w-7 rounded-[var(--radius-full)] bg-[var(--color-surface-raised)] text-[var(--color-success)]"
                aria-label="Reviewed"
              />
            )}
            <div className="pr-5">
              <h3 className="text-lg font-semibold tracking-tight text-[var(--color-text-primary)]">
                {element.title}
              </h3>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                {element.shortDescription || element.description || "No description yet."}
              </p>
            </div>

            {element?.mainCategory?.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
                  Main
                </span>
                {element.mainCategory.map((cat) => (
                  <CategoryBadge key={cat} category={cat} />
                ))}
              </div>
            )}

            {element.tags?.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {element.tags.map((tag) => (
                  <Badge key={tag} variant="soft">
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" variant="soft" size="sm" onClick={() => onEdit(element)}>
                Edit
              </Button>
              <Button type="button" variant="danger" size="sm" onClick={() => onDelete(element.id)}>
                Delete
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => onPreview(element)}>
                Preview
              </Button>
            </div>
          </Card>
        )}
      />
    </>
  );
}
