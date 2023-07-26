// app/components/UploadButton.tsx

import { ChangeEvent, FC } from "react";
import Papa from "papaparse";

interface UploadButtonProps {
  onFileLoaded: (data: any) => void;
}

const UploadButton: FC<UploadButtonProps> = ({ onFileLoaded }) => {
  const handleUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const result = evt.target?.result as string;

          if (file.type === "application/json") {
            const data = JSON.parse(result);
            onFileLoaded(data);
          } else if (file.type === "text/csv") {
            Papa.parse(result, {
              complete: (results) => {
                onFileLoaded(results.data);
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
    <label className="inline-block px-8 py-4 bg-indigo-600 text-white cursor-pointer rounded text-lg font-normal tracking-normal shadow-LG">
      ↥ Open File
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
