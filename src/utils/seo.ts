export function generateSearchMeta(searchTerm: string, category?: string) {
  return {
    title: `${searchTerm}${
      category ? ` in ${category}` : ""
    } | Code Components`,
    description: `Find ${searchTerm} code components${
      category ? ` in the ${category} category` : ""
    }. ${
      category
        ? `Best ${category} components for your projects`
        : "Search through our collection of reusable code components"
    }`,
    keywords: [
      searchTerm,
      ...(category ? [category] : []),
      "code components",
      "web development",
      "reusable code",
    ],
  };
}
