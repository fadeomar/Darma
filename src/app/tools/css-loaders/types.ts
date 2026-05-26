export type LoaderCategory =
  | "all"
  | "popular"
  | "dots"
  | "spinners"
  | "bars"
  | "pulse"
  | "skeleton"
  | "button"
  | "progress"
  | "minimal"
  | "fun"
  | "tailwind"
  | "creative";

export type LoaderFormat = "html" | "css" | "react" | "tailwind";

export type LoaderPreviewMode = "standalone" | "button" | "card" | "overlay";

export type LoaderGalleryMode = "grid" | "compact" | "focus";

export type LoaderPreviewTheme = "light" | "dark" | "transparent" | "gradient";

export type LoaderCustomizationState = {
  color: string;
  secondaryColor: string;
  size: number;
  speed: number;
  background: string;
};

export type LoaderSourceDefinition = {
  id: string;
  name: string;
  category: Exclude<LoaderCategory, "all" | "popular">;
  tags: string[];
  html: string;
  css: string;
  tailwind?: string;
  source?: {
    name?: string;
    author?: string;
    license?: string;
    url?: string;
  };
  controls?: {
    color?: boolean;
    size?: boolean;
    speed?: boolean;
    background?: boolean;
    secondaryColor?: boolean;
  };
  defaults?: {
    color?: string;
    secondaryColor?: string;
    size?: number;
    speed?: number;
    background?: string;
  };
  flags?: {
    popular?: boolean;
    singleElement?: boolean;
    cssOnly?: boolean;
    tailwind?: boolean;
    customizable?: boolean;
  };
};

export type LoaderFlags = {
  popular?: boolean;
  singleElement?: boolean;
  cssOnly?: boolean;
  tailwind?: boolean;
  customizable?: boolean;
};

export type LoaderIndexItem = {
  id: string;
  name: string;
  category: string;
  tags: string[];
  formats: LoaderFormat[];
  flags: LoaderFlags;
  searchText?: string;
};

export type LoaderPreviewItem = LoaderIndexItem & {
  previewHtml: string;
  previewCss: string;
  defaults?: NonNullable<LoaderSourceDefinition["defaults"]>;
};

export type LoaderDefinition = LoaderPreviewItem & {
  code: {
    html: string;
    css: string;
    react?: string;
    tailwind?: string;
  };
  controls: NonNullable<LoaderSourceDefinition["controls"]>;
  defaults: NonNullable<LoaderSourceDefinition["defaults"]>;
  source?: LoaderSourceDefinition["source"];
};
