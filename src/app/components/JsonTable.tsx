import { FC, useState, useEffect, ChangeEvent } from "react";
import Pagination from "./Pagination";
import jsFileDownload from "js-file-download";
import * as XLSX from "xlsx";
import Papa from "papaparse";

interface JsonTableProps {
  data: any[];
  filename: string;
}

const JsonTable: FC<JsonTableProps> = ({ data, filename }) => {
  const [tableData, setTableData] = useState(data);
  const [sortColumn, setSortColumn] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [searchTerms, setSearchTerms] = useState<string[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [colsPerPage, setColsPerPage] = useState(10);
  const [filenameState, setFilename] = useState(
    filename.split(".").slice(0, -1).join(".")
  ); // remove extension
  const [fileExtension] = useState(filename.split(".").pop()); // get extension

  const columns = tableData[0].slice(0, colsPerPage);
  const rows = tableData.slice(1);

  // Effect to update columns and rows on page whenever tableData changes
  useEffect(() => {
    const columns = tableData[0].slice(0, colsPerPage);
    const rows = tableData.slice(1);

    setSearchTerms(Array(columns.length).fill("")); // reset search terms
  }, [tableData]);

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

  // Calculate total pages
  const totalPages = Math.ceil(rows.length / rowsPerPage);

  // Calculate start and end row index
  const startRowIndex = (currentPage - 1) * rowsPerPage;
  const endRowIndex = startRowIndex + rowsPerPage;

  // Slice rows for the current page
  const rowsOnCurrentPage = sortedRows.slice(startRowIndex, endRowIndex);

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

  const handleFilenameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFilename(e.target.value);
  };

  const handleRowsChange = (e: ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(Number(e.target.value));
  };

  const handleColsChange = (e: ChangeEvent<HTMLInputElement>) => {
    setColsPerPage(Number(e.target.value));
  };

  const downloadTableData = () => {
    const fileType = fileExtension;
    let data: BlobPart;

    switch (fileType) {
      case "csv":
        data = Papa.unparse(tableData);
        break;
      case "json":
        data = JSON.stringify(tableData);
        break;
      case "xlsx":
        const ws = XLSX.utils.aoa_to_sheet(tableData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
        data = XLSX.write(wb, { bookType: "xlsx", type: "binary" });
        break;
      default:
        return;
    }

    jsFileDownload(data, `${filenameState}.${fileExtension}`);
  };

  return (
    <>
      <div
        className="mt-4 mx-auto p-1 h-[48px] text-black text-sm
          flex justify-between items-center font-normal tracking-wide border border-solid border-black rounded-md w-5/6 backdrop-blur-2xl"
      >
        <span className="mx-4 flex justify-between w-[260px] ">
          <span className="flex justify-center items-center">
            <label htmlFor="rows">Rows</label>
            <input
              name="rows"
              className="w-[72px] ml-2 p-2 rounded-md bg-transparent text-sm outline-none hover:border-2 border-indigo-900"
              type="text"
              placeholder="Enter no of Rows"
              value={rowsPerPage}
              onChange={handleRowsChange}
            />
          </span>
          <span className="flex justify-center items-center">
            <label htmlFor="cols">Cols</label>
            <input
              name="cols"
              className="w-[72px] ml-2 p-2 rounded-md bg-transparent text-sm outline-none hover:border-2 border-indigo-900"
              type="text"
              placeholder="Enter no of cols"
              value={colsPerPage}
              onChange={handleColsChange}
            />
          </span>
        </span>
        <span className="file_download flex items-center justify-between">
          <span className="mr-4">
            <label htmlFor="file_name">Filename</label>
            <input
              className="ml-2 p-2 w-56 rounded-md bg-transparent outline-none text-sm hover:border-2 border-indigo-900"
              name="file_name"
              type="text"
              value={filenameState}
              onChange={handleFilenameChange}
            />
          </span>
          <button
            className="outline-none text-lg px-[2.8rem] py-1 border-2 border-indigo-800 rounded-md"
            onClick={downloadTableData}
          >
            Download
          </button>
        </span>
      </div>

      <div className="overflow-auto h-custom w-5/6 bg-gray-50 bg-opacity-60 backdrop-blur-sm mx-auto mt-4 border border-black rounded-lg">
        <div
          className="grid gap-0"
          style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}
        >
          {columns.map((column: any, index: any) => (
            <div
              key={index}
              className="flex justify-between items-center font-bold p-4 border-b border-neutral-200 uppercase cursor-pointer sticky top-0 bg-slate-50"
              onClick={() => handleSort(index)}
            >
              {column}
              <span className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>

                <span>
                  {sortColumn === index
                    ? sortDirection === "asc"
                      ? "↓"
                      : "↑"
                    : ""}
                </span>
              </span>
            </div>
          ))}
          {columns.map((_: any, index: any) => (
            <div
              key={index}
              className="p-2 border-b border-slate-900 sticky top-14 bg-slate-50"
            >
              <input
                className=" p-2 outline-1 rounded-sm	border-none	"
                type="text"
                value={searchTerms[index] || ""}
                onChange={(e) => handleSearch(index, e.target.value)}
                placeholder="put your search term"
              />
            </div>
          ))}

          {rowsOnCurrentPage.map((row, rowIndex) =>
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
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </>
  );
};

export default JsonTable;
