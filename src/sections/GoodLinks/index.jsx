import resources from "./resources.json";
import { useState } from "react";
import Link from "next/link";
import { LinkIcon } from "lucide-react";

const CategoryList = ({ category }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const displayedItems = isExpanded
    ? category.items
    : category.items.slice(0, 10);

  return (
    <div className="category-container bg-white shadow-md rounded-lg p-6 flex flex-col border border-gray-200 hover:shadow-lg transition-shadow duration-300">
      {/* Category Header */}
      <div className="category-header mb-4">
        <h2 className="text-xl font-bold flex items-center text-gray-800">
          <LinkIcon className="w-6 h-6 mr-2 text-gray-500" />
          {category.category}
        </h2>
      </div>

      {/* List of Items */}
      <ul className="space-y-3">
        {displayedItems.map((item, index) => (
          <li
            key={index}
            className="category-item flex items-center pb-3 border-b border-gray-200 last:border-b-0"
          >
            <img
              src={item.favIcon}
              alt={`${item.name} favicon`}
              className="w-5 h-5 mr-2"
              onError={(e) =>
                (e.target.src = "https://placehold.jp/100x100.png")
              } // Optional: Add a fallback image
            />
            <Link
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-sm"
            >
              {item.name}
            </Link>
          </li>
        ))}
      </ul>

      {/* Toggle Button */}
      {category.items.length > 10 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-4 text-blue-600 hover:underline text-sm font-semibold focus:outline-none"
        >
          {isExpanded ? "SHOW LESS" : `SEE ALL ${category.items.length} SITES`}
        </button>
      )}
    </div>
  );
};

export default function GoodLinks() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
        Useful Developer Resources
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {resources.map((category, index) => (
          <CategoryList key={index} category={category} />
        ))}
      </div>
    </div>
  );
}
