import {
  FC,
  useState,
  useEffect,
  ChangeEvent,
  useRef,
  createRef,
  useMemo,
} from "react";
import jsFileDownload from "js-file-download";
import * as XLSX from "xlsx";
import Papa from "papaparse";

interface JsonTableProps {
  data: any[];
  filename: string;
}

const JsonTable: FC<JsonTableProps> = ({ data, filename }) => {
  const [columns, setColumns] = useState(Object.keys(data[0]));
  const [tableData, setTableData] = useState(data);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const rows = tableData;

  const [colsPerPage, setColsPerPage] = useState(columns.length);
  const [pendingColsPerPage, setPendingColsPerPage] = useState(colsPerPage);

  const [sortColumn, setSortColumn] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [searchTerms, setSearchTerms] = useState<string[]>([]);

  const [filenameParts, setFilenameParts] = useState(filename.split("."));
  const [filenameState, setFilename] = useState(
    filenameParts.slice(0, -1).join(".")
  );
  const [fileExtension] = useState(filenameParts.pop());

  const [globalSearchTerm, setGlobalSearchTerm] = useState("");

  const [uniqueValues, setUniqueValues] = useState<Array<Set<string>>>([]);
  const [selectedValues, setSelectedValues] = useState<Array<Set<string>>>([]);

  const [displayedRows, setDisplayedRows] = useState(20);
  const containerRef = useRef<HTMLDivElement>(null);

  const [debouncedColsPerPage, setDebouncedColsPerPage] =
    useState(pendingColsPerPage);

  const [isOpen, setIsOpen] = useState(new Array(columns.length).fill(false));
  const dropdownRef = useRef(columns.map(() => createRef<HTMLDivElement>()));

  useEffect(() => {
    const worker = new Worker("/worker.js");

    worker.onmessage = (event) => {
      const newUniqueValues = event.data;
      setUniqueValues(
        newUniqueValues.map(
          (values: Iterable<unknown> | null | undefined) => new Set(values)
        )
      );

      setSelectedValues((prevSelectedValues) => {
        const newSelectedValues = newUniqueValues.map((_: any, index: any) =>
          prevSelectedValues[index as number]
            ? prevSelectedValues[index as number]
            : new Set()
        );

        return newSelectedValues;
      });
    };

    worker.onerror = (error) => {
      console.error("An error occurred in the Web Worker:", error);
    };

    worker.postMessage({
      rows: tableData,
      colsPerPage,
    });

    return () => {
      worker.terminate();
    };
  }, [tableData, colsPerPage]);

  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedColsPerPage(pendingColsPerPage);
    }, 500); // 500ms delay

    return () => {
      clearTimeout(timerId);
    };
  }, [pendingColsPerPage]);

  useEffect(() => {
    setColsPerPage(debouncedColsPerPage);
  }, [debouncedColsPerPage]);

  // to handle scrolling for lazy loading
  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollHeight, scrollTop, clientHeight } = containerRef.current;
      if (scrollTop + clientHeight >= scrollHeight) {
        setDisplayedRows((displayedRows) => displayedRows + 20);
      }
    }
  };

  // to close dropdown when clicked outside
  const handleClickOutside = (event: { target: any }) => {
    const newIsOpen = isOpen.map((open, index) => {
      const ref = dropdownRef.current[index];
      if (ref && ref.current && !ref.current.contains(event.target)) {
        return false;
      }
      return open;
    });
    setIsOpen(newIsOpen);
  };

  const handleCheckboxChange = (
    colIndex: number,
    value: string,
    checked: boolean
  ) => {
    setSelectedValues((currentSelectedValues) => {
      const newSelectedValues = [...currentSelectedValues];

      if (checked) {
        newSelectedValues[colIndex].add(value);
      } else {
        newSelectedValues[colIndex].delete(value);
      }

      return newSelectedValues;
    });
  };

  const searchedRows = rows.filter(
    (row) =>
      searchTerms.every(
        (term, index) => !term || `${Object.values(row)[index]}`.includes(term)
      ) &&
      selectedValues.every(
        (set, index) =>
          set.size === 0 || set.has(Object.values(row)[index] as string)
      ) &&
      (globalSearchTerm === "" ||
        Object.values(row).some((cell: any) =>
          String(cell).toLowerCase().includes(globalSearchTerm.toLowerCase())
        ))
  );

  const sortedRows = useMemo(() => {
    return [...searchedRows].sort((a, b) => {
      if (sortColumn !== null) {
        const columnKey = columns[sortColumn]; // Convert sortColumn to string key
        const valA = a[columnKey];
        const valB = b[columnKey];
        const numA = Number(valA);
        const numB = Number(valB);
        const dateA = new Date(valA);
        const dateB = new Date(valB);

        if (!isNaN(numA) && !isNaN(numB)) {
          return sortDirection === "asc" ? numA - numB : numB - numA;
        } else if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
          return sortDirection === "asc"
            ? dateA.getTime() - dateB.getTime()
            : dateB.getTime() - dateA.getTime();
        } else {
          return sortDirection === "asc"
            ? `${valA}`.localeCompare(`${valB}`)
            : `${valB}`.localeCompare(`${valA}`);
        }
      }

      return 0;
    });
  }, [searchedRows, sortColumn, sortDirection]);

  const rowsOnCurrentPage = sortedRows.slice(0, displayedRows);

  const handleCellChange = (
    rowIndex: number,
    column: string,
    value: string
  ) => {
    const updatedRows = [...rows];
    updatedRows[rowIndex][column] = value;
    setTableData(updatedRows);
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

  const handleGlobalSearch = (event: ChangeEvent<HTMLInputElement>) => {
    setGlobalSearchTerm(event.target.value);
  };

  const handleFilenameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newFilename = e.target.value;
    setFilename(newFilename);
    setFilenameParts(newFilename.split("."));
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index); // call setDraggedIdx to update the state
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIdx !== null) {
      const newColumns = [...columns];
      [newColumns[draggedIdx as number], newColumns[index]] = [
        newColumns[index],
        newColumns[draggedIdx as number],
      ];
      setColumns(newColumns);
      setDraggedIdx(null);
    }
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
    jsFileDownload(data, `${filenameState}.${fileType}`);
  };

  return (
    <div onMouseDown={handleClickOutside}>
      <div
        className="mt-4 mx-auto p-1 h-[48px] text-black text-sm
          flex justify-between items-center font-normal tracking-wide border border-solid border-black rounded-md w-5/6 backdrop-blur-2xl"
      >
        <button
          className="p-2 underline underline-offset-4 mx-4  "
          onClick={() => setSelectedValues(uniqueValues.map(() => new Set()))}
        >
          Reset Filters
        </button>
        <span className="px-1 flex justify-between w-[240px]  ">
          <span className="flex justify-center items-center">
            <label htmlFor="rows">Rows</label>
            <input
              name="rows"
              className="w-[72px] p-2 rounded-md bg-transparent text-sm outline-none  "
              type="text"
              placeholder="Enter no of Rows"
              value={rows.length}
              readOnly
            />
          </span>
          <span className="flex justify-center items-center">
            <label htmlFor="cols">Cols</label>
            <input
              onMouseEnter={(e) =>
                (e.currentTarget.style.boxShadow = "0 0 10px rgba(0,0,0,0.3)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.boxShadow = "0 0 5px rgba(0,0,0,0.1)")
              }
              name="cols"
              className="w-[72px] ml-2 p-2 rounded-md bg-transparent text-sm outline-none border border-slate-400  "
              type="text"
              placeholder="Enter no of cols"
              value={pendingColsPerPage}
              onChange={(e) => setPendingColsPerPage(Number(e.target.value))}
            />
          </span>
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

      <div
        className="overflow-auto h-custom w-5/6 bg-gray-50 bg-opacity-60 backdrop-blur-sm mx-auto mt-4 border border-black rounded-lg"
        ref={containerRef}
        onScroll={handleScroll}
      >
        <div
          className="grid gap-0"
          style={{ gridTemplateColumns: `repeat(${colsPerPage}, 1fr)` }}
        >
          {columns.slice(0, colsPerPage).map((column: any, index: any) => (
            <div
              key={index}
              draggable="true"
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              className="flex justify-between items-center font-bold p-2 uppercase cursor-pointer sticky top-0 bg-slate-50"
            >
              {column}
              <span
                onClick={() => handleSort(index)}
                className="flex h-8 w-10 items-center border border-dotted rounded-md p-1 border-slate-500"
              >
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

          {columns.slice(0, colsPerPage).map((_: any, index: any) => {
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
                  ref={dropdownRef.current[index]}
                >
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        const newIsOpen = [...isOpen];
                        newIsOpen[index] = !newIsOpen[index];
                        setIsOpen(newIsOpen);
                      }}
                      className="flex justify-center w-full rounded-md border border-gray-300 py-[6px] px-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-indigo-500"
                      id="options-menu"
                      aria-expanded="true"
                      aria-haspopup="true"
                    >
                      ▾
                    </button>
                  </div>
                  {isOpen[index] && (
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
                                  checked={selectedValues[index as number].has(
                                    value
                                  )}
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
            columns.slice(0, colsPerPage).map((column, colIndex) => (
              <div key={`${rowIndex}-${colIndex}`}>
                <input
                  className="mt-1 bg-transparent px-4 py-2 outline-2 outline-blue-800 rounded-md border-none"
                  type="text"
                  value={row[column]}
                  onChange={(e) =>
                    handleCellChange(rowIndex, column, e.target.value)
                  }
                />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default JsonTable;
