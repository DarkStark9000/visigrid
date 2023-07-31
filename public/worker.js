self.onmessage = ({ data: { rows, colsPerPage } }) => {
  const columns = rows[0].slice(0, colsPerPage);
  const rowsData = rows.slice(1);
  let newUniqueValues = Array(columns.length)
    .fill(null)
    .map(() => new Set());
  for (let i = 0; i < rowsData.length; i++) {
    for (let j = 0; j < rowsData[i].length; j++) {
      newUniqueValues[j].add(rowsData[i][j]);
    }
  }
  const result = newUniqueValues.map((set) => Array.from(set));
  self.postMessage(result);
};
