import { FC, useState } from "react";
import Pagination from "./Pagination";

interface JsonTableProps {
  data: any[];
}

const JsonTable: FC<JsonTableProps> = ({ data }) => {
  const [tableData, setTableData] = useState(data);
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 100; // Number of rows per page

  const columns = tableData[0];
  const rows = tableData.slice(1);
  const totalPages = Math.ceil(rows.length / pageSize);

  const displayedRows = rows.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize
  );

  const handleCellChange = (
    rowIndex: number,
    colIndex: number,
    value: string
  ) => {
    const updatedRows = [...rows];
    updatedRows[rowIndex][colIndex] = value;
    setTableData([columns, ...updatedRows]);
  };

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns.length}, 1fr)`,
          gap: "10px",
        }}
      >
        {columns.map((column: any, index: any) => (
          <div
            key={index}
            style={{ fontWeight: "bold", borderBottom: "1px solid black" }}
          >
            {column}
          </div>
        ))}
        {displayedRows.map((row, rowIndex) =>
          row.map((value: any, colIndex: any) => (
            <div key={`${rowIndex}-${colIndex}`}>
              <input
                type="text"
                value={value}
                onChange={(e) =>
                  handleCellChange(rowIndex, colIndex, e.target.value)
                }
              />
            </div>
          ))
        )}
      </div>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </>
  );
};

export default JsonTable;
