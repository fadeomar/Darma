import { Category } from "@/types";

interface CategoryStructuredDataProps {
  category: Category;
}

export default function CategoryStructuredData({
  category,
}: CategoryStructuredDataProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${category.name} code components`,
    description: category.description,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: category.types.map((type: string, index: number) => ({
        "@type": "ListItem",
        position: index + 1,
        name: type,
      })),
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
