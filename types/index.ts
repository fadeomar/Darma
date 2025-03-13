export interface CodeElement {
  id: string;
  title: string;
  description: string;
  html: string;
  css: string;
  js: string;
  tags: string[];
  mainCategory: string[];
  secondaryCategory: string[];
  deleted: boolean;
  createdAt?: string; // Optional for backward compatibility
  updatedAt?: string; // Optional for backward compatibility
}

export interface Category {
  name: string;
  types: string[];
  description?: string;
}
