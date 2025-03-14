import React, { useState } from "react";
import { CodeElement } from "@/types"; // Ensure this import is correct

interface PaginatedListProps {
  elements: CodeElement[];
  itemsPerPage: number;
  renderElement: (element: CodeElement) => React.ReactNode;
}

const AdminElementList: React.FC<PaginatedListProps> = ({
  elements,
  itemsPerPage,
  renderElement,
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate total pages
  const totalPages = Math.ceil(elements.length / itemsPerPage);

  // Get the elements for the current page
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentElements = elements.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="mb-11">
      {/* Render the current elements */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {currentElements.map((element) => renderElement(element))}
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-center items-center mt-6 space-x-2">
        {/* Previous Button */}
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 text-sm bg-gray-200 rounded disabled:opacity-50"
        >
          Previous
        </button>

        {/* Page Numbers */}
        {Array.from({ length: totalPages }, (_, index) => (
          <button
            key={index + 1}
            onClick={() => handlePageChange(index + 1)}
            className={`w-8 h-8 flex items-center justify-center rounded-full text-sm ${
              currentPage === index + 1
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {index + 1}
          </button>
        ))}

        {/* Next Button */}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 text-sm bg-gray-200 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default AdminElementList;
