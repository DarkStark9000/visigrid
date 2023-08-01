import { ChangeEvent, FC, useState } from "react";
import Papa from "papaparse";

const flattenObject = (
  obj: any,
  prefix: string = "",
  res: { [key: string]: any } = {}
) => {
  Object.keys(obj).forEach((key) => {
    const pre = prefix.length ? prefix + "." : "";
    if (
      typeof obj[key] === "object" &&
      obj[key] !== null &&
      !Array.isArray(obj[key])
    ) {
      flattenObject(obj[key], pre + key, res);
    } else {
      res[pre + key] = obj[key];
    }
  });
  return res;
};

interface UploadButtonProps {
  onFileLoaded: (data: any, filename: string) => void;
  resetData: () => void;
  isDataLoaded: boolean;
}

const UploadButton: FC<UploadButtonProps> = ({
  onFileLoaded,
  resetData,
  isDataLoaded,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // Reset
    if (file) {
      if (isDataLoaded) {
        // Confirm with user
        const confirm = window.confirm(
          "Are you sure you want to load a new file? This will replace the current data."
        );

        // user cancels
        if (!confirm) {
          return;
        }

        // If user confirms
        resetData();
      }

      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const result = evt.target?.result as string;

          if (file.type === "application/json") {
            let data = JSON.parse(result);
            if (Array.isArray(data)) {
              data = data.map((obj) => flattenObject(obj));
            } else {
              data = [flattenObject(data)];
            }
            onFileLoaded(data, file.name);
          } else if (file.type === "text/csv") {
            Papa.parse(result, {
              complete: (results) => {
                const [headers, ...data] = results.data;
                const formattedData = data.map((d: any) => {
                  return (headers as string[]).reduce(
                    (obj: any, header: string, i: number) => {
                      obj[header] = (d as (string | number)[])[i];
                      return obj;
                    },
                    {}
                  );
                });

                onFileLoaded(formattedData, file.name);
              },
            });
          } else {
            setIsModalOpen(true);
          }
        } catch (e) {
          setIsModalOpen(true);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <>
      <label
        className="inline-block px-8 py-4 bg-indigo-700 text-white cursor-pointer rounded text-xl font-normal tracking-normal hover:bg-blue-600"
        style={{
          boxShadow: `rgba(0, 0, 0, 0.24) 0px 3px 8px`,
        }}
      >
        ↑ Open File
        <input
          type="file"
          accept=".json,.csv"
          onChange={handleUpload}
          className="hidden"
        />
      </label>
      {isModalOpen && (
        <div className="fixed z-50 inset-0 flex items-center justify-center">
          <div className="absolute w-full h-full bg-gray-500 opacity-50"></div>
          <div className="bg-white w-11/12 md:max-w-md mx-auto rounded shadow-lg z-50 overflow-y-auto">
            <div className="py-4 text-left px-6">
              <div className="flex justify-between items-center pb-3">
                <p className="text-2xl font-semibold text-red-600">
                  Invalid File
                </p>
                <div
                  className="cursor-pointer z-50"
                  onClick={() => setIsModalOpen(false)}
                >
                  <svg
                    className="fill-current text-black"
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                  >
                    <path d="M14.53 4.53l-1.06-1.06L9 7.94 4.53 3.47 3.47 4.53 7.94 9l-4.47 4.47 1.06 1.06L9 10.06l4.47 4.47 1.06-1.06L10.06 9z"></path>
                  </svg>
                </div>
              </div>
              <p className="text-base font-medium tracking-tight">
                Please upload a valid & correctly formatted JSON or CSV file.
              </p>
              <div className="flex justify-end pt-2">
                <button
                  className="text-base font-semibold tracking-wide hover: outline-blue-700 modal-close py-2 px-6 bg-blue-500 p-2 rounded-sm text-white "
                  onClick={() => setIsModalOpen(false)}
                >
                  Okay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UploadButton;
