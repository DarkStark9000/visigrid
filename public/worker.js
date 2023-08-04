self.onmessage = ({ data: { rows, colsPerPage } }) => {
  const columns = Object.keys(rows[0]).slice(0, colsPerPage);
  const uniqueValues = columns.map(() => new Set());

  for (const row of rows) {
    columns.forEach((column, index) => {
      uniqueValues[index].add(String(row[column]));
    });
  }

  self.postMessage(uniqueValues.map((set) => Array.from(set)));
};
