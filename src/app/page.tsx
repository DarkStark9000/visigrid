"use client";

import { useState } from "react";
import UploadButton from "./components/UploadButton";
import JsonTable from "./components/JsonTable";

export default function Home() {
  const [jsonData, setJsonData] = useState<any[]>([]);

  const handleFileLoaded = (data: any) => {
    if (Array.isArray(data)) {
      setJsonData(data);
    } else {
      console.error("Uploaded JSON file must contain an array of objects");
    }
  };

  return (
    <>
      <nav className="flex justify-between mx-auto mt-12 p-6 text-2xl font-semibold tracking-wide border border-solid border-white rounded-xl w-5/6">
        Visigrid
      </nav>
      <div className="justify-end	">
        <UploadButton onFileLoaded={handleFileLoaded} />
        {jsonData.length > 0 && <JsonTable data={jsonData} />}
      </div>
    </>
  );
}
