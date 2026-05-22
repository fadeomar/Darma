export type OgType = "website" | "article" | "product" | "profile";
export type TwitterCardType = "summary" | "summary_large_image";

export type MetaTagInput = {
  title: string;
  description: string;
  canonicalUrl: string;
  siteName: string;
  ogType: OgType;
  imageUrl: string;
  imageAlt: string;
  locale: string;
  twitterCard: TwitterCardType;
  twitterSite: string;
  twitterCreator: string;
};

export type MetaTagValidation = {
  level: "error" | "warning" | "info";
  field: keyof MetaTagInput | "general";
  message: string;
};

export type SocialPreviewModel = {
  title: string;
  description: string;
  url: string;
  domain: string;
  siteName: string;
  imageUrl: string;
  imageAlt: string;
  twitterCard: TwitterCardType;
};

export type MetaTagPreset = {
  label: string;
  description: string;
  input: MetaTagInput;
};

export type MetaTagSection = "all" | "seo" | "openGraph" | "twitter";
