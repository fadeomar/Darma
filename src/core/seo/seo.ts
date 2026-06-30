export type CoreSeoInput = {
  title: string;
  description: string;
  path?: string;
  image?: string;
  keywords?: string[];
};

export const buildCoreTitle = (title: string, siteName = "Darma") =>
  title.includes(siteName) ? title : `${title} | ${siteName}`;

export const buildCoreSeo = ({ title, description, path = "/", image, keywords }: CoreSeoInput) => ({
  title: buildCoreTitle(title),
  description,
  alternates: {
    canonical: path,
  },
  openGraph: {
    title: buildCoreTitle(title),
    description,
    url: path,
    images: image ? [{ url: image }] : undefined,
  },
  twitter: {
    card: "summary_large_image" as const,
    title: buildCoreTitle(title),
    description,
    images: image ? [image] : undefined,
  },
  keywords,
});
