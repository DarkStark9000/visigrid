import { FC, useState } from "react";

interface JsonTableProps {
  data: any[];
}

const JsonTable: FC<JsonTableProps> = ({ data }) => {
  const [tableData, setTableData] = useState(data);
  const [sortColumn, setSortColumn] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const columns = tableData[0];
  const rows = tableData.slice(1);

  const sortedRows = [...rows].sort((a, b) => {
    if (sortColumn !== null) {
      if (a[sortColumn] < b[sortColumn]) {
        return sortDirection === "asc" ? -1 : 1;
      }
      if (a[sortColumn] > b[sortColumn]) {
        return sortDirection === "asc" ? 1 : -1;
      }
    }
    return 0;
  });

  const handleCellChange = (
    rowIndex: number,
    colIndex: number,
    value: string
  ) => {
    const updatedRows = [...rows];
    updatedRows[rowIndex][colIndex] = value;
    setTableData([columns, ...updatedRows]);
  };

  const handleSort = (index: number) => {
    setSortColumn(index);
    setSortDirection(sortDirection === "asc" ? "desc" : "asc");
  };

  return (
    <div className="overflow-auto h-custom w-custom bg-gray-50 bg-opacity-20 backdrop-blur-lg mx-auto mt-12 border border-black rounded-lg p-4">
      <div
        className="grid gap-0"
        style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}
      >
        {columns.map((column: any, index: any) => (
          <div
            key={index}
            className="font-bold p-2 border-b border-black uppercase cursor-pointer"
            onClick={() => handleSort(index)}
          >
            {column}
            <span>
              {sortColumn === index
                ? sortDirection === "asc"
                  ? "↓"
                  : "↑"
                : ""}
            </span>
          </div>
        ))}
        {sortedRows.map((row, rowIndex) =>
          row.map((value: any, colIndex: any) => (
            <div key={`${rowIndex}-${colIndex}`}>
              <input
                className="bg-transparent p-2 outline-2	outline-blue-800 rounded-md	border-none	"
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
    </div>
  );
};

export default JsonTable;
