import { ActionMeta, MultiValue, SingleValue } from "react-select";
import { DropdownOption } from "@/components/Dropdown";
export interface CodeElement {
  id: string;
  title: string;
  description: string;
  html: string;
  css: string;
  js?: string | undefined;
  tags: string[];
  mainCategory: string[];
  secondaryCategory: string[];
  deleted?: boolean | undefined;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCodeElement {
  id: string;
  title?: string;
  description?: string;
  html?: string;
  css?: string;
  js?: string | undefined;
  tags?: string[];
  mainCategory?: string[];
  secondaryCategory?: string[];
  deleted?: boolean | undefined;
  createdAt?: string;
  updatedAt?: string;
}
export interface Category {
  name: string;
  types: string[];
  description?: string;
}

export interface ElementFormProps {
  formData: Partial<CodeElement>;
  selectedMainCategories: DropdownOption[]; // Still an array since isMulti is true
  selectedSecondaryCategories: DropdownOption[]; // Still an array since isMulti is true
  categories: { name: string }[];
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
