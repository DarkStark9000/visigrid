"use client";

import { useState } from "react";
import UploadButton from "./components/UploadButton";
import JsonTable from "./components/JsonTable";

export default function Home() {
  const [jsonData, setJsonData] = useState<any[]>([]);
  const [filename, setFilename] = useState<string>("");

  const handleFileLoaded = (data: any, filename: string) => {
    if (Array.isArray(data)) {
      setJsonData(data);
      setFilename(filename);
    } else {
      console.error("Uploaded JSON file must contain an array of objects");
    }
  };

  return (
    <>
      <div
        className="absolute w-72 h-72 rounded-full bg-gradient-to-r from-gradient-start to-gradient-end -z-10"
        style={{
          top: `10vh`,
          left: `10vw`,
        }}
      />
      <div
        className="absolute w-72 h-72 rounded-full bg-gradient-to-r from-gradient-start to-gradient-end -z-10"
        style={{
          top: `38vh`,
          right: `10vw`,
        }}
      />
      <div
        className="absolute w-52 h-52 rounded-full bg-gradient-to-r from-gradient-start to-gradient-end -z-10"
        style={{
          bottom: `4vh`,
          left: `25vw`,
        }}
      />

      <nav className="flex justify-between items-center mx-auto mt-12 px-2 py-2 text-xl font-semibold tracking-wide border border-solid border-black rounded-md w-5/6 backdrop-blur-2xl">
        <div className="antialiased tracking-tight font-normal text-3xl ml-2">
          ✤Visigrid
        </div>
        <div className="upload-file-button ">
          <UploadButton onFileLoaded={handleFileLoaded} />
        </div>
      </nav>

      {jsonData.length > 0 && <JsonTable data={jsonData} filename={filename} />}
    </>
  );
}
