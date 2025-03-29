"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaArrowRight, FaArrowLeft } from "react-icons/fa";
import catArr from "../data/category.json";

const Sidebar: React.FC = () => {
  const pathname = usePathname();
  // const searchParams = useSearchParams();
  // const [openCategories, setOpenCategories] = useState<{
  //   [key: string]: boolean;
  // }>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false); // Default closed

  // useEffect(() => {
  //   const handleResize = () => {
  //     if (window.innerWidth >= 768) {
  //       setIsSidebarOpen(true); // Open by default on desktop
  //     } else if (isSidebarOpen === true) {
  //       setIsSidebarOpen(false); // Keep closed on mobile
  //     }
  //   };

  //   handleResize(); // Run on mount
  //   window.addEventListener("resize", handleResize);
  //   return () => window.removeEventListener("resize", handleResize);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  // Simplified to only check the category name
  const isCategoryActive = (categoryName: string) => {
    return pathname === `/categories/${categoryName}`;
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
        className={`fixed md:relative flex-shrink-0 bg-gradient-to-b from-indigo-900 to-indigo-800 text-white min-h-screen shadow-lg transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "w-80" : "w-0 max-w-0"
        } z-40`}
      >
        <div className={`p-8 ${isSidebarOpen ? "block" : "hidden"}`}>
          <Link href={"/"} title="Home">
            <h1 className="text-2xl font-bold mb-10 tracking-wide mt-12 drop-shadow-md">
              Home Page
            </h1>
          </Link>
          <Link href={"/categories"} title="Categories">
            <h2 className="text-2xl font-bold mb-10 tracking-wide mt-12 drop-shadow-md">
              Categories
            </h2>
          </Link>
          <ul>
            {catArr.categories.map((category) => {
              const catActive = isCategoryActive(category.name);
              return (
                <li key={category.name} className="mb-4">
                  <div
                    className={`relative flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${
                      catActive
                        ? "bg-indigo-700 text-indigo-200"
                        : "hover:bg-indigo-700/50"
                    }`}
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
