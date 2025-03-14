import React from "react";

type Category =
  | "ui-elements"
  | "text-effects"
  | "games"
  | "canvas-projects"
  | "shapes"
  | string
  | "backgrounds";

interface CategoryBadgeProps {
  category: Category;
}

const categoryStyles: Record<Category, string> = {
  "ui-elements": "bg-blue-600 text-white",
  "text-effects": "bg-purple-500 text-white",
  games: "bg-green-500 text-white",
  "canvas-projects": "bg-red-500 text-white",
  shapes: "bg-yellow-500 text-black",
  backgrounds: "bg-gray-700 text-white",
};

const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category }) => {
  return (
    <span
      className={`font-semibold text-sm px-4 py-1 rounded-full animate-pulse-category ${categoryStyles[category]}`}
    >
      {category.replace("-", " ")}
    </span>
  );
};

export default CategoryBadge;
