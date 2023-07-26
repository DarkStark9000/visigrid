import { FC, useState } from "react";

interface JsonTableProps {
  data: any[];
}

const JsonTable: FC<JsonTableProps> = ({ data }) => {
  const [tableData, setTableData] = useState(data);
  const [sortColumn, setSortColumn] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [searchTerms, setSearchTerms] = useState<string[]>([]);

  const columns = tableData[0];
  const rows = tableData.slice(1);

  const searchedRows = rows.filter((row) =>
    searchTerms.every((term, index) => !term || `${row[index]}`.includes(term))
  );

  const sortedRows = [...searchedRows].sort((a, b) => {
    if (sortColumn !== null) {
      const valA = a[sortColumn];
      const valB = b[sortColumn];
      const numA = Number(valA);
      const numB = Number(valB);
      const dateA = new Date(valA);
      const dateB = new Date(valB);

      if (!isNaN(numA) && !isNaN(numB)) {
        // If values are numbers, compare as numbers
        return sortDirection === "asc" ? numA - numB : numB - numA;
      } else if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
        // If values are dates, compare as dates
        return sortDirection === "asc"
          ? dateA.getTime() - dateB.getTime()
          : dateB.getTime() - dateA.getTime();
      } else {
        // Compare as strings
        return sortDirection === "asc"
          ? `${valA}`.localeCompare(`${valB}`)
          : `${valB}`.localeCompare(`${valA}`);
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

  const handleSearch = (index: number, value: string) => {
    const updatedSearchTerms = [...searchTerms];
    updatedSearchTerms[index] = value;
    setSearchTerms(updatedSearchTerms);
  };

  const handleSort = (index: number) => {
    setSortColumn(index);
    setSortDirection(sortDirection === "asc" ? "desc" : "asc");
  };

  return (
    <div className="overflow-auto h-custom w-custom bg-gray-50 bg-opacity-20 backdrop-blur-lg mx-auto mt-12 border border-black rounded-lg">
      <div
        className="grid gap-0"
        style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}
      >
        {columns.map((column: any, index: any) => (
          <div
            key={index}
            className="font-bold p-4 border-b border-neutral-200 uppercase cursor-pointer sticky top-0 backdrop-blur-[90px]"
            onClick={() => handleSort(index)}
          >
            {column}
            <img src="/src/app/filter.svg" alt="Click to Filter" />
            <span>
              {sortColumn === index
                ? sortDirection === "asc"
                  ? "↓"
                  : "↑"
                : ""}
            </span>
          </div>
        ))}
        {columns.map((_, index: any) => (
          <div
            key={index}
            className="p-2 border-b border-slate-900 sticky top-14 backdrop-blur-3xl"
          >
            <input
              className="bg-transparent p-2 outline-2	outline-blue-800 rounded-md	border-none	"
              type="text"
              value={searchTerms[index] || ""}
              onChange={(e) => handleSearch(index, e.target.value)}
              placeholder="put your search term"
            />
          </div>
        ))}
        {sortedRows.map((row, rowIndex) =>
          row.map((value: any, colIndex: any) => (
            <div key={`${rowIndex}-${colIndex}`}>
              <input
                className="bg-transparent px-4 py-2 outline-2	outline-blue-800 rounded-md	border-none	"
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
