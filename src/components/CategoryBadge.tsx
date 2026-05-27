import React from "react";
import { Badge } from "@/components/ui";

interface CategoryBadgeProps {
  category: string;
}

const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category }) => {
  return <Badge variant="outline">{category.replaceAll("-", " ")}</Badge>;
};

export default CategoryBadge;
