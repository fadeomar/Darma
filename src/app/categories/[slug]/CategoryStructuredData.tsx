import { Category } from "@/types"; // Import your Category type

interface CategoryStructuredDataProps {
  category: Category; // Define the type for the category prop
}

export default function CategoryStructuredData({
  category,
}: CategoryStructuredDataProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${category.name} Code Components`,
    description: category.description,
    url: `https://yoursite.com/categories/${category.name}`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: category.types.map((type: string, index: number) => ({
        "@type": "ListItem",
        position: index + 1,
        name: type,
        url: `https://yoursite.com/categories/${category.name}?secCat=${type}`,
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
