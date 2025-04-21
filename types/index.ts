import { ActionMeta, MultiValue, SingleValue } from "react-select";
import { DropdownOption } from "@/components/Dropdown";
export interface CodeElement {
  id: string;
  title: string;
  description: string;
  shortDescription: string | null;
  html: string;
  css: string | null;
  js: string | null;
  tags: string[];
  mainCategory: string[];
  secondaryCategory: string[];
  deleted: boolean;
  reviewed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCodeElement {
  id: string;
  title?: string;
  description?: string;
  html?: string;
  css?: string | null;
  shortDescription?: string | null;
  js?: string | null | undefined;
  tags?: string[];
  mainCategory?: string[];
  secondaryCategory?: string[];
  deleted?: boolean | undefined;
  createdAt?: string;
  updatedAt?: string;
  reviewed?: boolean;
}
export interface Category {
  name: string;
  types: string[];
  description?: string;
}

export interface ElementFormProps {
  formData: Partial<CodeElement> | CreateCodeElement;
  selectedMainCategories: DropdownOption[];
  selectedSecondaryCategories: DropdownOption[];
  categories: { name: string }[];
  handleTextEditorChange: (value: string, key: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onTagsChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onMainCategoryChange: (
    newValue: MultiValue<DropdownOption> | SingleValue<DropdownOption>,
    actionMeta: ActionMeta<DropdownOption>
  ) => void;
  onSecondaryCategoryChange: (
    newValue: MultiValue<DropdownOption> | SingleValue<DropdownOption>,
    actionMeta: ActionMeta<DropdownOption>
  ) => void;
  onReset: () => void;
  getSecondaryCategoryOptions: () => DropdownOption[];
}

export interface SearchParams {
  q?: string;
  mainCat?: string | string[];
  secCat?: string | string[];
  page?: string;
  exactMatch?: string;
}

export interface ColorShade {
  hex: string;
  rgb: string;
  hsl: string;
}

export interface ColorShadesParams {
  color1: string;
  color2: string;
  steps: number;
}
