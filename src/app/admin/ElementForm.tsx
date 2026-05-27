import React from "react";
import type { ActionMeta, MultiValue, SingleValue } from "react-select";

import Dropdown, { DropdownOption } from "@/components/Dropdown";
import CodeEditor from "@/components/CodeEditor";
import PreviewCard from "@/components/TestCard";
import Editor from "@/components/Editor";
import type { ElementDTO } from "@/features/elements/dto/element.dto";
import { Badge, Button, Card, Field, Input, Textarea } from "@/components/ui";

export type ElementFormData = Partial<
  Omit<ElementDTO, "id" | "createdAt" | "updatedAt">
> & {
  id?: string;
};

type Category = {
  name: string;
  subcategories?: string[];
};

export interface ElementFormProps {
  formData: ElementFormData;
  selectedMainCategories: MultiValue<DropdownOption>;
  selectedSecondaryCategories: MultiValue<DropdownOption>;
  categories: Category[];
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  onTagsChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onMainCategoryChange: (
    newValue: MultiValue<DropdownOption> | SingleValue<DropdownOption>,
    actionMeta: ActionMeta<DropdownOption>,
  ) => void;
  onSecondaryCategoryChange: (
    newValue: MultiValue<DropdownOption> | SingleValue<DropdownOption>,
    actionMeta: ActionMeta<DropdownOption>,
  ) => void;
  onReset: () => void;
  getSecondaryCategoryOptions: () => DropdownOption[];
  handleTextEditorChange: (
    value: string,
    field: "description" | "shortDescription",
  ) => void;
}

type SelectValue<T> = MultiValue<T> | SingleValue<T> | null;

function optionsToValues(value: SelectValue<DropdownOption>): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((o) => o.value);
  return [(value as DropdownOption).value];
}

function createTextEvent(
  name: string,
  value: string,
): React.ChangeEvent<HTMLInputElement> {
  return {
    target: { name, value },
  } as React.ChangeEvent<HTMLInputElement>;
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

  const setCodeField =
    (field: "html" | "css" | "js") => (next: React.SetStateAction<string>) => {
      const current = String(formData[field] ?? "");
      const value = typeof next === "function" ? next(current) : next;
      onInputChange(createTextEvent(field, value));
    };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <Card padding="sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
              Element form
            </div>
            <h2 className="mt-1 text-xl font-semibold tracking-tight">
              {formData.id ? `Editing: ${formData.title}` : "Create New Element"}
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {formData.id ? <Badge variant="warning">Editing</Badge> : <Badge variant="accent">New</Badge>}
            {formData.id && (
              <Button type="button" variant="outline" onClick={onReset}>
                Create new instead
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Card padding="sm" className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Title" required>
            <Input
              type="text"
              name="title"
              placeholder="Button hover effect"
              value={formData.title ?? ""}
              onChange={onInputChange}
              required
            />
          </Field>

          <Field label="Tags" description="Comma separated.">
            <Input
              type="text"
              name="tags"
              placeholder="button, hover, css"
              value={formData.tags?.join(", ") ?? ""}
              onChange={onTagsChange}
            />
          </Field>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Main Category">
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
          </Field>

          <Field label="Secondary Category">
            <Dropdown
              options={getSecondaryCategoryOptions()}
              value={selectedSecondaryCategories}
              onChange={onSecondaryCategoryChange}
              placeholder="Select secondary categories..."
              isDisabled={selectedMainCategories.length === 0}
              isMulti
            />
          </Field>
        </div>

        <Field
          label="Slug"
          description={
            <>
              Used in the URL: <code>/elements/{formData.slug || "..."}</code>
            </>
          }
        >
          <Input
            name="slug"
            value={formData.slug ?? ""}
            onChange={onInputChange}
            placeholder="auto-generated-from-title"
          />
        </Field>

        <label className="flex w-fit items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-control-bg)] px-3 py-2 text-sm font-semibold text-[var(--color-text-secondary)]">
          <input
            type="checkbox"
            name="reviewed"
            checked={formData.reviewed ?? false}
            onChange={onInputChange}
            className="h-4 w-4 accent-[var(--color-primary)]"
          />
          Reviewed
        </label>
      </Card>

      <Card padding="sm" className="space-y-4">
        <Field label="Description">
          <Editor
            content={formData.description ?? ""}
            onUpdate={(value) => handleTextEditorChange(value, "description")}
            placeholder="Type or paste your description here..."
          />
        </Field>

        <Field label="Short description" required>
          <Textarea
            name="shortDescription"
            placeholder="Short summary shown on element cards."
            value={formData.shortDescription ?? ""}
            onChange={onInputChange}
            rows={3}
            required
          />
        </Field>
      </Card>

      <Card padding="sm" className="space-y-4">
        <div>
          <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
            HTML
          </div>
          <CodeEditor
            code={formData.html ?? ""}
            setCode={setCodeField("html")}
            language="html"
            analyticsContext="html from element form component"
          />
        </div>

        <div>
          <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
            CSS
          </div>
          <CodeEditor
            code={formData.css ?? ""}
            setCode={setCodeField("css")}
            language="css"
            analyticsContext="css from element form component"
          />
        </div>

        <div>
          <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
            JavaScript
          </div>
          <CodeEditor
            code={formData.js ?? ""}
            setCode={setCodeField("js")}
            language="javascript"
            analyticsContext="js from element form component"
          />
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs leading-5 text-[var(--color-text-tertiary)]">
          Save writes to the element API. Preview remains local until submitted.
        </p>
        <Button type="submit">
          {formData.id ? "Update Element" : "Create Element"}
        </Button>
      </div>

      {formData.html && (
        <Card padding="sm" className="space-y-3">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
            Local preview
          </div>
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
        </Card>
      )}
    </form>
  );
}
