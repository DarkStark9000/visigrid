// app/components/JsonTable.tsx

import { FC } from "react";

interface JsonTableProps {
  data: any[];
}

const JsonTable: FC<JsonTableProps> = ({ data }) => {
  const [columns, ...rows] = data;

  return (
    <table>
      <thead>
        <tr>
          {columns.map((column: any, index: any) => (
            <th key={index}>{column}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((value: any, colIndex: any) => (
              <td key={colIndex}>{value}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default JsonTable;
