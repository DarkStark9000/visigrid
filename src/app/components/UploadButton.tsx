import { ChangeEvent, FC } from "react";
import Papa from "papaparse";

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
  const handleUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // Reset the value of the input

    if (file) {
      if (isDataLoaded) {
        // Confirm with the user if they want to load a new file
        const confirm = window.confirm(
          "Are you sure you want to load a new file? This will replace the current data."
        );

        // If the user cancels, don't proceed with file loading
        if (!confirm) {
          return;
        }

        // If the user confirms, reset the current data
        resetData();
      }

      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const result = evt.target?.result as string;

          if (file.type === "application/json") {
            const data = JSON.parse(result);
            onFileLoaded(data, file.name);
          } else if (file.type === "text/csv") {
            Papa.parse(result, {
              complete: (results) => {
                onFileLoaded(results.data, file.name);
              },
            });
          } else {
            console.error(
              "Invalid file type. Please upload a JSON or CSV file."
            );
          }
        } catch (e) {
          console.error("Could not parse file.");
        }
      };
      reader.readAsText(file);
    }
  };

  return (
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
  );
};

export default UploadButton;
