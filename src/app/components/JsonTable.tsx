import { FC, useState, useEffect, ChangeEvent, useRef } from "react";
// import Pagination from "./Pagination";
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

  // const [currentPage, setCurrentPage] = useState(1);
  // const [rowsPerPage, setRowsPerPage] = useState(100);
  const [colsPerPage, setColsPerPage] = useState(10);

  const [filenameState, setFilename] = useState(
    filename.split(".").slice(0, -1).join(".")
  ); // remove extension
  const [fileExtension] = useState(filename.split(".").pop()); // get extension

  // const [pendingRowsPerPage, setPendingRowsPerPage] = useState(rowsPerPage);
  const [pendingColsPerPage, setPendingColsPerPage] = useState(colsPerPage);

  const [globalSearchTerm, setGlobalSearchTerm] = useState("");

  const [uniqueValues, setUniqueValues] = useState<Array<Set<string>>>([]);
  const [selectedValues, setSelectedValues] = useState<Array<Set<string>>>([]);

  const columns = colsPerPage
    ? tableData[0].slice(0, colsPerPage)
    : tableData[0];

  const rows = tableData.slice(1);

  // original code before web workers
  // useEffect(() => {
  //   const columns = tableData[0].slice(0, colsPerPage);
  //   const rows = tableData.slice(1);

  //   setSearchTerms(Array(columns.length).fill(""));

  //   let newUniqueValues = Array(columns.length)
  //     .fill(null)
  //     .map(() => new Set<string>());

  //   for (let i = 0; i < rows.length; i++) {
  //     for (let j = 0; j < rows[i].length; j++) {
  //       // Add unique values to the corresponding Set
  //       newUniqueValues[j].add(rows[i][j]);
  //     }
  //   }

  //   setUniqueValues(newUniqueValues);
  //   setSelectedValues(newUniqueValues.map(() => new Set()));
  // }, [tableData]);

  // new code to tackle web workers
  useEffect(() => {
    const worker = new Worker("/worker.js");

    worker.onmessage = (event) => {
      const newUniqueValues = event.data;
      setUniqueValues(
        newUniqueValues.map(
          (values: Iterable<unknown> | null | undefined) => new Set(values)
        )
      );
      setSelectedValues(newUniqueValues.map(() => new Set()));
    };

    worker.postMessage({ rows: tableData, colsPerPage });

    return () => {
      worker.terminate();
    };
  }, [tableData, colsPerPage]);

  const handleCheckboxChange = (
    colIndex: number,
    value: string,
    checked: boolean
  ) => {
    let newSelectedValues = [...selectedValues];
    if (checked) {
      newSelectedValues[colIndex].add(value);
    } else {
      newSelectedValues[colIndex].delete(value);
    }
    setSelectedValues(newSelectedValues);
  };

  const searchedRows = rows.filter(
    (row) =>
      searchTerms.every(
        (term, index) => !term || `${row[index]}`.includes(term)
      ) &&
      selectedValues.every(
        (set, index) => set.size === 0 || set.has(row[index])
      ) &&
      (globalSearchTerm === "" ||
        row.some((cell: any) =>
          String(cell).toLowerCase().includes(globalSearchTerm.toLowerCase())
        ))
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
  // const totalPages = rowsPerPage ? Math.ceil(rows.length / rowsPerPage) : 1;

  // Calculate start and end row index
  // const startRowIndex = (currentPage - 1) * rowsPerPage;
  // const endRowIndex = startRowIndex + rowsPerPage;

  // Slice rows for the current page
  // const rowsOnCurrentPage = rowsPerPage
  //   ? sortedRows.slice(startRowIndex, endRowIndex)
  //   : sortedRows;

  const rowsOnCurrentPage = sortedRows;

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
    // setCurrentPage(1);
  };

  const handleSort = (index: number) => {
    setSortColumn(index);
    setSortDirection(sortDirection === "asc" ? "desc" : "asc");
  };

  const handleGlobalSearch = (event: ChangeEvent<HTMLInputElement>) => {
    setGlobalSearchTerm(event.target.value);
  };

  const handleFilenameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFilename(e.target.value);
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
        <span className="px-2 flex justify-between w-[360px] ">
          <span className="flex justify-center items-center">
            <label htmlFor="rows">Rows</label>
            <input
              name="rows"
              className="w-[72px] ml-2 p-2 rounded-md bg-transparent text-sm outline-none border border-slate-200 hover:border-2"
              type="text"
              placeholder="Enter no of Rows"
              // value={pendingRowsPerPage}
              value={rows.length}
              contentEditable="false"
              // onChange={(e) => setPendingRowsPerPage(Number(e.target.value))}
            />
          </span>
          <span className="flex justify-center items-center">
            <label htmlFor="cols">Cols</label>
            <input
              name="cols"
              className="w-[72px] ml-2 p-2 rounded-md bg-transparent text-sm outline-none border border-slate-200 hover:border-2"
              type="text"
              placeholder="Enter no of cols"
              value={pendingColsPerPage}
              onChange={(e) => setPendingColsPerPage(Number(e.target.value))}
            />
          </span>
          <button
            className="outline-none text-xs m-1 p-2 border border-gray-600 rounded-md tracking-tight  "
            onClick={() => {
              // setRowsPerPage(pendingRowsPerPage);
              setColsPerPage(pendingColsPerPage);
            }}
            style={{
              boxShadow: `rgba(99, 99, 99, 0.2) 0px 2px 8px 0px`,
              transition: "box-shadow .3s ease",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.boxShadow = "0 0 10px rgba(0,0,0,0.3)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.boxShadow = "0 0 5px rgba(0,0,0,0.1)")
            }
          >
            View Now →
          </button>
        </span>

        <span>
          <input
            className="m-2 p-2 w-full rounded-md bg-transparent outline-none text-sm border border-slate-400 hover:border-2"
            type="text"
            value={globalSearchTerm}
            onChange={handleGlobalSearch}
            placeholder="Search anything..."
            style={{
              boxShadow: `rgba(99, 99, 99, 0.2) 0px 2px 8px 0px`,
              transition: "box-shadow .3s ease",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.boxShadow = "0 0 10px rgba(0,0,0,0.3)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.boxShadow = "0 0 5px rgba(0,0,0,0.1)")
            }
          />
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
            style={{
              boxShadow: `rgba(50, 50, 93, 0.25) 0px 2px 5px -1px`,
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.boxShadow =
                "0 0 10px rgba(63, 34, 168,0.45)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.boxShadow = "0 0 5px rgba(0,0,0,0.24)")
            }
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
              className="flex justify-between items-center font-bold p-3 uppercase cursor-pointer sticky top-0 bg-slate-50"
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
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
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

          {columns.map((_: any, index: any) => {
            const [isOpen, setIsOpen] = useState(false);
            const dropdownRef = useRef<HTMLDivElement>(null);

            useEffect(() => {
              const handleClickOutside = (event: { target: any }) => {
                if (
                  dropdownRef.current &&
                  !dropdownRef.current.contains(event.target)
                ) {
                  setIsOpen(false);
                }
              };

              document.addEventListener("mousedown", handleClickOutside);
              return () => {
                document.removeEventListener("mousedown", handleClickOutside);
              };
            }, []);

            return (
              <div
                key={index}
                className="flex items-center justify-between p-2 border-b border-gray-200 sticky top-12 bg-slate-50"
              >
                <input
                  className="px-2 py-1 outline-none border rounded-md"
                  type="text"
                  value={searchTerms[index] || ""}
                  onChange={(e) => handleSearch(index, e.target.value)}
                  placeholder="Search term"
                />
                <div
                  className="relative inline-block text-left"
                  ref={dropdownRef}
                >
                  <div>
                    <button
                      type="button"
                      className="flex justify-center w-full rounded-md border border-gray-300 py-[6px] px-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-indigo-500"
                      id="options-menu"
                      aria-expanded="true"
                      aria-haspopup="true"
                      onClick={() => setIsOpen(!isOpen)}
                    >
                      ▾
                    </button>
                  </div>

                  {isOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 overflow-auto max-h-60">
                      <div
                        className="py-1"
                        role="menu"
                        aria-orientation="vertical"
                        aria-labelledby="options-menu"
                      >
                        {uniqueValues[index] ? (
                          Array.from(uniqueValues[index]).map(
                            (value: string) => (
                              <div
                                className="checkbox-option px-4 py-2"
                                key={value}
                              >
                                <input
                                  type="checkbox"
                                  value={value}
                                  onChange={(e) =>
                                    handleCheckboxChange(
                                      index,
                                      value,
                                      e.target.checked
                                    )
                                  }
                                />
                                <label className="ml-2 text-gray-700 text-sm">
                                  {value}
                                </label>
                              </div>
                            )
                          )
                        ) : (
                          <p className="px-4 py-2 text-gray-700 text-sm">
                            Loading...
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {rowsOnCurrentPage.map((row, rowIndex) =>
            (colsPerPage ? row.slice(0, colsPerPage) : row).map(
              (value: any, colIndex: any) => (
                <div key={`${rowIndex}-${colIndex}`}>
                  <input
                    className="bg-transparent px-4 py-2 outline-2outline-blue-800 rounded-mdborder-none"
                    type="text"
                    value={value}
                    onChange={(e) =>
                      handleCellChange(rowIndex, colIndex, e.target.value)
                    }
                  />
                </div>
              )
            )
          )}
        </div>
      </div>
      {/* <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      /> */}
    </>
  );
};

export default JsonTable;
