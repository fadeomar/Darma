"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import catArr from "../data/category.json";

const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const [openCategories, setOpenCategories] = useState<{
    [key: string]: boolean;
  }>({});

  const toggleCategory = (categoryName: string) => {
    setOpenCategories((prev) => ({
      ...prev,
      [categoryName]: !prev[categoryName],
    }));
  };

  return (
    <div className="w-64 bg-gray-800 text-white min-h-screen p-4">
      <h2 className="text-lg font-bold mb-4">Categories</h2>
      <ul>
        {catArr.categories.map((category) => (
          <li key={category.name} className="mb-2">
            <div
              className="flex items-center justify-between cursor-pointer p-2 rounded hover:bg-gray-700"
              onClick={(e) => {
                if ((e.target as HTMLElement).tagName !== "SPAN") {
                  toggleCategory(category.name);
                }
              }}
            >
              <Link
                href={`/categories/${category.name}`}
                className={`flex-1 ${
                  pathname === `/categories/${category.name}`
                    ? "text-blue-400"
                    : ""
                }`}
              >
                {category.name}
              </Link>
              <span
                className="ml-2 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCategory(category.name);
                }}
              >
                {openCategories[category.name] ? "▼" : "▶"}
              </span>
            </div>
            {openCategories[category.name] && (
              <ul className="pl-6 mt-1">
                {category.types.map((type) => (
                  <li key={type} className="mb-1">
                    {/* <Link href={`/categories/${category.name}/${type}`}> */}
                    <Link href={`/categories/${type}`}>
                      <div
                        className={`p-2 rounded ${
                          pathname === `/categories/${type}`
                            ? "bg-blue-500"
                            : "hover:bg-gray-700"
                        }`}
                      >
                        {type}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
