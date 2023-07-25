// app/components/Pagination.tsx

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
  return (
    <div>
      {currentPage > 0 && (
        <button onClick={() => onPageChange(currentPage - 1)}>Previous</button>
      )}
      {currentPage < totalPages - 1 && (
        <button onClick={() => onPageChange(currentPage + 1)}>Next</button>
      )}
    </div>
  );
};

export default Pagination;
