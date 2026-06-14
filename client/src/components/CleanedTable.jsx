import { useContext } from "react";
import { DataContext } from "../contexts/DataContext";

const CleanedTable = () => {
  const { analysisResult } = useContext(DataContext);

  const cleanedData =
    analysisResult?.cleanedData || [];

  if (cleanedData.length === 0) return null;

  const columns = Object.keys(cleanedData[0]);

  return (
    <section className="section">
      <div className="container-custom">
        <div className="card overflow-x-auto">
          <h2 className="mb-5">Cleaned Data</h2>

          <table className="w-full">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th
                    key={column}
                    className="text-left p-3 border-b"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {cleanedData.map((row, index) => (
                <tr key={index}>
                  {columns.map((column) => (
                    <td
                      key={column}
                      className="p-3 border-b"
                    >
                      {row[column]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default CleanedTable;