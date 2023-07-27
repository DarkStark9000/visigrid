import { FC } from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  // Determine the start and end page numbers to display.
  let startPage = currentPage - 2;
  let endPage = currentPage + 2;

  // Ensure we don't go out of bounds (below 1 or above totalPages).
  startPage = Math.max(startPage, 1);
  endPage = Math.min(endPage, totalPages);

  // Create an array of page numbers.
  const pageNumbers = [];
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="flex justify-center my-4 space-x-2">
      {currentPage > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className="px-3 py-1 border border-gray-500 rounded-md hover:bg-gray-200"
          >
            {"<<"}
          </button>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            className="px-3 py-1 border border-gray-500 rounded-md hover:bg-gray-200"
          >
            {"<"}
          </button>
        </>
      )}

      {pageNumbers.map((pageNumber) => (
        <button
          key={pageNumber}
          onClick={() => onPageChange(pageNumber)}
          className={`px-3 py-1 border border-gray-500 rounded-md ${
            pageNumber === currentPage ? "bg-gray-300" : "hover:bg-gray-200"
          }`}
        >
          {pageNumber}
        </button>
      ))}

      {currentPage < totalPages && (
        <>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            className="px-3 py-1 border border-gray-500 rounded-md hover:bg-gray-200"
          >
            {">"}
          </button>
          <button
            onClick={() => onPageChange(totalPages)}
            className="px-3 py-1 border border-gray-500 rounded-md hover:bg-gray-200"
          >
            {">>"}
          </button>
        </>
      )}
    </div>
  );
};

export default Pagination;
