import { useContext } from "react";
import { DataContext } from "../contexts/DataContext";

const InvalidTable = () => {
  const { analysisResult } = useContext(DataContext);

  const invalidData = analysisResult?.invalidData || [];

  if (invalidData.length === 0) return null;

  const columns = Object.keys(invalidData[0]);

  return (
    <section className="section">
      <div className="container-custom">
        <div className="card overflow-x-auto">
          <h2 className="mb-5">Invalid Data</h2>

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
              {invalidData.map((row, index) => (
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

export default InvalidTable;