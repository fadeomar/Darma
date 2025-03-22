"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaArrowRight, FaArrowLeft, FaChevronRight } from "react-icons/fa";
import catArr from "../data/category.json";

const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const [openCategories, setOpenCategories] = useState<{
    [key: string]: boolean;
  }>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleCategory = (categoryName: string) => {
    setOpenCategories((prev) => ({
      ...prev,
      [categoryName]: !prev[categoryName],
    }));
  };

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const isCategoryActive = (categoryName: string, types: string[]) => {
    if (pathname === `/categories/${categoryName}`) return true;
    return types.some((type) => pathname === `/categories/${type}`);
  };

  return (
    <>
      {/* Toggle button */}
      <button
        className="fixed top-4 left-4 z-50 p-2 text-white bg-indigo-700 rounded-full hover:bg-indigo-600 transition-colors"
        onClick={toggleSidebar}
      >
        {isSidebarOpen ? <FaArrowLeft size={16} /> : <FaArrowRight size={16} />}
      </button>

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 md:hidden z-30"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={`relative flex-shrink-0 bg-gradient-to-b from-indigo-900 to-indigo-800 text-white min-h-screen shadow-lg transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "w-80" : "w-0 max-w-0"
        } z-40`}
      >
        <div className={`p-8 ${isSidebarOpen ? "block" : "hidden"}`}>
          <h2 className="text-2xl font-bold mb-10 tracking-wide mt-12 drop-shadow-md">
            Categories
          </h2>
          <ul>
            {catArr.categories.map((category) => {
              const catActive = isCategoryActive(category.name, category.types);
              return (
                <li key={category.name} className="mb-4">
                  <div
                    className={`relative flex items-center justify-between cursor-pointer p-3 rounded-lg transition-all duration-200 ${
                      catActive
                        ? "bg-indigo-700 text-indigo-200"
                        : "hover:bg-indigo-700/50"
                    }`}
                    onClick={() => toggleCategory(category.name)}
                  >
                    {catActive && (
                      <span className="absolute left-0 top-0 h-full w-1 bg-indigo-400 rounded-r animate-slide-in" />
                    )}
                    <Link
                      href={`/categories/${category.name}`}
                      className={`flex-1 text-lg ${
                        catActive ? "font-semibold" : ""
                      }`}
                    >
                      {category.name}
                    </Link>
                    <span
                      className={`ml-2 transition-transform duration-300 ease-in-out ${
                        openCategories[category.name] ? "rotate-90" : "rotate-0"
                      }`}
                    >
                      <FaChevronRight size={14} />
                    </span>
                  </div>
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      openCategories[category.name]
                        ? "max-h-96 opacity-100"
                        : "max-h-0 opacity-0"
                    }`}
                  >
                    <ul className="pl-6 mt-2 space-y-2">
                      {category.types.map((type) => {
                        const typeActive = pathname === `/categories/${type}`;
                        return (
                          <li key={type}>
                            <Link href={`/categories/${type}`}>
                              <div
                                className={`relative p-2 rounded-lg text-sm transition-all duration-200 ${
                                  typeActive
                                    ? "bg-indigo-600 text-white font-medium"
                                    : "hover:bg-indigo-700/70"
                                }`}
                              >
                                {typeActive && (
                                  <span className="absolute left-0 top-0 h-full w-1 bg-indigo-400 rounded-r animate-slide-in" />
                                )}
                                {type}
                              </div>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
